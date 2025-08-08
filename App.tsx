
import React, { useState, useCallback } from 'react';
import { AppState, CarInfo, DiagnoseRequest, DiagnosisResult } from './types';
import { diagnoseIssue } from './services/geminiService';
import Header from './components/Header';
import IssueInputForm from './components/IssueInputForm';
import DiagnosisResults from './components/DiagnosisResults';
import LoadingSpinner from './components/LoadingSpinner';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [carInfo, setCarInfo] = useState<CarInfo | null>(null);
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = useCallback(async (request: DiagnoseRequest) => {
    setError(null);
    setDiagnosisResults([]);
    setCarInfo(null);
    setAppState(AppState.DIAGNOSING);

    try {
      const fullCarInfo = { ...request };
      setCarInfo(fullCarInfo);

      const result = await diagnoseIssue(fullCarInfo);
      if (result && result.results.length > 0) {
        setDiagnosisResults(result.results);
        setAppState(AppState.DIAGNOSED);
      } else {
        setError("Couldn't find any relevant web pages. Please try describing the issue differently.");
        setAppState(AppState.ERROR);
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Diagnosis failed: ${errorMessage}`);
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleStartOver = () => {
    setAppState(AppState.IDLE);
    setCarInfo(null);
    setDiagnosisResults([]);
    setError(null);
  };

  const isLoading = appState === AppState.DIAGNOSING;

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
                Diagnosing problem and finding video fixes...
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


          {appState === AppState.DIAGNOSED && diagnosisResults.length > 0 && carInfo && (
            <DiagnosisResults
              results={diagnosisResults}
              carInfo={carInfo}
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
