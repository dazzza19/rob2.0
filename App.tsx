
import React, { useState, useCallback } from 'react';
import { AppState, CarInfo, Cause, Video, GroundingChunk, DiagnoseRequest } from './types';
import { diagnoseIssue, findFixVideos, getCostEstimate } from './services/geminiService';
import Header from './components/Header';
import IssueInputForm from './components/IssueInputForm';
import DiagnosisResults from './components/DiagnosisResults';
import VideoTutorials from './components/VideoTutorials';
import LoadingSpinner from './components/LoadingSpinner';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [carInfo, setCarInfo] = useState<CarInfo | null>(null);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [selectedCause, setSelectedCause] = useState<Cause | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = useCallback(async (request: DiagnoseRequest) => {
    setError(null);
    setCauses([]);
    setVideos([]);
    setSelectedCause(null);
    setGroundingChunks([]);
    setCarInfo(null);
    setAppState(AppState.DIAGNOSING);

    try {
      const fullCarInfo = { ...request };
      setCarInfo(fullCarInfo);

      const result = await diagnoseIssue(fullCarInfo);
      if (result && result.causes.length > 0) {
        setCauses(result.causes);
        setAppState(AppState.DIAGNOSED);
      } else {
        setError("Couldn't find any likely causes. Please try describing the issue differently.");
        setAppState(AppState.ERROR);
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Diagnosis failed: ${errorMessage}`);
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleSelectCause = useCallback(async (cause: Cause) => {
    if (!carInfo) return;
    setAppState(AppState.FETCHING_VIDEOS);
    setSelectedCause(cause);
    setError(null);
    setVideos([]);
    setGroundingChunks([]);

    try {
      // Run fetching videos and costs in parallel for speed
      const [videoResult, costResult] = await Promise.all([
        findFixVideos(carInfo, cause.cause),
        getCostEstimate(carInfo, cause)
      ]);

      // Update costs in the state
      if (costResult) {
        setCauses(prevCauses =>
          prevCauses.map(c =>
            c.cause === cause.cause ? { ...c, ...costResult } : c
          )
        );
      }
      
      // Update videos and sources
      setVideos(videoResult?.videos || []);
      setGroundingChunks(videoResult?.sources || []);
      
      // Move to the final state to display results
      setAppState(AppState.VIDEOS_FOUND);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while fetching details.';
      setError(`Failed to get details: ${errorMessage}`);
      setAppState(AppState.ERROR); // Fallback to error state for critical failures
    }
  }, [carInfo]);

  const handleStartOver = () => {
    setAppState(AppState.IDLE);
    setCarInfo(null);
    setCauses([]);
    setSelectedCause(null);
    setVideos([]);
    setError(null);
    setGroundingChunks([]);
  };

  const isLoading = appState === AppState.DIAGNOSING || appState === AppState.FETCHING_VIDEOS;

  const getLoadingMessage = () => {
    switch (appState) {
      case AppState.DIAGNOSING:
        return 'Diagnosing issue...';
      case AppState.FETCHING_VIDEOS:
        return 'Finding videos & cost estimates...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <Header />

        <main className="mt-8">
          {appState === AppState.IDLE && (
            <IssueInputForm onDiagnose={handleDiagnose} disabled={isLoading} />
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 rounded-lg">
              <LoadingSpinner />
              <p className="mt-4 text-lg text-gray-300 animate-pulse">
                {getLoadingMessage()}
              </p>
            </div>
          )}

          {error && appState !== AppState.DIAGNOSING && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg my-6 text-center">
              <p className="font-semibold">An Error Occurred</p>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}
          
          {appState !== AppState.IDLE && !error && carInfo && (
            <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
               <h2 className="text-lg font-bold text-white">Vehicle Details</h2>
               <p className="text-gray-300">{carInfo.year} {carInfo.make} {carInfo.model}</p>
               <p className="text-gray-400 mt-1 text-sm">Problem: "{carInfo.description}"</p>
            </div>
          )}


          {causes.length > 0 && (
            <DiagnosisResults
              carInfo={carInfo}
              causes={causes}
              onSelectCause={handleSelectCause}
              selectedCause={selectedCause}
              appState={appState}
              isDisabled={appState === AppState.FETCHING_VIDEOS || appState === AppState.VIDEOS_FOUND}
            />
          )}

          {appState === AppState.VIDEOS_FOUND && !isLoading && carInfo && selectedCause && (
            <VideoTutorials
              videos={videos}
              sources={groundingChunks}
              carInfo={carInfo}
              selectedCause={selectedCause}
              causes={causes}
            />
          )}

          {appState !== AppState.IDLE && appState !== AppState.DIAGNOSING && (
            <div className="mt-8 text-center">
              <button
                onClick={handleStartOver}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Start New Diagnosis
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
