/**
 * Web Worker for secure code execution using QuickJS WASM
 *
 * This worker provides true sandboxed JavaScript execution:
 * - Runs off the main thread (non-blocking UI)
 * - Isolated from browser APIs
 * - Can be terminated on timeout (kills infinite loops)
 * - No access to DOM, localStorage, cookies, etc.
 */

import { getQuickJS } from 'quickjs-emscripten';

interface ExecutionMessage {
  id: string;
  code: string;
  inputs: Record<string, any>;
}

interface ExecutionResult {
  id: string;
  result?: any;
  error?: string;
  success: boolean;
}

/**
 * Execute user code in QuickJS WASM runtime
 */
async function executeCode(message: ExecutionMessage): Promise<ExecutionResult> {
  const { id, code, inputs } = message;

  try {
    // Initialize QuickJS runtime
    const QuickJS = await getQuickJS();
    const vm = QuickJS.newContext();

    try {
      // Create a safe function that wraps the user code
      // The code is treated as the body of a function that takes 'inputs'
      const wrappedCode = `
        (function(inputs) {
          ${code}
        })
      `;

      // Evaluate the function definition
      const fnHandle = vm.evalCode(wrappedCode);

      if (fnHandle.error) {
        const error = vm.dump(fnHandle.error);
        fnHandle.error.dispose();
        return {
          id,
          error: `Code compilation error: ${error}`,
          success: false,
        };
      }

      // Convert inputs to QuickJS values
      const inputsHandle = vm.newObject();
      for (const [key, value] of Object.entries(inputs)) {
        const valueHandle = vm.newNumber(
          typeof value === 'number' ? value :
          typeof value === 'string' ? value.length :
          0
        );
        vm.setProp(inputsHandle, key, valueHandle);
        valueHandle.dispose();
      }

      // Call the function with inputs
      const resultHandle = vm.callFunction(fnHandle.value, vm.undefined, inputsHandle);

      // Clean up handles
      fnHandle.value.dispose();
      inputsHandle.dispose();

      if (resultHandle.error) {
        const error = vm.dump(resultHandle.error);
        resultHandle.error.dispose();
        return {
          id,
          error: `Runtime error: ${error}`,
          success: false,
        };
      }

      // Extract and return result
      const result = vm.dump(resultHandle.value);
      resultHandle.value.dispose();

      return {
        id,
        result,
        success: true,
      };
    } finally {
      // Always dispose of the VM
      vm.dispose();
    }
  } catch (error: any) {
    return {
      id,
      error: `Sandbox error: ${error.message}`,
      success: false,
    };
  }
}

/**
 * Worker message handler
 */
self.addEventListener('message', async (event: MessageEvent<ExecutionMessage>) => {
  const message = event.data;

  // Execute code and send result back to main thread
  const result = await executeCode(message);
  self.postMessage(result);
});

// Signal that worker is ready
self.postMessage({ type: 'ready' });
