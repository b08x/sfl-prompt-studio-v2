import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality, FunctionDeclaration, Type, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import type { TranscriptEntry, SFLField, SFLTenor, SFLMode, PromptSFL, Workflow } from '../types';

import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';

type ConversationStatus = 'idle' | 'connecting' | 'active' | 'error';

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
    const [status, setStatus] = useState<ConversationStatus>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // LiveSession is not exported, so using any.
    const sessionRef = useRef<any | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const isIdeationMode = activePage === 'lab' && labTab === 'ideation' && activePrompt && onUpdatePrompt;

    const systemInstruction = useMemo(() => {
        const base = `You are a friendly and helpful AI assistant for the "SFL Prompt Studio" application. Your goal is to provide contextual help to the user. Be concise and clear.`;
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

    const cleanup = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const endConversation = useCallback(() => {
        if (sessionRef.current) {
          sessionRef.current.close();
          sessionRef.current = null;
        }
        cleanup();
        setStatus('idle');
    }, [cleanup]);

    // 2. Client-Side Tool Execution Handler
    const handleUpdatePromptFromTool = useCallback((args: {
        sflField?: Partial<SFLField>;
        sflTenor?: Partial<SFLTenor>;
        sflMode?: Partial<SFLMode>;
    }) => {
        if (!activePrompt || !onUpdatePrompt) return;
        
        console.log("Executing Tool: updatePromptComponents", args);
        
        const updatedPrompt = {
            ...activePrompt,
            sflField: { ...activePrompt.sflField, ...(args.sflField || {}) },
            sflTenor: { ...activePrompt.sflTenor, ...(args.sflTenor || {}) },
            sflMode: { ...activePrompt.sflMode, ...(args.sflMode || {}) },
        };
        onUpdatePrompt(updatedPrompt);

    }, [activePrompt, onUpdatePrompt]);

    const startConversation = useCallback(async () => {
        if (!isOpen) return;
        setStatus('connecting');
        setError(null);
        setTranscript([{ speaker: 'model', text: isIdeationMode ? "I'm ready to refine the prompt. How can I help?" : "Hello! How can I help you?", isFinal: true}]);

        try {
            if (!process.env.API_KEY) throw new Error("API key not found.");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => { 
                        setStatus('active');
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // 3. Catch Tool Calls
                        if (message.toolCall) {
                            const functionResponses = [];
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'updatePromptComponents' && isIdeationMode) {
                                    // Execute the logic locally
                                    handleUpdatePromptFromTool(fc.args);
                                    
                                    const updatedSections = Object.keys(fc.args).join(', ');
                                    setTranscript(prev => [...prev, { speaker: 'system', text: `Tool Executed: Updated ${updatedSections}`, isFinal: true }]);
                                    
                                    // Provide the result back to the model
                                    functionResponses.push({ 
                                        id: fc.id, 
                                        name: fc.name, 
                                        response: { result: "Success: The prompt components have been updated in the UI." } 
                                    });
                                }
                            }
                            // Send response back to model
                            if (functionResponses.length > 0) {
                                sessionPromise.then((session) => session.sendToolResponse({ functionResponses }));
                            }
                        }

                        if (message.serverContent?.inputTranscription) {
                            const textChunk = message.serverContent.inputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'user' && !last.isFinal) {
                                    const newLast = { ...last, text: last.text + textChunk };
                                    return [...prev.slice(0, -1), newLast];
                                } else {
                                    const finalized = prev.map(e => (e.isFinal === false ? { ...e, isFinal: true } : e));
                                    return [...finalized, { speaker: 'user', text: textChunk, isFinal: false }];
                                }
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                            const textChunk = message.serverContent.outputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'model' && !last.isFinal) {
                                    const newLast = { ...last, text: last.text + textChunk };
                                    return [...prev.slice(0, -1), newLast];
                                } else {
                                    const finalized = prev.map(e => (e.isFinal === false ? { ...e, isFinal: true } : e));
                                    return [...finalized, { speaker: 'model', text: textChunk, isFinal: false }];
                                }
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscript(prev => prev.map(e => (e.isFinal === false ? { ...e, isFinal: true } : e)));
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputContext = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, 24000, 1);
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(s => s.stop());
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => { 
                        console.error('Live session error:', e);
                        setError('A connection error occurred.');
                        setStatus('error');
                        cleanup();
                    },
                    onclose: () => { 
                        cleanup();
                        setStatus('idle');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction,
                    tools: isIdeationMode ? [{ functionDeclarations: [updatePromptComponentsFunctionDeclaration] }] : undefined,
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (e) {
            console.error('Failed to start conversation:', e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setStatus('error');
            cleanup();
        }
    }, [isOpen, systemInstruction, cleanup, isIdeationMode, handleUpdatePromptFromTool]);

    useEffect(() => {
        if (isOpen && status === 'idle') {
            startConversation();
        } else if (!isOpen && status !== 'idle') {
            endConversation();
        }
    }, [isOpen, status, startConversation, endConversation]);
    
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
                        onClick={isConversing ? endConversation : startConversation}
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