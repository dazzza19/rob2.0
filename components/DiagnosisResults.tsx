
import React from 'react';
import type { DiagnosisResult } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface DiagnosisResultsProps {
  results: DiagnosisResult[];
  onSelectResult: (result: DiagnosisResult) => void;
  selectedResult: DiagnosisResult | null;
  isDisabled: boolean;
}

const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ results, onSelectResult, selectedResult, isDisabled }) => {
  if (results.length === 0) return null;

  return (
    <div className="mt-8 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">2. Relevant Web Pages</h2>
      <p className="text-sm text-gray-400 mb-4">Here are some web pages that might help diagnose the issue. Click one to find video tutorials.</p>
      <div className="space-y-4">
        {results.map((item, index) => (
          <div
            key={index}
            className={`
              p-4 border rounded-lg transition-all duration-300
              ${selectedResult?.url === item.url 
                ? 'bg-indigo-900/50 border-indigo-500 scale-105 shadow-lg' 
                : 'bg-gray-700/50 border-gray-600'}
              ${!isDisabled 
                ? 'cursor-pointer hover:border-indigo-500 hover:bg-gray-700' 
                : 'cursor-not-allowed opacity-60'}
            `}
            onClick={() => !isDisabled && onSelectResult(item)}
            role={!isDisabled ? "button" : undefined}
            aria-disabled={isDisabled}
            tabIndex={!isDisabled ? 0 : -1}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-grow">
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-indigo-300 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.title}
                </a>
                <p className="mt-1 text-gray-300 text-sm">{item.description}</p>
                <p className="mt-2 text-xs text-gray-500 truncate">{item.url}</p>
              </div>

              {!isDisabled && (
                 <button className="flex-shrink-0 ml-4 flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 self-center">
                    <span>Find Fix</span>
                    <ChevronRightIcon className="w-5 h-5 ml-1" />
                 </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {isDisabled && !selectedResult && <p className="text-sm text-gray-400 mt-4">Select a page above to find video tutorials.</p>}
    </div>
  );
};

export default DiagnosisResults;
