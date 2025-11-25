
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveConnectConfig, LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { TranscriptEntry } from '../types';

export type ConversationStatus = 'idle' | 'connecting' | 'active' | 'error';

interface UseGeminiLiveProps {
    apiKey: string | undefined;
}

export const useGeminiLive = ({ apiKey }: UseGeminiLiveProps) => {
    const [status, setStatus] = useState<ConversationStatus>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Refs for audio and session management
    const sessionRef = useRef<any | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

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

    const disconnect = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        cleanup();
        setStatus('idle');
    }, [cleanup]);

    const connect = useCallback(async (
        model: string, 
        config: LiveConnectConfig, 
        onToolCall?: (toolCall: any) => Promise<any | null>
    ) => {
        if (!apiKey) {
            setError("API Key not configured");
            return;
        }

        setStatus('connecting');
        setError(null);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            const ai = new GoogleGenAI({ apiKey });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const sessionPromise = ai.live.connect({
                model,
                config,
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
                        // Handle Tool Calls
                        if (message.toolCall && onToolCall) {
                            const functionResponses = [];
                            for (const fc of message.toolCall.functionCalls) {
                                const result = await onToolCall(fc);
                                if (result) {
                                    functionResponses.push({ 
                                        id: fc.id, 
                                        name: fc.name, 
                                        response: { result } 
                                    });
                                }
                            }
                            if (functionResponses.length > 0) {
                                sessionPromise.then((session) => session.sendToolResponse({ functionResponses }));
                            }
                        }

                        // Handle Transcripts
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

                        // Handle Audio Output
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
                        
                        // Handle Interruption
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
                }
            });
            sessionRef.current = await sessionPromise;

        } catch (e) {
             console.error('Failed to start conversation:', e);
             setError(e instanceof Error ? e.message : 'An unknown error occurred.');
             setStatus('error');
             cleanup();
        }
    }, [apiKey, cleanup]);

    return {
        status,
        transcript,
        error,
        connect,
        disconnect,
        setTranscript
    };
};
