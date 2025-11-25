import React, { useRef } from 'react';
import { Workflow } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import MagicWandIcon from '../icons/MagicWandIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import ArrowUpTrayIcon from '../icons/ArrowUpTrayIcon';
import ArrowDownTrayIcon from '../icons/ArrowDownTrayIcon';

interface WorkflowControlsProps {
    workflows: Workflow[];
    activeWorkflow: Workflow | null;
    onSelectWorkflow: (id: string) => void;
    onOpenEditor: () => void;
    onOpenWizard: () => void;
    onDeleteWorkflow: (id: string) => void;
    onImportWorkflows: (workflows: Workflow[]) => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
    workflows,
    activeWorkflow,
    onSelectWorkflow,
    onOpenEditor,
    onOpenWizard,
    onDeleteWorkflow,
    onImportWorkflows
}) => {
    const importFileRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (!activeWorkflow) return alert("No workflow selected to export.");
        // We export as an array to make import logic consistent
        const data = JSON.stringify([activeWorkflow], null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeWorkflow.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const importedData = JSON.parse(content);
                if (!Array.isArray(importedData)) {
                    throw new Error("Imported file must be a JSON array of workflows.");
                }
                onImportWorkflows(importedData);
            } catch (err: any) {
                alert(`Import failed: ${err.message}`);
            }
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };
    
    const buttonClasses = "flex items-center justify-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="flex items-center justify-between w-full">
             <input type="file" ref={importFileRef} onChange={handleFileImport} className="hidden" accept=".json" />

            {/* Left Side: Selection and Creation */}
            <div className="flex items-center gap-3">
                 <select
                    id="workflow-select"
                    value={activeWorkflow?.id || ''}
                    onChange={(e) => onSelectWorkflow(e.target.value)}
                    className="w-72 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md shadow-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <optgroup label="Default Workflows">
                        {workflows.filter(w => w.isDefault).map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </optgroup>
                    <optgroup label="Custom Workflows">
                        {workflows.filter(w => !w.isDefault).map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </optgroup>
                </select>
                <button onClick={onOpenEditor} className={buttonClasses} title="Create new workflow from scratch">
                    <PlusIcon className="w-4 h-4"/>
                    <span>New</span>
                </button>
                <button onClick={onOpenWizard} className={buttonClasses} title="Create new workflow with AI">
                    <MagicWandIcon className="w-4 h-4"/>
                    <span>Wizard</span>
                </button>
            </div>

            {/* Right Side: Actions for selected workflow */}
            <div className="flex items-center gap-2">
                 <button onClick={handleImportClick} className={buttonClasses} title="Import workflows from a JSON file">
                    <ArrowUpTrayIcon className="w-4 h-4"/>
                </button>
                <button onClick={handleExport} disabled={!activeWorkflow} className={buttonClasses} title="Export the selected workflow">
                   <ArrowDownTrayIcon className="w-4 h-4"/>
                </button>
                 <button 
                    onClick={onOpenEditor} 
                    disabled={!activeWorkflow}
                    className={buttonClasses}
                    title={activeWorkflow?.isDefault ? "Clone to edit this default workflow" : "Edit this workflow"}
                >
                    <PencilIcon className="w-4 h-4"/>
                    <span>{activeWorkflow?.isDefault ? "Clone" : "Edit"}</span>
                </button>
                <button 
                    onClick={() => {
                        if (activeWorkflow && window.confirm(`Are you sure you want to delete "${activeWorkflow.name}"?`)) {
                            onDeleteWorkflow(activeWorkflow.id);
                        }
                    }}
                    disabled={!activeWorkflow || activeWorkflow.isDefault}
                    className={`${buttonClasses} hover:bg-red-500/20 hover:text-red-300`}
                    title={activeWorkflow?.isDefault ? "Default workflows cannot be deleted" : "Delete this workflow"}
                >
                    <TrashIcon className="w-4 h-4"/>
                </button>
            </div>
        </div>
    );
};

export default WorkflowControls;