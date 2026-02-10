# SFL Prompt Studio v2 - Refactoring Plan

**Generated:** 2026-02-09
**Source:** backlog.json
**Total Tasks:** 5
**Estimated Duration:** 4-6 hours

---

## Executive Summary

This refactoring plan addresses critical improvements across Security, Architecture, Maintenance, Reliability, and Performance. Tasks are ordered by risk level and dependencies, starting with low-impact architectural improvements and progressing to higher-risk security migrations.

### Priority Distribution
- **High Priority:** 1 task (SEC-001)
- **Medium Priority:** 2 tasks (ARCH-001, MAINT-001)
- **Low Priority:** 2 tasks (REL-001, PERF-001)

---

## Task Execution Order

### Phase 1: Architecture Foundation (Low Risk)
**Estimated Time:** 45 minutes

#### ✅ Task 1: ARCH-001 - Centralize AI Model Configuration
**Status:** Pending
**Priority:** Medium
**Risk Level:** ⚠️ Low
**Dependencies:** None

**Current State:**
- Model string `'gemini-2.5-flash'` hardcoded in 9 locations:
  - `GeminiProvider.ts` (5 occurrences: lines 19, 38, 45, 57, 74)
  - `validationService.ts` (1 occurrence: line 45)
  - `constants.ts` (4 occurrences: lines 179, 190, 229, 240, 279, 290)
  - `useStore.ts` (1 occurrence: line 123)

**Target State:**
- Single source of truth in `src/config/models.ts`
- Runtime configuration through store

**Implementation Steps:**
1. Create `src/config/models.ts` with model constants
2. Update `GeminiProvider.ts` to use `config?.model || DEFAULT_GEMINI_MODEL`
3. Update `validationService.ts` imports
4. Update `constants.ts` DEFAULT_WORKFLOWS to reference constants
5. Update `useStore.ts` to use centralized constant
6. Add runtime model field to AppConstants

**Files Modified:**
- ✨ NEW: `src/config/models.ts`
- 📝 EDIT: `src/services/providers/GeminiProvider.ts`
- 📝 EDIT: `src/services/validationService.ts`
- 📝 EDIT: `src/constants.ts`
- 📝 EDIT: `src/types/ai.ts`
- 📝 EDIT: `src/store/useStore.ts`

**Testing:**
- Verify all API calls use correct model
- Test model switching via settings
- Validate workflows execute with configured model

**Rollback:** Simple - revert imports to hardcoded strings

---

### Phase 2: Reliability Enhancement (Low Risk)
**Estimated Time:** 30 minutes

#### ✅ Task 2: REL-001 - Implement Robust Templating Engine
**Status:** Pending
**Priority:** Low
**Risk Level:** ⚠️ Low-Medium
**Dependencies:** None

**Current State:**
- Simple regex-based templating in `workflowEngine.ts` (lines 13-26)
- No nested object support
- Poor error handling for missing keys
- Fails on complex data structures

**Target State:**
- Lightweight templating library (mustache/eta recommended)
- Graceful handling of null/undefined
- Support for nested objects (e.g., `{{user.address.city}}`)

**Implementation Steps:**
1. Install `eta` (smallest footprint: ~3KB)
2. Create new `templateString` implementation
3. Add unit tests for nested objects
4. Update `executeTask` to use new engine
5. Test with existing workflows

**Files Modified:**
- 📝 EDIT: `package.json`
- 📝 EDIT: `src/services/workflowEngine.ts`

**Testing:**
- Test simple variable replacement
- Test nested object paths
- Test missing key handling
- Test null/undefined values
- Verify all 4 default workflows still work

**Rollback:** Keep old `templateString` as `templateStringLegacy` until verified

---

### Phase 3: Performance Optimization (Medium Risk)
**Estimated Time:** 1 hour

#### ✅ Task 3: PERF-001 - Implement Prompt Library Pagination
**Status:** Pending
**Priority:** Low
**Risk Level:** ⚠️⚠️ Medium
**Dependencies:** None

**Current State:**
- `useStore.init()` loads ALL prompts synchronously (line 131)
- `storage.getAllPrompts()` returns entire array (line 38)
- No pagination state management
- Will cause UI lag with 100+ prompts

**Target State:**
- Lazy loading with pagination
- Initial load: 20-50 prompts
- Infinite scroll or "Load More" button
- Pagination state in store

**Implementation Steps:**
1. Add pagination state to `useStore` interface:
   ```ts
   pagination: { currentPage: number; pageSize: number; totalItems: number }
   loadMorePrompts: () => void
   ```
2. Update `storage.getAllPrompts()` to accept `page` and `limit` parameters
3. Modify `init()` to load only first page
4. Update `PromptList.tsx` with infinite scroll or Load More button
5. Implement `loadMorePrompts` action

**Files Modified:**
- 📝 EDIT: `src/store/useStore.ts`
- 📝 EDIT: `src/utils/storage.ts`
- 📝 EDIT: `src/components/PromptList.tsx`

**Testing:**
- Test initial load (20 prompts)
- Test pagination loading
- Test with empty library
- Test with 100+ prompts
- Verify search/filter works with pagination

**Rollback:** Moderate complexity - requires database migration strategy

---

### Phase 4: Dependency Upgrade (High Risk)
**Estimated Time:** 45 minutes

#### ✅ Task 4: MAINT-001 - Migrate to @xyflow/react (React Flow v12)
**Status:** Pending
**Priority:** Medium
**Risk Level:** ⚠️⚠️⚠️ High
**Dependencies:** None

**Current State:**
- Using `reactflow` v11.10.4 (maintenance mode)
- Will lose support and React 19 compatibility

**Target State:**
- Using `@xyflow/react` v12 (active development)
- Full React 19 compatibility
- Long-term support

**Implementation Steps:**
1. Uninstall `reactflow`: `npm uninstall reactflow`
2. Install `@xyflow/react`: `npm install @xyflow/react`
3. Update imports in all files:
   - `WorkflowCanvas.tsx`
   - `TaskNode.tsx`
   - `modals/WorkflowEditorModal.tsx`
4. Update CSS import path (check v12 docs)
5. Verify Node and Edge type definitions
6. Test all canvas interactions

**Files Modified:**
- 📝 EDIT: `package.json`
- 📝 EDIT: `src/components/lab/WorkflowCanvas.tsx`
- 📝 EDIT: `src/components/lab/TaskNode.tsx`
- 📝 EDIT: `src/components/lab/modals/WorkflowEditorModal.tsx`

**Testing:**
- Verify workflow canvas renders
- Test node dragging
- Test zooming and panning
- Test edge connections
- Test workflow execution
- Visual regression testing

**Migration Guide:** https://reactflow.dev/learn/migration-guides/v11-to-v12

**Rollback:** High risk - requires package.json restore and npm install

---

### Phase 5: Security Hardening (Highest Risk)
**Estimated Time:** 2-3 hours

#### ✅ Task 5: SEC-001 - Migrate Sandbox Service to Web Worker/WASM
**Status:** Pending
**Priority:** High
**Risk Level:** ⚠️⚠️⚠️⚠️ Critical
**Dependencies:** None (but should be done last)

**Current State:**
- Uses hidden iframe with `allow-scripts` (sandboxService.ts)
- Executes code with `new Function()` on main thread
- Can freeze UI with infinite loops
- Security risk from direct browser API access

**Target State:**
- Web Worker for off-thread execution
- WASM-based JavaScript runtime (quickjs-emscripten)
- Completely isolated from browser APIs
- Effective timeout mechanism via Worker termination

**Implementation Steps:**
1. Install dependencies:
   ```bash
   npm install quickjs-emscripten
   ```
2. Create `src/workers/codeExecutor.worker.ts`:
   - Initialize QuickJS WASM runtime
   - Handle postMessage communication
   - Implement timeout termination
3. Refactor `sandboxService.ts`:
   - Replace iframe with Worker instantiation
   - Update `runSafeCode` to use Worker postMessage
   - Implement Worker termination on timeout
4. Remove legacy iframe implementation
5. Update `workflowEngine.ts` imports

**Files Modified:**
- ✨ NEW: `src/workers/codeExecutor.worker.ts`
- 📝 EDIT: `src/services/sandboxService.ts`
- 📝 EDIT: `src/services/workflowEngine.ts`
- 📝 EDIT: `package.json`

**Testing:**
- Test basic code execution
- Test timeout mechanism (infinite loop)
- Test multiple concurrent executions
- Test error handling
- Verify no UI freezing
- Security audit: verify API isolation

**Security Checklist:**
- ✅ Code runs off main thread
- ✅ No access to browser APIs
- ✅ Timeout kills Worker instance
- ✅ No eval/Function constructors in Worker
- ✅ Proper error boundaries

**Rollback:** High complexity - requires full Worker removal and iframe restoration

---

## Risk Matrix

| Task | Risk Level | Impact | Reversibility | Recommended Order |
|------|-----------|--------|---------------|-------------------|
| ARCH-001 | Low | High | Easy | 1st |
| REL-001 | Low-Medium | Medium | Easy | 2nd |
| PERF-001 | Medium | Medium | Moderate | 3rd |
| MAINT-001 | High | High | Difficult | 4th |
| SEC-001 | Critical | Critical | Difficult | 5th |

---

## Git Checkpoint Strategy

**Before Each Phase:**
```bash
git add .
git commit -m "checkpoint: before [TASK-ID]"
```

**After Each Phase:**
```bash
git add .
git commit -m "feat: [TASK-ID] - [brief description]"
npm run build # verify no build errors
```

---

## Success Criteria

### Phase 1 Complete (ARCH-001)
- ✅ All model references use centralized constants
- ✅ No hardcoded model strings remain
- ✅ Workflows execute successfully
- ✅ Settings allow model configuration

### Phase 2 Complete (REL-001)
- ✅ Nested object templating works
- ✅ Missing keys handled gracefully
- ✅ All default workflows still function
- ✅ No template-related errors in console

### Phase 3 Complete (PERF-001)
- ✅ Initial load shows only first page
- ✅ Pagination controls work correctly
- ✅ Search/filter compatible with pagination
- ✅ No performance regression

### Phase 4 Complete (MAINT-001)
- ✅ No build errors
- ✅ Workflow canvas renders correctly
- ✅ All interactions (drag, zoom, pan) work
- ✅ No TypeScript errors

### Phase 5 Complete (SEC-001)
- ✅ Code executes off main thread
- ✅ UI remains responsive during execution
- ✅ Infinite loops terminate correctly
- ✅ No security vulnerabilities
- ✅ Legacy iframe code removed

---

## Estimated Timeline

| Phase | Task | Duration | Cumulative |
|-------|------|----------|------------|
| 1 | ARCH-001 | 45 min | 45 min |
| 2 | REL-001 | 30 min | 1h 15min |
| 3 | PERF-001 | 1 hour | 2h 15min |
| 4 | MAINT-001 | 45 min | 3h |
| 5 | SEC-001 | 2-3 hours | 5-6h |

**Total Estimated Time:** 5-6 hours

---

## Notes

- All tasks are independent and can be executed sequentially
- Testing after each phase is mandatory
- Git checkpoints before and after each phase
- Build verification after each task
- User acceptance testing recommended after Phase 5

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Get approval** - Proceed only after explicit confirmation
3. **Execute Phase 1** - Start with low-risk architectural improvements
4. **Validate incrementally** - Test after each phase
5. **Monitor and adjust** - Update plan if issues arise
