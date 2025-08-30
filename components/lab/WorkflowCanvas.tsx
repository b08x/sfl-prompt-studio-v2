


import React from 'react';
import { Workflow, TaskStatus, PromptSFL, TaskStateMap, Task, TaskType, DataStore, StagedUserInput } from '../../types';
import TaskNode from './TaskNode';

interface WorkflowCanvasProps {
    workflow: Workflow;
    prompts: PromptSFL[];
    taskStates: TaskStateMap;
    runFeedback: string[];
    onTaskClick: (task: Task) => void;
    dataStore: DataStore;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflow, prompts, taskStates, runFeedback, onTaskClick, dataStore }) => {
    
    const getNested = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

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
                    {workflow.tasks.map(task => {
                        const hasInputData = task.type === TaskType.DATA_INPUT && task.inputKeys.some(key => {
                            const value = getNested(dataStore, key);
                            return value !== undefined && value !== null && value !== '';
                        });

                        return (
                             <TaskNode
                                key={task.id}
                                task={task}
                                state={taskStates[task.id] || { status: TaskStatus.PENDING }}
                                onClick={() => onTaskClick(task)}
                                hasInputData={hasInputData}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WorkflowCanvas;
