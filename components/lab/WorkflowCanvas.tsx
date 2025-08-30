

import React, { useState, useEffect } from 'react';
import { Workflow, TaskStatus, PromptSFL, DataStore, TaskStateMap } from '../../types';
import TaskNode from './TaskNode';
import PlayIcon from '../icons/PlayIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import TaskDetailModal from './modals/TaskDetailModal';

interface WorkflowCanvasProps {
    workflow: Workflow;
    prompts: PromptSFL[];
    dataStore: DataStore;
    taskStates: TaskStateMap;
    isRunning: boolean;
    run: () => void;
    reset: () => void;
    runFeedback: string[];
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflow, prompts, dataStore, taskStates, isRunning, run, reset, runFeedback }) => {
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<string | null>(null);

    // Reset the runner state when the workflow itself changes.
    useEffect(() => {
        reset();
    }, [workflow, reset]);


    const handleTaskClick = (taskId: string) => {
        setSelectedTaskForDetail(taskId);
    };
    
    const taskForModal = workflow.tasks.find(t => t.id === selectedTaskForDetail);
    const taskStateForModal = selectedTaskForDetail ? taskStates[selectedTaskForDetail] : undefined;

    return (
        <div className="flex-1 flex flex-col bg-gray-900">
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