
import React, { useState, useEffect, useRef } from 'react';
import { PromptSFL, SFLAnalysis } from '../types';
import { analyzeSFL, regenerateSFLFromSuggestion } from '../services/sflService';
import { INITIAL_PROMPT_SFL } from '../constants';

interface UsePromptAIProps {
  formData: Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history' | 'sflAnalysis'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<PromptSFL, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'history' | 'sflAnalysis'>>>;
  promptToEdit?: PromptSFL | null;
  apiKey?: string;
}

export const usePromptAI = ({ formData, setFormData, promptToEdit, apiKey }: UsePromptAIProps) => {
  const [sflAnalysis, setSflAnalysis] = useState<SFLAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [regenState, setRegenState] = useState({ shown: false, suggestion: '', loading: false });
  const analysisTimeoutRef = useRef<number | null>(null);

  // Initialize analysis from existing prompt
  useEffect(() => {
    if (promptToEdit?.sflAnalysis) {
      setSflAnalysis(promptToEdit.sflAnalysis);
    } else {
      setSflAnalysis(null);
    }
    setRegenState({ shown: false, suggestion: '', loading: false });
    setIsFixing(false);
  }, [promptToEdit]);

  // Auto-Analyze Effect
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    if (!formData.title && !formData.promptText) {
      setSflAnalysis(null);
      setIsAnalyzing(false);
      return;
    }

    if (!apiKey) {
      setSflAnalysis(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);

    analysisTimeoutRef.current = window.setTimeout(async () => {
      try {
        const promptForAnalysis = { ...INITIAL_PROMPT_SFL, ...formData };
        const analysis = await analyzeSFL(promptForAnalysis, apiKey);
        setSflAnalysis(analysis);
      } catch (error) {
        console.error("Analysis failed", error);
        setSflAnalysis({
          score: 0,
          assessment: "Failed to analyze.",
          issues: [{
            severity: 'error',
            component: 'System',
            message: 'Could not connect to the analysis service.',
            suggestion: 'Check your connection or try again later.'
          }]
        });
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [formData, apiKey]);

  const handleRegeneratePrompt = async () => {
    if (!regenState.suggestion.trim()) return;
    if (!apiKey) {
      alert('Google API key is not configured. Please add your API key in Settings.');
      return;
    }
    setRegenState(prev => ({ ...prev, loading: true }));
    try {
      const promptForRegeneration = {
        ...formData,
        version: promptToEdit?.version ?? 1,
        history: promptToEdit?.history ?? [],
      };
      const regeneratedData = await regenerateSFLFromSuggestion(promptForRegeneration, regenState.suggestion, apiKey);
      setFormData(regeneratedData);
      setRegenState({ shown: false, suggestion: '', loading: false });
    } catch (error) {
      console.error(error);
      alert('Failed to regenerate prompt: ' + (error instanceof Error ? error.message : String(error)));
      setRegenState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAutoFix = async () => {
    if (!sflAnalysis || sflAnalysis.issues.length === 0) return;
    if (!apiKey) {
      alert('Google API key is not configured. Please add your API key in Settings.');
      return;
    }

    setIsFixing(true);
    try {
      const issuesText = sflAnalysis.issues
        .map(i => `- Issue in ${i.component} (${i.severity}): ${i.message}. Suggestion: ${i.suggestion}`)
        .join('\n');

      const suggestion = `Auto-fix request based on SFL analysis issues:\n${issuesText}\n\nPlease implement these suggestions to improve the prompt's quality, ensuring consistency across Field, Tenor, and Mode.`;

      const promptForRegeneration = {
        ...formData,
        version: promptToEdit?.version ?? 1,
        history: promptToEdit?.history ?? [],
      };

      const fixedData = await regenerateSFLFromSuggestion(promptForRegeneration, suggestion, apiKey);
      setFormData(fixedData);
    } catch (error) {
      console.error("Auto-fix failed", error);
      alert("Failed to apply auto-fixes. Please review the issues manually.");
    } finally {
      setIsFixing(false);
    }
  };

  return {
    sflAnalysis,
    isAnalyzing,
    isFixing,
    regenState,
    setRegenState,
    handleRegeneratePrompt,
    handleAutoFix
  };
};
