
import React from 'react';
import type { Cause, CarInfo, AppState } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { MoneyIcon } from './icons/MoneyIcon';
import { BuildingIcon } from './icons/BuildingIcon';

interface DiagnosisResultsProps {
  causes: Cause[];
  carInfo: CarInfo | null;
  onSelectCause: (cause: Cause) => void;
  selectedCause: Cause | null;
  isDisabled: boolean;
  appState: AppState;
}

interface Retailer {
  name: string;
  url: string;
}

const retailers: Retailer[] = [
  { name: 'Amazon', url: 'https://www.amazon.co.uk/s?k=' },
  { name: 'eBay', url: 'https://www.ebay.co.uk/sch/i.html?_nkw=' },
  { name: 'Google', url: 'https://www.google.com/search?q=' },
];

const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ carInfo, causes, onSelectCause, selectedCause, isDisabled, appState }) => {
  if (causes.length === 0) return null;

  return (
    <div className="mt-8 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">2. Likely Causes</h2>
      <div className="space-y-4">
        {causes.map((item, index) => (
          <div
            key={index}
            className={`
              p-4 border rounded-lg transition-all duration-300
              ${selectedCause?.cause === item.cause 
                ? 'bg-indigo-900/50 border-indigo-500 scale-105 shadow-lg' 
                : 'bg-gray-700/50 border-gray-600'}
              ${!isDisabled 
                ? 'cursor-pointer hover:border-indigo-500 hover:bg-gray-700' 
                : 'cursor-not-allowed opacity-60'}
            `}
            onClick={() => !isDisabled && onSelectCause(item)}
            role={!isDisabled ? "button" : undefined}
            aria-disabled={isDisabled}
            tabIndex={!isDisabled ? 0 : -1}
          >
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-indigo-300">{item.cause}</h3>
                <p className="mt-1 text-gray-300 text-sm">{item.reasoning}</p>

                {item.requiredParts && item.requiredParts.length > 0 && (
                   <div className="mt-4 pt-4 border-t border-gray-600/50">
                     <h4 className="text-sm font-semibold text-gray-200 mb-2">Required Parts</h4>
                     <ul className="space-y-3">
                       {item.requiredParts.map((part, partIndex) => (
                           <li key={partIndex} className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded-md">
                             <p className="font-medium">{part}</p>
                             <div className="ml-2 mt-2 flex items-center gap-x-4 gap-y-1 text-xs flex-wrap">
                               <span className="text-gray-400 font-medium">Search:</span>
                               {retailers.map(retailer => {
                                  let searchQuery;
                                  if (retailer.name === 'Google') {
                                    searchQuery = encodeURIComponent(`${carInfo?.year} ${carInfo?.make} ${carInfo?.model} ${part} "motorpart direct" "euro car parts" napa`);
                                  } else {
                                    searchQuery = encodeURIComponent(`${carInfo?.year} ${carInfo?.make} ${carInfo?.model} ${part}`);
                                  }
                                  const href = `${retailer.url}${searchQuery}`;

                                 return (
                                   <a 
                                     key={retailer.name}
                                     href={href}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="text-indigo-400 hover:text-indigo-300 hover:underline"
                                     onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                                    >
                                     {retailer.name}
                                   </a>
                                 );
                               })}
                             </div>
                           </li>
                       ))}
                     </ul>
                   </div>
                )}
                
                {(item.estimatedCostMin !== undefined || item.dealerCostMin !== undefined) && (
                  <div className="mt-4 pt-4 border-t border-gray-600/50 space-y-2">
                    {item.estimatedCostMin !== undefined && item.estimatedCostMax !== undefined && (
                      <div className="flex items-center gap-2">
                        <MoneyIcon className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-200">
                          <span className="font-semibold text-gray-400">Independent:</span> £{item.estimatedCostMin} - £{item.estimatedCostMax}
                        </p>
                      </div>
                    )}
                    {item.dealerCostMin !== undefined && item.dealerCostMax !== undefined && (
                      <div className="flex items-center gap-2">
                        <BuildingIcon className="w-5 h-5 text-teal-300 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-200">
                          <span className="font-semibold text-gray-400">Main Dealer:</span> £{item.dealerCostMin} - £{item.dealerCostMax}
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
      {isDisabled && !selectedCause && <p className="text-sm text-gray-400 mt-4">Select a cause above to find video tutorials.</p>}
    </div>
  );
};

export default DiagnosisResults;
