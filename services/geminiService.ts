
import type { CarInfo, DiagnosisResult, Video } from '../types';

export const diagnoseIssue = async (carInfo: CarInfo): Promise<{ results: DiagnosisResult[] }> => {
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

export const findFixVideos = async (carInfo: CarInfo, searchTerm: string): Promise<{ videos: Video[] }> => {
  const response = await fetch('/.netlify/functions/findFixVideos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ carInfo, cause: searchTerm }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};
