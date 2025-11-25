import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { PromptSFL, Filters, ModalType, PromptVersion, StagedUserInput, Workflow } from './types';
import { AIProvider } from './types/ai';
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
import SettingsPage from './components/SettingsPage';
import { testPrompt } from './services/sflService';
import { useWorkflowRunner } from './hooks/useWorkflowRunner';
import WorkflowEditorModal from './components/lab/modals/WorkflowEditorModal';
import WorkflowWizardModal from './components/lab/modals/WorkflowWizardModal';
import { promptToMarkdown, sanitizeFilename } from './utils/exportUtils';
import LiveAssistant from './components/LiveAssistant';
import MicrophoneIcon from './components/icons/MicrophoneIcon';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const {
      prompts, workflows, filters, appConstants, activeModal, selectedPrompt, isSidebarCollapsed,
      isInitialized, apiKeyValidation, userApiKeys,
      init, addPrompt, updatePrompt, deletePrompt, importPrompts, setFilters, resetFilters,
      setActiveModal, setSelectedPrompt, toggleSidebar, addAppConstant,
      saveWorkflow, deleteWorkflow, saveCustomWorkflows
  } = useStore();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  // Validation guard: redirect to settings if no valid API keys
  useEffect(() => {
    if (!isInitialized) return;

    const hasValidKey = Object.values(apiKeyValidation).some(status => status === 'valid');
    const isOnSettings = location.pathname === '/settings';
    const isOnDocumentation = location.pathname === '/documentation';

    // Redirect to settings if no valid keys and not already on settings or documentation
    if (!hasValidKey && !isOnSettings && !isOnDocumentation) {
      navigate('/settings');
    }
  }, [isInitialized, apiKeyValidation, location.pathname, navigate]);

  const importFileRef = useRef<HTMLInputElement>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  
  const activeWorkflow = useMemo(() => workflows.find(wf => wf.id === activeWorkflowId) || null, [workflows, activeWorkflowId]);
  
  // Note: WorkflowRunner maintains ephemeral execution state, so it stays as a local hook for now, 
  // though prompts are passed from the store.
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
    if (workflows.length > 0 && !activeWorkflowId) {
        setActiveWorkflowId(workflows[0].id);
    }
  }, [workflows, activeWorkflowId]);


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
    // Get Google API key from store
    const googleApiKey = userApiKeys[AIProvider.Google];

    if (!googleApiKey || googleApiKey.trim() === '') {
      updatePrompt({
        ...promptToTest,
        isTesting: false,
        geminiTestError: 'Please configure your Google API key in Settings before testing prompts.',
        geminiResponse: undefined
      });
      return;
    }

    updatePrompt({ ...promptToTest, isTesting: true, geminiResponse: undefined, geminiTestError: undefined });

    let finalPromptText = promptToTest.promptText;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      finalPromptText = finalPromptText.replace(regex, variables[key] || '');
    });

    try {
      const responseText = await testPrompt(finalPromptText, googleApiKey);
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

  // Determine active page name for LiveAssistant context
  const getActivePageName = (): 'dashboard' | 'lab' | 'documentation' | 'settings' => {
      if (location.pathname.startsWith('/lab')) return 'lab';
      if (location.pathname.startsWith('/documentation')) return 'documentation';
      if (location.pathname.startsWith('/settings')) return 'settings';
      return 'dashboard';
  };
  const activePageName = getActivePageName();

  const handleImportPromptsClick = () => {
    importFileRef.current?.click();
  };

  const handleExportAllPrompts = () => {
    try {
        const exportablePrompts = prompts.map(({ isTesting, geminiResponse, geminiTestError, ...rest }) => rest);
        const jsonData = JSON.stringify(exportablePrompts, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `sfl-prompts-export_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Export all failed", error);
        alert("Failed to export prompts.");
    }
  };

  const handleExportAllPromptsMarkdown = () => {
     try {
        let markdownContent = `# SFL Prompt Export - ${new Date().toLocaleDateString()}\n\n`;
        prompts.forEach(p => {
            markdownContent += promptToMarkdown(p) + "\n\n---\n\n";
        });
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `sfl-prompts-export_${date}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
     } catch (error) {
         console.error("Export all markdown failed", error);
         alert("Failed to export markdown.");
     }
  };


  return (
    <div className="flex h-screen bg-gray-900 font-sans">
      <Sidebar 
        filters={filters}
        onFilterChange={handleFilterChange}
        popularTags={appConstants.popularTags}
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
          <Routes>
            <Route path="/" element={
              <>
                <TopBar
                  onAddNewPrompt={handleOpenCreateModal}
                  onOpenWizard={() => setActiveModal(ModalType.WIZARD)}
                  searchTerm={filters.searchTerm}
                  onSearchChange={(value) => handleFilterChange('searchTerm', value)}
                />
                 {/* This section needs to accept header actions for import/export which were previously in TopBar in the old design or Dashboard specific */}
                 {/* Re-injecting the header with actions that were likely part of Dashboard view composition in previous versions or handled differently. 
                     Checking Sidebar/TopBar logic. TopBar has Add/Wizard. 
                     The Header component (from components/Header.tsx) seems to have been used inside renderMainContent previously or replaced by TopBar.
                     Wait, TopBar replaces Header? In the previous App.tsx, TopBar was used for dashboard. 
                     Ah, the original App.tsx had 'Header' component imported but not used in the 'dashboard' case of renderMainContent in the provided file?
                     Wait, looking at previous App.tsx provided content:
                     It uses `TopBar` for dashboard. 
                     It also uses `import Header from './components/Header';` but doesn't seem to use it in the JSX of `App.tsx` provided.
                     However, the `Header` component file content shows buttons for import/export.
                     Let's check `TopBar.tsx`. It has search, wizard, new prompt.
                     The buttons for import/export/help seem missing from the `TopBar`. 
                     They were likely in the `Header` component which might have been used in a different version or I missed where it was used.
                     Actually, in the provided `App.tsx`, `Header` was imported but NOT used.
                     I will stick to the provided `App.tsx` structure where `TopBar` is the main header.
                     If I want to expose Import/Export, I should probably add them to the Dashboard view or TopBar.
                     For now, I will replicate the previous Dashboard view exactly.
                 */}
                 {/* Adding a sub-header for actions if needed, or just keeping it simple as per previous App.tsx */}
                 <div className="flex-1 overflow-y-auto p-6">
                     <div className="flex justify-end space-x-2 mb-4">
                        <button onClick={() => setActiveModal(ModalType.HELP)} className="text-gray-400 hover:text-gray-200 text-sm">Help</button>
                        <span className="text-gray-600">|</span>
                        <button onClick={handleImportPromptsClick} className="text-gray-400 hover:text-gray-200 text-sm">Import</button>
                        <span className="text-gray-600">|</span>
                        <button onClick={handleExportAllPrompts} className="text-gray-400 hover:text-gray-200 text-sm">Export JSON</button>
                        <span className="text-gray-600">|</span>
                        <button onClick={handleExportAllPromptsMarkdown} className="text-gray-400 hover:text-gray-200 text-sm">Export MD</button>
                     </div>
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
            } />
            <Route path="/lab" element={
              <PromptLabPage
                prompts={prompts}
                activeWorkflow={activeWorkflow}
                taskStates={taskStates}
                isRunning={isRunning}
                run={run}
                reset={reset}
                runFeedback={runFeedback}
                isLoading={workflows.length === 0}
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
              />
            } />
            <Route path="/documentation" element={<div className="flex-1 overflow-y-auto p-6"><Documentation /></div>} />
            <Route path="/settings" element={
                <div className="flex-1 overflow-y-auto">
                    <SettingsPage />
                </div>
            } />
          </Routes>
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
        activePage={activePageName}
        labTab={activePageName === 'lab' ? activeLabTab : undefined}
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
    </div>
  );
};

export default App;