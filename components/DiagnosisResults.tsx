import React from 'react';
import type { Cause, GroundingChunk, CarInfo } from '../types';
import { YoutubeIcon } from './icons/YoutubeIcon';
import { EmailIcon } from './icons/EmailIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { MoneyIcon } from './icons/MoneyIcon';

interface DiagnosisResultsProps {
  causes: Cause[];
  sources: GroundingChunk[];
  carInfo: CarInfo;
}

const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ causes, sources, carInfo }) => {
  if (causes.length === 0) return null;

  const handleEmail = (cause: Cause) => {
    const subject = `ROB 2.0 AI Diagnosis for ${carInfo.year} ${carInfo.make} ${carInfo.model}`;
    
    let bodyLines = [
      'Hi,',
      '',
      `Here is a potential diagnosis for the problem: "${carInfo.description}"`,
      '',
      '--- AI Diagnosis ---',
      `Likely Cause: ${cause.title}`,
      `Reasoning: ${cause.reasoning}`,
      `Required Parts: ${cause.parts.join(', ') || 'N/A'}`,
      `Estimated Main Dealer Price: ${cause.dealerPriceEstimate}`,
      ''
    ];

    if (cause.videos.length > 0) {
      bodyLines.push('--- Recommended Videos ---');
      bodyLines.push(...cause.videos.map(v => `- ${v.title}: ${v.url}`), '');
    }
    
    if (sources.length > 0) {
      bodyLines.push('--- Information Sources ---');
      bodyLines.push(...sources.map(s => `- ${s.web.title}: ${s.web.uri}`), '');
    }

    bodyLines.push('Powered by ROB 2.0 AI.');

    const body = bodyLines.join('\n');
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };
  
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="space-y-8">
      <div>
         <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
             <h2 className="text-lg font-bold text-white">Vehicle Under Diagnosis</h2>
             <p className="text-gray-300">{carInfo.year} {carInfo.make} {carInfo.model}</p>
             <p className="text-gray-400 mt-1 text-sm">Problem: "{carInfo.description}"</p>
          </div>
          <h2 className="text-3xl font-bold text-white">AI Diagnosis Results</h2>
          <p className="text-md text-gray-400 mt-1">Based on web data, the AI has identified the following potential causes.</p>
      </div>
      
      {causes.map((cause, index) => (
        <div key={index} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6">
            <h3 className="text-xl font-bold text-indigo-300">{index + 1}. {cause.title}</h3>
            
            <p className="mt-2 text-gray-300">{cause.reasoning}</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <BuildingIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-200">Required Parts</h4>
                  <p className="text-gray-400">{cause.parts.join(', ') || 'None specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MoneyIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                 <div>
                  <h4 className="font-semibold text-gray-200">Est. Main Dealer Price</h4>
                  <p className="text-gray-400">{cause.dealerPriceEstimate}</p>
                </div>
              </div>
            </div>
          </div>

          {cause.videos.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">RECOMMENDED VIDEO TUTORIALS</h4>
              <div className="space-y-3">
                {cause.videos.map((video) => (
                  <a
                    key={video.url}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 -m-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <YoutubeIcon className="w-7 h-7 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-200">{video.title}</h5>
                      <p className="text-sm text-gray-400 line-clamp-2">{video.summary}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-800/50 border-t border-gray-700 text-right">
             <button
                onClick={() => handleEmail(cause)}
                className="inline-flex items-center gap-2 py-1.5 px-3 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500"
             >
               <EmailIcon className="w-4 h-4" />
               Email this Diagnosis
             </button>
          </div>
        </div>
      ))}

      {sources.length > 0 && (
          <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Information Sources</h3>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2 text-sm">
                  {sources.map((source, index) => (
                      <a href={source.web.uri} key={index} target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-indigo-300 truncate transition-colors">
                          <span className="font-medium">[{getHostname(source.web.uri)}]</span> {source.web.title}
                      </a>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default DiagnosisResults;
