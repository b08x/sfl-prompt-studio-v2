# SFL Prompt Studio

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

Prompt engineering platform implementing **Structured Format Language (SFL)** - a linguistic framework for systematic prompt design, testing, and management. Multi-provider AI integration with visual workflow orchestration.

## Quick Start

```bash
git clone <repository-url> && cd sfl-prompt-studio-v2
npm install
npm run dev
# → http://localhost:5173
# Configure API keys in Settings (⚙️) on first launch
```

## Features

### 🎯 SFL Framework
- **Three-Component Architecture**: Decomposes prompts into linguistic dimensions:
  - **Field**: Domain topology - task type, subject matter, technical context
  - **Tenor**: Interactional stance - persona, audience, register, tone
  - **Mode**: Discourse organization - output format, rhetorical structure, constraints
- **Automated Analysis**: Validation and quality scoring using linguistic heuristics
- **Wizard Interface**: Guided construction with context-aware suggestions

### 📚 Prompt Library
- **Versioning**: Full history tracking with rollback (because your first draft is rarely your last)
- **Serialization**: JSON and Markdown export for portability
- **Multi-Dimensional Search**: Filter by domain, task taxonomy, register, format
- **Pagination**: Manages large collections efficiently
- **Examples**: Curated prompts demonstrating framework application

### 🤖 Multi-Provider Architecture
- **Anthropic**: claude-3-5-sonnet, claude-3-opus, claude-3-haiku
- **Google**: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash-exp
- **OpenAI**: gpt-4, gpt-4-turbo, gpt-3.5-turbo
- **Mistral**: mistral-large, mistral-medium, mistral-small
- **Credential Management**: Browser-only encryption (your keys never meet a server)

### 🔄 Visual Workflow Engine
- **Graph-Based Composition**: Build execution pipelines using [@xyflow/react](https://reactflow.dev/)
- **Node Types**:
  - Data ingestion (text, images, files)
  - LLM invocation (any configured provider)
  - Vision analysis
  - JavaScript transformation functions
  - Simulation nodes
  - Visualization outputs (Recharts)
- **DAG Execution**: Dependency-aware task scheduling
- **Sandboxed Runtime**: Isolated Web Worker + QuickJS-WASM (no eval, no arbitrary code execution)
- **Template Library**: Reference implementations for common patterns

### 🎙️ Live Assistant
- **Bidirectional Streaming**: Gemini Live API integration
- **Voice I/O**: Browser speech recognition + synthesis
- **Multi-Modal**: Text, images, file attachments

### 🔒 Security Model
- **Browser-Only Storage**: API keys remain in localStorage, encrypted
- **WASM Sandbox**: User code executes in QuickJS-WASM (no eval, no arbitrary execution)
- **Zero-Server Architecture**: Static SPA, all computation client-side

## Architecture

### Design Principles

**Browser-First**: Zero-server SPA. Computation, storage, and credentials live client-side. No backend. No transmission. LocalStorage only.

**Provider Abstraction**: Factory pattern unifies Claude, Gemini, GPT-4, and Mistral behind `IProvider` contract (Vercel AI SDK). Model selection cascades through configuration hierarchy.

**Workflow Engine**: DAG-based execution with dependency resolution. Tasks execute sequentially, respecting graph topology. Immutable data store. Tasks read inputs by reference.

**Security Model**: Two-tier isolation:
1. **Credential Layer**: Browser encryption (Web Crypto API) for API keys
2. **Execution Layer**: QuickJS-WASM sandbox for user code (no eval, no Node.js globals)

### Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **State**: Zustand (localStorage persistence)
- **AI SDKs**: Vercel AI SDK (unified interface), provider-specific SDKs (Anthropic, Google, OpenAI, Mistral)
- **Workflow**: @xyflow/react (React Flow v12)
- **Sandbox**: QuickJS-WASM
- **Validation**: Zod
- **Visualization**: Recharts
- **Routing**: React Router v6

## Prerequisites

- **Node.js** 18+ or compatible JavaScript runtime
- **API Keys** for at least one AI provider:
  - [Anthropic API Key](https://console.anthropic.com/)
  - [Google AI Studio API Key](https://aistudio.google.com/app/apikey)
  - [OpenAI API Key](https://platform.openai.com/api-keys)
  - [Mistral API Key](https://console.mistral.ai/)

## Installation

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd sfl-prompt-studio-v2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   ```
   http://localhost:5173
   ```

## Configuration

### API Keys

On first launch, navigate to Settings (⚙️ sidebar):

1. Enter API keys for desired providers
2. Keys encrypt to localStorage
3. Save validates and persists credentials

Keys never leave the browser. No server transmission.

### Model Selection

Provider/model selection cascades:
- Global defaults (Settings)
- Per-prompt overrides (prompt editor)
- Per-task overrides (workflow nodes)

## Guides

### Prompt Engineering Workflow

**Manual Construction**:
```
1. + New Prompt
2. Compose prompt text
3. Decompose into SFL components:
   Field    → domain, task taxonomy, keywords
   Tenor    → persona, audience, register
   Mode     → format, structure, constraints
4. Test → select provider/model → execute
5. Iterate based on output quality
6. Save to library
```

**Wizard-Assisted**:
```
1. ✨ Wizard
2. Describe objective in natural language
3. System generates SFL decomposition
4. Review/adjust components
5. Test → iterate → save
```

**Version Management**:
- Edits save new versions automatically
- Access history via prompt card
- Rollback preserves full SFL metadata

### Workflow Development

**Graph Construction**:
```
1. Prompt Lab (🧪) → + New Workflow
2. Drag node types from sidebar:
   - Data input (text/image/file)
   - Prompt (library or inline)
   - Transform (JS functions)
   - Visualization (charts)
3. Connect nodes → defines data flow
4. Configure each node:
   - Parameters
   - Input mappings (upstream outputs)
   - Output variable names
5. Save template
```

**Execution**:
```
1. Select workflow
2. Provide input data
3. Run → engine executes DAG
4. Data store receives results (accessible by node ID)
5. Inspect intermediate outputs
```

**Sandbox Execution**:
- Transform nodes run in QuickJS-WASM
- No Node.js modules, no eval
- Return serializable values only
- UI surfaces execution errors

### Testing Strategies

**Unit Testing** (Single Prompts):
- Prompt card → Test
- Select provider/model
- Inspect response quality
- Adjust SFL components based on failure modes

**Integration Testing** (Workflows):
- Execute complete pipeline
- Verify transformations at each node
- Confirm output format meets expectations
- Iterate node configurations

**Live Assistant**:
- Real-time conversational testing
- Voice I/O for rapid iteration
- Multi-modal input (images + text)
- Model switching mid-conversation

## Troubleshooting

**Redirected to Settings on launch**: Missing API keys. Add at least one provider credential.

**"Invalid API key" error**:
- Verify key format (provider console)
- Check key permissions
- Regenerate if stale

**Workflow execution hangs**:
- Check for circular dependencies
- Inspect nodes for missing inputs
- Review console for async errors

**Transform node fails**:
- QuickJS doesn't support Node.js modules
- Use vanilla ES2022 JavaScript only
- Return serializable data (no functions, no classes)

**Model not available**:
- Verify API key permissions
- Check provider's model availability in your region
- Some models require waitlist access

## Development

### Build for Production

```bash
npm run build  # → dist/
npm run preview  # test production build locally
```

### Project Structure

```
src/
├── components/          # React components
│   ├── forms/          # SFL form sections
│   ├── icons/          # Icon components
│   └── lab/            # Workflow engine UI
├── config/             # Model configurations
├── hooks/              # Custom React hooks
├── services/           # AI providers, workflow engine, validation
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utilities (storage, audio, export)
└── workers/            # Web Workers for code execution
```

## Recent Changes

- Web Worker/WASM sandbox migration (QuickJS replaces eval)
- @xyflow/react upgrade (React Flow v12)
- Prompt library pagination (performance optimization for large collections)
- Templating engine error handling improvements
- Centralized model configuration architecture
- Client-side credential encryption

## Contributing

Standard GitHub flow:

1. Fork → feature branch
2. Commit (conventional commits preferred)
3. Push → open PR
4. Survive review process

## License

[Add your license here]

## Acknowledgments

- **SFL Framework**: Linguistic theory foundation for structured prompt design
- **Vercel AI SDK**: Unified interface for multiple AI providers
- **React Flow**: Workflow visualization
- **QuickJS**: Secure JavaScript execution environment

