import React, { useState } from 'react';
import type { CarInfo } from '../types';
import { CarIcon } from './icons/CarIcon';

interface IssueInputFormProps {
  onDiagnose: (request: CarInfo) => void;
  disabled: boolean;
}

const IssueInputForm: React.FC<IssueInputFormProps> = ({ onDiagnose, disabled }) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !description || !make || !model || !year) return;
    onDiagnose({ make, model, year, description });
  };
  
  const isSubmitDisabled = disabled || !description || !make || !model || !year;

  return (
    <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <CarIcon className="w-8 h-8 text-indigo-400 mr-3" />
        <h2 className="text-2xl font-bold text-white">1. Describe Your Vehicle & Issue</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-300">Make</label>
            <input
              type="text"
              id="make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g., Ford"
              required
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-300">Model</label>
            <input
              type="text"
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., Focus"
              required
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-300">Year</label>
            <input
              type="number"
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2018"
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">
            Describe the Problem
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., 'I hear a loud squealing noise when I press the brake pedal.'"
            required
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="text-right">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-lg font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            Diagnose Problem
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueInputForm;
