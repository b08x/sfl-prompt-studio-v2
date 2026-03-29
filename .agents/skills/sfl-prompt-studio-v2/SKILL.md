```markdown
# sfl-prompt-studio-v2 Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns, coding conventions, and workflows for contributing to the `sfl-prompt-studio-v2` codebase. The project is a TypeScript application built with the Vite framework, focusing on prompt engineering, workflow management, and extensible UI components. You'll learn how to implement features, refactor architecture, enhance workflow and prompt functionality, and manage dependencies using established conventions and step-by-step processes.

---

## Coding Conventions

### File Naming

- Use **PascalCase** for all file names, including components and services.
  - Example: `PromptCard.tsx`, `SflService.ts`

### Imports

- Use **relative imports** for internal modules.
  - Example:
    ```typescript
    import PromptCard from '../components/PromptCard';
    ```

### Exports

- Use **default exports** for modules and components.
  - Example:
    ```typescript
    const PromptCard = () => { /* ... */ };
    export default PromptCard;
    ```

### Commit Messages

- Follow **Conventional Commits** with prefixes: `feat`, `refactor`, `fix`, `chore`.
  - Example: `feat: add prompt versioning support`

---

## Workflows

### Feature Development & Implementation

**Trigger:** When adding a new feature or major capability  
**Command:** `/new-feature`

1. Implement feature logic in relevant service or component files.
2. Update or create related UI components (e.g., in `src/components/` or `src/components/lab/`).
3. Update global state/store logic in `src/store/useStore.ts`.
4. Update or create utility functions in `src/utils/`.
5. Optionally update documentation (`README.md`, `CHANGELOG.md`, or in-code docs).

**Example:**
```typescript
// src/services/SflService.ts
export default function newFeatureLogic() {
  // Feature logic here
}

// src/components/NewFeatureComponent.tsx
import React from 'react';
const NewFeatureComponent = () => <div>New Feature</div>;
export default NewFeatureComponent;
```

---

### Refactor Service or Architecture

**Trigger:** When improving code organization, migrating to new patterns, or centralizing logic  
**Command:** `/refactor-service`

1. Move or consolidate service logic between files (e.g., `geminiService.ts` → `sflService.ts`).
2. Update all component and service imports to use the new structure.
3. Refactor state/store logic as needed.
4. Remove or deprecate legacy files.
5. Test and validate the new architecture.

**Example:**
```typescript
// Update import paths after moving service logic
import sflService from '../services/SflService';
```

---

### Add or Enhance Workflow Functionality

**Trigger:** When adding a new workflow type or improving workflow editing/execution  
**Command:** `/new-workflow`

1. Update or create workflow logic in `src/services/workflowEngine.ts` or `src/services/workflowService.ts`.
2. Update or create workflow UI components (e.g., `WorkflowCanvas.tsx`, `WorkflowEditorModal.tsx`).
3. Update constants or types to include new workflow definitions.
4. Update state/store as needed.

**Example:**
```typescript
// src/services/workflowEngine.ts
export default function addNewWorkflowType() {
  // Workflow logic here
}
```

---

### Add or Update Prompt Features

**Trigger:** When improving prompt management or adding prompt-related capabilities  
**Command:** `/update-prompt`

1. Update or create prompt-related UI components (`PromptCard.tsx`, `PromptFormModal.tsx`, etc.).
2. Update prompt logic in `src/services/sflService.ts` or `src/services/sflValidator.ts`.
3. Update types (`types.ts`) and constants as needed.
4. Update state/store logic.

**Example:**
```typescript
// src/components/PromptCard.tsx
const PromptCard = ({ prompt }) => <div>{prompt.title}</div>;
export default PromptCard;
```

---

### Dependency or SDK Upgrade

**Trigger:** When upgrading a library or migrating to a new SDK version  
**Command:** `/upgrade-sdk`

1. Update `package.json` and `package-lock.json` with new dependency versions.
2. Update imports and usage in affected components/services.
3. Test for compatibility and fix breaking changes.
4. Update documentation if needed.

**Example:**
```json
// package.json
"dependencies": {
  "some-sdk": "^2.0.0"
}
```
```typescript
// Update usage for new SDK version
import { newApi } from 'some-sdk';
```

---

## Testing Patterns

- Test files follow the pattern `*.test.*` (e.g., `PromptCard.test.tsx`).
- The specific testing framework is not specified, but typical usage would be with Jest or Vitest.
- Place test files alongside the modules they test or in a dedicated `__tests__` directory.

**Example:**
```typescript
// PromptCard.test.tsx
import { render } from '@testing-library/react';
import PromptCard from './PromptCard';

test('renders prompt title', () => {
  const { getByText } = render(<PromptCard prompt={{ title: 'Test' }} />);
  expect(getByText('Test')).toBeInTheDocument();
});
```

---

## Commands

| Command         | Purpose                                                 |
|-----------------|---------------------------------------------------------|
| /new-feature    | Start a new feature implementation workflow             |
| /refactor-service | Refactor or restructure service/architecture logic    |
| /new-workflow   | Add or enhance workflow-related functionality           |
| /update-prompt  | Add or update prompt management features                |
| /upgrade-sdk    | Upgrade dependencies or SDKs and update usage           |
```
