

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

export interface DiagnosisResult {
  title: string;
  url: string;
  description: string;
  videos: Video[];
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
  ERROR,
}
