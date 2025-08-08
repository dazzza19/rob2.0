import type { CarInfo, DiagnoseResponse } from '../types';

export const diagnoseIssue = async (carInfo: CarInfo): Promise<DiagnoseResponse> => {
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
