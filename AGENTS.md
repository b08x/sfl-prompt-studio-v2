# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-09 22:05  
**Commit:** 1462ce0  
**Branch:** main

## OVERVIEW
SFL Prompt Studio v2: React 19 + TypeScript prompt engineering workspace with AI-powered workflow execution and live assistant. Gemini/OpenAI/Anthropic/Mistral integration via Vercel AI SDK.

## STRUCTURE
```
sfl-prompt-studio-v2/
├── src/
│   ├── components/        # React components (18 root + 52 icons + lab/)
│   │   ├── icons/         # 52 SVG icon components → see src/components/icons/AGENTS.md
│   │   ├── lab/           # Workflow/ideation features → see src/components/lab/AGENTS.md
│   │   ├── forms/         # Form input components (3 files)
│   │   └── *.tsx          # Dashboard, modals, UI components
│   ├── services/          # AI execution + providers → see src/services/AGENTS.md  
│   ├── hooks/             # 6 custom React hooks (workflow, AI, Gemini Live)
│   ├── store/             # Zustand state (prompts, workflows, API keys)
│   ├── types/             # TypeScript interfaces (overlaps with types.ts)
│   ├── types.ts           # Main type definitions
│   ├── utils/             # Export, sandbox, validation utilities
│   ├── constants.ts       # SFL framework constants (16KB)
│   ├── App.tsx            # Root component with routing
│   └── index.tsx          # Entry point (React 19, StrictMode, BrowserRouter)
├── public/                # Static assets
├── index.html             # HTML entry (<div id="root">)
├── package.json           # Vite + React 19, no tests
├── vite.config.ts         # Minimal Vite config
└── tsconfig.json          # ES2022, bundler resolution
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new prompt | `src/store/useStore.ts` | Zustand store + localStorage persistence |
| Add AI provider | `src/services/providers/` | Implement IProvider interface |
| Modify workflow execution | `src/services/workflowEngine.ts` | Task execution loop |
| Add UI component | `src/components/` | Co-locate with similar components |
| Add icon | `src/components/icons/` | 52 existing SVG components |
| Add custom hook | `src/hooks/` | 2 empty placeholders exist |
| Modify routing | `src/App.tsx` | React Router v6 Routes |
| Add type | `src/types.ts` or `src/types/` | Both exist (consolidate) |
| Export logic | `src/utils/exportUtils.ts` | Markdown/JSON export |
| SFL constants | `src/constants.ts` | Task types, personas, formats |

## CONVENTIONS

### Deviations from React/Vite Standards
- **Duplicate types**: Both `src/types.ts` (main) AND `src/types/` directory exist
- **Icon separation**: 52 icons in `src/components/icons/` instead of co-located
- **Empty files**: `ChatBot.tsx`, `useLiveConversation.ts`, `useSpeechRecognition.ts` (placeholders)
- **No test infrastructure**: No Jest/Vitest, no test files
- **No lint/test scripts**: `package.json` only has `dev`, `build`, `preview`
- **Flat services**: All 9 service files at `src/services/` root (no subdirs except `providers/`)
- **Mixed component org**: Some in `lab/`, `forms/`, `icons/`, others at root

### React 19 Specific
- Uses `ReactDOM.createRoot()` (React 18+ API)
- React.StrictMode enabled
- No class components observed

## ANTI-PATTERNS (THIS PROJECT)

None explicitly documented in code comments. Inferred from structure:
- Avoid creating more empty placeholder files
- Don't add types to both `types.ts` AND `types/` directory
- Don't separate icons further unless count exceeds 100

## UNIQUE STYLES

### SFL Framework
Project implements "SFL" (Situation-Field-Tenor-Mode) prompt engineering framework with structured metadata:
- **Field**: Task type, topic, keywords, domain specifics
- **Tenor**: AI persona, target audience, tone
- **Mode**: Output format, length constraints

See `src/constants.ts` for framework constants.

### State Management
Zustand store with localStorage persistence, no Redux/Context API. Single `useStore` hook exports all state + actions.

### AI Provider Architecture
Factory pattern for multi-provider support (Gemini, OpenAI, Anthropic, Mistral) via Vercel AI SDK. Each provider implements `IProvider` interface.

## COMMANDS
```bash
npm install           # Install dependencies
npm run dev           # Start dev server (Vite)
npm run build         # Production build
npm run preview       # Preview production build
```

**No test/lint commands configured.**

## NOTES

### API Key Validation
App redirects to `/settings` if no valid API keys detected. Keys stored in localStorage via Zustand store.

### Empty Hooks
`useLiveConversation.ts` and `useSpeechRecognition.ts` are placeholders (0 bytes). `ChatBot.tsx` component also empty.

### File Consolidation Needed
- Merge `src/types/` into `src/types.ts` OR move all types to `src/types/`
- Organize services into subdirectories (`api/`, `execution/`, `providers/`)
- Move page-level components (`SettingsPage`, `PromptLabPage`) to `src/pages/` (doesn't exist)

### No Testing
Zero test files, no testing framework. Consider adding Vitest + React Testing Library.
