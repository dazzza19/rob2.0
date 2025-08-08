
import type { CarInfo, DiagnosisResult, Video } from '../../types.ts';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// Interface for Brave Web Search API results
interface BraveWebResult {
  title: string;
  url: string;
  description: string;
}

// Interface for Brave Video Search API results
interface BraveVideoResult {
  title: string;
  url: string;
  description: string;
}

async function findVideosForTerm(carInfo: CarInfo, cause: string): Promise<Video[]> {
  if (!BRAVE_API_KEY) {
    console.error("BRAVE_API_KEY not set. Skipping video search.");
    return [];
  }
  
  try {
    const query = `${carInfo.year} ${carInfo.make} ${carInfo.model} ${cause} fix tutorial`;
    const braveApiUrl = `https://api.search.brave.com/res/v1/videos/search?q=${encodeURIComponent(query)}&country=gb&spellcheck=true`;

    const braveResponse = await fetch(braveApiUrl, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!braveResponse.ok) {
      const errorText = await braveResponse.text();
      console.error(`Brave Video API error for query "${query}":`, errorText);
      return []; // Return empty array on failure, don't fail the whole diagnosis
    }

    const braveData = await braveResponse.json();
    const results = braveData.results || [];
    
    // Return top 2 videos
    return results.slice(0, 2).map((video: BraveVideoResult) => ({
      title: video.title,
      summary: video.description,
      url: video.url,
    }));
  } catch (error) {
    console.error(`Error fetching videos for query "${cause}":`, error);
    return []; // Return empty on error
  }
}


async function getWebResults(query: string): Promise<Omit<DiagnosisResult, 'videos'>[]> {
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
        
        const webResults = data.web?.results || [];
        const discussionResults = data.discussions?.results || [];
        
        const combinedResults = [...webResults, ...discussionResults] as BraveWebResult[];
        
        const uniqueResults = combinedResults.filter((result, index, self) => 
            result.url && index === self.findIndex((r) => r.url === result.url)
        );
        
        return uniqueResults.slice(0, 3).map((result: BraveWebResult) => ({
            title: result.title,
            url: result.url,
            description: result.description,
        }));

    } catch (error) {
        console.error("Error fetching from Brave API:", error);
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
    const searchQuery = `${carInfo.year} ${carInfo.make} ${carInfo.model} ${carInfo.description} problem forum solution`;
    
    // 1. Get web results
    const webResults = await getWebResults(searchQuery);

    // 2. For each web result, find associated videos in parallel
    const resultsWithVideos: DiagnosisResult[] = await Promise.all(
      webResults.map(async (webResult) => {
        const videos = await findVideosForTerm(carInfo, webResult.title);
        return {
          ...webResult,
          videos,
        };
      })
    );

    return new Response(JSON.stringify({ results: resultsWithVideos }), {
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
