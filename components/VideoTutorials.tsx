
import React from 'react';
import type { Video, CarInfo, GroundingChunk } from '../types';
import { YoutubeIcon } from './icons/YoutubeIcon';
import { EmailIcon } from './icons/EmailIcon';

interface VideoTutorialsProps {
  videos: Video[];
  carInfo: CarInfo;
  diagnosis: GroundingChunk;
}

const VideoTutorials: React.FC<VideoTutorialsProps> = ({ videos, carInfo, diagnosis }) => {
  if (videos.length === 0) return null;

  const handleEmail = () => {
    const subject = `ROB 2.0 AI Diagnosis for ${carInfo.year} ${carInfo.make} ${carInfo.model}`;
    
    const bodyLines = [
      'Hi,',
      '',
      `Here is the diagnosis summary for the ${carInfo.year} ${carInfo.make} ${carInfo.model}.`,
      '',
      'Problem Description:',
      `"${carInfo.description}"`,
      '',
      '--- Diagnosis ---',
      '',
      'The video tutorials were found based on the following web page:',
      `Title: ${diagnosis.web.title}`,
      `URL: ${diagnosis.web.uri}`,
      '',
      '--- Recommended Videos ---',
      '',
      videos.map(v => `- ${v.title}: ${v.url}`).join('\\n'),
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
        <h2 className="text-2xl font-bold text-white">3. Video Tutorials</h2>
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
    </div>
  );
};

export default VideoTutorials;
