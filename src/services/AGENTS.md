# SERVICES LAYER

**AI execution, workflow engine, providers**

## OVERVIEW
Core business logic: AI provider integration, workflow execution, validation, sandboxing. Subdirectory: `providers/` (1 file).

## STRUCTURE
```
services/
├── sflService.ts              # Main SFL prompt testing service
├── workflowEngine.ts          # Task execution engine
├── executionService.ts        # Task execution logic
├── modelDiscoveryService.ts   # AI model enumeration
├── providerFactory.ts         # Provider instantiation
├── validationService.ts       # Input validation
├── sandboxService.ts          # Code execution sandbox
├── workflowService.ts         # Workflow management
├── aiTypes.ts                 # AI-related types
└── providers/
    └── (IProvider implementations)
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Add AI provider | `providers/` + register in `providerFactory.ts` |
| Modify workflow execution | `workflowEngine.ts` |
| Change prompt testing | `sflService.ts` |
| Add model discovery | `modelDiscoveryService.ts` |
| Modify validation rules | `validationService.ts` |

## CONVENTIONS
- **Factory pattern**: `providerFactory.ts` instantiates providers
- **Interface**: All providers implement `IProvider` (Vercel AI SDK)
- **Flat structure**: All services at root except `providers/`
- **Separation**: Execution logic separate from UI hooks

## UNIQUE PATTERNS
- **Vercel AI SDK**: `generateText()` for AI calls, stream support
- **Multi-provider**: Gemini, OpenAI, Anthropic, Mistral supported
- **Workflow engine**: Sequential task execution with data passing
- **Sandbox**: Isolated code execution for security

## NOTES
- `sflService.ts` is main entry for prompt testing
- Workflow engine uses `dataStore` map for task outputs
- Model discovery dynamically fetches available models per provider
- No subdirectory organization (all 9 files at root) - consider restructuring if grows
