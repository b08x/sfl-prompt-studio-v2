import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { PromptSFL, Filters, ModalType, PromptVersion, StagedUserInput, Workflow } from './types';
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
import { testPrompt } from './services/sflService';
import { useWorkflowManager } from './hooks/useWorkflowManager';
import { useWorkflowRunner } from './hooks/useWorkflowRunner';
import WorkflowEditorModal from './components/lab/modals/WorkflowEditorModal';
import WorkflowWizardModal from './components/lab/modals/WorkflowWizardModal';
import { promptToMarkdown, sanitizeFilename } from './utils/exportUtils';
import LiveAssistant from './components/LiveAssistant';
import MicrophoneIcon from './components/icons/MicrophoneIcon';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { 
      prompts, filters, appConstants, activeModal, selectedPrompt, activePage, isSidebarCollapsed,
      init, addPrompt, updatePrompt, deletePrompt, importPrompts, setFilters, resetFilters,
      setActiveModal, setSelectedPrompt, setActivePage, toggleSidebar, addAppConstant
  } = useStore();

  useEffect(() => {
    init();
  }, []);

  const importFileRef = useRef<HTMLInputElement>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Workflow management is still local to App or could be its own store.
  // Keeping it here to minimize refactor risk for the workflow engine logic.
  const { workflows, saveWorkflow, deleteWorkflow, isLoading: workflowsLoading, saveCustomWorkflows } = useWorkflowManager();
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const activeWorkflow = useMemo(() => workflows.find(wf => wf.id === activeWorkflowId) || null, [workflows, activeWorkflowId]);
  const { dataStore, taskStates, isRunning, run, reset, runFeedback, stageInput } = useWorkflowRunner(activeWorkflow, prompts);
  const [activeLabTab, setActiveLabTab] = useState<'workflow' | 'ideation'>('workflow');
  const [ideationPromptId, setIdeationPromptId] = useState<string | null>(null);

  // Sync ideation prompt selection
  useEffect(() => {
     if (!ideationPromptId && prompts.length > 0) {
         setIdeationPromptId(prompts[0].id);
     }
  }, [prompts, ideationPromptId]);

  const ideationPrompt = useMemo(() => prompts.find(p => p.id === ideationPromptId) || null, [prompts, ideationPromptId]);

  useEffect(() => {
    if (!workflowsLoading && workflows.length > 0 && !activeWorkflowId) {
        setActiveWorkflowId(workflows[0].id);
    }
  }, [workflowsLoading, workflows, activeWorkflowId]);


  const handleOpenCreateModal = () => {
    setSelectedPrompt(null);
    setActiveModal(ModalType.CREATE_EDIT_PROMPT);
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

  const handleFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters({ [key]: value });
  }, [setFilters]);

  // Derived filtered prompts
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
    updatePrompt({ ...promptToTest, isTesting: true, geminiResponse: undefined, geminiTestError: undefined });
    
    let finalPromptText = promptToTest.promptText;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      finalPromptText = finalPromptText.replace(regex, variables[key] || '');
    });

    try {
      const responseText = await testPrompt(finalPromptText);
      updatePrompt({ ...promptToTest, isTesting: false, geminiResponse: responseText, geminiTestError: undefined });
    } catch (error: any) {
      updatePrompt({ ...promptToTest, isTesting: false, geminiTestError: error.message, geminiResponse: undefined });
    }
  };

  const handleRevertPrompt = (prompt: PromptSFL, versionToRevertTo: PromptVersion) => {
    const previousVersion: PromptVersion = {
      version: prompt.version,
      promptText: prompt.promptText,
      sflField: prompt.sflField,
      sflTenor: prompt.sflTenor,
      sflMode: prompt.sflMode,
      exampleOutput: prompt.exampleOutput,
      notes: prompt.notes,
      sourceDocument: prompt.sourceDocument,
      createdAt: prompt.updatedAt,
    };

    const newPromptState: PromptSFL = {
      ...prompt,
      promptText: versionToRevertTo.promptText,
      sflField: versionToRevertTo.sflField,
      sflTenor: versionToRevertTo.sflTenor,
      sflMode: versionToRevertTo.sflMode,
      exampleOutput: versionToRevertTo.exampleOutput,
      notes: versionToRevertTo.notes,
      sourceDocument: versionToRevertTo.sourceDocument,
      updatedAt: new Date().toISOString(),
      version: prompt.version + 1,
      history: [...(prompt.history || []), previousVersion],
      geminiResponse: undefined,
      geminiTestError: undefined,
    };
    
    updatePrompt(newPromptState);
    alert(`Reverted to version ${versionToRevertTo.version}. A new version (${newPromptState.version}) has been created.`);
  };

  const handleExportSinglePrompt = (promptToExport: PromptSFL) => {
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
      alert("Error exporting prompt.");
    }
  };

  const handleExportSinglePromptMarkdown = (promptToExport: PromptSFL) => {
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
       console.error("Error exporting markdown:", error);
       alert("Error exporting markdown.");
    }
  };

  const handleExportAllPrompts = () => {
    if (prompts.length === 0) return alert("No prompts to export.");
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
      alert("Error exporting prompts.");
    }
  };

  const handleExportAllPromptsMarkdown = () => {
    if (prompts.length === 0) return alert("No prompts to export.");
    try {
      const allPromptsMarkdown = prompts.map(p => promptToMarkdown(p)).join('\n\n---\n\n');
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
      console.error("Error exporting all markdown:", error);
      alert("Error exporting all markdown.");
    }
  };

  const onFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("File content not readable.");
              const importedData = JSON.parse(text);
              if (!Array.isArray(importedData)) throw new Error("Invalid prompt array.");
              const importedPrompts = importedData as PromptSFL[];
              
              importPrompts(importedPrompts);
              alert(`Import successful! ${importedPrompts.length} prompts processed.`);

          } catch (error: any) {
              alert(`Import failed: ${error.message}`);
          } finally {
              if (event.target) event.target.value = '';
          }
      };
      reader.readAsText(file);
  };
  
  const handleImportWorkflows = (importedWorkflows: Workflow[]) => {
      const customWorkflows = workflows.filter(wf => !wf.isDefault);
      const merged = [...customWorkflows];
      importedWorkflows.forEach(iw => {
          const index = merged.findIndex(cw => cw.id === iw.id);
          if (index !== -1) merged[index] = iw;
          else merged.push(iw);
      });
      saveCustomWorkflows(merged);
      alert(`Import successful. ${importedWorkflows.length} workflows imported/updated.`);
  };

  const handleSaveWorkflow = (workflow: Workflow) => {
    saveWorkflow(workflow);
    setActiveWorkflowId(workflow.id); 
    handleCloseModal();
  };

  const handleCopyToMarkdown = (prompt: PromptSFL) => {
    navigator.clipboard.writeText(promptToMarkdown(prompt));
  };

  const renderMainContent = () => {
    switch(activePage) {
        case 'dashboard':
            return (
                <>
                    <TopBar
                      onAddNewPrompt={handleOpenCreateModal}
                      onOpenWizard={() => setActiveModal(ModalType.WIZARD)}
                      searchTerm={filters.searchTerm}
                      onSearchChange={(value) => handleFilterChange('searchTerm', value)}
                    />
                    <div className="flex-1 overflow-y-auto p-6">
                        <Stats totalPrompts={prompts.length}/>
                        <div className="mt-8">
                            <PromptList 
                                prompts={filteredPrompts} 
                                onViewPrompt={handleOpenDetailModal}
                                onEditPrompt={handleOpenEditModal}
                                onDeletePrompt={deletePrompt}
                                onCopyToMarkdown={handleCopyToMarkdown}
                            />
                        </div>
                    </div>
                </>
            );
        case 'lab':
            return <PromptLabPage
              prompts={prompts}
              activeWorkflow={activeWorkflow}
              taskStates={taskStates}
              isRunning={isRunning}
              run={run}
              reset={reset}
              runFeedback={runFeedback}
              isLoading={workflowsLoading}
              workflows={workflows}
              onSelectWorkflow={setActiveWorkflowId}
              onOpenWorkflowEditor={() => setActiveModal(ModalType.WORKFLOW_EDITOR)}
              onOpenWorkflowWizard={() => setActiveModal(ModalType.WORKFLOW_WIZARD)}
              onDeleteWorkflow={deleteWorkflow}
              onImportWorkflows={handleImportWorkflows}
              onStageInput={stageInput}
              dataStore={dataStore}
              saveWorkflow={saveWorkflow}
              activeLabTab={activeLabTab}
              onSetLabTab={setActiveLabTab}
              ideationPrompt={ideationPrompt}
              onIdeationPromptChange={updatePrompt}
              onSelectIdeationPrompt={setIdeationPromptId}
            />;
        case 'documentation':
            return <div className="flex-1 overflow-y-auto p-6"><Documentation /></div>;
        case 'settings':
        default:
             return (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="text-center py-20 bg-gray-800 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-50">Coming Soon!</h2>
                    </div>
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
        onNavigate={setActivePage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
       <input
            type="file"
            ref={importFileRef}
            onChange={onFileImport}
            className="hidden"
            accept="application/json"
        />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderMainContent()}
        </main>
      </div>

      {activeModal === ModalType.CREATE_EDIT_PROMPT && (
        <PromptFormModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={(prompt) => {
             if (selectedPrompt) updatePrompt(prompt); else addPrompt(prompt);
             handleCloseModal();
          }}
          promptToEdit={selectedPrompt}
          appConstants={appConstants}
          onAddConstant={addAppConstant}
        />
      )}

      {activeModal === ModalType.VIEW_PROMPT_DETAIL && selectedPrompt && (
         <PromptDetailModal
          isOpen={true}
          onClose={handleCloseModal}
          prompt={selectedPrompt}
          onEdit={handleOpenEditModal}
          onDelete={deletePrompt}
          onTestWithGemini={handleTestWithGemini}
          onExportPrompt={handleExportSinglePrompt}
          onExportPromptMarkdown={handleExportSinglePromptMarkdown}
          onRevert={handleRevertPrompt}
        />
      )}

      {activeModal === ModalType.WIZARD && (
        <PromptWizardModal
          isOpen={true}
          onClose={handleCloseModal}
          onSave={(prompt) => {
            addPrompt(prompt);
            handleCloseModal();
          }}
          appConstants={appConstants}
          onAddConstant={addAppConstant}
        />
      )}

      {activeModal === ModalType.HELP && (
        <HelpModal
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === ModalType.WORKFLOW_EDITOR && (
        <WorkflowEditorModal
            isOpen={true}
            onClose={handleCloseModal}
            onSave={handleSaveWorkflow}
            workflowToEdit={activeWorkflow?.isDefault ? null : activeWorkflow}
            prompts={prompts}
        />
      )}
      
      {activeModal === ModalType.WORKFLOW_WIZARD && (
        <WorkflowWizardModal
            isOpen={true}
            onClose={handleCloseModal}
            onSave={handleSaveWorkflow}
            prompts={prompts}
        />
      )}

      <LiveAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        activePage={activePage}
        labTab={activePage === 'lab' ? activeLabTab : undefined}
        activePrompt={ideationPrompt}
        onUpdatePrompt={updatePrompt}
        activeWorkflow={activeWorkflow}
      />
      
      {!isAssistantOpen && (
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="fixed bottom-5 right-5 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 z-40"
            aria-label="Open live assistant"
          >
            <MicrophoneIcon className="w-8 h-8"/>
          </button>
      )}
      
      {/* Header Actions for import/export need connecting to header if they were there, but Sidebar/TopBar handle most. */}
      {/* The Header component from previous iteration seems to have been removed or merged into TopBar? 
          Checking files... components/Header.tsx exists in provided files but App.tsx uses TopBar.tsx.
          TopBar.tsx has search and create buttons. Sidebar has nav.
          The 'Import/Export' buttons were in the old Header.tsx which isn't used in App.tsx?
          Ah, I see 'components/Header.tsx' in the provided file list.
          Wait, looking at the previous App.tsx content provided by user...
          It imports TopBar and uses it. It does NOT use Header.
          So Header.tsx might be dead code or I missed where it was used.
          Actually, checking the previous App.tsx again...
          It uses <TopBar ... />.
          Okay, so I will stick to TopBar.
          
          Wait, I see `handleExportAllPrompts` etc defined in App.tsx but not passed to TopBar?
          Let's check TopBar props.
          TopBarProps: onAddNewPrompt, onOpenWizard, searchTerm, onSearchChange.
          
          It seems the Import/Export functionality for *prompts* is missing from the UI in the current App.tsx structure provided by the user?
          Or maybe it was in the Sidebar?
          Sidebar has "Settings".
          
          Let's look at `components/Header.tsx`. It has `onImportPrompts`, `onExportAllPrompts`.
          But `App.tsx` imports `TopBar`.
          Maybe the user replaced Header with TopBar in a previous step and lost the buttons?
          
          I will stick to the user's current App.tsx structure (using TopBar) and just update the state logic.
          If buttons are missing in the UI, I won't add them back unless requested, to keep changes minimal,
          BUT I will keep the handlers in App.tsx just in case.
      */}
    </div>
  );
};

export default App;