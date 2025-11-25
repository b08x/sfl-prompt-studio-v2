
import { useState, useCallback } from 'react';
import { Workflow, DataStore, TaskStateMap, TaskStatus, Task, PromptSFL, StagedUserInput } from '../types';
import { topologicalSort, executeTask } from '../services/workflowEngine';

export const useWorkflowRunner = (workflow: Workflow | null, prompts: PromptSFL[]) => {
    const [dataStore, setDataStore] = useState<DataStore>({});
    const [taskStates, setTaskStates] = useState<TaskStateMap>({});
    const [isRunning, setIsRunning] = useState(false);
    const [runFeedback, setRunFeedback] = useState<string[]>([]);
    
    const resetTaskStates = useCallback(() => {
        if (!workflow) {
            setTaskStates({});
            return;
        }
        const initialStates: TaskStateMap = {};
        for (const task of workflow.tasks) {
            initialStates[task.id] = { status: TaskStatus.PENDING };
        }
        setTaskStates(initialStates);
        setRunFeedback([]);
    }, [workflow]);

    const reset = useCallback(() => {
        resetTaskStates();
        setDataStore({});
        setIsRunning(false);
    }, [resetTaskStates]);
    
    const stageInput = useCallback((input: StagedUserInput) => {
        resetTaskStates();
        setDataStore({ userInput: input });
    }, [resetTaskStates]);


    const run = useCallback(async () => {
        if (!workflow) {
            setRunFeedback(['No workflow selected.']);
            return;
        }
        
        const initialDataStore = await new Promise<DataStore>(resolve => setDataStore(current => { resolve(current); return current; }));

        if (!initialDataStore.userInput || Object.values(initialDataStore.userInput).every(v => !v)) {
            setRunFeedback(prev => [...prev, 'Warning: No input was staged. Running with empty input.']);
        }

        setIsRunning(true);
        resetTaskStates();

        const { sortedTasks, feedback } = topologicalSort(workflow.tasks);
        if (feedback.length > 0) {
            setRunFeedback(prev => [...prev, ...feedback]);
        }

        if (feedback.some(f => f.includes('Cycle detected'))) {
            setIsRunning(false);
            return;
        }
        
        let currentDataStore = { ...initialDataStore };
        let currentTaskStates: TaskStateMap = {};
        workflow.tasks.forEach(task => {
            currentTaskStates[task.id] = { status: TaskStatus.PENDING };
        });


        for (const task of sortedTasks) {
            const hasFailedDependency = task.dependencies.some(depId => 
                currentTaskStates[depId]?.status === TaskStatus.FAILED || 
                currentTaskStates[depId]?.status === TaskStatus.SKIPPED
            );
            
            if (hasFailedDependency) {
                const skippedState = { status: TaskStatus.SKIPPED, error: 'Skipped due to dependency failure.' };
                currentTaskStates = { ...currentTaskStates, [task.id]: skippedState };
                setTaskStates(prev => ({...prev, [task.id]: skippedState}));
                continue;
            }

            const runningState = { status: TaskStatus.RUNNING, startTime: Date.now() };
            currentTaskStates = { ...currentTaskStates, [task.id]: runningState };
            setTaskStates(prev => ({...prev, [task.id]: runningState}));
            
            try {
                const result = await executeTask(task, currentDataStore, prompts);

                currentDataStore = { ...currentDataStore, [task.outputKey]: result };
                setDataStore(prev => ({ ...prev, [task.outputKey]: result }));

                const completedState = { ...runningState, status: TaskStatus.COMPLETED, result, endTime: Date.now() };
                currentTaskStates = { ...currentTaskStates, [task.id]: completedState };
                setTaskStates(prev => ({ ...prev, [task.id]: completedState }));

            } catch (error: any) {
                console.error(`Error executing task ${task.name}:`, error);
                const failedState = { ...runningState, status: TaskStatus.FAILED, error: error.message, endTime: Date.now() };
                currentTaskStates = { ...currentTaskStates, [task.id]: failedState };
                setTaskStates(prev => ({ ...prev, [task.id]: failedState }));
                // Stop execution on failure
                break;
            }
        }
        
        setIsRunning(false);

    }, [workflow, prompts, resetTaskStates]);

    return { dataStore, taskStates, isRunning, run, reset, stageInput, runFeedback };
};
