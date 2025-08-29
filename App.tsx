

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PromptSFL, Filters, ModalType } from './types';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Stats from './components/Stats';
import PromptList from './components/PromptList';
import PromptFormModal from './components/PromptFormModal';
import PromptDetailModal from './components/PromptDetailModal';
import PromptWizardModal from './components/PromptWizardModal';
import HelpModal from './components/HelpModal';
import Documentation from './components/Documentation';
import PromptLabPage from './components/lab/PromptLabPage';
import { testPromptWithGemini } from './services/geminiService';
import { TASK_TYPES, AI_PERSONAS, TARGET_AUDIENCES, DESIRED_TONES, OUTPUT_FORMATS, LENGTH_CONSTRAINTS, POPULAR_TAGS } from './constants';


const initialFilters: Filters = {
  searchTerm: '',
  topic: '',
  taskType: '',
  aiPersona: '',
  outputFormat: '',
};

const samplePrompts: PromptSFL[] = [
  {
    id: "1",
    title: "Python Code Explanation",
    promptText: "Explain this Python code snippet in simple terms for beginners:\n\n```python\n{{code_snippet}}\n```",
    sflField: { topic: "Programming", taskType: "Explanation", domainSpecifics: "Python", keywords: "python, beginner, education" },
    sflTenor: { aiPersona: "Friendly Assistant", targetAudience: ["Beginners"], desiredTone: "Friendly", interpersonalStance: "Helpful tutor" },
    sflMode: { outputFormat: "Markdown", rhetoricalStructure: "Code block followed by bullet points", lengthConstraint: "Medium Paragraph (~150 words)", textualDirectives: "Use simple language" },
    createdAt: "2023-05-15T12:00:00Z",
    updatedAt: "2023-05-15T12:00:00Z",
    geminiResponse: "This is a test response."
  },
  {
    id: "2",
    title: "API Documentation Summary",
    promptText: "Summarize this API documentation into key points for developers. Focus on endpoints, authentication, and request/response examples.\n\nAPI Documentation:\n{{api_docs}}",
    sflField: { topic: "Software Development", taskType: "Summarization", domainSpecifics: "REST API", keywords: "technical, api, documentation" },
    sflTenor: { aiPersona: "Expert", targetAudience: ["Software Developers"], desiredTone: "Concise", interpersonalStance: "Technical writer" },
    sflMode: { outputFormat: "Bullet-Points", rhetoricalStructure: "Sections for endpoints, authentication, etc.", lengthConstraint: "Detailed (as needed)", textualDirectives: "Focus on practical usage" },
    createdAt: "2023-05-10T12:00:00Z",
    updatedAt: "2023-05-10T12:00:00Z",
    geminiResponse: "This is a test response."
  },
  {
    id: "3",
    title: "JSON Data Transformation",
    promptText: "Convert this JSON data from format A to format B with specific rules...",
    sflField: { topic: "Data Processing", taskType: "Code Generation", domainSpecifics: "JSON", keywords: "json, data, transformation" },
    sflTenor: { aiPersona: "Expert", targetAudience: ["Software Developers"], desiredTone: "Formal", interpersonalStance: "Data engineer" },
    sflMode: { outputFormat: "Json", rhetoricalStructure: "JSON object", lengthConstraint: "Concise (as needed)", textualDirectives: "Adhere to the specified output schema" },
    createdAt: "2023-05-18T12:00:00Z",
    updatedAt: "2023-05-18T12:00:00Z",
  },
    {
    id: "4",
    title: "Technical Concept Explanation",
    promptText: "Explain blockchain technology to a non-technical audience...",
    sflField: { topic: "Technology", taskType: "Explanation", domainSpecifics: "Blockchain", keywords: "blockchain, education, simplified" },
    sflTenor: { aiPersona: "Friendly Assistant", targetAudience: ["General Public"], desiredTone: "Friendly", interpersonalStance: "Patient teacher" },
    sflMode: { outputFormat: "Paragraph", rhetoricalStructure: "Analogy followed by explanation", lengthConstraint: "Medium Paragraph (~150 words)", textualDirectives: "Avoid technical jargon" },
    createdAt: "2023-05-12T12:00:00Z",
    updatedAt: "2023-05-12T12:00:00Z",
    geminiResponse: "This is a test response."
  },
  {
    id: "5",
    title: "Code Debugging Assistant",
    promptText: "Help identify and fix bugs in this JavaScript code...",
    sflField: { topic: "Programming", taskType: "Code Generation", domainSpecifics: "JavaScript", keywords: "javascript, debugging, error" },
    sflTenor: { aiPersona: "Expert", targetAudience: ["Software Developers"], desiredTone: "Formal", interpersonalStance: "Senior developer" },
    sflMode: { outputFormat: "Code", rhetoricalStructure: "Explanation of bug then corrected code", lengthConstraint: "Concise (as needed)", textualDirectives: "Provide clear fix descriptions" },
    createdAt: "2023-05-20T12:00:00Z",
    updatedAt: "2023-05-20T12:00:00Z",
  },
  {
    id: "6",
    title: "Article Translation",
    promptText: "Translate this technical article from English to Spanish...",
    sflField: { topic: "Languages", taskType: "Translation", domainSpecifics: "Technical article", keywords: "translation, spanish, technical" },
    sflTenor: { aiPersona: "Expert", targetAudience: ["Business Professionals"], desiredTone: "Formal", interpersonalStance: "Professional translator" },
    sflMode: { outputFormat: "Paragraph", rhetoricalStructure: "Maintain original structure", lengthConstraint: "As per original", textualDirectives: "Use formal Spanish" },
    createdAt: "2023-05-17T12:00:00Z",
    updatedAt: "2023-05-17T12:00:00Z",
    geminiResponse: "This is a test response."
  },
];

const promptToMarkdown = (prompt: PromptSFL): string => {
    const { 
        title, updatedAt, promptText, sflField, sflTenor, sflMode, exampleOutput, notes, sourceDocument
    } = prompt;

    const sections = [
        `# ${title || 'Untitled Prompt'}`,
        `**Last Updated:** ${new Date(updatedAt).toLocaleString()}`,
        '---',
        '## Prompt Text',
        '```',
        promptText || '',
        '```',
    ];

    if (sourceDocument) {
        sections.push(
            '---',
            '## Source Document',
            `**Filename:** \`${sourceDocument.name}\``,
            '> This document was used as a stylistic reference during prompt generation.',
            '',
            '<details>',
            '<summary>View Content</summary>',
            '',
            '```',
            sourceDocument.content,
            '```',
            '</details>'
        );
    }

    sections.push(
        '---',
        '## SFL Metadata',
        '### Field (What is happening?)',
        `- **Topic:** ${sflField.topic || 'N/A'}`,
        `- **Task Type:** ${sflField.taskType || 'N/A'}`,
        `- **Domain Specifics:** ${sflField.domainSpecifics || 'N/A'}`,
        `- **Keywords:** ${sflField.keywords ? `\`${sflField.keywords.split(',').map(k => k.trim()).join('`, `')}\`` : 'N/A'}`,
        '',
        '### Tenor (Who is taking part?)',
        `- **AI Persona:** ${sflTenor.aiPersona || 'N/A'}`,
        `- **Target Audience:** ${sflTenor.targetAudience.join(', ') || 'N/A'}`,
        `- **Desired Tone:** ${sflTenor.desiredTone || 'N/A'}`,
        `- **Interpersonal Stance:** ${sflTenor.interpersonalStance || 'N/A'}`,
        '',
        '### Mode (What role is language playing?)',
        `- **Output Format:** ${sflMode.outputFormat || 'N/A'}`,
        `- **Rhetorical Structure:** ${sflMode.rhetoricalStructure || 'N/A'}`,
        `- **Length Constraint:** ${sflMode.lengthConstraint || 'N/A'}`,
        `- **Textual Directives:** ${sflMode.textualDirectives || 'N/A'}`,
    );

    if (exampleOutput) {
        sections.push(
            '---',
            '## Example Output',
            '```',
            exampleOutput,
            '```'
        );
    }

    if (notes) {
        sections.push(
            '---',
            '## Notes',
            notes
        );
    }
    
    return sections.join('\n');
};

type Page = 'dashboard' | 'lab' | 'documentation' | 'settings';

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptSFL[]>(() => {
    const savedPrompts = localStorage.getItem('sflPrompts');
    try {
        const parsed = savedPrompts ? JSON.parse(savedPrompts) : samplePrompts;
        return Array.isArray(parsed) ? parsed : samplePrompts;
    } catch (error) {
        console.error("Failed to parse prompts from localStorage", error);
        return samplePrompts;
    }
  });
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptSFL | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [appConstants, setAppConstants] = useState({
    taskTypes: TASK_TYPES,
    aiPersonas: AI_PERSONAS,
    targetAudiences: TARGET_AUDIENCES,
    desiredTones: DESIRED_TONES,
    outputFormats: OUTPUT_FORMATS,
    lengthConstraints: LENGTH_CONSTRAINTS,
    popularTags: POPULAR_TAGS,
  });

  const handleNavigate = useCallback((page: Page) => {
    setActivePage(page);
  }, []);

  const handleAddConstant = useCallback((key: keyof typeof appConstants, value: string) => {
    if (!value || !value.trim()) return;
    const trimmedValue = value.trim();
    setAppConstants(prev => {
        const currentValues = prev[key];
        if (!Array.isArray(currentValues)) return prev;

        const lowerCaseValue = trimmedValue.toLowerCase();
        const existingValues = currentValues.map(v => String(v).toLowerCase());

        if (existingValues.includes(lowerCaseValue)) {
            return prev;
        }
        return {
            ...prev,
            [key]: [...currentValues, trimmedValue]
        };
    });
  }, []);


  useEffect(() => {
    localStorage.setItem('sflPrompts', JSON.stringify(prompts));
  }, [prompts]);

  const handleOpenCreateModal = () => {
    setSelectedPrompt(null);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
  };
  
  const handleOpenHelpModal = () => {
    setActiveModal(ModalType.HELP);
  };

  const handleOpenWizard = () => {
    setActiveModal(ModalType.WIZARD);
  };

  const handleOpenEditModal = (prompt: PromptSFL) => {
    setSelectedPrompt(prompt);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
  };

  const handleOpenDetailModal = (prompt: PromptSFL) => {
    setSelectedPrompt(prompt);
    setActiveModal(ModalType.VIEW_PROMPT_DETAIL);
  };

  const handleCloseModal = () => {
    setActiveModal(ModalType.NONE);
  };

  const handleSavePrompt = (prompt: PromptSFL) => {
    setPrompts(prevPrompts => {
      const existingIndex = prevPrompts.findIndex(p => p.id === prompt.id);
      if (existingIndex > -1) {
        const updatedPrompts = [...prevPrompts];
        updatedPrompts[existingIndex] = prompt;
        return updatedPrompts;
      }
      return [prompt, ...prevPrompts].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    handleCloseModal();
  };

  const handleDeletePrompt = (promptId: string) => {
    if(window.confirm('Are you sure you want to delete this prompt?')){
      setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== promptId));
      if (selectedPrompt && selectedPrompt.id === promptId) {
          setSelectedPrompt(null);
          handleCloseModal();
      }
    }
  };

  const handleFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      
      const searchFields = [
        p.title,
        p.promptText,
        p.sflField.keywords,
        p.sflField.topic,
        p.sflField.domainSpecifics,
        p.sflTenor.aiPersona,
        p.sflTenor.targetAudience.join(' '),
        p.sflTenor.desiredTone,
        p.sflMode.outputFormat
      ];

      const matchesSearchTerm = filters.searchTerm === '' || searchFields.some(field => field && field.toLowerCase().includes(searchTermLower));
      const matchesTaskType = filters.taskType === '' || p.sflField.taskType === filters.taskType;
      const matchesAiPersona = filters.aiPersona === '' || p.sflTenor.aiPersona === filters.aiPersona;
      
      return matchesSearchTerm && matchesTaskType && matchesAiPersona;
    }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [prompts, filters]);

  const handleTestWithGemini = async (promptToTest: PromptSFL, variables: Record<string, string>) => {
    const updatePromptState = (id: string, updates: Partial<PromptSFL>) => {
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        setSelectedPrompt(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
    };

    updatePromptState(promptToTest.id, { isTesting: true, geminiResponse: undefined, geminiTestError: undefined });
    
    let finalPromptText = promptToTest.promptText;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      finalPromptText = finalPromptText.replace(regex, variables[key] || '');
    });


    try {
      const responseText = await testPromptWithGemini(finalPromptText);
      updatePromptState(promptToTest.id, { isTesting: false, geminiResponse: responseText, geminiTestError: undefined });
    } catch (error: any) {
      updatePromptState(promptToTest.id, { isTesting: false, geminiTestError: error.message, geminiResponse: undefined });
    }
  };

  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_');
  };

  const handleExportSinglePrompt = (promptToExport: PromptSFL) => {
    if (!promptToExport) {
      alert("No prompt selected for export.");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isTesting, geminiResponse, geminiTestError, ...exportablePrompt } = promptToExport;
      const jsonData = JSON.stringify(exportablePrompt, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      const sanitizedTitle = sanitizeFilename(promptToExport.title || "untitled");
      a.href = url;
      a.download = `sfl-prompt_${sanitizedTitle}_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting prompt:", error);
      alert("An error occurred while exporting the prompt. Please check the console for details.");
    }
  };

  const handleExportSinglePromptMarkdown = (promptToExport: PromptSFL) => {
    if (!promptToExport) {
      alert("No prompt selected for export.");
      return;
    }
    try {
      const markdownData = promptToMarkdown(promptToExport);
      const blob = new Blob([markdownData], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      const sanitizedTitle = sanitizeFilename(promptToExport.title || "untitled");
      a.href = url;
      a.download = `sfl-prompt_${sanitizedTitle}_${date}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting prompt as markdown:", error);
      alert("An error occurred while exporting the prompt as markdown. Please check the console for details.");
    }
  };


  const handleExportAllPrompts = () => {
    if (prompts.length === 0) {
      alert("There are no prompts to export.");
      return;
    }
    try {
      const exportablePrompts = prompts.map(p => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isTesting, geminiResponse, geminiTestError, ...rest } = p;
        return rest;
      });
      const jsonData = JSON.stringify(exportablePrompts, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sfl-prompt-library_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting prompts:", error);
      alert("An error occurred while exporting prompts. Please check the console for details.");
    }
  };

  const handleExportAllPromptsMarkdown = () => {
    if (prompts.length === 0) {
      alert("There are no prompts to export.");
      return;
    }
    try {
      const allPromptsMarkdown = prompts
        .map(p => promptToMarkdown(p))
        .join('\n\n---\n\n');
        
      const blob = new Blob([allPromptsMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sfl-prompt-library_${date}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting all prompts as markdown:", error);
      alert("An error occurred while exporting prompts as markdown. Please check the console for details.");
    }
  };

  const handleImportPrompts = () => {
      importFileRef.current?.click();
  };

  const onFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') {
                  throw new Error("File content is not readable.");
              }
              const importedData = JSON.parse(text);

              if (!Array.isArray(importedData)) {
                  throw new Error("Imported file is not a valid prompt array.");
              }

              const isValid = importedData.every(p => p.id && p.title && p.promptText);
              if (!isValid) {
                  throw new Error("Some prompts in the imported file are malformed.");
              }
              const importedPrompts = importedData as PromptSFL[];
              
              setPrompts(prevPrompts => {
                  const promptsMap = new Map(prevPrompts.map(p => [p.id, p]));
                  let newPromptsCount = 0;
                  let updatedPromptsCount = 0;

                  importedPrompts.forEach(importedPrompt => {
                      if (promptsMap.has(importedPrompt.id)) {
                          updatedPromptsCount++;
                      } else {
                          newPromptsCount++;
                      }
                      promptsMap.set(importedPrompt.id, {
                          ...importedPrompt,
                          geminiResponse: undefined,
                          geminiTestError: undefined,
                          isTesting: false,
                      });
                  });
                  alert(`Import successful!\n\nNew prompts: ${newPromptsCount}\nUpdated prompts: ${updatedPromptsCount}`);
                  return Array.from(promptsMap.values());
              });

          } catch (error: any) {
              console.error("Error importing prompts:", error);
              alert(`Import failed: ${error.message}`);
          } finally {
              if (event.target) {
                  event.target.value = '';
              }
          }
      };
      reader.readAsText(file);
  };


  const renderMainContent = () => {
    switch(activePage) {
        case 'dashboard':
            return (
                <>
                    <Stats totalPrompts={prompts.length}/>
                    <div className="mt-8">
                        <PromptList 
                            prompts={filteredPrompts} 
                            onViewPrompt={handleOpenDetailModal}
                            onEditPrompt={handleOpenEditModal}
                            onDeletePrompt={handleDeletePrompt}
                        />
                    </div>
                </>
            );
        case 'lab':
            return <PromptLabPage prompts={prompts} />;
        case 'documentation':
            return <Documentation />;
        case 'settings':
        default:
             return (
                <div className="text-center py-20 bg-gray-800 rounded-lg border border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-50">Coming Soon!</h2>
                    <p className="text-gray-400 mt-2">This page is under construction.</p>
                </div>
            );
    }
  }


  return (
    <div className="flex h-screen bg-gray-900 font-sans">
      <Sidebar 
        filters={filters}
        onFilterChange={handleFilterChange}
        popularTags={appConstants.popularTags}
        activePage={activePage}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />
       <input
            type="file"
            ref={importFileRef}
            onChange={onFileImport}
            className="hidden"
            accept="application/json"
        />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          onAddNewPrompt={handleOpenCreateModal}
          onOpenWizard={handleOpenWizard}
          searchTerm={filters.searchTerm}
          onSearchChange={(value) => handleFilterChange('searchTerm', value)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderMainContent()}
        </main>
      </div>

      {activeModal === ModalType.CREATE_EDIT_PROMPT && (
        <PromptFormModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSavePrompt}
          promptToEdit={selectedPrompt}
          appConstants={appConstants}
          onAddConstant={handleAddConstant}
        />
      )}

      {activeModal === ModalType.VIEW_PROMPT_DETAIL && selectedPrompt && (
         <PromptDetailModal
          isOpen={true}
          onClose={handleCloseModal}
          prompt={selectedPrompt}
          onEdit={handleOpenEditModal}
          onDelete={handleDeletePrompt}
          onTestWithGemini={handleTestWithGemini}
          onExportPrompt={handleExportSinglePrompt}
          onExportPromptMarkdown={handleExportSinglePromptMarkdown}
        />
      )}

      {activeModal === ModalType.WIZARD && (
        <PromptWizardModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={handleSavePrompt}
          appConstants={appConstants}
          onAddConstant={handleAddConstant}
        />
      )}

      {activeModal === ModalType.HELP && (
        <HelpModal
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default App;