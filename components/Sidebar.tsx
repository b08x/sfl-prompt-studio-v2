


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
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';

type Page = 'dashboard' | 'lab' | 'documentation' | 'settings';

interface SidebarProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  popularTags: string[];
  activePage: Page;
  onNavigate: (page: Page) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const NavItem: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick: () => void; isCollapsed: boolean; }> = ({ icon: Icon, label, active, onClick, isCollapsed }) => (
  <button onClick={onClick} className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${isCollapsed ? 'justify-center' : ''} ${
      active ? 'bg-blue-500 text-gray-50' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-50'
    }`}
    title={isCollapsed ? label : undefined}
  >
    <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
    {!isCollapsed && <span className="truncate">{label}</span>}
  </button>
);

const FilterItem: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; selected: boolean; isCollapsed: boolean; }> = ({ icon: Icon, label, onClick, selected, isCollapsed }) => (
    <button onClick={onClick} className={`flex w-full items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
        selected ? 'text-gray-50 bg-blue-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-50'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ filters, onFilterChange, popularTags, activePage, onNavigate, isCollapsed, onToggleCollapse }) => {
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
    <aside className={`bg-gray-800 text-gray-50 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className="flex-grow flex flex-col p-4 space-y-4 overflow-y-auto overflow-x-hidden">
        <div className={`flex items-center space-x-2 pt-2 pb-4 ${isCollapsed ? 'justify-center' : 'px-3'}`}>
            <BrainCircuitIcon className="w-8 h-8 text-blue-400 shrink-0" />
            {!isCollapsed && <span className="text-xl font-bold">SFL Prompt Studio</span>}
        </div>

        <div className="flex-grow space-y-6">
            <div>
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${isCollapsed ? 'text-center' : 'px-3'}`}>{isCollapsed ? 'NAV' : 'Navigation'}</h3>
            <nav className="space-y-1">
                <NavItem icon={HomeIcon} label="Dashboard" active={activePage === 'dashboard'} onClick={() => onNavigate('dashboard')} isCollapsed={isCollapsed} />
                <NavItem icon={FlaskIcon} label="Prompt Lab" active={activePage === 'lab'} onClick={() => onNavigate('lab')} isCollapsed={isCollapsed} />
                <NavItem icon={BookOpenIcon} label="Documentation" active={activePage === 'documentation'} onClick={() => onNavigate('documentation')} isCollapsed={isCollapsed} />
                <NavItem icon={CogIcon} label="Settings" active={activePage === 'settings'} onClick={() => onNavigate('settings')} isCollapsed={isCollapsed} />
            </nav>
            </div>

            <div>
                <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${isCollapsed ? 'text-center' : 'px-3'}`}>{isCollapsed ? 'TASK' : 'Filter by Task Type'}</h3>
                <div className="space-y-1">
                    {taskTypes.map(type => (
                        <FilterItem 
                            key={type}
                            icon={taskIcons[type]} 
                            label={type} 
                            onClick={() => onFilterChange('taskType', filters.taskType === type ? '' : type)}
                            selected={filters.taskType === type}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${isCollapsed ? 'text-center' : 'px-3'}`}>{isCollapsed ? 'AI' : 'Filter by AI Persona'}</h3>
                <div className="space-y-1">
                    {aiPersonas.map(persona => (
                        <FilterItem 
                            key={persona}
                            icon={personaIcons[persona]} 
                            label={persona} 
                            onClick={() => onFilterChange('aiPersona', filters.aiPersona === persona ? '' : persona)}
                            selected={filters.aiPersona === persona}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </div>
            </div>
            
            {!isCollapsed && (
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
            )}
        </div>
      
        <div className="flex-shrink-0 space-y-4">
            <div className={`bg-gray-700 rounded-lg p-3 ${isCollapsed ? 'w-auto' : ''}`}>
                <div className={`flex items-center space-x-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"></div>
                        {!isCollapsed && <span className="text-sm font-medium">Gemini Flash</span>}
                    </div>
                    {!isCollapsed && <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Active</span>}
                </div>
            </div>
            <button className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-50 transition-colors border border-gray-700 ${isCollapsed ? 'w-auto' : ''}`}>
                <PlusIcon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>Add Model</span>}
            </button>
        </div>
      </div>
       <div className="p-2 border-t border-gray-700">
        <button 
          onClick={onToggleCollapse} 
          className="w-full flex items-center justify-center p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-gray-50 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;