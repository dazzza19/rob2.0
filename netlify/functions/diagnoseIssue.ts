
import type { CarInfo, DiagnosisResult } from '../../types.ts';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// Interface for Brave Web Search API results
interface BraveWebResult {
  title: string;
  url: string;
  description: string;
}

async function getWebResults(query: string): Promise<DiagnosisResult[]> {
    if (!BRAVE_API_KEY) {
        console.error("BRAVE_API_KEY not set on server.");
        throw new Error("The server is missing the necessary API key for searches.");
    }
    
    try {
        const braveApiUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&country=gb&count=5&safesearch=moderate`;
        const response = await fetch(braveApiUrl, {
            headers: {
                'X-Subscription-Token': BRAVE_API_KEY,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Brave API request failed with status ${response.status}: ${errorText}`);
            throw new Error(`The search service failed. Please try again later.`);
        }

        const data = await response.json();
        // Brave web search results are nested under the `web` property
        const results = data.web?.results || [];
        
        return results.map((result: BraveWebResult) => ({
            title: result.title,
            url: result.url,
            description: result.description,
        }));

    } catch (error) {
        console.error("Error fetching from Brave API:", error);
        // Re-throw a more user-friendly error
        if (error instanceof Error && error.message.includes('The search service failed')) {
            throw error;
        }
        throw new Error("An error occurred while trying to perform a web search.");
    }
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const carInfo: CarInfo = await req.json();
    const searchQuery = `"${carInfo.year} ${carInfo.make} ${carInfo.model}" ${carInfo.description} common causes forum UK`;
    const results = await getWebResults(searchQuery);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Error in Netlify function diagnoseIssue:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Failed to get diagnosis: ${errorMessage}` }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
     });
  }
};
