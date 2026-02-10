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
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
}

const PromptList: React.FC<PromptListProps> = ({
  prompts,
  onViewPrompt,
  onEditPrompt,
  onDeletePrompt,
  onCopyToMarkdown,
  hasMore = false,
  onLoadMore,
  totalCount
}) => {
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
    <div className="space-y-6">
      {/* Pagination info */}
      {totalCount !== undefined && totalCount > prompts.length && (
        <div className="text-sm text-gray-400 text-center">
          Showing {prompts.length} of {totalCount} prompts
        </div>
      )}

      {/* Prompt grid */}
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

      {/* Load More button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Load More Prompts ({totalCount && totalCount - prompts.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptList;