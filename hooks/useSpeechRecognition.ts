
import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add type definitions for Web Speech API to fix TypeScript errors.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}


// The browser's SpeechRecognition interface might not be standard
// so we need to check for vendor prefixes.
// FIX: Cast window to `any` to access non-standard properties.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface UseSpeechRecognitionProps {
  onTranscript: (text: string) => void;
}

export const useSpeechRecognition = ({ onTranscript }: UseSpeechRecognitionProps) => {
    const [isListening, setIsListening] = useState(false);
    // FIX: Use the locally defined SpeechRecognition interface.
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Memoize the callback to prevent re-renders in the effect
    const handleTranscript = useCallback(onTranscript, [onTranscript]);

    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn('Speech Recognition is not supported by this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false; // Only get final results to avoid complexity
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        // FIX: Use the locally defined SpeechRecognitionEvent interface.
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let newTranscriptChunk = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    newTranscriptChunk += event.results[i][0].transcript;
                }
            }
            if (newTranscriptChunk) {
                handleTranscript(newTranscriptChunk.trim());
            }
        };

        // FIX: Use the locally defined SpeechRecognitionErrorEvent interface.
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        // Cleanup function to stop recognition when the component unmounts
        return () => {
            recognition.stop();
        };
    }, [handleTranscript]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        startListening,
        stopListening,
        hasSpeechRecognition: !!SpeechRecognition,
    };
};
