
import React, { useState } from 'react';
import { Workflow, StagedUserInput, TaskStatus, PromptSFL } from '../../types';
import { useWorkflowRunner } from '../../hooks/useWorkflowRunner';
import TaskNode from './TaskNode';
import DataStoreViewer from './DataStoreViewer';
import PlayIcon from '../icons/PlayIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import TaskDetailModal from './modals/TaskDetailModal';

interface WorkflowCanvasProps {
    workflow: Workflow;
    stagedInput: StagedUserInput;
    prompts: PromptSFL[];
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflow, stagedInput, prompts }) => {
    const { dataStore, taskStates, isRunning, run, reset, runFeedback } = useWorkflowRunner(workflow, prompts);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<string | null>(null);

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskForDetail(taskId);
    };
    
    const taskForModal = workflow.tasks.find(t => t.id === selectedTaskForDetail);
    const taskStateForModal = selectedTaskForDetail ? taskStates[selectedTaskForDetail] : undefined;

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-900">
            <header className="flex-shrink-0 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-50">{workflow.name}</h2>
                    <p className="text-sm text-gray-400">{workflow.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => reset()}
                        disabled={isRunning}
                        className="flex items-center space-x-2 bg-gray-700 text-gray-200 border border-gray-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={() => run(stagedInput)}
                        disabled={isRunning}
                        className="flex items-center space-x-2 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isRunning ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <PlayIcon className="w-5 h-5" />}
                        <span>{isRunning ? 'Running...' : 'Run Workflow'}</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                     {runFeedback.length > 0 && (
                        <div className="mb-4 p-3 bg-amber-900/50 border-l-4 border-amber-500 text-amber-300 text-xs rounded-r-lg">
                            <p className="font-bold">Execution Notes:</p>
                            <ul className="list-disc list-inside">
                                {runFeedback.map((fb, i) => <li key={i}>{fb}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {workflow.tasks.map(task => (
                            <TaskNode
                                key={task.id}
                                task={task}
                                state={taskStates[task.id] || { status: TaskStatus.PENDING }}
                                onClick={() => handleTaskClick(task.id)}
                            />
                        ))}
                    </div>
                </div>
                
                <aside className="w-[400px] bg-gray-800 border-l border-gray-700 overflow-y-auto">
                    <DataStoreViewer dataStore={dataStore} />
                </aside>
            </div>
            
            {selectedTaskForDetail && taskForModal && (
                <TaskDetailModal
                    isOpen={true}
                    onClose={() => setSelectedTaskForDetail(null)}
                    task={taskForModal}
                    taskState={taskStateForModal}
                    prompts={prompts}
                />
            )}
        </div>
    );
};

export default WorkflowCanvas;