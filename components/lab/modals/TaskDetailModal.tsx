

import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Task, TaskState, TaskType, PromptSFL, TaskStatus } from '../../../types';
import ModalShell from '../../ModalShell';
import ClipboardIcon from '../../icons/ClipboardIcon';
import ArrowDownTrayIcon from '../../icons/ArrowDownTrayIcon';
import CheckIcon from '../../icons/CheckIcon';

const DetailItem: React.FC<{ label: string; value?: any; isCode?: boolean }> = ({ label, value, isCode }) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return null;

    let displayValue = value;
    if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
    } else {
        displayValue = String(value);
    }
    
    return (
        <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-1">{label}</h4>
            <pre className={`p-3 rounded-md text-sm whitespace-pre-wrap break-all border ${isCode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-blue-900/50 border-blue-800 text-blue-300'}`}>
                {displayValue}
            </pre>
        </div>
    );
};

const ChartRenderer: React.FC<{data: any[]}> = ({data}) => {
    if (!Array.isArray(data) || data.length === 0) {
        return <p className="text-sm text-gray-400">No data available for chart.</p>;
    }
    // Basic validation for chart data structure
    const sample = data[0];
    if (typeof sample !== 'object' || !sample.name || !sample.value) {
         return <DetailItem label="Chart Data" value={data} isCode />;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{fill: '#9CA3AF'}} />
                    <YAxis tick={{fill: '#9CA3AF'}}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Legend wrapperStyle={{ color: '#F9FAFB' }} />
                    <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    taskState?: TaskState;
    prompts: PromptSFL[];
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, taskState, prompts }) => {
    const linkedPrompt = task.promptId ? prompts.find(p => p.id === task.promptId) : null;
    const [isCopied, setIsCopied] = useState(false);

    const isGroundedResult = task.type === TaskType.GEMINI_GROUNDED && taskState?.result && typeof taskState.result === 'object' && taskState.result !== null && 'text' in taskState.result && 'sources' in taskState.result;

    const handleCopyToClipboard = () => {
        if (!taskState?.result) return;
        const resultString = typeof taskState.result === 'object' 
            ? JSON.stringify(taskState.result, null, 2) 
            : String(taskState.result);
        navigator.clipboard.writeText(resultString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleExportMarkdown = () => {
        if (!taskState?.result) return;

        const resultString = typeof taskState.result === 'object'
            ? JSON.stringify(taskState.result, null, 2)
            : String(taskState.result);

        const markdownContent = [
            `# Task Output: ${task.name}`,
            `**Status:** ${taskState.status}`,
            `**Timestamp:** ${new Date().toISOString()}`,
            '---',
            '## Result',
            '```',
            resultString,
            '```'
        ].join('\n');

        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const sanitizedName = task.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.href = url;
        a.download = `task_output_${sanitizedName}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title={`Task Details: ${task.name}`} size="3xl">
            <div className="space-y-6 text-gray-50">
                <section>
                    <h3 className="text-lg font-bold text-gray-50 mb-2 border-b border-gray-700 pb-2">Configuration</h3>
                    <div className="space-y-3 mt-2 text-sm text-gray-300">
                        <p><strong>ID:</strong> {task.id}</p>
                        <p><strong>Description:</strong> {task.description}</p>
                        <p><strong>Type:</strong> {task.type}</p>
                        {linkedPrompt && <p><strong>Linked Prompt:</strong> {linkedPrompt.title}</p>}
                        <DetailItem label="Dependencies" value={task.dependencies} isCode />
                        <DetailItem label="Input Keys" value={task.inputKeys} isCode />
                        <DetailItem label="Output Key" value={task.outputKey} isCode />
                        <DetailItem label="Prompt Template" value={task.promptTemplate} isCode />
                        <DetailItem label="Function Body" value={task.functionBody} isCode />
                        <DetailItem label="Static Value" value={task.staticValue} isCode />
                        <DetailItem label="Agent Config" value={task.agentConfig} isCode />
                    </div>
                </section>
                
                {taskState && (
                     <section>
                        <h3 className="text-lg font-bold text-gray-50 mb-2 border-b border-gray-700 pb-2">Execution State</h3>
                         <div className="space-y-3 mt-2 text-sm text-gray-300">
                            <p><strong>Status:</strong> {taskState.status}</p>
                            {taskState.startTime && <p><strong>Start Time:</strong> {new Date(taskState.startTime).toLocaleString()}</p>}
                            {taskState.endTime && <p><strong>End Time:</strong> {new Date(taskState.endTime).toLocaleString()}</p>}
                            {taskState.startTime && taskState.endTime && <p><strong>Duration:</strong> {((taskState.endTime - taskState.startTime)/1000).toFixed(3)} seconds</p>}
                            
                            {isGroundedResult ? (
                                <div>
                                    <DetailItem label="Grounded Response" value={taskState.result.text} />
                                    {Array.isArray(taskState.result.sources) && taskState.result.sources.length > 0 && (
                                        <div className="mt-3">
                                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources</h4>
                                            <ul className="list-disc list-inside space-y-2 pl-2 text-sm">
                                                {taskState.result.sources.map((source: any, index: number) => (
                                                    <li key={index} className="text-blue-400 truncate hover:text-blue-300">
                                                        <a 
                                                            href={source.uri} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="hover:underline"
                                                            title={source.uri}
                                                        >
                                                            {source.title || source.uri}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : task.type === TaskType.DISPLAY_CHART && taskState.result ? (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 mb-1">Chart</h4>
                                    <ChartRenderer data={taskState.result} />
                                </div>
                            ) : (
                                <DetailItem label="Result" value={taskState.result} />
                            )}

                            {taskState.status === TaskStatus.COMPLETED && taskState.result !== undefined && taskState.result !== null && (
                                <div className="flex items-center space-x-2 pt-3">
                                    <button
                                        onClick={handleCopyToClipboard}
                                        className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                        {isCopied ? <CheckIcon className="w-4 h-4 text-teal-400" /> : <ClipboardIcon className="w-4 h-4" />}
                                        <span>{isCopied ? 'Copied!' : 'Copy Result'}</span>
                                    </button>
                                    <button
                                        onClick={handleExportMarkdown}
                                        className="flex items-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-600 transition-colors"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                        <span>Export as Markdown</span>
                                    </button>
                                </div>
                            )}
                            
                            <DetailItem label="Error" value={taskState.error} />
                         </div>
                    </section>
                )}
                 <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Close</button>
                </div>
            </div>
        </ModalShell>
    );
};

export default TaskDetailModal;