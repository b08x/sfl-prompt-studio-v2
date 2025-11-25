import React from 'react';
import { PromptSFL } from '../types';
import PromptCard from './PromptCard';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

interface PromptListProps {
  prompts: PromptSFL[];
  onViewPrompt: (prompt: PromptSFL) => void;
  onEditPrompt: (prompt: PromptSFL) => void;
  onDeletePrompt: (promptId: string) => void;
  onCopyToMarkdown: (prompt: PromptSFL) => void;
}

const PromptList: React.FC<PromptListProps> = ({ prompts, onViewPrompt, onEditPrompt, onDeletePrompt, onCopyToMarkdown }) => {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700">
        <ClipboardDocumentListIcon className="w-16 h-16 text-gray-600 mx-auto mb-4"/>
        <p className="text-xl text-gray-200 font-semibold">No prompts found.</p>
        <p className="text-sm text-gray-400">Try adjusting your filters or adding a new prompt.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {prompts.map(prompt => (
        <PromptCard 
          key={prompt.id} 
          prompt={prompt} 
          onView={onViewPrompt}
          onEdit={onEditPrompt}
          onDelete={onDeletePrompt}
          onCopyToMarkdown={onCopyToMarkdown}
        />
      ))}
    </div>
  );
};

export default PromptList;