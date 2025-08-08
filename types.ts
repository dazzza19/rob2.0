export interface CarInfo {
  make: string;
  model: string;
  year: string;
  description: string;
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
  };
}

export interface Cause {
  title: string;
  reasoning: string;
  parts: string[];
  dealerPriceEstimate: string;
  videos: Video[];
}

export interface DiagnoseResponse {
  causes: Cause[];
  sources: GroundingChunk[];
}

export enum AppState {
  IDLE,
  DIAGNOSING,
  DIAGNOSED,
  ERROR,
}
