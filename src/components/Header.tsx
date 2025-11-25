import React from 'react';
import PlusIcon from './icons/PlusIcon';
import MagicWandIcon from './icons/MagicWandIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';

interface HeaderProps {
  onAddNewPrompt: () => void;
  onOpenWizard: () => void;
  onImportPrompts: () => void;
  onExportAllPrompts: () => void;
  onExportAllPromptsMarkdown: () => void;
  onOpenHelp: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddNewPrompt, onOpenWizard, onImportPrompts, onExportAllPrompts, onExportAllPromptsMarkdown, onOpenHelp }) => {
  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-[#e2a32d]">SFL Prompt Architect</h1>
      <div className="flex items-center space-x-3">
        <div className="flex space-x-2 border-r border-[#5c6f7e] pr-3 mr-1">
            <button
              onClick={onOpenHelp}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Open help guide"
              title="Help Guide"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onImportPrompts}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Import prompts"
              title="Import Prompts"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onExportAllPrompts}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Export all prompts as JSON"
              title="Export All as JSON"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
             <button
              onClick={onExportAllPromptsMarkdown}
              className="bg-transparent border border-[#5c6f7e] hover:bg-[#5c6f7e] text-gray-200 font-semibold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#212934]"
              aria-label="Export all prompts as Markdown"
              title="Export All as Markdown"
            >
              <DocumentTextIcon className="w-5 h-5" />
            </button>
        </div>
        <button
          onClick={onOpenWizard}
          className="bg-[#5c6f7e] hover:bg-opacity-90 text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:ring-offset-2 focus:ring-offset-[#212934]"
          aria-label="Open Prompt Wizard"
        >
          <MagicWandIcon className="w-5 h-5 mr-2" />
          Prompt Wizard
        </button>
        <button
          onClick={onAddNewPrompt}
          className="bg-[#c36e26] hover:bg-opacity-90 text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:ring-offset-2 focus:ring-offset-[#212934]"
          aria-label="Create new prompt"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Prompt
        </button>
      </div>
    </header>
  );
};

export default Header;