
import React, { useState, useCallback, useEffect } from 'react';
import { Workflow, ModalType, StagedUserInput, PromptSFL } from '../../types';
import { useWorkflowManager } from '../../hooks/useWorkflowManager';
import { useWorkflowRunner } from '../../hooks/useWorkflowRunner';
import WorkflowControls from './WorkflowControls';
import UserInputArea from './UserInputArea';
import WorkflowCanvas from './WorkflowCanvas';
import WorkflowEditorModal from './modals/WorkflowEditorModal';
import WorkflowWizardModal from './modals/WorkflowWizardModal';
import ChevronDoubleLeftIcon from '../icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from '../icons/ChevronDoubleRightIcon';
// FIX: Import DataStoreViewer component
import DataStoreViewer from './DataStoreViewer';

interface PromptLabPageProps {
    prompts: PromptSFL[];
}

const PromptLabPage: React.FC<PromptLabPageProps> = ({ prompts }) => {
    const { workflows, saveWorkflow, deleteWorkflow, isLoading, saveCustomWorkflows } = useWorkflowManager();
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
    const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
    
    const activeWorkflow = workflows.find(wf => wf.id === activeWorkflowId) || null;
    const { dataStore, taskStates, isRunning, run, reset, runFeedback, stageInput } = useWorkflowRunner(activeWorkflow, prompts);

    useEffect(() => {
        if (!isLoading && workflows.length > 0 && !activeWorkflowId) {
            setActiveWorkflowId(workflows[0].id);
        }
    }, [isLoading, workflows, activeWorkflowId]);

    const handleOpenModal = (modalType: ModalType) => setActiveModal(modalType);
    const handleCloseModal = () => setActiveModal(ModalType.NONE);

    const handleSaveWorkflow = (workflow: Workflow) => {
        saveWorkflow(workflow);
        setActiveWorkflowId(workflow.id); // Switch to the newly saved/edited workflow
        handleCloseModal();
    };
    
    const handleImportWorkflows = (importedWorkflows: Workflow[]) => {
        const customWorkflows = workflows.filter(wf => !wf.isDefault);
        const merged = [...customWorkflows];
        
        importedWorkflows.forEach(iw => {
            const index = merged.findIndex(cw => cw.id === iw.id);
            if (index !== -1) {
                merged[index] = iw; // Overwrite
            } else {
                merged.push(iw); // Add new
            }
        });
        
        saveCustomWorkflows(merged);
        alert(`Import successful. ${importedWorkflows.length} workflows imported/updated.`);
    };


    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="spinner"></div></div>;
    }

    return (
        <div className="flex h-full bg-gray-900 font-sans">
            <aside className={`
                ${isRunning ? 'w-0 p-0 opacity-0' : (isLeftSidebarCollapsed ? 'w-0 p-0 opacity-0' : 'w-[350px] p-4')}
                bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out
            `}>
                <div className="w-[318px] flex-grow flex flex-col space-y-4 overflow-hidden">
                    <WorkflowControls
                        workflows={workflows}
                        activeWorkflow={activeWorkflow}
                        onSelectWorkflow={setActiveWorkflowId}
                        onOpenEditor={() => handleOpenModal(ModalType.WORKFLOW_EDITOR)}
                        onOpenWizard={() => handleOpenModal(ModalType.WORKFLOW_WIZARD)}
                        onDeleteWorkflow={deleteWorkflow}
                        onImportWorkflows={handleImportWorkflows}
                    />
                    <UserInputArea onStageInput={stageInput} />
                </div>
            </aside>
            
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {!isRunning && (
                    <button
                        onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                        className="absolute top-1/2 -translate-y-1/2 left-0 z-20 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded-r-md transition-opacity"
                        title={isLeftSidebarCollapsed ? 'Show Selection Panel' : 'Hide Selection Panel'}
                    >
                        {isLeftSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5"/> : <ChevronDoubleLeftIcon className="w-5 h-5"/>}
                    </button>
                )}
                
                <button
                    onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                    className="absolute top-1/2 -translate-y-1/2 right-0 z-20 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded-l-md"
                    title={isRightSidebarCollapsed ? 'Show Data Store' : 'Hide Data Store'}
                >
                    {isRightSidebarCollapsed ? <ChevronDoubleLeftIcon className="w-5 h-5"/> : <ChevronDoubleRightIcon className="w-5 h-5"/>}
                </button>


                 {activeWorkflow ? (
                    <WorkflowCanvas
                        key={activeWorkflow.id} 
                        workflow={activeWorkflow}
                        prompts={prompts}
                        dataStore={dataStore}
                        taskStates={taskStates}
                        isRunning={isRunning}
                        run={run}
                        reset={reset}
                        runFeedback={runFeedback}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-400">
                        <div>
                            <h2 className="text-xl font-semibold">No Workflow Selected</h2>
                            <p>Please select a workflow from the sidebar, or create a new one.</p>
                        </div>
                    </div>
                )}
            </main>
            
             <aside className={`
                ${isRightSidebarCollapsed ? 'w-0 opacity-0' : 'w-[400px]'}
                bg-gray-800 border-l border-gray-700 transition-all duration-300 ease-in-out
            `}>
                <div className="w-[400px] h-full overflow-hidden">
                    <DataStoreViewer dataStore={dataStore} />
                </div>
            </aside>

            {activeModal === ModalType.WORKFLOW_EDITOR && (
                <WorkflowEditorModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSave={handleSaveWorkflow}
                    workflowToEdit={activeWorkflow?.isDefault ? null : activeWorkflow}
                    prompts={prompts}
                />
            )}
            
            {activeModal === ModalType.WORKFLOW_WIZARD && (
                <WorkflowWizardModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSave={handleSaveWorkflow}
                    prompts={prompts}
                />
            )}
        </div>
    );
};

export default PromptLabPage;
