
import type { CarInfo, DiagnosisResult } from '../../types.ts';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// Interface for Brave Web Search API results (covers both web and discussion types)
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
        const braveApiUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&country=gb&count=10&safesearch=moderate`;
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
        
        // Combine results from 'web' and 'discussions' for better diagnosis sources
        const webResults = data.web?.results || [];
        const discussionResults = data.discussions?.results || [];
        
        // Type assertion as both result types have the shape we need.
        const combinedResults = [...webResults, ...discussionResults] as BraveWebResult[];
        
        // Remove duplicates based on URL and ensure item has a URL
        const uniqueResults = combinedResults.filter((result, index, self) => 
            result.url && index === self.findIndex((r) => r.url === result.url)
        );
        
        return uniqueResults.slice(0, 5).map((result: BraveWebResult) => ({
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
    // A less restrictive query, targeting forums and problem descriptions
    const searchQuery = `${carInfo.year} ${carInfo.make} ${carInfo.model} ${carInfo.description} problem forum solution`;
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
