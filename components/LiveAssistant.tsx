import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Modality, FunctionDeclaration, Type } from '@google/genai';
import type { SFLField, SFLTenor, SFLMode, PromptSFL, Workflow } from '../types';
import { useGeminiLive } from '../hooks/useGeminiLive';

import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';

// 1. Explicitly Define the Tool
const updatePromptComponentsFunctionDeclaration: FunctionDeclaration = {
    name: 'updatePromptComponents',
    description: "Updates one or more components of the SFL prompt (sflField, sflTenor, or sflMode) and the promptText. Only include fields that need changing.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sflField: {
          type: Type.OBJECT,
          description: "Updates to the 'Field' component (the subject matter).",
          properties: {
            topic: { type: Type.STRING },
            taskType: { type: Type.STRING },
            domainSpecifics: { type: Type.STRING },
            keywords: { type: Type.STRING },
          },
        },
        sflTenor: {
          type: Type.OBJECT,
          description: "Updates to the 'Tenor' component (persona and audience).",
          properties: {
            aiPersona: { type: Type.STRING },
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            desiredTone: { type: Type.STRING },
            interpersonalStance: { type: Type.STRING },
          },
        },
        sflMode: {
          type: Type.OBJECT,
          description: "Updates to the 'Mode' component (output format and structure).",
          properties: {
            outputFormat: { type: Type.STRING },
            rhetoricalStructure: { type: Type.STRING },
            lengthConstraint: { type: Type.STRING },
            textualDirectives: { type: Type.STRING },
          },
        },
      },
    },
};

interface LiveAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    activePage: 'dashboard' | 'lab' | 'documentation' | 'settings';
    labTab?: 'workflow' | 'ideation';
    activePrompt?: PromptSFL | null;
    onUpdatePrompt?: (prompt: PromptSFL) => void;
    activeWorkflow?: Workflow | null;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ 
    isOpen, onClose, activePage, labTab, activePrompt, onUpdatePrompt, activeWorkflow
}) => {
    // Use the secure key from process.env
    const { status, transcript, error, connect, disconnect, setTranscript } = useGeminiLive({ apiKey: process.env.API_KEY });
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // BUG FIX: Maintain a ref to the active prompt.
    // The Live API callbacks form a closure when the connection starts.
    // Without this ref, the handler uses the stale 'activePrompt' from when the connection opened,
    // causing updates to overwrite each other or revert to old states.
    const activePromptRef = useRef(activePrompt);
    useEffect(() => {
        activePromptRef.current = activePrompt;
    }, [activePrompt]);

    const isIdeationMode = activePage === 'lab' && labTab === 'ideation' && activePrompt && onUpdatePrompt;

    const systemInstruction = useMemo(() => {
        const base = `You are a friendly and helpful customer support agent. Your goal is to provide contextual help to the user. Be concise and clear.`;
        if (isIdeationMode) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, createdAt, updatedAt, version, history, geminiResponse, geminiTestError, isTesting, ...promptForContext } = activePrompt;
            return `You are in 'Ideation Mode'. When the user asks to change the prompt (e.g., 'change the tone to be more formal'), YOU MUST call the 'updatePromptComponents' tool. Do not just describe the change, execute it. You can ask clarifying questions if needed. Here is the current prompt you are refining:\n\n${JSON.stringify(promptForContext, null, 2)}`;
        }
        if (activePage === 'lab' && activeWorkflow) {
            return `${base} The user is on the Workflow Canvas, looking at the "${activeWorkflow.name}" workflow. Help them understand its tasks and purpose.`;
        }
        if (activePage === 'dashboard') {
            return `${base} The user is on the main Dashboard. You can help them find prompts or understand SFL concepts.`;
        }
        return base;
    }, [activePage, activeWorkflow, activePrompt, isIdeationMode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, status]);

    // 2. Client-Side Tool Execution Handler
    const handleToolCall = useCallback(async (fc: any) => {
        if (fc.name === 'updatePromptComponents' && isIdeationMode) {
             const args = fc.args as {
                sflField?: Partial<SFLField>;
                sflTenor?: Partial<SFLTenor>;
                sflMode?: Partial<SFLMode>;
            };

            // BUG FIX: Use the ref to get the latest prompt state
            const currentPrompt = activePromptRef.current;
            if (!currentPrompt || !onUpdatePrompt) return null;
            
            console.log("Executing Tool: updatePromptComponents", args);
            
            const updatedPrompt = {
                ...currentPrompt,
                sflField: { ...currentPrompt.sflField, ...(args.sflField || {}) },
                sflTenor: { ...currentPrompt.sflTenor, ...(args.sflTenor || {}) },
                sflMode: { ...currentPrompt.sflMode, ...(args.sflMode || {}) },
                updatedAt: new Date().toISOString()
            };
            onUpdatePrompt(updatedPrompt);
            
            const updatedSections = Object.keys(args).join(', ');
            setTranscript(prev => [...prev, { speaker: 'system', text: `Tool Executed: Updated ${updatedSections}`, isFinal: true }]);

            return "Success: The prompt components have been updated in the UI.";
        }
        return null;
    }, [isIdeationMode, onUpdatePrompt, setTranscript]);


    const startConversation = useCallback(() => {
        const initialMessage = isIdeationMode ? "I'm ready to refine the prompt. How can I help?" : "Hello! How can I help you?";
        setTranscript([{ speaker: 'model', text: initialMessage, isFinal: true }]);

        connect(
            'gemini-2.5-flash-native-audio-preview-09-2025',
            {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction,
                tools: isIdeationMode ? [{ functionDeclarations: [updatePromptComponentsFunctionDeclaration] }] : undefined,
            },
            handleToolCall
        );
    }, [connect, isIdeationMode, systemInstruction, handleToolCall, setTranscript]);

    useEffect(() => {
        if (isOpen && status === 'idle') {
            startConversation();
        } else if (!isOpen && status !== 'idle') {
            disconnect();
        }
    }, [isOpen, status, startConversation, disconnect]);
    
    if (!isOpen) return null;

    const isConversing = status === 'active' || status === 'connecting';

    return (
        <div className="fixed bottom-20 right-5 w-full max-w-md h-[70vh] max-h-[600px] z-50 animate-fade-in-up">
            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
            <div className="bg-gray-800 rounded-lg shadow-2xl flex flex-col h-full border border-gray-700">
                <header className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900/50 rounded-t-lg flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-50 flex items-center">
                        <SparklesIcon className="w-5 h-5 mr-2 text-blue-400"/>
                        Live Assistant
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </header>
                <main className="flex-1 p-4 overflow-y-auto space-y-4">
                    {transcript.map((entry, index) => {
                        if (entry.speaker === 'system') {
                            return <p key={index} className="text-center text-xs text-fuchsia-400 italic py-1">-- {entry.text} --</p>;
                        }
                        const isUser = entry.speaker === 'user';
                        const Icon = isUser ? UserCircleIcon : SparklesIcon;
                        const isFinal = entry.isFinal !== false;
                        return (
                            <div key={index} className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
                                {entry.speaker === 'model' && <Icon className="w-6 h-6 shrink-0 mt-1 text-teal-400" />}
                                <div className={`p-3 rounded-lg max-w-xs md:max-w-sm text-sm break-words ${
                                    isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                                } transition-opacity duration-300 ${isFinal ? 'opacity-100' : 'opacity-60'}`}>
                                    {entry.text}
                                </div>
                                {entry.speaker === 'user' && <Icon className="w-6 h-6 shrink-0 mt-1 text-gray-400" />}
                            </div>
                        );
                    })}
                    {error && <p className="p-3 bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-lg">{error}</p>}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0 flex items-center justify-center">
                     <button
                        onClick={isConversing ? disconnect : startConversation}
                        disabled={status === 'connecting'}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors text-white ${
                            isConversing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                        } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    >
                        {status === 'connecting' ? <div className="spinner w-8 h-8"/> : (isConversing ? <StopIcon className="w-8 h-8"/> : <MicrophoneIcon className="w-8 h-8"/>)}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default LiveAssistant;