
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Task, TaskState, TaskStatus, TaskType } from '../../types';
import CodeBracketIcon from '../icons/CodeBracketIcon';
import SparklesIcon from '../icons/SparklesIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import PresentationChartLineIcon from '../icons/PresentationChartLineIcon';
import EyeIcon from '../icons/EyeIcon';
import LinkIcon from '../icons/LinkIcon';
import CheckIcon from '../icons/CheckIcon';

const TaskIcon: React.FC<{ type: TaskType }> = ({ type }) => {
    const commonClasses = "w-5 h-5";
    switch (type) {
        case TaskType.DATA_INPUT: return <DocumentTextIcon className={commonClasses} />;
        case TaskType.GEMINI_PROMPT: return <SparklesIcon className={commonClasses} />;
        case TaskType.GEMINI_GROUNDED: return <SparklesIcon className={commonClasses} />;
        case TaskType.IMAGE_ANALYSIS: return <EyeIcon className={commonClasses} />;
        case TaskType.TEXT_MANIPULATION: return <CodeBracketIcon className={commonClasses} />;
        case TaskType.DISPLAY_CHART: return <PresentationChartLineIcon className={commonClasses} />;
        default: return <DocumentTextIcon className={commonClasses} />;
    }
};

const statusConfig = {
    [TaskStatus.PENDING]: { bg: 'bg-gray-800', border: 'border-gray-700', text: 'text-gray-400', iconBg: 'bg-gray-700' },
    [TaskStatus.RUNNING]: { bg: 'bg-blue-500/10', border: 'border-blue-500 ring-2 ring-blue-500/30', text: 'text-blue-300', iconBg: 'bg-blue-500/30' },
    [TaskStatus.COMPLETED]: { bg: 'bg-teal-500/10', border: 'border-teal-500', text: 'text-teal-300', iconBg: 'bg-teal-500/30' },
    [TaskStatus.FAILED]: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-300', iconBg: 'bg-red-500/30' },
    [TaskStatus.SKIPPED]: { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-300', iconBg: 'bg-amber-500/30' },
};

interface TaskNodeData {
    task: Task;
    state: TaskState;
    onClick: (task: Task) => void;
    hasInputData?: boolean;
}

const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ data, selected }) => {
    const { task, state, onClick, hasInputData } = data;
    const config = statusConfig[state.status];

    const getResultSummary = () => {
        if (state.status !== TaskStatus.COMPLETED || !state.result) return null;
        if(typeof state.result === 'string') return state.result.substring(0, 50) + (state.result.length > 50 ? '...' : '');
        if(typeof state.result === 'object') return `[Object] Keys: ${Object.keys(state.result).slice(0,3).join(', ')}`;
        return String(state.result);
    }
    
    const duration = (state.startTime && state.endTime) ? `${((state.endTime - state.startTime)/1000).toFixed(2)}s` : null;

    return (
        <div className={`relative shadow-md rounded-lg bg-gray-900 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
            {/* Input Handle */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className="!bg-gray-500 !w-3 !h-3 !border-2 !border-gray-900" 
            />

            <div 
                onClick={() => onClick(task)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-500 w-72 ${config.bg} ${config.border} ${selected ? 'border-blue-500' : ''}`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${config.iconBg} ${config.text}`}>
                            <TaskIcon type={task.type} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-50 truncate w-32" title={task.name}>{task.name}</h3>
                            {hasInputData && <span title="Input has been staged for this task"><CheckIcon className="w-4 h-4 text-teal-400" /></span>}
                            {task.promptId && <span title="Linked to SFL Prompt Library"><LinkIcon className="w-4 h-4 text-gray-500" /></span>}
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${config.bg} ${config.text}`}>
                        {state.status}
                    </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 h-8 overflow-hidden line-clamp-2" title={task.description}>{task.description}</p>
                
                <div className="mt-3 pt-3 border-t border-gray-700 text-[10px] space-y-1">
                    <p className="flex justify-between"><span className="font-medium text-gray-300">In:</span> <span className="text-gray-400 truncate max-w-[120px]" title={task.inputKeys.join(', ')}>{task.inputKeys.join(', ') || 'None'}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-300">Out:</span> <span className="text-gray-400 truncate max-w-[120px]" title={task.outputKey}>{task.outputKey}</span></p>
                </div>
                
                {state.status === TaskStatus.COMPLETED && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                        <p className="font-medium text-teal-300">Result:</p>
                        <p className="text-gray-200 break-words h-6 overflow-hidden">{getResultSummary()}</p>
                    </div>
                )}
                
                {state.status === TaskStatus.FAILED && state.error && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                        <p className="font-medium text-red-300">Error:</p>
                        <p className="text-red-400 break-words h-6 overflow-hidden" title={state.error}>{state.error}</p>
                    </div>
                )}
                
                {duration && (
                    <div className="text-right text-[10px] text-gray-500 mt-2">
                        {duration}
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className="!bg-gray-500 !w-3 !h-3 !border-2 !border-gray-900" 
            />
        </div>
    );
};

export default TaskNode;
