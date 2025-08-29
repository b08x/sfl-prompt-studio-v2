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

    return (
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-50">Workflow Selection</h2>
            
            <input type="file" ref={importFileRef} onChange={handleFileImport} className="hidden" accept=".json" />

            <div>
                <label htmlFor="workflow-select" className="block text-sm font-medium text-gray-300 mb-1">Select Workflow</label>
                <select
                    id="workflow-select"
                    value={activeWorkflow?.id || ''}
                    onChange={(e) => onSelectWorkflow(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <optgroup label="Default Workflows">
                        {workflows.filter(w => w.isDefault).map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </optgroup>
                    <optgroup label="Custom Workflows">
                        {workflows.filter(w => !w.isDefault).map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </optgroup>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button onClick={onOpenEditor} className="flex items-center justify-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600"><PlusIcon className="w-4 h-4"/><span>New</span></button>
                <button onClick={onOpenWizard} className="flex items-center justify-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600"><MagicWandIcon className="w-4 h-4"/><span>Wizard</span></button>
            </div>
            
            {activeWorkflow && (
                <div className="border-t border-gray-700 pt-4 space-y-2">
                     <p className="text-xs text-gray-400">{activeWorkflow.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={onOpenEditor} 
                            className="flex items-center justify-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600"
                            title={activeWorkflow.isDefault ? "Clone to edit" : "Edit this workflow"}
                        >
                            <PencilIcon className="w-4 h-4"/>
                            <span>{activeWorkflow.isDefault ? "Clone" : "Edit"}</span>
                        </button>
                        <button 
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${activeWorkflow.name}"?`)) {
                                    onDeleteWorkflow(activeWorkflow.id);
                                }
                            }}
                            disabled={activeWorkflow.isDefault}
                            className="flex items-center justify-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <TrashIcon className="w-4 h-4"/>
                            <span>Delete</span>
                        </button>
                        <button onClick={handleImportClick} className="flex items-center justify-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600">
                            <ArrowUpTrayIcon className="w-4 h-4"/>
                            <span>Import</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center justify-center space-x-2 text-sm bg-gray-700 border border-gray-600 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600">
                           <ArrowDownTrayIcon className="w-4 h-4"/>
                           <span>Export</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowControls;