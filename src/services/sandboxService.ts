/**
 * Secure Code Execution Sandbox Service (Web Worker + WASM)
 *
 * This service provides safe execution of user-provided JavaScript code:
 * - Runs off the main thread (prevents UI freezing)
 * - True isolation via QuickJS WASM runtime
 * - No access to browser APIs (DOM, localStorage, fetch, etc.)
 * - Effective timeout mechanism via Worker termination
 * - Kills infinite loops without blocking UI
 *
 * Security guarantees:
 * ✓ Code executes in isolated WASM environment
 * ✓ No access to window, document, or global scope
 * ✓ Worker can be terminated on timeout
 * ✓ Prevents malicious code from accessing user data
 */

// Worker instance and state management
let worker: Worker | null = null;
let isReady = false;
const pendingRequests: Record<
  string,
  {
    resolve: (val: any) => void;
    reject: (err: any) => void;
    timeoutId: NodeJS.Timeout;
    workerId: number; // Track which worker instance this belongs to
  }
> = {};
const queue: (() => void)[] = [];
let workerIdCounter = 0;
let currentWorkerId = 0;

/**
 * Handle messages from the worker
 */
const handleMessage = (event: MessageEvent) => {
  const data = event.data;

  // Handle worker ready signal
  if (data.type === 'ready') {
    isReady = true;
    // Flush queued requests
    queue.forEach((sendFn) => sendFn());
    queue.length = 0;
    return;
  }

  // Handle execution results
  const { id, result, error, success } = data;

  if (!id || !pendingRequests[id]) return;

  const pending = pendingRequests[id];

  // Clear timeout
  clearTimeout(pending.timeoutId);

  // Resolve or reject
  if (success) {
    pending.resolve(result);
  } else {
    pending.reject(new Error(error || 'Unknown execution error'));
  }

  // Clean up
  delete pendingRequests[id];
};

/**
 * Initialize or reinitialize the worker
 */
const initWorker = () => {
  // Terminate existing worker if any
  if (worker) {
    worker.terminate();
  }

  // Create new worker
  try {
    worker = new Worker(
      new URL('../workers/codeExecutor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    currentWorkerId = ++workerIdCounter;
    isReady = false;

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', (error) => {
      console.error('Worker error:', error);
      isReady = false;
    });
  } catch (error) {
    console.error('Failed to create worker:', error);
    throw new Error('Sandbox initialization failed');
  }
};

/**
 * Execute code safely in the Web Worker sandbox
 *
 * @param code - JavaScript code to execute (function body)
 * @param inputs - Input data available to the code
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves with the execution result
 *
 * @example
 * const result = await runSafeCode(
 *   "return inputs.a + inputs.b;",
 *   { a: 5, b: 10 }
 * );
 * // result === 15
 */
export const runSafeCode = (
  code: string,
  inputs: Record<string, any>,
  timeoutMs: number = 5000
): Promise<any> => {
  // Initialize worker if needed
  if (!worker) {
    initWorker();
  }

  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const requestWorkerId = currentWorkerId;

    // Setup timeout that terminates the worker on infinite loops
    const timeoutId = setTimeout(() => {
      if (pendingRequests[id]) {
        // Terminate the worker to kill any infinite loops
        if (worker && requestWorkerId === currentWorkerId) {
          worker.terminate();
          worker = null;
          isReady = false;

          // Reinitialize for future requests
          initWorker();
        }

        // Reject all pending requests from the terminated worker
        Object.keys(pendingRequests).forEach((pendingId) => {
          const pending = pendingRequests[pendingId];
          if (pending.workerId === requestWorkerId) {
            clearTimeout(pending.timeoutId);
            pending.reject(
              new Error(`Execution timed out (${timeoutMs}ms limit)`)
            );
            delete pendingRequests[pendingId];
          }
        });
      }
    }, timeoutMs);

    // Store the pending request
    pendingRequests[id] = {
      resolve,
      reject,
      timeoutId,
      workerId: requestWorkerId,
    };

    // Send message to worker
    const payload = { id, code, inputs };
    const send = () => {
      worker?.postMessage(payload);
    };

    if (isReady) {
      send();
    } else {
      queue.push(send);
    }
  });
};

/**
 * Cleanup: Terminate the worker when no longer needed
 * (Call this when unmounting or when sandbox service is no longer needed)
 */
export const cleanup = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    isReady = false;
  }

  // Reject all pending requests
  Object.values(pendingRequests).forEach((pending) => {
    clearTimeout(pending.timeoutId);
    pending.reject(new Error('Sandbox service shutting down'));
  });

  Object.keys(pendingRequests).forEach((id) => {
    delete pendingRequests[id];
  });

  queue.length = 0;
};
