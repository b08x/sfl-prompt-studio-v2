
import React, { useState } from 'react';
import { Workflow, PromptSFL } from '../../../types';
import { generateWorkflowFromGoal } from '../../../services/workflowService';
import ModalShell from '../../ModalShell';
import WorkflowEditorModal from './WorkflowEditorModal';

interface WorkflowWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workflow: Workflow) => void;
    prompts: PromptSFL[];
}

type WizardStep = 'input' | 'loading' | 'refinement' | 'error';

const WorkflowWizardModal: React.FC<WorkflowWizardModalProps> = ({ isOpen, onClose, onSave, prompts }) => {
    const [step, setStep] = useState<WizardStep>('input');
    const [goal, setGoal] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [generatedWorkflow, setGeneratedWorkflow] = useState<Workflow | null>(null);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setErrorMessage('Please describe your workflow goal.');
            return;
        }
        setStep('loading');
        setErrorMessage('');
        try {
            const workflow = await generateWorkflowFromGoal(goal);
            setGeneratedWorkflow(workflow);
            setStep('refinement');
        } catch (error: any) {
            setErrorMessage(error.message || 'An unknown error occurred.');
            setStep('error');
        }
    };
    
    const handleCloseAndReset = () => {
        setStep('input');
        setGoal('');
        setErrorMessage('');
        setGeneratedWorkflow(null);
        onClose();
    };

    const renderContent = () => {
        switch (step) {
            case 'input':
                return (
                    <div className="space-y-4">
                        <p className="text-gray-300">Describe the multi-step process you want to automate. The AI will generate a structured workflow with all the necessary tasks, inputs, and outputs.</p>
                        <div>
                            <textarea
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                rows={5}
                                placeholder="e.g., 'Take a user-provided article URL, fetch its content, summarize it, and then translate the summary into Spanish.'"
                                className="w-full p-2 bg-gray-900 border border-gray-700 text-gray-50 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        {errorMessage && <p className="text-red-400 text-sm">{errorMessage}</p>}
                        <div className="flex justify-end space-x-2">
                             <button onClick={handleCloseAndReset} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Cancel</button>
                             <button onClick={handleGenerate} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">Generate Workflow</button>
                        </div>
                    </div>
                );
            case 'loading':
                 return (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-48">
                        <div className="spinner mb-4"></div>
                        <p className="text-lg text-gray-50">Generating workflow...</p>
                    </div>
                );
            case 'refinement':
                return (
                    <WorkflowEditorModal
                        isOpen={true}
                        onClose={handleCloseAndReset}
                        onSave={onSave}
                        workflowToEdit={generatedWorkflow}
                        prompts={prompts}
                    />
                );
            case 'error':
                 return (
                    <div className="text-center p-4 bg-red-900/50 border border-red-700 rounded-lg">
                        <p className="font-semibold text-red-300">Generation Failed</p>
                        <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
                        <button onClick={() => setStep('input')} className="mt-4 px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Try Again</button>
                    </div>
                 );
        }
    };

    if (step === 'refinement') {
        return renderContent();
    }

    return (
        <ModalShell isOpen={isOpen} onClose={handleCloseAndReset} title="AI Workflow Wizard">
            {renderContent()}
        </ModalShell>
    );
};

export default WorkflowWizardModal;
