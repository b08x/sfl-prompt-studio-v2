
import React, { useState, useEffect } from 'react';
import { Workflow, Task, TaskType, PromptSFL } from '../../../types';
import { AIProvider } from '../../../types/ai';
import { useStore } from '../../../store/useStore';
import ModalShell from '../../ModalShell';
import PlusIcon from '../../icons/PlusIcon';
import TrashIcon from '../../icons/TrashIcon';
import LinkIcon from '../../icons/LinkIcon';
import { validateWorkflow } from '../../../services/workflowEngine';

interface WorkflowEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workflow: Workflow) => void;
    workflowToEdit: Workflow | null;
    prompts: PromptSFL[];
}

const getEmptyTask = (defaultProvider: AIProvider, defaultModel: string, globalParams: any): Omit<Task, 'id'> => ({
    name: 'New Task',
    description: '',
    type: TaskType.GEMINI_PROMPT,
    dependencies: [],
    inputKeys: [],
    outputKey: 'newResult',
    promptTemplate: '',
    agentConfig: {
        provider: defaultProvider,
        model: defaultModel,
        temperature: globalParams.temperature,
        topK: globalParams.topK,
        topP: globalParams.topP,
    },
    functionBody: '',
    staticValue: '',
    dataKey: '',
});

const TaskEditor: React.FC<{
    task: Task;
    updateTask: (updatedTask: Task) => void;
    removeTask: () => void;
    availableDependencies: { id: string; name: string }[];
    prompts: PromptSFL[];
}> = ({ task, updateTask, removeTask, availableDependencies, prompts }) => {
    const { availableModels, defaultProvider, defaultModel } = useStore();
    const linkedPrompt = task.promptId ? prompts.find(p => p.id === task.promptId) : null;

    // Ensure agentConfig has a provider, default to Google if not set
    const taskProvider = (task.agentConfig?.provider as AIProvider) || defaultProvider;
    const taskModel = task.agentConfig?.model || defaultModel;

    const providerDisplayNames: Record<AIProvider, string> = {
        [AIProvider.Google]: 'Google (Gemini)',
        [AIProvider.OpenAI]: 'OpenAI',
        [AIProvider.OpenRouter]: 'OpenRouter',
        [AIProvider.Anthropic]: 'Anthropic (Claude)',
        [AIProvider.Mistral]: 'Mistral',
    };

    const handleChange = (field: keyof Task, value: any) => {
        updateTask({ ...task, [field]: value });
    };

    const handleAgentConfigChange = (field: string, value: any) => {
        updateTask({ ...task, agentConfig: { ...task.agentConfig, [field]: value } });
    }

    const handleDependencyChange = (depId: string) => {
        const newDeps = task.dependencies.includes(depId)
            ? task.dependencies.filter(d => d !== depId)
            : [...task.dependencies, depId];
        handleChange('dependencies', newDeps);
    };

    const handlePromptLinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const promptId = e.target.value;
        if (promptId) {
            handleChange('promptId', promptId);
        } else {
            handleChange('promptId', undefined);
        }
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

    return (
        <details className="border border-gray-700 rounded-lg p-4 bg-gray-800" open>
            <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center text-gray-50">
                <div className="flex items-center space-x-2">
                    <span>{task.name}</span>
                    {task.promptId && <LinkIcon className="w-4 h-4 text-gray-400" />}
                </div>
                <button type="button" onClick={removeTask} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
            </summary>
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClasses}>Name</label><input type="text" value={task.name} onChange={e => handleChange('name', e.target.value)} className={commonInputClasses} /></div>
                    <div><label className={labelClasses}>Type</label>
                        <select value={task.type} onChange={e => handleChange('type', e.target.value)} className={commonInputClasses}>
                            {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div><label className={labelClasses}>Description</label><input type="text" value={task.description} onChange={e => handleChange('description', e.target.value)} className={commonInputClasses} /></div>

                <div>
                    <h4 className={labelClasses}>Dependencies</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border border-gray-700 rounded-md max-h-32 overflow-y-auto bg-gray-900">
                        {availableDependencies.map(dep => (
                            <div key={dep.id} className="flex items-center">
                                <input type="checkbox" id={`dep-${task.id}-${dep.id}`} checked={task.dependencies.includes(dep.id)} onChange={() => handleDependencyChange(dep.id)} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"/>
                                <label htmlFor={`dep-${task.id}-${dep.id}`} className="ml-2 text-sm text-gray-300 truncate">{dep.name}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClasses}>Input Keys (comma-separated)</label><input type="text" value={task.inputKeys.join(',')} onChange={e => handleChange('inputKeys', e.target.value.split(',').map(k => k.trim()))} className={commonInputClasses} /></div>
                    <div><label className={labelClasses}>Output Key</label><input type="text" value={task.outputKey} onChange={e => handleChange('outputKey', e.target.value)} className={commonInputClasses} /></div>
                </div>

                {task.type === TaskType.GEMINI_PROMPT && (
                    <div className="p-3 border border-dashed border-gray-600 rounded-md space-y-3 bg-gray-900/50">
                        <div>
                            <label className={labelClasses}>Link Library Prompt</label>
                            <select value={task.promptId || ''} onChange={handlePromptLinkChange} className={commonInputClasses}>
                                <option value="">-- None (Manual Prompt) --</option>
                                {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Prompt Template</label>
                            <textarea 
                                value={linkedPrompt ? linkedPrompt.promptText : (task.promptTemplate || '')} 
                                onChange={e => handleChange('promptTemplate', e.target.value)} 
                                rows={4} 
                                className={`${commonInputClasses} font-mono text-sm disabled:bg-gray-800 disabled:text-gray-400`}
                                disabled={!!linkedPrompt}
                                placeholder={linkedPrompt ? 'This is managed by the linked prompt.' : 'Enter prompt template here...'}
                            />
                        </div>
                         {!linkedPrompt && (
                            <div className="space-y-3">
                                <h4 className={`${labelClasses} text-base font-semibold`}>Model Configuration</h4>

                                {/* Provider Selection */}
                                <div>
                                    <label className={labelClasses}>Provider</label>
                                    <select
                                        value={taskProvider}
                                        onChange={e => handleAgentConfigChange('provider', e.target.value)}
                                        className={commonInputClasses}
                                    >
                                        {Object.values(AIProvider).map(provider => (
                                            <option key={provider} value={provider}>
                                                {providerDisplayNames[provider]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Model Selection */}
                                <div>
                                    <label className={labelClasses}>Model</label>
                                    <select
                                        value={taskModel}
                                        onChange={e => handleAgentConfigChange('model', e.target.value)}
                                        className={commonInputClasses}
                                    >
                                        {availableModels[taskProvider].length > 0 ? (
                                            availableModels[taskProvider].map(model => (
                                                <option key={model.id} value={model.id}>
                                                    {model.name} {model.supportsVision ? '🖼️' : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <option value={taskModel}>{taskModel}</option>
                                        )}
                                    </select>
                                    {availableModels[taskProvider].length === 0 && (
                                        <p className="text-xs text-yellow-500 mt-1">
                                            No models discovered for this provider. Verify API key in Settings.
                                        </p>
                                    )}
                                </div>

                                {/* Temperature Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className={labelClasses}>Temperature</label>
                                        <span className="text-gray-400 text-sm">
                                            {(task.agentConfig?.temperature ?? 0.7).toFixed(2)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={task.agentConfig?.temperature ?? 0.7}
                                        onChange={e => handleAgentConfigChange('temperature', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Top P Slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className={labelClasses}>Top P</label>
                                        <span className="text-gray-400 text-sm">
                                            {(task.agentConfig?.topP ?? 0.9).toFixed(2)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={task.agentConfig?.topP ?? 0.9}
                                        onChange={e => handleAgentConfigChange('topP', parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Top K Input */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Top K</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={task.agentConfig?.topK ?? 40}
                                            onChange={e => {
                                                const value = parseInt(e.target.value);
                                                if (!isNaN(value)) {
                                                    handleAgentConfigChange('topK', value);
                                                }
                                            }}
                                            className={commonInputClasses}
                                        />
                                    </div>
                                </div>

                                {/* System Instruction */}
                                <div>
                                    <label className={labelClasses}>System Instruction (Optional)</label>
                                    <textarea
                                        value={task.agentConfig?.systemInstruction || ''}
                                        onChange={e => handleAgentConfigChange('systemInstruction', e.target.value)}
                                        rows={3}
                                        className={`${commonInputClasses} font-mono text-sm`}
                                        placeholder="Optional system instruction for the model..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {task.type === TaskType.GEMINI_GROUNDED || task.type === TaskType.IMAGE_ANALYSIS ? (
                    <div><label className={labelClasses}>Prompt Template</label><textarea value={task.promptTemplate} onChange={e => handleChange('promptTemplate', e.target.value)} rows={4} className={`${commonInputClasses} font-mono text-sm`}></textarea></div>
                ) : null}
                
                {task.type === TaskType.TEXT_MANIPULATION && (
                     <div><label className={labelClasses}>Function Body</label><textarea value={task.functionBody} onChange={e => handleChange('functionBody', e.target.value)} rows={4} className={`${commonInputClasses} font-mono text-sm`} placeholder="e.g., return `Hello, ${inputs.name}`"></textarea></div>
                )}
                
                {task.type === TaskType.DATA_INPUT && (
                    <div><label className={labelClasses}>Static Value</label><textarea value={task.staticValue} onChange={e => handleChange('staticValue', e.target.value)} rows={2} className={commonInputClasses}></textarea></div>
                )}
                
                {task.type === TaskType.DISPLAY_CHART && (
                    <div><label className={labelClasses}>Data Key for Chart</label><input type="text" value={task.dataKey} onChange={e => handleChange('dataKey', e.target.value)} className={commonInputClasses} /></div>
                )}
            </div>
        </details>
    );
};


const WorkflowEditorModal: React.FC<WorkflowEditorModalProps> = ({ isOpen, onClose, onSave, workflowToEdit, prompts }) => {
    const { defaultProvider, defaultModel, globalModelParams } = useStore();
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    useEffect(() => {
        if (workflowToEdit) {
            // If editing a default, it's a "clone" operation, so create a new ID
            if(workflowToEdit.isDefault) {
                setWorkflow({
                    ...workflowToEdit,
                    id: `wf-custom-${crypto.randomUUID().slice(0, 8)}`,
                    name: `${workflowToEdit.name} (Copy)`,
                    isDefault: false,
                });
            } else {
                setWorkflow(JSON.parse(JSON.stringify(workflowToEdit)));
            }
        } else {
            setWorkflow({
                id: `wf-custom-${crypto.randomUUID().slice(0, 8)}`,
                name: 'New Custom Workflow',
                description: '',
                tasks: [],
            });
        }
    }, [workflowToEdit, isOpen]);

    if (!workflow) return null;

    const handleWorkflowChange = (field: keyof Workflow, value: any) => {
        setWorkflow(prev => prev ? { ...prev, [field]: value } : null);
    };

    const addTask = () => {
        const newTask: Task = {
            ...getEmptyTask(defaultProvider, defaultModel, globalModelParams),
            id: `task-${crypto.randomUUID().slice(0, 8)}`
        };
        handleWorkflowChange('tasks', [...workflow.tasks, newTask]);
    };

    const updateTask = (updatedTask: Task) => {
        const newTasks = workflow.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        handleWorkflowChange('tasks', newTasks);
    };

    const removeTask = (taskId: string) => {
        const newTasks = workflow.tasks.filter(t => t.id !== taskId);
        // Also remove this task from any dependencies
        const cleanedTasks = newTasks.map(t => ({
            ...t,
            dependencies: t.dependencies.filter(d => d !== taskId)
        }));
        handleWorkflowChange('tasks', cleanedTasks);
    };

    const handleSubmit = () => {
        const warnings = validateWorkflow(workflow);
        if (warnings.length > 0) {
            const message = "Workflow Validation Warnings:\n\n" + warnings.map(w => "• " + w).join('\n') + "\n\nDo you want to save anyway?";
            if (!confirm(message)) return;
        }
        onSave(workflow);
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-600 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";


    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title={workflowToEdit && !workflowToEdit.isDefault ? 'Edit Workflow' : 'Create Workflow'} size="4xl">
            <div className="space-y-6">
                <div className="p-4 border border-gray-700 rounded-lg space-y-4 bg-gray-900/50">
                     <div><label className={labelClasses}>Workflow Name</label><input type="text" value={workflow.name} onChange={(e) => handleWorkflowChange('name', e.target.value)} className={commonInputClasses} /></div>
                     <div><label className={labelClasses}>Workflow Description</label><textarea value={workflow.description} onChange={(e) => handleWorkflowChange('description', e.target.value)} rows={2} className={commonInputClasses} /></div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-50">Tasks</h3>
                    {workflow.tasks.map(task => (
                        <TaskEditor
                            key={task.id}
                            task={task}
                            updateTask={updateTask}
                            removeTask={() => removeTask(task.id)}
                            availableDependencies={workflow.tasks.filter(t => t.id !== task.id).map(t => ({id: t.id, name: t.name}))}
                            prompts={prompts}
                        />
                    ))}
                    <button type="button" onClick={addTask} className="w-full flex items-center justify-center space-x-2 py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700 hover:border-gray-500">
                        <PlusIcon className="w-5 h-5"/>
                        <span>Add Task</span>
                    </button>
                </div>

                 <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">Save Workflow</button>
                </div>
            </div>
        </ModalShell>
    );
};

export default WorkflowEditorModal;
