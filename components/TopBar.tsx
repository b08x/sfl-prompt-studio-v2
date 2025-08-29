import React from 'react';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import PlusIcon from './icons/PlusIcon';
import MagicWandIcon from './icons/MagicWandIcon';

interface TopBarProps {
  onAddNewPrompt: () => void;
  onOpenWizard: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onAddNewPrompt, onOpenWizard, searchTerm, onSearchChange }) => {
  return (
    <header className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="relative w-full max-w-sm">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
      <div className="flex items-center space-x-4">
          <button
            onClick={onOpenWizard}
            className="flex items-center space-x-2 bg-gray-700 text-gray-200 border border-gray-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors shadow-sm"
          >
            <MagicWandIcon className="w-5 h-5" />
            <span>Prompt Wizard</span>
          </button>
          <button
            onClick={onAddNewPrompt}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create New Prompt</span>
          </button>
      </div>
    </header>
  );
};

export default TopBar;