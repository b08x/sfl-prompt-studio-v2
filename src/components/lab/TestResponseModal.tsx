
import React, { useState, useMemo, useEffect } from 'react';
import { PromptSFL } from '../../types';
import { testPrompt } from '../../services/sflService';
import ModalShell from '../ModalShell';
import SparklesIcon from '../icons/SparklesIcon';

interface TestResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: PromptSFL;
}

const TestResponseModal: React.FC<TestResponseModalProps> = ({ isOpen, onClose, prompt }) => {
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');

    const variables = useMemo(() => {
        if (!prompt?.promptText) return [];
        const regex = /{{\s*(\w+)\s*}}/g;
        const matches = prompt.promptText.match(regex);
        if (!matches) return [];
        return [...new Set(matches.map(v => v.replace(/{{\s*|\s*}}/g, '')))];
    }, [prompt?.promptText]);

    useEffect(() => {
        if (isOpen) {
            const initialValues: Record<string, string> = {};
            variables.forEach(v => { initialValues[v] = ''; });
            setVariableValues(initialValues);
            setIsLoading(false);
            setResponse('');
            setError('');
        }
    }, [isOpen, prompt, variables]);

    const handleRunTest = async () => {
        setIsLoading(true);
        setResponse('');
        setError('');
        
        let finalPromptText = prompt.promptText;
        Object.keys(variableValues).forEach(key => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            finalPromptText = finalPromptText.replace(regex, variableValues[key] || '');
        });

        try {
            const responseText = await testPrompt(finalPromptText);
            setResponse(responseText);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title={`Test: ${prompt.title}`} size="3xl">
            <div className="space-y-6">
                <div>
                    <h3 className="text-md font-semibold text-gray-200 mb-2">Prompt Template</h3>
                    <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap break-all border border-gray-700 max-h-48 overflow-y-auto">{prompt.promptText}</pre>
                </div>

                {variables.length > 0 && (
                    <section className="space-y-4">
                        <h3 className="text-md font-semibold text-gray-200">Variables</h3>
                        {variables.map(varName => (
                            <div key={varName}>
                                <label htmlFor={`var-${varName}`} className="block text-sm font-medium text-gray-300 mb-1">{`{{${varName}}}`}</label>
                                <textarea
                                    id={`var-${varName}`}
                                    value={variableValues[varName] || ''}
                                    onChange={(e) => setVariableValues(prev => ({ ...prev, [varName]: e.target.value }))}
                                    placeholder={`Enter value for ${varName}...`}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-50"
                                />
                            </div>
                        ))}
                    </section>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={handleRunTest}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-opacity-50"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>{isLoading ? 'Testing...' : 'Run Test'}</span>
                    </button>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center p-4">
                        <div className="spinner"></div>
                        <p className="ml-3 text-blue-300">Waiting for Gemini response...</p>
                    </div>
                )}
                
                {response && (
                    <div>
                        <h3 className="text-md font-semibold text-teal-300 mb-2">Gemini Response</h3>
                        <pre className="bg-teal-500/10 p-4 rounded-md text-sm text-teal-200 whitespace-pre-wrap break-all border border-teal-500/50">{response}</pre>
                    </div>
                )}

                {error && (
                    <div>
                        <h3 className="text-md font-semibold text-red-400 mb-2">Error</h3>
                        <pre className="bg-red-500/10 p-4 rounded-md text-sm text-red-300 whitespace-pre-wrap break-all border border-red-500/50">{error}</pre>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};

export default TestResponseModal;
