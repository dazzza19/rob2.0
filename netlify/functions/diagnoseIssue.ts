
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
      Diagnose a vehicle issue for a ${carInfo.year} ${carInfo.make} ${carInfo.model} located in the UK.
      The user reported this problem: "${carInfo.description}".

      Your task is to identify the top 2 most likely causes.

      For each cause, you must provide:
      1. A brief reasoning.
      2. A list of required parts for the repair.
      
      Do NOT include cost estimates. You must respond in the required JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: diagnosisSchema,
        systemInstruction: "You are an expert AI mechanic for the UK market. Your primary goal is speed and accuracy. Provide a concise diagnosis based on the user's input, focusing only on causes, reasoning, and required parts. You MUST strictly adhere to the provided JSON schema and return results as quickly as possible.",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        if (!result.causes || !Array.isArray(result.causes)) {
          throw new Error("AI response did not contain a valid 'causes' array.");
        }
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch(e) {
        console.error("Failed to parse diagnosis JSON:", jsonText, e);
        return new Response(JSON.stringify({ error: "The AI returned an invalid diagnosis format. Please try rephrasing your issue." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
  } catch (error) {
    console.error("Error in Netlify function diagnoseIssue:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `The AI diagnosis service failed: ${errorMessage}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
};
