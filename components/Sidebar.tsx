

import React from 'react';
import { Filters } from '../types';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import HomeIcon from './icons/HomeIcon';
import FlaskIcon from './icons/FlaskIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import CogIcon from './icons/CogIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import LanguageIcon from './icons/LanguageIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import FaceSmileIcon from './icons/FaceSmileIcon';
import BeakerIcon from './icons/BeakerIcon';
import PlusIcon from './icons/PlusIcon';

type Page = 'dashboard' | 'lab' | 'documentation' | 'settings';

interface SidebarProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  popularTags: string[];
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NavItem: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean, onClick: () => void; }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
      active ? 'bg-blue-500 text-gray-50' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-50'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </button>
);

const FilterItem: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; selected: boolean }> = ({ icon: Icon, label, onClick, selected }) => (
    <button onClick={onClick} className={`flex w-full items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        selected ? 'text-gray-50 bg-blue-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-50'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ filters, onFilterChange, popularTags, activePage, onNavigate }) => {
    const taskTypes = ["Explanation", "Code Generation", "Summarization", "Translation"];
    const taskIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
        "Explanation": ChatBubbleLeftRightIcon,
        "Code Generation": CodeBracketIcon,
        "Summarization": DocumentTextIcon,
        "Translation": LanguageIcon,
    };

    const aiPersonas = ["Expert", "Friendly Assistant", "Sarcastic Bot"];
    const personaIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
        "Expert": UserCircleIcon,
        "Friendly Assistant": FaceSmileIcon,
        "Sarcastic Bot": BeakerIcon,
    };

  return (
    <aside className="w-72 bg-gray-800 text-gray-50 flex flex-col p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center space-x-2 px-3 pt-2 pb-4">
        <BrainCircuitIcon className="w-8 h-8 text-blue-400" />
        <span className="text-xl font-bold">SFL Prompt Studio</span>
      </div>

      <div className="flex-grow space-y-6">
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Navigation</h3>
          <nav className="space-y-1">
            <NavItem icon={HomeIcon} label="Dashboard" active={activePage === 'dashboard'} onClick={() => onNavigate('dashboard')} />
            <NavItem icon={FlaskIcon} label="Prompt Lab" active={activePage === 'lab'} onClick={() => onNavigate('lab')} />
            <NavItem icon={BookOpenIcon} label="Documentation" active={activePage === 'documentation'} onClick={() => onNavigate('documentation')} />
            <NavItem icon={CogIcon} label="Settings" active={activePage === 'settings'} onClick={() => onNavigate('settings')} />
          </nav>
        </div>

        <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filter by Task Type</h3>
            <div className="space-y-1">
                {taskTypes.map(type => (
                    <FilterItem 
                        key={type}
                        icon={taskIcons[type]} 
                        label={type} 
                        onClick={() => onFilterChange('taskType', filters.taskType === type ? '' : type)}
                        selected={filters.taskType === type}
                    />
                ))}
            </div>
        </div>

        <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filter by AI Persona</h3>
            <div className="space-y-1">
                 {aiPersonas.map(persona => (
                    <FilterItem 
                        key={persona}
                        icon={personaIcons[persona]} 
                        label={persona} 
                        onClick={() => onFilterChange('aiPersona', filters.aiPersona === persona ? '' : persona)}
                        selected={filters.aiPersona === persona}
                    />
                ))}
            </div>
        </div>
        
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Popular Tags</h3>
          <div className="flex flex-wrap gap-2 px-3">
            {popularTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => onFilterChange('searchTerm', filters.searchTerm === tag.substring(1) ? '' : tag.substring(1))}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    filters.searchTerm === tag.substring(1) ? 'bg-blue-500 text-gray-50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                    {tag}
                </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 space-y-4">
        <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-medium">Gemini Flash</span>
                </div>
                <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Active</span>
            </div>
        </div>
        <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-50 transition-colors border border-gray-700">
            <PlusIcon className="w-5 h-5" />
            <span>Add Model</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;