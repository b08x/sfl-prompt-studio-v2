
import React, { useState, useRef, useEffect } from 'react';
import { PromptSFL } from '../types';
import EllipsisVerticalIcon from './icons/EllipsisVerticalIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import GlobeAltIcon from './icons/GlobeAltIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import EyeIcon from './icons/EyeIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';


interface PromptCardProps {
  prompt: PromptSFL;
  onView: (prompt: PromptSFL) => void;
  onEdit: (prompt: PromptSFL) => void;
  onDelete: (promptId: string) => void;
  onCopyToMarkdown: (prompt: PromptSFL) => void;
}

const getTaskIcon = (taskType: string) => {
    const iconProps = { className: "w-5 h-5" };
    switch (taskType) {
        case 'Explanation': return <ChatBubbleLeftRightIcon {...iconProps} />;
        case 'Code Generation': return <CodeBracketIcon {...iconProps} />;
        case 'Summarization': return <DocumentTextIcon {...iconProps} />;
        case 'Translation': return <GlobeAltIcon {...iconProps} />;
        case 'Code Debugging Assistant': return <WrenchScrewdriverIcon {...iconProps} />;
        case 'JSON Data Transformation': return <ArrowsRightLeftIcon {...iconProps} />;
        case 'Technical Concept Explanation': return <AcademicCapIcon {...iconProps} />;
        default: return <DocumentTextIcon {...iconProps} />;
    }
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onView, onEdit, onDelete, onCopyToMarkdown }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isTested = !!prompt.geminiResponse;

  const cardIconColorMapping: Record<string, string> = {
    Explanation: 'text-blue-400 bg-blue-500/20',
    'Code Generation': 'text-teal-400 bg-teal-400/20',
    Summarization: 'text-pink-400 bg-pink-400/20',
    Translation: 'text-sky-400 bg-sky-400/20',
    'Code Debugging Assistant': 'text-red-400 bg-red-400/20',
    'JSON Data Transformation': 'text-indigo-400 bg-indigo-400/20',
    'Technical Concept Explanation': 'text-amber-400 bg-amber-400/20',
    default: 'text-gray-400 bg-gray-700',
  }

  const iconColor = cardIconColorMapping[prompt.sflField.taskType] || cardIconColorMapping.default;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleCopy = () => {
    onCopyToMarkdown(prompt);
    setCopied(true);
    setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
    }, 1500);
  };
  
  const getScoreColor = (score: number) => {
    if (score < 50) return 'text-red-400';
    if (score < 80) return 'text-amber-400';
    return 'text-teal-400';
  };

  const analysis = prompt.sflAnalysis;
  const errorCount = analysis?.issues.filter(i => i.severity === 'error').length || 0;
  const warningCount = analysis?.issues.filter(i => i.severity === 'warning').length || 0;

  return (
    <div className="bg-gray-800 shadow-sm rounded-lg p-5 border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${iconColor}`}>
                    {getTaskIcon(prompt.sflField.taskType)}
                </div>
                <h3 className="text-md font-semibold text-gray-50 flex items-center gap-2" title={prompt.title}>
                    {prompt.title}
                    <span className="text-xs font-normal text-gray-400 border border-gray-600 px-1.5 py-0.5 rounded" title={`Current Version: ${prompt.version}`}>v{prompt.version}</span>
                </h3>
            </div>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="p-1 text-gray-400 hover:text-gray-50 rounded-full hover:bg-gray-700"
                    aria-label="Options"
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-gray-900 rounded-md shadow-lg z-10 border border-gray-700 py-1">
                        <button onClick={() => { onView(prompt); setMenuOpen(false); }} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-md mx-1">
                            <EyeIcon className="w-4 h-4"/>
                            <span>View Details</span>
                        </button>
                        <button onClick={() => { onEdit(prompt); setMenuOpen(false); }} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-md mx-1">
                            <PencilIcon className="w-4 h-4"/>
                            <span>Edit</span>
                        </button>
                         <button onClick={handleCopy} className={`flex items-center space-x-3 w-full text-left px-3 py-2 text-sm transition-colors rounded-md mx-1 ${copied ? 'text-teal-400 bg-teal-500/10' : 'text-gray-200 hover:bg-gray-700'}`}>
                            {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                            <span>{copied ? 'Copied!' : 'Copy as Markdown'}</span>
                        </button>
                        <div className="my-1 border-t border-gray-700"></div>
                        <button onClick={() => { onDelete(prompt.id); setMenuOpen(false); }} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-md mx-1">
                            <TrashIcon className="w-4 h-4"/>
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>
        </div>

        <p className="text-gray-300 text-sm mb-3 line-clamp-2" title={prompt.promptText}>{prompt.promptText}</p>
        
        <div className="space-y-2 text-sm mb-4">
            <div className="flex"><p className="w-16 font-medium text-gray-400 shrink-0">Task:</p> <p className="text-gray-200 truncate">{prompt.sflField.taskType}</p></div>
            <div className="flex"><p className="w-16 font-medium text-gray-400 shrink-0">Persona:</p> <p className="text-gray-200 truncate">{prompt.sflTenor.aiPersona}</p></div>
            <div className="flex"><p className="w-16 font-medium text-gray-400 shrink-0">Format:</p> <p className="text-gray-200 truncate">{prompt.sflMode.outputFormat}</p></div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {prompt.sflField.keywords.split(',').slice(0, 3).map((keyword) => (
            keyword.trim() && (
              <span key={keyword} className="px-2 py-0.5 text-xs font-medium text-teal-300 bg-teal-400/20 rounded-full">
                #{keyword.trim()}
              </span>
            )
          ))}
        </div>
        
        {analysis && (
            <div className="flex items-center gap-3 mb-3 pt-3 border-t border-gray-700/50">
                <span className={`text-xs font-bold ${getScoreColor(analysis.score)}`}>
                    Score: {analysis.score}
                </span>
                {errorCount > 0 && <span className="text-xs text-red-400 font-medium">{errorCount} Errors</span>}
                {warningCount > 0 && <span className="text-xs text-amber-400 font-medium">{warningCount} Warnings</span>}
            </div>
        )}
      </div>
      
      <div className={`border-t border-gray-700 ${analysis ? 'pt-2' : 'pt-4'} flex justify-between items-center text-sm`}>
        <p className="text-gray-400">Updated {new Date(prompt.updatedAt).toLocaleDateString()}</p>
        {isTested ? (
          <span className="px-2 py-1 text-xs font-semibold text-teal-300 bg-teal-400/20 rounded-md">Tested</span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold text-amber-300 bg-amber-400/20 rounded-md">Not Tested</span>
        )}
      </div>
    </div>
  );
};

export default PromptCard;
