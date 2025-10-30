import React, { useState, useCallback, useEffect } from 'react';
import { PromptSFL, SFLField, SFLTenor, SFLMode, TranscriptEntry } from '../../types';
import { useLiveConversation } from '../../hooks/useLiveConversation';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import StopIcon from '../icons/StopIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import SparklesIcon from '../icons/SparklesIcon';
import CogIcon from '../icons/CogIcon';

const SFLDetail: React.FC<{ label: string, value: string | string[] | undefined }> = ({ label, value }) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    if (!displayValue) return null;
    return (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-gray-200">{displayValue}</p>
        </div>
    );
};

const SFLViewer: React.FC<{ prompt: PromptSFL }> = ({ prompt }) => (
    <div className="space-y-6">
        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-medium text-amber-400 px-2">Field</legend>
            <div className="space-y-3 mt-2">
                <SFLDetail label="Topic" value={prompt.sflField.topic} />
                <SFLDetail label="Task Type" value={prompt.sflField.taskType} />
                <SFLDetail label="Domain Specifics" value={prompt.sflField.domainSpecifics} />
                <SFLDetail label="Keywords" value={prompt.sflField.keywords} />
            </div>
        </fieldset>
        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-medium text-violet-400 px-2">Tenor</legend>
            <div className="space-y-3 mt-2">
                <SFLDetail label="AI Persona" value={prompt.sflTenor.aiPersona} />
                <SFLDetail label="Target Audience" value={prompt.sflTenor.targetAudience} />
                <SFLDetail label="Desired Tone" value={prompt.sflTenor.desiredTone} />
                <SFLDetail label="Interpersonal Stance" value={prompt.sflTenor.interpersonalStance} />
            </div>
        </fieldset>
        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-lg font-medium text-pink-400 px-2">Mode</legend>
            <div className="space-y-3 mt-2">
                <SFLDetail label="Output Format" value={prompt.sflMode.outputFormat} />
                <SFLDetail label="Rhetorical Structure" value={prompt.sflMode.rhetoricalStructure} />
                <SFLDetail label="Length Constraint" value={prompt.sflMode.lengthConstraint} />
                <SFLDetail label="Textual Directives" value={prompt.sflMode.textualDirectives} />
            </div>
        </fieldset>
    </div>
);

const TranscriptViewer: React.FC<{ transcript: TranscriptEntry[] }> = ({ transcript }) => (
    <div className="space-y-4">
        {transcript.map((entry, index) => {
            if (entry.speaker === 'system') {
                return <p key={index} className="text-center text-xs text-fuchsia-400 italic py-1">-- {entry.text} --</p>;
            }
            const isUser = entry.speaker === 'user';
            const Icon = isUser ? UserCircleIcon : SparklesIcon;
            return (
                <div key={index} className={`flex items-start gap-3 ${isUser ? '' : 'flex-row-reverse'}`}>
                    <Icon className={`w-6 h-6 shrink-0 mt-1 ${isUser ? 'text-gray-400' : 'text-teal-400'}`} />
                    <div className={`p-3 rounded-lg max-w-sm ${isUser ? 'bg-gray-700' : 'bg-teal-900/50'}`}>
                        <p className="text-sm text-gray-200">{entry.text}</p>
                    </div>
                </div>
            );
        })}
    </div>
);


const PromptRefinementStudio: React.FC<{ prompts: PromptSFL[] }> = ({ prompts }) => {
    const [selectedPromptId, setSelectedPromptId] = useState<string>(prompts[0]?.id || '');
    const [editablePrompt, setEditablePrompt] = useState<PromptSFL | null>(prompts.find(p => p.id === selectedPromptId) || null);

    useEffect(() => {
        setEditablePrompt(prompts.find(p => p.id === selectedPromptId) || null);
    }, [selectedPromptId, prompts]);

    const handlePromptUpdate = useCallback((updates: {
        sflField?: Partial<SFLField>;
        sflTenor?: Partial<SFLTenor>;
        sflMode?: Partial<SFLMode>;
    }) => {
        setEditablePrompt(prev => {
            if (!prev) return null;
            // Deep merge for nested SFL objects
            return {
                ...prev,
                sflField: { ...prev.sflField, ...(updates.sflField || {}) },
                sflTenor: { ...prev.sflTenor, ...(updates.sflTenor || {}) },
                sflMode: { ...prev.sflMode, ...(updates.sflMode || {}) },
                updatedAt: new Date().toISOString(),
            };
        });
    }, []);

    const systemInstruction = "You are an AI assistant helping a user refine an SFL prompt. When the user asks to make a change (e.g., 'change the tone to be more formal'), use the `updatePromptComponents` tool to modify the prompt. You can ask clarifying questions if needed. Be concise and helpful.";

    const { status, transcript, error, startConversation, endConversation } = useLiveConversation({
        systemInstruction,
        onUpdatePrompt: handlePromptUpdate,
    });
    
    const isConversing = status === 'active' || status === 'connecting';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
            {/* Left Pane: SFL Prompt Details */}
            <div className="flex flex-col h-full border-r border-gray-700">
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <label htmlFor="prompt-select" className="block text-sm font-medium text-gray-400 mb-1">Select Prompt to Refine</label>
                    <select
                        id="prompt-select"
                        value={selectedPromptId}
                        onChange={(e) => setSelectedPromptId(e.target.value)}
                        disabled={isConversing}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md shadow-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>
                <div className="p-4 overflow-y-auto">
                    {editablePrompt ? <SFLViewer prompt={editablePrompt} /> : <p className="text-gray-400">Select a prompt to begin.</p>}
                </div>
            </div>

            {/* Right Pane: Conversation & Transcript */}
            <div className="flex flex-col h-full bg-gray-800">
                <div className="flex-grow p-4 overflow-y-auto">
                    {transcript.length > 0 ? (
                        <TranscriptViewer transcript={transcript} />
                    ) : (
                        <div className="text-center text-gray-500 pt-10">
                             <p>Press the microphone to start refining.</p>
                             <p className="text-xs mt-2">e.g., "Change the persona to a sarcastic bot" or "Make the output format JSON."</p>
                        </div>
                    )}
                     {error && <p className="text-red-400 text-center mt-4">Error: {error}</p>}
                </div>
                <div className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0 flex items-center justify-center">
                    <button
                        onClick={isConversing ? endConversation : startConversation}
                        disabled={!editablePrompt || status === 'connecting'}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors text-white ${
                            isConversing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {status === 'connecting' ? <div className="spinner w-8 h-8"/> : (isConversing ? <StopIcon className="w-8 h-8"/> : <MicrophoneIcon className="w-8 h-8"/>)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptRefinementStudio;