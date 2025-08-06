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
      Vehicle: ${carInfo.year} ${carInfo.make} ${carInfo.model} (UK).
      Problem: "${cause}".

      Task:
      From the search results, find up to 3 YouTube tutorial videos for this repair. Prioritize UK-relevant content.
      Return a JSON array of objects. Each object must have:
      - "title": The exact video title.
      - "summary": A one-sentence summary.
      - "url": The exact, valid YouTube URL from the search result.

      Respond with ONLY the JSON array.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are an expert AI assistant that processes Google Search results to find video links for a UK user. Your sole purpose is to return a valid JSON array. The objects in the array must represent YouTube videos found in the search results. The 'url' field in each object MUST be a direct and unaltered URL from the search results. Do not hallucinate or create URLs.",
        thinkingConfig: { thinkingBudget: 0 },
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
    
    // The model can sometimes wrap the JSON in markdown, so we extract it.
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
      // If parsing fails, it's possible the model didn't find anything or returned text.
      // We'll return an empty array, which the frontend handles gracefully.
      const result = { videos: [], sources };
       return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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
