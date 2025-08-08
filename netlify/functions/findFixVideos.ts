
import type { CarInfo, Video } from '../../types.ts';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// Interface for the Brave Video Search API response
interface BraveVideoResult {
  title: string;
  url: string;
  description: string;
}

export default async (req: Request): Promise<Response> => {
  if (!BRAVE_API_KEY) {
    return new Response(JSON.stringify({ error: "BRAVE_API_KEY environment variable not set on server." }), {
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
    const { carInfo, cause }: { carInfo: CarInfo, cause: string } = await req.json();

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
      console.error("Brave API error:", errorText);
      throw new Error(`Brave Video Search API request failed with status ${braveResponse.status}`);
    }

    const braveData = await braveResponse.json();
    const results = braveData.results || [];

    const videos: Video[] = results.slice(0, 5).map((video: BraveVideoResult) => ({
      title: video.title,
      summary: video.description,
      url: video.url,
    }));

    return new Response(JSON.stringify({ videos }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in Netlify function findFixVideos:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ error: `Failed to find videos: ${errorMessage}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
};
