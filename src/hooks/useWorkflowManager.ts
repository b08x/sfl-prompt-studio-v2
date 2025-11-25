import { useState, useEffect, useCallback } from 'react';
import { Workflow } from '../types';
import { DEFAULT_WORKFLOWS } from '../constants';

const LOCAL_STORAGE_KEY = 'sfl-custom-workflows';

export const useWorkflowManager = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Client-Side Persistence for Workflows ---
    useEffect(() => {
        // 1. LOAD: This effect runs once on component mount to load custom workflows.
        // It reads from localStorage, providing persistence for user-created workflows.
        try {
            const savedWorkflowsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
            const savedWorkflows = savedWorkflowsRaw ? JSON.parse(savedWorkflowsRaw) : [];
            
            if (!Array.isArray(savedWorkflows)) {
                 throw new Error("Invalid data in localStorage");
            }

            // The app merges read-only default workflows with the user's custom, editable ones.
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
        // --- FUTURE ENHANCEMENT: Backend API Call ---
        // To sync workflows, this localStorage logic would be replaced with an API call.
        // Example:
        // fetch('/api/workflows')
        //   .then(res => res.json())
        //   .then(customWfs => {
        //      const defaultWfs = DEFAULT_WORKFLOWS.map(wf => ({ ...wf, isDefault: true }));
        //      setWorkflows([...defaultWfs, ...customWfs]);
        //   })
        //   .catch(err => console.error("Failed to fetch workflows", err))
        //   .finally(() => setIsLoading(false));
    }, []);

    // 2. SAVE (Central Function): This function is responsible for writing *only* custom workflows
    // back to localStorage. It's called by `saveWorkflow` and `deleteWorkflow`.
    const saveCustomWorkflows = useCallback((customWorkflows: Workflow[]) => {
        try {
            // We filter out default workflows to avoid saving them, as they are part of the app's static assets.
            const workflowsToSave = customWorkflows.filter(wf => !wf.isDefault);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workflowsToSave));
            
            // Re-compose the full list for the UI state.
            setWorkflows([
                ...DEFAULT_WORKFLOWS.map(wf => ({ ...wf, isDefault: true })), 
                ...workflowsToSave.map(wf => ({...wf, isDefault: false}))
            ]);
        } catch (error) {
            console.error("Failed to save workflows to localStorage:", error);
        }
        // --- FUTURE ENHANCEMENT: Backend API Call ---
        // This function would be removed. Instead, `saveWorkflow` and `deleteWorkflow` would make
        // their own specific API calls.
    }, []);

    const saveWorkflow = useCallback((workflowToSave: Workflow) => {
        // --- FUTURE ENHANCEMENT: Backend API Call ---
        // This is the ideal place to create or update a workflow on the backend.
        setWorkflows(prevWorkflows => {
            const newWorkflow = { ...workflowToSave, isDefault: false }; // Always save as a custom workflow
            const existingIndex = prevWorkflows.findIndex(wf => wf.id === newWorkflow.id && !wf.isDefault);
            
            let updatedCustomWorkflows;
            if (existingIndex > -1) {
                // UPDATE (PUT/PATCH): The workflow exists, so send an update request.
                // fetch(`/api/workflows/${newWorkflow.id}`, { method: 'PUT', body: JSON.stringify(newWorkflow), ... });
                updatedCustomWorkflows = prevWorkflows.filter(wf => !wf.isDefault).map(wf => wf.id === newWorkflow.id ? newWorkflow : wf);
            } else {
                // CREATE (POST): This is a new workflow, send a create request.
                // fetch('/api/workflows', { method: 'POST', body: JSON.stringify(newWorkflow), ... });
                updatedCustomWorkflows = [...prevWorkflows.filter(wf => !wf.isDefault), newWorkflow];
            }
            
            // For client-side persistence, we call the central save function.
            saveCustomWorkflows(updatedCustomWorkflows);

            // In a backend scenario, you would typically refetch the list or update state based on the API response.
            return [
                ...DEFAULT_WORKFLOWS.map(wf => ({...wf, isDefault: true})),
                ...updatedCustomWorkflows
            ];
        });
    }, [saveCustomWorkflows]);
    
    const deleteWorkflow = useCallback((workflowId: string) => {
        // --- FUTURE ENHANCEMENT: Backend API Call ---
        // This is where a DELETE request to the backend would be made.
        // fetch(`/api/workflows/${workflowId}`, { method: 'DELETE', ... });
        setWorkflows(prevWorkflows => {
            const updatedCustomWorkflows = prevWorkflows.filter(wf => wf.id !== workflowId && !wf.isDefault);
            
            // For client-side persistence, we call the central save function.
            saveCustomWorkflows(updatedCustomWorkflows);

            // In a backend scenario, this state update would happen after a successful API call.
            return [
                ...DEFAULT_WORKFLOWS.map(wf => ({...wf, isDefault: true})),
                ...updatedCustomWorkflows
            ];
        });
    }, [saveCustomWorkflows]);

    return { workflows, saveWorkflow, deleteWorkflow, isLoading, setWorkflows, saveCustomWorkflows };
};