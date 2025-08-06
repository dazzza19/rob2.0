
import React from 'react';
import type { Video, GroundingChunk, CarInfo, Cause } from '../types';
import { YoutubeIcon } from './icons/YoutubeIcon';
import { EmailIcon } from './icons/EmailIcon';

interface VideoTutorialsProps {
  videos: Video[];
  sources: GroundingChunk[];
  carInfo: CarInfo;
  causes: Cause[];
  selectedCause: Cause;
}

const VideoTutorials: React.FC<VideoTutorialsProps> = ({ videos, sources, carInfo, causes }) => {
  if (videos.length === 0) return null;

  const handleEmail = () => {
    const subject = `ROB 2.0 AI Diagnosis for ${carInfo.year} ${carInfo.make} ${carInfo.model}`;
    
    const causesSummary = causes.map(cause => {
        const partsList = cause.requiredParts && cause.requiredParts.length > 0
            ? `  - Required Parts: ${cause.requiredParts.join(', ')}`
            : '';
        const independentCostLine = cause.estimatedCostMin !== undefined && cause.estimatedCostMax !== undefined
            ? `  - Independent Garage: £${cause.estimatedCostMin} - £${cause.estimatedCostMax}`
            : '';
        const dealerCostLine = cause.dealerCostMin !== undefined && cause.dealerCostMax !== undefined
            ? `  - Main Dealer: £${cause.dealerCostMin} - £${cause.dealerCostMax}`
            : '';
        
        return [
            `Cause: ${cause.cause}`,
            `Reasoning: ${cause.reasoning}`,
            partsList,
            independentCostLine,
            dealerCostLine
        ].filter(Boolean).join('\n');
    }).join('\n\n');

    const bodyLines = [
      'Hi,',
      '',
      `Here is the diagnosis summary for the ${carInfo.year} ${carInfo.make} ${carInfo.model}.`,
      '',
      'Problem Description:',
      `"${carInfo.description}"`,
      '',
      '--- Likely Causes ---',
      '',
      causesSummary,
      '',
      'Powered by ROB 2.0 AI.'
    ];

    const body = bodyLines.join('\n');

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="mt-8 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">3. Video Tutorials & Sources</h2>
        <button
          onClick={handleEmail}
          className="inline-flex items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 transition-colors"
        >
          <EmailIcon className="w-5 h-5" />
          Email Diagnosis Summary
        </button>
      </div>
      <div className="space-y-4">
        {videos.map((video, index) => (
          <a
            key={index}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group bg-gray-700/50 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            aria-label={`Watch video: ${video.title}`}
          >
            <div className="flex items-start gap-4">
              <YoutubeIcon className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-100 group-hover:text-indigo-300 transition-colors">{video.title}</h3>
                <p className="text-gray-300 mt-1">{video.summary}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
      {sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">Sources</h3>
          <p className="text-sm text-gray-400 mb-4">These tutorials were found using information from the following web pages:</p>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.web.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 hover:underline text-sm truncate block"
                  title={source.web.uri}
                >
                  {source.web.title || source.web.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoTutorials;