import { useState, useEffect, useCallback } from 'react';
import { Workflow } from '../types';
import { DEFAULT_WORKFLOWS } from '../constants';

const LOCAL_STORAGE_KEY = 'sfl-custom-workflows';

export const useWorkflowManager = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const savedWorkflowsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const savedWorkflows = savedWorkflowsRaw ? JSON.parse(savedWorkflowsRaw) : [];
            
            if (!Array.isArray(savedWorkflows)) {
                 throw new Error("Invalid data in localStorage");
            }

            // Combine defaults with custom, ensuring defaults are marked as such
            const defaultWfs = DEFAULT_WORKFLOWS.map(wf => ({ ...wf, isDefault: true }));
            const customWfs = savedWorkflows.map(wf => ({...wf, isDefault: false }));

            setWorkflows([...defaultWfs, ...customWfs]);

        } catch (error) {
            console.error("Failed to load workflows from localStorage:", error);
            setWorkflows(DEFAULT_WORKFLOWS.map(wf => ({...wf, isDefault: true})));
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveCustomWorkflows = useCallback((customWorkflows: Workflow[]) => {
        try {
            const workflowsToSave = customWorkflows.filter(wf => !wf.isDefault);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workflowsToSave));
            setWorkflows([
                ...DEFAULT_WORKFLOWS.map(wf => ({ ...wf, isDefault: true })), 
                ...workflowsToSave.map(wf => ({...wf, isDefault: false}))
            ]);
        } catch (error) {
            console.error("Failed to save workflows to localStorage:", error);
        }
    }, []);

    const saveWorkflow = useCallback((workflowToSave: Workflow) => {
        setWorkflows(prevWorkflows => {
            const newWorkflow = { ...workflowToSave, isDefault: false }; // Always save as a custom workflow
            const existingIndex = prevWorkflows.findIndex(wf => wf.id === newWorkflow.id && !wf.isDefault);
            
            let updatedCustomWorkflows;
            if (existingIndex > -1) {
                updatedCustomWorkflows = prevWorkflows.filter(wf => !wf.isDefault).map(wf => wf.id === newWorkflow.id ? newWorkflow : wf);
            } else {
                updatedCustomWorkflows = [...prevWorkflows.filter(wf => !wf.isDefault), newWorkflow];
            }
            
            saveCustomWorkflows(updatedCustomWorkflows);
            return [
                ...DEFAULT_WORKFLOWS.map(wf => ({...wf, isDefault: true})),
                ...updatedCustomWorkflows
            ];
        });
    }, [saveCustomWorkflows]);
    
    const deleteWorkflow = useCallback((workflowId: string) => {
        setWorkflows(prevWorkflows => {
            const updatedCustomWorkflows = prevWorkflows.filter(wf => wf.id !== workflowId && !wf.isDefault);
            saveCustomWorkflows(updatedCustomWorkflows);
            return [
                ...DEFAULT_WORKFLOWS.map(wf => ({...wf, isDefault: true})),
                ...updatedCustomWorkflows
            ];
        });
    }, [saveCustomWorkflows]);

    return { workflows, saveWorkflow, deleteWorkflow, isLoading, setWorkflows, saveCustomWorkflows };
};
