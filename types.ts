
export interface CarInfo {
  make: string;
  model: string;
  year: string;
  description: string;
}

export interface Cause {
  cause: string;
  reasoning: string;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  dealerCostMin?: number;
  dealerCostMax?: number;
  requiredParts?: string[];
}

export interface Video {
  title: string;
  summary: string;
  url: string;
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  }
}

export interface DiagnoseRequest {
  description: string;
  make: string;
  model: string;
  year: string;
}

export enum AppState {
  IDLE,
  DIAGNOSING,
  DIAGNOSED,
  FETCHING_VIDEOS,
  VIDEOS_FOUND,
  ERROR,
}