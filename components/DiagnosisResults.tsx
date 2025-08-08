
import React from 'react';
import type { DiagnosisResult, CarInfo } from '../types';
import { YoutubeIcon } from './icons/YoutubeIcon';
import { EmailIcon } from './icons/EmailIcon';

interface DiagnosisResultsProps {
  results: DiagnosisResult[];
  carInfo: CarInfo;
}

const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ results, carInfo }) => {
  if (results.length === 0) return null;

  const handleEmail = (diagnosis: DiagnosisResult) => {
    const subject = `ROB 2.0 AI Diagnosis for ${carInfo.year} ${carInfo.make} ${carInfo.model}`;
    
    const bodyLines = [
      'Hi,',
      '',
      `Here is a potential solution for the ${carInfo.year} ${carInfo.make} ${carInfo.model}.`,
      '',
      'Problem Description:',
      `"${carInfo.description}"`,
      '',
      '--- Suggested Resource ---',
      `Title: ${diagnosis.title}`,
      `URL: ${diagnosis.url}`,
      `Description: ${diagnosis.description}`,
      ''
    ];

    if (diagnosis.videos.length > 0) {
      bodyLines.push('--- Recommended Videos ---', '');
      bodyLines.push(...diagnosis.videos.map(v => `- ${v.title}: ${v.url}`), '');
    }
    
    bodyLines.push('Powered by ROB 2.0 AI.');

    const body = bodyLines.join('\\n');
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">2. Potential Solutions</h2>
      <p className="text-sm text-gray-400 -mt-4">Here are some potential solutions, including relevant web pages and video tutorials we found.</p>
      
      {results.map((item, index) => (
        <div key={item.url || index} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          {/* Web Page Info */}
          <div className="p-4 sm:p-6 bg-gray-700/30">
            <div className="flex items-start gap-4">
              <img
                src={`https://www.google.com/s2/favicons?sz=32&domain_url=${item.url}`}
                alt=""
                width="24"
                height="24"
                className="w-6 h-6 rounded-md mt-1 flex-shrink-0"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <div className="flex-grow min-w-0">
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.title}
                  className="text-lg font-semibold text-indigo-300 hover:underline"
                >
                  {item.title}
                </a>
                <p className="mt-1 text-gray-300 text-sm line-clamp-2" title={item.description}>{item.description}</p>
                <span className="mt-2 text-xs text-gray-500 truncate block">{getHostname(item.url)}</span>
              </div>
            </div>
          </div>

          {/* Associated Videos */}
          {item.videos.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">RELATED VIDEO TUTORIALS</h3>
              <div className="space-y-3">
                {item.videos.map((video) => (
                  <a
                    key={video.url}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 -m-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <YoutubeIcon className="w-7 h-7 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-200">{video.title}</h4>
                      <p className="text-sm text-gray-400 line-clamp-2">{video.summary}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 bg-gray-800/50 border-t border-gray-700 text-right">
             <button
                onClick={() => handleEmail(item)}
                className="inline-flex items-center gap-2 py-1.5 px-3 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 transition-colors"
             >
               <EmailIcon className="w-4 h-4" />
               Email this Solution
             </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiagnosisResults;
