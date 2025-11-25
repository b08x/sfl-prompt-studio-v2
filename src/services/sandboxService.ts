
let iframe: HTMLIFrameElement | null = null;
let isLoaded = false;
const pendingIds: Record<string, { resolve: (val: any) => void; reject: (err: any) => void }> = {};
const queue: (() => void)[] = [];

const handleMessage = (event: MessageEvent) => {
    // Security: We only care about messages with an ID that matches one of our pending requests.
    if (!event.data || !event.data.id) return;
    
    const { id, result, error, success } = event.data;
    
    if (pendingIds[id]) {
        if (success) {
            pendingIds[id].resolve(result);
        } else {
            pendingIds[id].reject(new Error(error));
        }
        delete pendingIds[id];
    }
};

const init = () => {
    if (iframe) return;
    
    iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    // sandbox="allow-scripts" enables JS execution.
    // OMITTING "allow-same-origin" puts the iframe in a unique origin, preventing access to parent DOM/Cookies.
    iframe.setAttribute('sandbox', 'allow-scripts');
    
    const html = `
    <!DOCTYPE html>
    <html>
    <body>
    <script>
        window.addEventListener('message', (event) => {
            const { id, code, inputs } = event.data;
            try {
                // The code is executed within this isolated context.
                // We treat the code as the body of a function that takes 'inputs'.
                const func = new Function('inputs', code);
                const result = func(inputs);
                
                event.source.postMessage({ id, result, success: true }, '*');
            } catch (error) {
                event.source.postMessage({ id, error: error.message, success: false }, '*');
            }
        });
    </script>
    </body>
    </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
    
    iframe.onload = () => {
        isLoaded = true;
        // Flush any queued requests that happened before load
        queue.forEach(sendFn => sendFn());
        queue.length = 0;
    };
    
    document.body.appendChild(iframe);
    window.addEventListener('message', handleMessage);
};

export const runSafeCode = (code: string, inputs: Record<string, any>): Promise<any> => {
    if (!iframe) init();
    
    return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        pendingIds[id] = { resolve, reject };
        
        const payload = { id, code, inputs };
        const send = () => {
             iframe?.contentWindow?.postMessage(payload, '*');
        };
        
        if (isLoaded) {
            send();
        } else {
            queue.push(send);
        }
        
        // 5-second timeout to prevent infinite loops or hangs
        setTimeout(() => {
            if (pendingIds[id]) {
                delete pendingIds[id];
                reject(new Error("Execution timed out (5s limit)"));
            }
        }, 5000);
    });
};