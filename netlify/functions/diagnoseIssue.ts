import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@^1.12.0";
import type { CarInfo, Cause } from '../../types.ts';

const API_KEY = process.env.API_KEY;

const diagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    causes: {
      type: Type.ARRAY,
      description: "An array of potential causes for the car issue.",
      items: {
        type: Type.OBJECT,
        properties: {
          cause: {
            type: Type.STRING,
            description: "A concise name for the potential issue (e.g., 'Worn Brake Pads').",
          },
          reasoning: {
            type: Type.STRING,
            description: "A one-sentence explanation of why this could be the cause.",
          },
          requiredParts: {
            type: Type.ARRAY,
            description: "A list of specific parts needed for this repair (e.g., ['Front brake pad set', 'Brake disc']).",
            items: {
              type: Type.STRING,
            }
          },
          estimatedCostMin: {
            type: Type.NUMBER,
            description: "The estimated minimum cost in GBP (£) for the repair at an independent garage in the UK.",
          },
          estimatedCostMax: {
            type: Type.NUMBER,
            description: "The estimated maximum cost in GBP (£) for the repair at an independent garage in the UK.",
          },
          dealerCostMin: {
            type: Type.NUMBER,
            description: "The estimated minimum cost in GBP (£) for the repair at a main franchise dealer in the UK.",
          },
          dealerCostMax: {
            type: Type.NUMBER,
            description: "The estimated maximum cost in GBP (£) for the repair at a main franchise dealer in the UK.",
          },
        },
        required: ["cause", "reasoning", "requiredParts"],
      },
    },
  },
  required: ["causes"],
};

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
    const carInfo: CarInfo = await req.json();
    
    const prompt = `
    A user in the UK is reporting an issue with their ${carInfo.year} ${carInfo.make} ${carInfo.model}.
    The problem description is: "${carInfo.description}".

    Based on this information:
    1.  Provide the top 3 most likely causes relevant to the UK market.
    2.  For each cause, list the specific parts typically required for the repair.
    3.  For each cause, provide a rough cost estimate range (minimum and maximum) in GBP (£) for the repair at an independent, non-dealership garage in the United Kingdom.
    4.  For each cause, provide a rough cost estimate range (minimum and maximum) in GBP (£) for the same repair at a main franchise dealer in the United Kingdom.
  `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: diagnosisSchema,
        systemInstruction: "You are an expert AI mechanic with a specialization in the UK automotive market. Your goal is to diagnose car problems based on user descriptions. You MUST provide concise, likely causes, a list of required parts, and estimated repair costs in GBP (£) for BOTH independent garages and main dealers in the requested JSON format.",
      },
    });

    const jsonText = response.text.trim();
    // It's good practice to handle potential malformed JSON, even with schema enforcement.
    try {
        const result = JSON.parse(jsonText);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch(e) {
        console.error("Failed to parse diagnosis JSON:", jsonText);
        return new Response(JSON.stringify({ error: "AI returned a malformed diagnosis. Please try again." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
  } catch (error) {
    console.error("Error in Netlify function diagnoseIssue:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Failed to get a diagnosis from the AI service: ${errorMessage}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
};
