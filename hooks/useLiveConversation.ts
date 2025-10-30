import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveSession, FunctionDeclaration, Type, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import type { TranscriptEntry, SFLField, SFLTenor, SFLMode } from '../types';

type ConversationStatus = 'idle' | 'connecting' | 'active' | 'error';

interface UseLiveConversationProps {
  systemInstruction: string;
  onUpdatePrompt: (updates: {
    sflField?: Partial<SFLField>;
    sflTenor?: Partial<SFLTenor>;
    sflMode?: Partial<SFLMode>;
  }) => void;
}

const updatePromptComponentsFunctionDeclaration: FunctionDeclaration = {
    name: 'updatePromptComponents',
    description: "Updates one or more components of the SFL prompt (sflField, sflTenor, or sflMode). Only include fields that need changing.",
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

export const useLiveConversation = ({ systemInstruction, onUpdatePrompt }: UseLiveConversationProps) => {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

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
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';
  }, []);


  const endConversation = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    cleanup();
    setStatus('idle');
  }, [cleanup]);
  
  const startConversation = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';


    try {
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
                        const pcmBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.toolCall) {
                        const functionResponses = [];
                        for (const fc of message.toolCall.functionCalls) {
                            if (fc.name === 'updatePromptComponents') {
                                const updates: {
                                    sflField?: Partial<SFLField>;
                                    sflTenor?: Partial<SFLTenor>;
                                    sflMode?: Partial<SFLMode>;
                                } = {};
                                if (fc.args.sflField) updates.sflField = fc.args.sflField as Partial<SFLField>;
                                if (fc.args.sflTenor) updates.sflTenor = fc.args.sflTenor as Partial<SFLTenor>;
                                if (fc.args.sflMode) updates.sflMode = fc.args.sflMode as Partial<SFLMode>;
                                
                                onUpdatePrompt(updates);

                                const updatedSections = Object.keys(fc.args).join(', ');
                                setTranscript(prev => [...prev, { speaker: 'system', text: `Updated ${updatedSections}` }]);
                                
                                functionResponses.push({
                                    id : fc.id,
                                    name: fc.name,
                                    response: { result: "OK, the prompt has been updated." },
                                });
                            }
                        }
                        if (functionResponses.length > 0) {
                            sessionPromise.then((session) => {
                                session.sendToolResponse({ functionResponses });
                            });
                        }
                    }

                    if (message.serverContent?.inputTranscription) {
                        currentInputTranscription.current += message.serverContent.inputTranscription.text;
                    }
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                    }

                    if (message.serverContent?.turnComplete) {
                        const finalInput = currentInputTranscription.current;
                        const finalOutput = currentOutputTranscription.current;
                        
                        setTranscript(prev => {
                            const newEntries: TranscriptEntry[] = [];
                            if (finalInput) newEntries.push({ speaker: 'user', text: finalInput });
                            if (finalOutput) newEntries.push({ speaker: 'model', text: finalOutput });
                            return [...prev, ...newEntries];
                        });

                        currentInputTranscription.current = '';
                        currentOutputTranscription.current = '';
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
                onclose: (e: CloseEvent) => {
                    cleanup();
                    setStatus('idle');
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction,
                tools: [{ functionDeclarations: [updatePromptComponentsFunctionDeclaration] }],
            },
        });
        
        sessionRef.current = await sessionPromise;

    } catch (e) {
        console.error('Failed to start conversation:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        setStatus('error');
        cleanup();
    }
  }, [systemInstruction, cleanup, onUpdatePrompt]);

  return { status, transcript, error, startConversation, endConversation };
};