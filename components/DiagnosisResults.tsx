
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

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="mt-8 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">2. Relevant Web Pages</h2>
      <p className="text-sm text-gray-400 mb-4">Here are some web pages that might help diagnose the issue. Click one to find video tutorials.</p>
      <div className="space-y-4">
        {results.map((item, index) => (
          <div
            key={item.url || index}
            className={`
              group p-4 border rounded-lg transition-all duration-300 flex items-center gap-4
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
            <div className="flex-grow min-w-0">
              <a 
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={item.title}
                className="text-lg font-semibold text-indigo-300 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {item.title}
              </a>
              <p className="mt-1 text-gray-300 text-sm line-clamp-2" title={item.description}>{item.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <img
                  src={`https://www.google.com/s2/favicons?sz=16&domain_url=${item.url}`}
                  alt=""
                  width="16"
                  height="16"
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="truncate">{getHostname(item.url)}</span>
              </div>
            </div>

            {!isDisabled && (
              <div className="flex-shrink-0">
                <ChevronRightIcon className="w-6 h-6 text-indigo-400 transition-colors group-hover:text-indigo-300" />
              </div>
            )}
          </div>
        ))}
      </div>
      {isDisabled && !selectedResult && <p className="text-sm text-gray-400 mt-4">Select a page above to find video tutorials.</p>}
    </div>
  );
};

export default DiagnosisResults;
