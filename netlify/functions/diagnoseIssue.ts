import { GoogleGenAI, Type } from "@google/genai";
import type { CarInfo, Video, GroundingChunk, Cause } from '../../types.ts';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const API_KEY = process.env.API_KEY;

// Interfaces for Brave API results
interface BraveWebResult {
  title: string;
  url: string;
  description: string;
}

interface BraveVideoResult {
  title: string;
  url: string;
  description: string;
}

// --- Helper Functions ---

async function getWebContext(query: string): Promise<{ context: string; sources: GroundingChunk[] }> {
  if (!BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY is not set.");
  }
  const braveApiUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&country=gb&count=5&safesearch=moderate`;
  const response = await fetch(braveApiUrl, {
    headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`Brave Search API request failed: ${response.statusText}`);
  
  const data = await response.json();
  const results = data.web?.results || [];
  
  const sources: GroundingChunk[] = results.map((r: BraveWebResult) => ({
    web: { uri: r.url, title: r.title },
  }));

  const context = results.map((r: BraveWebResult) => `URL: ${r.url}\nTitle: ${r.title}\nDescription: ${r.description}`).join('\n\n---\n\n');
  
  return { context, sources };
}

async function findVideosForCause(carInfo: CarInfo, videoQuery: string): Promise<Video[]> {
    if (!BRAVE_API_KEY) {
      console.warn("BRAVE_API_KEY not set. Skipping video search.");
      return [];
    }
    const query = `${carInfo.year} ${carInfo.make} ${carInfo.model} ${videoQuery} tutorial uk`;
    const braveApiUrl = `https://api.search.brave.com/res/v1/videos/search?q=${encodeURIComponent(query)}&country=gb&spellcheck=true`;
  
    const response = await fetch(braveApiUrl, {
      headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' },
    });
    if (!response.ok) {
        console.error(`Brave Video API error for query "${query}": ${await response.text()}`);
        return [];
    }
    const data = await response.json();
    return (data.results || []).slice(0, 2).map((v: BraveVideoResult): Video => ({
      title: v.title,
      summary: v.description,
      url: v.url,
    }));
}


// --- Main Handler ---

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API_KEY not set." }), { status: 500 });
  }

  try {
    const carInfo: CarInfo = await req.json();
    const searchQuery = `${carInfo.year} ${carInfo.make} ${carInfo.model} ${carInfo.description} common problems causes forum uk`;

    // 1. Retrieve web context from Brave
    const { context, sources } = await getWebContext(searchQuery);
    if (!context) {
        return new Response(JSON.stringify({ causes: [], sources: [] }), { status: 200 });
    }

    // 2. Analyze with Gemini AI
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const systemInstruction = `You are an expert car mechanic based in the United Kingdom. Analyze the provided web search results for a user's car problem. Your task is to identify up to 3 likely causes. For each cause, provide a clear title, a brief reasoning based on the web context, a list of parts that might be needed, a main dealer price estimate in GBP (£), and a concise search query (3-5 words) for finding a relevant YouTube video tutorial. The price estimate should be a realistic range. Respond ONLY with the JSON object.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        causes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A clear, concise title for the likely cause (e.g., 'Worn Brake Pads')." },
              reasoning: { type: Type.STRING, description: "A brief explanation of why this might be the cause, based on the provided context." },
              parts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of parts that may need to be replaced." },
              dealerPriceEstimate: { type: Type.STRING, description: "An estimated cost for the repair at a main dealer in the UK, formatted as a price range in GBP (e.g., '£150 - £300')." },
              videoSearchQuery: { type: Type.STRING, description: "A concise, effective search query (3-5 words) for finding a YouTube tutorial for this specific fix." }
            },
            required: ["title", "reasoning", "parts", "dealerPriceEstimate", "videoSearchQuery"]
          }
        }
      }
    };

    const prompt = `Car: ${carInfo.year} ${carInfo.make} ${carInfo.model}\nProblem: "${carInfo.description}"\n\nWeb Search Results:\n---\n${context}`;

    const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const aiResult = JSON.parse(aiResponse.text);
    let causes: Cause[] = [];

    if (aiResult.causes && aiResult.causes.length > 0) {
      // 3. Find videos for each cause in parallel
      causes = await Promise.all(
        aiResult.causes.map(async (cause: any) => {
          const videos = await findVideosForCause(carInfo, cause.videoSearchQuery);
          return {
            title: cause.title,
            reasoning: cause.reasoning,
            parts: cause.parts,
            dealerPriceEstimate: cause.dealerPriceEstimate,
            videos: videos,
          };
        })
      );
    }
    
    return new Response(JSON.stringify({ causes, sources }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in diagnoseIssue function:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Diagnosis failed: ${errorMessage}` }), { status: 500 });
  }
};
