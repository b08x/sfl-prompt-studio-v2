
import React, { useMemo, useState, useEffect } from 'react';
import { PromptSFL, PromptVersion } from '../types';
import ModalShell from './ModalShell';
import SparklesIcon from './icons/SparklesIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import ClockIcon from './icons/ClockIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: PromptSFL | null;
  onEdit: (prompt: PromptSFL) => void;
  onDelete: (promptId: string) => void;
  onTestWithGemini: (prompt: PromptSFL, variables: Record<string, string>) => void;
  onExportPrompt: (prompt: PromptSFL) => void;
  onExportPromptMarkdown: (prompt: PromptSFL) => void;
  onRevert: (prompt: PromptSFL, version: PromptVersion) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | null | string[]; isCode?: boolean; isEmpty?: boolean }> = ({ label, value, isCode, isEmpty }) => {
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  if (isEmpty || !displayValue) return null;
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-gray-400 mb-0.5">{label}</h4>
      {isCode ? (
        <pre className="bg-gray-900 p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap break-all border border-gray-700">{displayValue}</pre>
      ) : (
        <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">{displayValue}</p>
      )}
    </div>
  );
};


const PromptDetailModal: React.FC<PromptDetailModalProps> = ({ isOpen, onClose, prompt, onEdit, onDelete, onTestWithGemini, onExportPrompt, onExportPromptMarkdown, onRevert }) => {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isDocVisible, setDocVisible] = useState(false);
  const [docCopied, setDocCopied] = useState(false);
  const [viewedVersion, setViewedVersion] = useState<'latest' | number>('latest');

  const allVersionsForDropdown = useMemo(() => {
    if (!prompt) return [];
    const latest = { value: 'latest' as const, label: `Version ${prompt.version} (Latest) - ${new Date(prompt.updatedAt).toLocaleString()}` };
    const historyVersions = (prompt.history || []).sort((a, b) => b.version - a.version).map(v => ({
        value: v.version,
        label: `Version ${v.version} - ${new Date(v.createdAt).toLocaleString()}`
    }));
    return [latest, ...historyVersions];
  }, [prompt]);

  const displayedData = useMemo(() => {
    if (!prompt) return null;
    if (viewedVersion === 'latest') {
        return prompt;
    }
    const historicVersion = prompt.history.find(v => v.version === viewedVersion);
    // Create a temporary PromptSFL-like object for display
    return historicVersion ? { ...prompt, ...historicVersion, updatedAt: historicVersion.createdAt } : prompt;
  }, [prompt, viewedVersion]);
  
  const variables = useMemo(() => {
    if (!displayedData?.promptText) return [];
    const regex = /{{\s*(\w+)\s*}}/g;
    const matches = displayedData.promptText.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map(v => v.replace(/{{\s*|\s*}}/g, '')))];
  }, [displayedData?.promptText]);

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues(prev => ({
        ...prev,
        [varName]: value,
    }));
  };

  useEffect(() => {
    if (isOpen) {
      setViewedVersion('latest');
    }
  }, [isOpen]);

  // Reset states when the displayed data (prompt or version) changes
  useEffect(() => {
    if (displayedData) {
      const initialValues: Record<string, string> = {};
      variables.forEach(v => { initialValues[v] = ''; });
      setVariableValues(initialValues);
      setDocVisible(false);
      setDocCopied(false);
    }
  }, [displayedData, variables]);
  
  const handleRevert = () => {
    if (!prompt || viewedVersion === 'latest') return;
    const versionToRevertTo = prompt.history.find(v => v.version === viewedVersion);
    if (!versionToRevertTo) return;

    if (window.confirm(`Are you sure you want to revert to Version ${versionToRevertTo.version}? This will create a new version with this content.`)) {
        onRevert(prompt, versionToRevertTo);
        setViewedVersion('latest');
    }
  };


  const handleCopyDocContent = () => {
    if (displayedData?.sourceDocument?.content) {
      navigator.clipboard.writeText(displayedData.sourceDocument.content);
      setDocCopied(true);
      setTimeout(() => setDocCopied(false), 2000);
    }
  };

  if (!prompt || !displayedData) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={displayedData.title} size="4xl">
      <div className="space-y-6 text-gray-50">
      
        <section className="border border-gray-700 p-4 rounded-lg bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5 text-gray-400"/>
                    <h3 className="text-md font-semibold text-gray-200">Version History</h3>
                </div>
                 {viewedVersion !== 'latest' && (
                    <button onClick={handleRevert} className="flex items-center space-x-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                        <ArrowPathIcon className="w-4 h-4" />
                        <span>Revert to this version</span>
                    </button>
                )}
            </div>
            <select
                value={viewedVersion}
                onChange={(e) => setViewedVersion(e.target.value === 'latest' ? 'latest' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200"
            >
               {allVersionsForDropdown.map(v => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                ))}
            </select>
            {viewedVersion !== 'latest' && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                    <p className="text-xs text-amber-300 text-center">
                        You are viewing a past version. Editing or Testing is disabled in this view. <br/>
                        Click "Revert to this version" to restore this content as the latest version.
                    </p>
                </div>
            )}
        </section>

        <DetailItem label="Prompt Text" value={displayedData.promptText} isCode />

        {displayedData.sourceDocument && (
            <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-400 mb-0.5">Source Document</h4>
                <div className="flex items-center justify-between bg-gray-900 p-3 rounded-md text-sm border border-gray-700">
                    <span className="italic">{displayedData.sourceDocument.name}</span>
                    <button onClick={() => setDocVisible(!isDocVisible)} className="text-xs font-semibold text-blue-400 hover:underline">
                        {isDocVisible ? 'Hide Content' : 'View Content'}
                    </button>
                </div>
                {isDocVisible && (
                    <div className="relative mt-2">
                        <pre className="bg-gray-900 p-3 rounded-md text-sm whitespace-pre-wrap break-all max-h-48 overflow-y-auto border border-gray-700">
                           {displayedData.sourceDocument.content}
                        </pre>
                        <button onClick={handleCopyDocContent} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md text-gray-400 hover:text-gray-200 transition-colors border border-gray-600">
                           {docCopied ? <span className="text-xs">Copied!</span> : <ClipboardIcon className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="border border-gray-700 p-4 rounded-lg bg-gray-900/50">
            <h3 className="text-md font-semibold text-amber-400 mb-2 border-b pb-1 border-gray-700">Field</h3>
            <DetailItem label="Topic" value={displayedData.sflField.topic} />
            <DetailItem label="Task Type" value={displayedData.sflField.taskType} />
            <DetailItem label="Domain Specifics" value={displayedData.sflField.domainSpecifics} />
            <DetailItem label="Keywords" value={displayedData.sflField.keywords} />
          </section>

          <section className="border border-gray-700 p-4 rounded-lg bg-gray-900/50">
            <h3 className="text-md font-semibold text-violet-400 mb-2 border-b pb-1 border-gray-700">Tenor</h3>
            <DetailItem label="AI Persona" value={displayedData.sflTenor.aiPersona} />
            <DetailItem label="Target Audience" value={displayedData.sflTenor.targetAudience} />
            <DetailItem label="Desired Tone" value={displayedData.sflTenor.desiredTone} />
            <DetailItem label="Interpersonal Stance" value={displayedData.sflTenor.interpersonalStance} />
          </section>

          <section className="border border-gray-700 p-4 rounded-lg bg-gray-900/50">
            <h3 className="text-md font-semibold text-pink-400 mb-2 border-b pb-1 border-gray-700">Mode</h3>
            <DetailItem label="Output Format" value={displayedData.sflMode.outputFormat} />
            <DetailItem label="Rhetorical Structure" value={displayedData.sflMode.rhetoricalStructure} />
            <DetailItem label="Length Constraint" value={displayedData.sflMode.lengthConstraint} />
            <DetailItem label="Textual Directives" value={displayedData.sflMode.textualDirectives} />
          </section>
        </div>
        
        <DetailItem label="Example Output" value={displayedData.exampleOutput} isEmpty={!displayedData.exampleOutput} isCode/>
        <DetailItem label="Notes" value={displayedData.notes} isEmpty={!displayedData.notes} />
        
        <div className="mt-3">
            <p className="text-xs text-gray-500">Created: {new Date(displayedData.createdAt).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Version Saved: {new Date(displayedData.updatedAt).toLocaleString()}</p>
        </div>

        {variables.length > 0 && (
          <section className="space-y-4 border border-gray-700 p-4 rounded-lg bg-gray-900/50">
            <h3 className="text-md font-semibold text-gray-50 mb-2 border-b pb-1 border-gray-700">Prompt Variables</h3>
            <div className="space-y-4">
              {variables.map((varName) => (
                <div key={varName}>
                  <label htmlFor={`var-${varName}`} className="block text-sm font-medium text-gray-300 mb-1">{`{{${varName}}}`}</label>
                  <textarea
                    id={`var-${varName}`}
                    value={variableValues[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Enter value for ${varName}...`}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500 text-gray-50"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {prompt.isTesting && (
          <div className="my-4 p-4 border border-blue-500/50 rounded-md bg-blue-500/10 flex items-center justify-center">
            <div className="spinner"></div>
            <p className="ml-3 text-blue-300">Testing with Gemini...</p>
          </div>
        )}

        {viewedVersion === 'latest' && prompt.geminiResponse && (
          <div className="my-4">
            <h3 className="text-md font-semibold text-teal-300 mb-2">Gemini Response:</h3>
            <pre className="bg-teal-500/10 p-4 rounded-md text-sm text-teal-200 whitespace-pre-wrap break-all border border-teal-500/50">{prompt.geminiResponse}</pre>
          </div>
        )}

        {viewedVersion === 'latest' && prompt.geminiTestError && (
          <div className="my-4">
            <h3 className="text-md font-semibold text-red-400 mb-2">Gemini Test Error:</h3>
            <pre className="bg-red-500/10 p-4 rounded-md text-sm text-red-300 whitespace-pre-wrap break-all border border-red-500/50">{prompt.geminiTestError}</pre>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-gray-700 mt-6">
          <button
            onClick={() => onExportPrompt(displayedData as PromptSFL)}
            className="px-3 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 flex items-center"
            aria-label="Export this prompt as JSON"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2"/> Export JSON
          </button>
          <button
            onClick={() => onExportPromptMarkdown(displayedData as PromptSFL)}
            className="px-3 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 flex items-center"
            aria-label="Export this prompt as Markdown"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2"/> Export MD
          </button>
          <button
            onClick={() => onTestWithGemini(prompt, variableValues)}
            disabled={prompt.isTesting || viewedVersion !== 'latest'}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center"
            title={viewedVersion !== 'latest' ? "Switch to latest version to test" : "Test prompt"}
          >
            <SparklesIcon className="w-5 h-5 mr-2"/>
            {prompt.isTesting ? 'Testing...' : 'Test with Gemini'}
          </button>
          <button
            onClick={() => { onEdit(prompt); onClose(); }}
            disabled={viewedVersion !== 'latest'}
            className="px-3 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={viewedVersion !== 'latest' ? "Switch to latest version to edit" : "Edit prompt"}
          >
           <PencilIcon className="w-5 h-5 mr-2"/> Edit
          </button>
          <button
            onClick={() => { if(window.confirm('Are you sure you want to delete this prompt?')) { onDelete(prompt.id); onClose(); }}}
            disabled={viewedVersion !== 'latest'}
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={viewedVersion !== 'latest' ? "Switch to latest version to delete" : "Delete prompt"}
          >
           <TrashIcon className="w-5 h-5 mr-2"/> Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default PromptDetailModal;
