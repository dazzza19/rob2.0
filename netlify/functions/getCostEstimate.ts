
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai@^1.12.0";
import type { CarInfo, Cause } from '../../types.ts';

const API_KEY = process.env.API_KEY;

const costSchema = {
  type: Type.OBJECT,
  properties: {
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
    const { carInfo, cause }: { carInfo: CarInfo, cause: Cause } = await req.json();

    const prompt = `
      For a ${carInfo.year} ${carInfo.make} ${carInfo.model} in the UK, estimate the repair cost in GBP for the following issue.
      Issue: "${cause.cause}".
      Relevant Parts: ${cause.requiredParts?.join(', ') || 'not specified'}.
      
      Provide estimated costs for both independent garages and main dealers.
      You must respond in the required JSON format. If a cost cannot be determined, return null for that specific field.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: costSchema,
        systemInstruction: "You are an expert AI mechanic cost estimator for the UK market. Provide cost estimates in GBP (£). Be concise and fast. Strictly adhere to the JSON schema.",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonText = response.text.trim();
    try {
        const result = JSON.parse(jsonText);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error("Failed to parse cost estimate JSON:", jsonText, e);
        // Return an empty object on parse failure to not break Promise.all on the client
        return new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error("Error in Netlify function getCostEstimate:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
     // Return an empty object on error to not break Promise.all on the client
    return new Response(JSON.stringify({ error: `Cost estimation AI service failed: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
