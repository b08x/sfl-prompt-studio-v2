
import { useState, useCallback } from 'react';
import { Workflow, DataStore, TaskStateMap, TaskStatus, Task, PromptSFL } from '../types';
import { topologicalSort, executeTask } from '../services/workflowEngine';

export const useWorkflowRunner = (workflow: Workflow | null, prompts: PromptSFL[]) => {
    const [dataStore, setDataStore] = useState<DataStore>({});
    const [taskStates, setTaskStates] = useState<TaskStateMap>({});
    const [isRunning, setIsRunning] = useState(false);
    const [runFeedback, setRunFeedback] = useState<string[]>([]);
    
    const initializeStates = useCallback((tasks: Task[]) => {
        const initialStates: TaskStateMap = {};
        for (const task of tasks) {
            initialStates[task.id] = { status: TaskStatus.PENDING };
        }
        setTaskStates(initialStates);
        setDataStore({});
        setRunFeedback([]);
    }, []);

    const reset = useCallback(() => {
        if (workflow) {
            initializeStates(workflow.tasks);
        } else {
            setTaskStates({});
            setDataStore({});
        }
        setIsRunning(false);
    }, [workflow, initializeStates]);

    const run = useCallback(async (stagedUserInput: Record<string, any> = {}) => {
        if (!workflow) {
            setRunFeedback(['No workflow selected.']);
            return;
        }
        
        setIsRunning(true);
        initializeStates(workflow.tasks);

        const { sortedTasks, feedback } = topologicalSort(workflow.tasks);
        setRunFeedback(feedback);

        if (feedback.some(f => f.includes('Cycle detected'))) {
            setIsRunning(false);
            return;
        }
        
        // Initialize datastore with user input
        const initialDataStore: DataStore = { userInput: stagedUserInput };
        setDataStore(initialDataStore);

        for (const task of sortedTasks) {
            const hasSkippedDependency = task.dependencies.some(depId => taskStates[depId]?.status === TaskStatus.FAILED || taskStates[depId]?.status === TaskStatus.SKIPPED);
            
            if (hasSkippedDependency) {
                setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.SKIPPED, error: 'Skipped due to dependency failure.' }}));
                continue;
            }

            setTaskStates(prev => ({...prev, [task.id]: { status: TaskStatus.RUNNING, startTime: Date.now() }}));
            
            try {
                // Pass the most recent dataStore state to executeTask
                const currentDataStore = await new Promise<DataStore>(resolve => setDataStore(current => { resolve(current); return current; }));
                const result = await executeTask(task, currentDataStore, prompts);

                setDataStore(prev => ({ ...prev, [task.outputKey]: result }));
                setTaskStates(prev => ({
                    ...prev, 
                    [task.id]: { ...prev[task.id], status: TaskStatus.COMPLETED, result, endTime: Date.now() }
                }));

            } catch (error: any) {
                console.error(`Error executing task ${task.name}:`, error);
                setTaskStates(prev => ({
                    ...prev,
                    [task.id]: { ...prev[task.id], status: TaskStatus.FAILED, error: error.message, endTime: Date.now() }
                }));
            }
        }
        
        setIsRunning(false);

    }, [workflow, initializeStates, taskStates, prompts]);

    return { dataStore, taskStates, isRunning, run, reset, runFeedback };
};