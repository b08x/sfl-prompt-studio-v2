


import React, { useState } from 'react';
import { Workflow, TaskStateMap, PromptSFL, StagedUserInput, Task, TaskType, DataStore } from '../../types';
import WorkflowCanvas from './WorkflowCanvas';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import PlayIcon from '../icons/PlayIcon';
import WorkflowControls from './WorkflowControls';
import TaskDetailModal from './modals/TaskDetailModal';
import UserInputModal from './modals/UserInputModal';

interface PromptLabPageProps {
    prompts: PromptSFL[];
    activeWorkflow: Workflow | null;
    taskStates: TaskStateMap;
    isRunning: boolean;
    run: () => void;
    reset: () => void;
    runFeedback: string[];
    isLoading: boolean;
    workflows: Workflow[];
    onSelectWorkflow: (id: string) => void;
    onOpenWorkflowEditor: () => void;
    onOpenWorkflowWizard: () => void;
    onDeleteWorkflow: (id: string) => void;
    onImportWorkflows: (workflows: Workflow[]) => void;
    onStageInput: (input: StagedUserInput) => void;
    dataStore: DataStore;
}

const PromptLabPage: React.FC<PromptLabPageProps> = ({
    prompts,
    activeWorkflow,
    taskStates,
    isRunning,
    run,
    reset,
    runFeedback,
    isLoading,
    workflows,
    onSelectWorkflow,
    onOpenWorkflowEditor,
    onOpenWorkflowWizard,
    onDeleteWorkflow,
    onImportWorkflows,
    onStageInput,
    dataStore,
}) => {
    const [modalState, setModalState] = useState<{type: 'detail' | 'input' | 'none', taskId: string | null}>({type: 'none', taskId: null});

    const handleTaskClick = (task: Task) => {
        if (task.type === TaskType.DATA_INPUT) {
            setModalState({type: 'input', taskId: task.id });
        } else {
            setModalState({type: 'detail', taskId: task.id });
        }
    };
    
    const handleCloseModal = () => {
        setModalState({ type: 'none', taskId: null });
    };

    const handleStageInputAndClose = (input: StagedUserInput) => {
        onStageInput(input);
        handleCloseModal();
    };
    
    const taskForDetailModal = activeWorkflow?.tasks.find(t => t.id === modalState.taskId);
    const taskStateForDetailModal = modalState.taskId ? taskStates[modalState.taskId] : undefined;
    const taskForInputModal = activeWorkflow?.tasks.find(t => t.id === modalState.taskId && t.type === TaskType.DATA_INPUT);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="spinner"></div></div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <header className="flex-shrink-0 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                {activeWorkflow ? (
                    <>
                        <div>
                            <h2 className="text-xl font-bold text-gray-50">{activeWorkflow.name}</h2>
                            <p className="text-sm text-gray-400">{activeWorkflow.description}</p>
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
                                onClick={() => run()}
                                disabled={isRunning}
                                className="flex items-center space-x-2 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isRunning ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <PlayIcon className="w-5 h-5" />}
                                <span>{isRunning ? 'Running...' : 'Run Workflow'}</span>
                            </button>
                        </div>
                    </>
                ) : (
                     <div>
                        <h2 className="text-xl font-bold text-gray-50">Prompt Lab</h2>
                        <p className="text-sm text-gray-400">Select or create a workflow to begin.</p>
                    </div>
                )}
            </header>
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {activeWorkflow ? (
                    <WorkflowCanvas
                        key={activeWorkflow.id} 
                        workflow={activeWorkflow}
                        prompts={prompts}
                        taskStates={taskStates}
                        runFeedback={runFeedback}
                        onTaskClick={handleTaskClick}
                        dataStore={dataStore}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-400">
                        <div>
                            <h2 className="text-xl font-semibold">No Workflow Selected</h2>
                            <p>Please select a workflow from the control panel below, or create a new one.</p>
                        </div>
                    </div>
                )}
            </main>
             <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4">
                <WorkflowControls
                    workflows={workflows}
                    activeWorkflow={activeWorkflow}
                    onSelectWorkflow={onSelectWorkflow}
                    onOpenEditor={onOpenWorkflowEditor}
                    onOpenWizard={onOpenWorkflowWizard}
                    onDeleteWorkflow={onDeleteWorkflow}
                    onImportWorkflows={onImportWorkflows}
                />
            </footer>

            {modalState.type === 'detail' && taskForDetailModal && (
                <TaskDetailModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    task={taskForDetailModal}
                    taskState={taskStateForDetailModal}
                    prompts={prompts}
                />
            )}

            {modalState.type === 'input' && taskForInputModal && (
                <UserInputModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onStageInput={handleStageInputAndClose}
                    task={taskForInputModal}
                />
            )}
        </div>
    );
};

export default PromptLabPage;
