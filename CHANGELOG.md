# Changelog

All notable changes to SFL Prompt Studio.

Format: [Keep a Changelog](https://keepachangelog.com/)
Versioning: [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Added

**Core Framework**
- SFL (Structured Format Language) prompt engineering framework
- Three-component architecture: Field, Tenor, Mode
- Automated SFL analysis and quality scoring
- Prompt wizard for guided construction

**Prompt Management**
- Version control with full history and rollback
- Client-side persistence (localStorage)
- Import/export (JSON, Markdown)
- Library pagination for large collections
- Auto-fix suggestions for prompt refinement

**AI Integration**
- Multi-provider architecture (Anthropic, Google, OpenAI, Mistral)
- Centralized model configuration
- Secure client-side API key storage (encrypted)
- Model discovery service
- Template engine with error handling

**Workflow Engine**
- Visual workflow editor (@xyflow/react v12)
- DAG-based execution with dependency resolution
- Multi-type uploads (text, images, files)
- QuickJS-WASM sandbox for code execution
- Data store for intermediate outputs
- Perlocutionary Effect Forecaster workflow example

**Live Assistant**
- Gemini Live API integration
- Voice I/O (speech recognition + synthesis)
- Multi-modal input support
- Real-time conversation streaming

**UI/UX**
- React 19 + TypeScript + Vite
- Zustand state management
- React Router v6 navigation
- Settings page for configuration
- Sidebar collapse functionality

### Changed

- Consolidated SFL and Gemini service logic
- Improved JSON parsing robustness and error handling
- Consolidated utility and provider architecture
- Migrated to dynamic API key configuration
- Completed API key architecture remediation

### Fixed

- Gemini JSON parsing edge cases
- Live Assistant callback stability (ref vs state)
- AI SDK package dependency conflicts
