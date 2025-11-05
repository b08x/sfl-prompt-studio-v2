
import React, { useState } from 'react';
import { Workflow, TaskStateMap, PromptSFL, StagedUserInput, Task, TaskType, DataStore } from '../../types';
import WorkflowCanvas from './WorkflowCanvas';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import PlayIcon from '../icons/PlayIcon';
import WorkflowControls from './WorkflowControls';
import TaskDetailModal from './modals/TaskDetailModal';
import PromptRefinementStudio from './PromptRefinementStudio';
import WorkflowIcon from '../icons/WorkflowIcon';
import SparklesIcon from '../icons/SparklesIcon';
import UserInputArea from './UserInputArea';
import DataStoreViewer from './DataStoreViewer';


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
    saveWorkflow: (workflow: Workflow) => void;
    activeLabTab: 'workflow' | 'ideation';
    onSetLabTab: (tab: 'workflow' | 'ideation') => void;
    ideationPrompt: PromptSFL | null;
    onIdeationPromptChange: (prompt: PromptSFL) => void;
    onSelectIdeationPrompt: (promptId: string | null) => void;
}

type LabTab = 'workflow' | 'ideation';

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
    saveWorkflow,
    activeLabTab,
    onSetLabTab,
    ideationPrompt,
    onIdeationPromptChange,
    onSelectIdeationPrompt
}) => {
    const [modalState, setModalState] = useState<{type: 'detail' | 'none', taskId: string | null}>({type: 'none', taskId: null});

    const handleTaskClick = (task: Task) => {
        setModalState({type: 'detail', taskId: task.id });
    };
    
    const handleCloseModal = () => {
        setModalState({ type: 'none', taskId: null });
    };
    
    const taskForDetailModal = activeWorkflow?.tasks.find(t => t.id === modalState.taskId);
    const taskStateForDetailModal = modalState.taskId ? taskStates[modalState.taskId] : undefined;

    const handleTestInWorkflow = (workflow: Workflow) => {
        saveWorkflow(workflow);
        onSelectWorkflow(workflow.id);
        onSetLabTab('workflow');
    };

    const TabButton: React.FC<{ tabId: LabTab; icon: React.ReactNode; label: string }> = ({ tabId, icon, label }) => (
        <button
            onClick={() => onSetLabTab(tabId)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeLabTab === tabId ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:bg-gray-700'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="spinner"></div></div>;
    }

    const workflowHeader = (
         <>
            <div>
                <h2 className="text-xl font-bold text-gray-50">{activeWorkflow?.name || "Select a Workflow"}</h2>
                <p className="text-sm text-gray-400">{activeWorkflow?.description || "Select or create a workflow to get started."}</p>
            </div>
            {activeWorkflow && (
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
            )}
         </>
    );
    
    const ideationHeader = (
        <div>
            <h2 className="text-xl font-bold text-gray-50">Prompt Ideation Studio</h2>
            <p className="text-sm text-gray-400">Refine prompts in real-time with the Live AI Assistant.</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <header className="flex-shrink-0 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                {activeLabTab === 'workflow' ? workflowHeader : ideationHeader}
            </header>

            <div className="flex-shrink-0 px-6 py-2 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center space-x-2">
                    <TabButton tabId="workflow" icon={<WorkflowIcon className="w-5 h-5"/>} label="Workflow Canvas"/>
                    <TabButton tabId="ideation" icon={<SparklesIcon className="w-5 h-5"/>} label="Ideation Studio"/>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {activeLabTab === 'workflow' && (
                    <>
                        {/* Main Canvas and Controls Area */}
                        <div className="flex-1 flex flex-col overflow-hidden">
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
                            <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4 z-10">
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
                        </div>
                        
                        {/* Right Sidebar for Input & Data */}
                        <aside className="w-[32rem] flex-shrink-0 border-l border-gray-700 flex flex-col p-4 space-y-4 overflow-y-auto bg-gray-800/50">
                            <UserInputArea onStageInput={onStageInput} />
                            <div className="flex-grow flex flex-col min-h-0">
                                <DataStoreViewer dataStore={dataStore} />
                            </div>
                        </aside>
                    </>
                )}
                {activeLabTab === 'ideation' && (
                    <PromptRefinementStudio 
                        prompts={prompts} 
                        onTestInWorkflow={handleTestInWorkflow}
                        prompt={ideationPrompt}
                        onPromptChange={onIdeationPromptChange}
                        onSelectPrompt={onSelectIdeationPrompt}
                    />
                )}
            </div>

            {modalState.type === 'detail' && taskForDetailModal && (
                <TaskDetailModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    task={taskForDetailModal}
                    taskState={taskStateForDetailModal}
                    prompts={prompts}
                />
            )}
        </div>
    );
};

export default PromptLabPage;
