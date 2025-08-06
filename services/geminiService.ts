
import type { CarInfo, Cause, GroundingChunk, Video } from '../types';

export const diagnoseIssue = async (carInfo: CarInfo): Promise<{ causes: Cause[] }> => {
  const response = await fetch('/.netlify/functions/diagnoseIssue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(carInfo),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const findFixVideos = async (carInfo: CarInfo, cause: string): Promise<{ videos: Video[], sources: GroundingChunk[] }> => {
  const response = await fetch('/.netlify/functions/findFixVideos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ carInfo, cause }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};


export const getCostEstimate = async (carInfo: CarInfo, cause: Cause): Promise<Partial<Cause>> => {
  const response = await fetch('/.netlify/functions/getCostEstimate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ carInfo, cause }),
  });

  if (!response.ok) {
    console.error(`Cost estimation failed with status ${response.status}`);
    // Return empty object on failure to not break Promise.all
    return {};
  }
  
  return response.json();
};
