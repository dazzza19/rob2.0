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
        Diagnose car troubles, get likely causes, and find video fixes.
      </p>
    </header>
  );
};

export default Header;