import type { CarInfo, Video, GroundingChunk, Cause } from '../../types.ts';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

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
  if (!BRAVE_API_KEY) {
    return new Response(JSON.stringify({ error: "BRAVE_API_KEY not set." }), { status: 500 });
  }

  try {
    const carInfo: CarInfo = await req.json();
    const searchQuery = `${carInfo.year} ${carInfo.make} ${carInfo.model} ${carInfo.description} common problems causes forum uk`;

    // 1. Retrieve web context from Brave
    const { context, sources } = await getWebContext(searchQuery);
    if (!context) {
        return new Response(JSON.stringify({ causes: [], sources: [] }), { status: 200 });
    }

    // 2. Analyze with Brave AI
    const system_prompt = `You are an expert car mechanic based in the United Kingdom. Analyze the provided web search results for a user's car problem. Your task is to identify up to 3 likely causes. For each cause, provide a clear title, a brief reasoning based on the web context, a list of parts that might be needed, a main dealer price estimate in GBP (£), and a concise search query (3-5 words) for finding a relevant YouTube video tutorial. The price estimate should be a realistic range. Respond ONLY with a JSON object that strictly follows this structure: { "causes": [ { "title": "...", "reasoning": "...", "parts": ["..."], "dealerPriceEstimate": "...", "videoSearchQuery": "..." } ] }`;
    const user_prompt = `Car: ${carInfo.year} ${carInfo.make} ${carInfo.model}\nProblem: "${carInfo.description}"\n\nWeb Search Results:\n---\n${context}`;
    const braveLlmApiUrl = 'https://api.search.brave.com/llm/v1/chat/completions';
    
    const llmResponse = await fetch(braveLlmApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Subscription-Token': BRAVE_API_KEY,
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            model: "mixtral-8x7b-instruct-v0.1",
            messages: [
                { role: "system", content: system_prompt },
                { role: "user", content: user_prompt }
            ],
            response_format: { "type": "json_object" },
            temperature: 0.5,
        })
    });

    if (!llmResponse.ok) {
        const errorText = await llmResponse.text();
        throw new Error(`Brave AI API request failed: ${llmResponse.statusText} - ${errorText}`);
    }

    const aiResultData = await llmResponse.json();
    const aiResult = JSON.parse(aiResultData.choices[0].message.content);
    
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
