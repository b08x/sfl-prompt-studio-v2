import React from 'react';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import UsersIcon from './icons/UsersIcon';
import PresentationChartLineIcon from './icons/PresentationChartLineIcon';
import ClockIcon from './icons/ClockIcon';

interface StatsProps {
    totalPrompts: number;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; change?: string; iconBgColor: string }> = ({ icon, label, value, iconBgColor }) => {
    return (
        <div className="bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-700 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${iconBgColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-50">{value}</p>
            </div>
        </div>
    );
};

const Stats: React.FC<StatsProps> = ({ totalPrompts }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard 
                icon={<ClipboardDocumentListIcon className="w-6 h-6 text-blue-400"/>} 
                label="Total Prompts" 
                value={totalPrompts}
                iconBgColor="bg-blue-500/20"
            />
            <StatCard 
                icon={<UsersIcon className="w-6 h-6 text-violet-400"/>} 
                label="AI Personas" 
                value={8}
                iconBgColor="bg-violet-500/20"
            />
            <StatCard 
                icon={<PresentationChartLineIcon className="w-6 h-6 text-teal-400"/>} 
                label="Test Coverage" 
                value="87%"
                iconBgColor="bg-teal-400/20"
            />
            <StatCard 
                icon={<ClockIcon className="w-6 h-6 text-amber-400"/>} 
                label="Last Tested" 
                value="2h ago"
                iconBgColor="bg-amber-400/20"
            />
        </div>
    );
};

export default Stats;