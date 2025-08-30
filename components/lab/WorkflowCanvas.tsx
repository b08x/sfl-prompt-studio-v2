

import React, { useRef, useLayoutEffect, useState } from 'react';
import { Workflow, TaskStatus, PromptSFL, TaskStateMap, Task, TaskType, DataStore } from '../../types';
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
    
    const nodeRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const [paths, setPaths] = useState<string[]>([]);

    useLayoutEffect(() => {
        const calculatePaths = () => {
            const newPaths: string[] = [];
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (!canvasRect) return;

            for (const task of workflow.tasks) {
                for (const depId of task.dependencies) {
                    const sourceNode = nodeRefs.current.get(depId);
                    const targetNode = nodeRefs.current.get(task.id);

                    if (sourceNode && targetNode) {
                        const sourceRect = sourceNode.getBoundingClientRect();
                        const targetRect = targetNode.getBoundingClientRect();

                        const x1 = sourceRect.right - canvasRect.left;
                        const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
                        
                        const x2 = targetRect.left - canvasRect.left;
                        const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;

                        const controlPointX1 = x1 + 60;
                        const controlPointY1 = y1;
                        const controlPointX2 = x2 - 60;
                        const controlPointY2 = y2;

                        newPaths.push(`M ${x1} ${y1} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${x2} ${y2}`);
                    }
                }
            }
            setPaths(newPaths);
        };
        
        // Timeout to ensure layout is stable after render
        const timer = setTimeout(calculatePaths, 50);

        window.addEventListener('resize', calculatePaths);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculatePaths);
        };
    }, [workflow]);

    return (
        <div className="flex-1 flex flex-col bg-gray-900 relative" ref={canvasRef}>
             <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                <defs>
                    <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#5c6f7e" />
                    </marker>
                </defs>
                {paths.map((path, index) => (
                    <path
                        key={index}
                        d={path}
                        stroke="#5c6f7e"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrow)"
                    />
                ))}
            </svg>
            <div className="flex-1 overflow-y-auto p-6 relative z-10">
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
                                // FIX: The ref callback must not return a value. `Map.set` returns the map,
                                // so we wrap the call in braces to make the function return `undefined`.
                                ref={el => { nodeRefs.current.set(task.id, el); }}
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