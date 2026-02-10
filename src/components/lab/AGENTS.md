# LAB COMPONENTS

**Workflow and ideation features**

## OVERVIEW
Experimental/advanced features: workflow editor, workflow wizard, ideation tools. Subdirectory: `modals/` (4 files).

## STRUCTURE
```
lab/
├── PromptLabPage.tsx       # Main lab page component
├── IdeationSection.tsx     # AI-assisted prompt ideation
├── WorkflowSection.tsx     # Workflow execution UI
└── modals/
    ├── WorkflowEditorModal.tsx
    ├── WorkflowWizardModal.tsx
    ├── TaskConfigModal.tsx
    └── PromptSelectorModal.tsx
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Modify workflow UI | `WorkflowSection.tsx` |
| Modify ideation UI | `IdeationSection.tsx` |
| Edit workflow editor | `modals/WorkflowEditorModal.tsx` |
| Edit workflow wizard | `modals/WorkflowWizardModal.tsx` |

## CONVENTIONS
- **Feature isolation**: Lab features separate from main dashboard
- **Modal pattern**: Complex interactions in dedicated modals
- **Page component**: `PromptLabPage.tsx` aggregates sections

## NOTES
- Workflow engine logic in `src/services/workflowEngine.ts`, not here
- Ideation uses Gemini Live API via `useGeminiLive` hook
- Deep nesting (`lab/modals/`) unique to this subdirectory
