import React from 'react';
import { WrenchIcon } from './icons/WrenchIcon';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-4">
        <WrenchIcon className="w-10 h-10 text-indigo-400" />
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 tracking-tight">
          ROB 2.0 AI
        </h1>
      </div>
      <p className="mt-4 text-lg text-gray-400">
        AI-powered diagnosis, main dealer price estimates, and video fixes for your car.
      </p>
    </header>
  );
};

export default Header;
