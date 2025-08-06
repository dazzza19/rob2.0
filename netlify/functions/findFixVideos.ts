import { GoogleGenAI } from "https://esm.sh/@google/genai@^1.12.0";
import type { CarInfo, GroundingChunk, Video } from '../../types.ts';

const API_KEY = process.env.API_KEY;

export default async (req: Request): Promise<Response> => {
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API_KEY environment variable not set on server." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const { carInfo, cause }: { carInfo: CarInfo, cause: string } = await req.json();

    const prompt = `
      My car is a ${carInfo.year} ${carInfo.make} ${carInfo.model}, and I am in the UK.
      The diagnosed problem is: "${cause}".

      Using the provided Google Search results, find up to 3 relevant YouTube video tutorials that show how to fix this specific issue, prioritizing content from UK creators or relevant to UK vehicle models if possible.

      You MUST create a JSON array of objects. Each object represents one YouTube video.
      For each object, you MUST include these three keys: "title", "summary", and "url".
      - "title": The full, exact title of the YouTube video, taken from the search result.
      - "summary": A brief, one-sentence summary of what the tutorial covers, based on the information in the search result.
      - "url": The complete and valid URL to the YouTube video, copied EXACTLY from the search result. YOU MUST NOT invent a URL or change it in any way. It must be a real, working link.

      Your entire response must be ONLY the valid JSON array. Do not add any other text, explanations, or markdown formatting like \`\`\`json.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are an expert AI assistant that processes Google Search results to find video links for a UK user. Your sole purpose is to return a valid JSON array. The objects in the array must represent YouTube videos found in the search results. The 'url' field in each object MUST be a direct and unaltered URL from the search results. Do not hallucinate or create URLs.",
      },
    });
    
    const geminiChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources: GroundingChunk[] = geminiChunks
      .filter(chunk => chunk.web?.uri)
      .map(chunk => ({
        web: {
          uri: chunk.web!.uri!,
          title: chunk.web!.title || chunk.web!.uri!,
        }
      }));

    let jsonText = response.text.trim();
    
    const jsonMatch = jsonText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    try {
      const videos: Video[] = JSON.parse(jsonText);
      const result = { videos, sources };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error("Failed to parse videos JSON:", jsonText, e);
      throw new Error("AI returned a malformed video list. Could not parse the results.");
    }
    
  } catch (error) {
    console.error("Error in Netlify function findFixVideos:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Failed to find videos from the AI service: ${errorMessage}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
};
