import Tesseract from 'tesseract.js';

// Worker pool for performance optimization
let worker: Tesseract.Worker | null = null;
let isWorkerInitializing = false;
let workerInitPromise: Promise<Tesseract.Worker> | null = null;

/**
 * Initialize Tesseract worker (singleton pattern)
 */
async function getWorker(): Promise<Tesseract.Worker> {
  if (worker) return worker;
  if (isWorkerInitializing && workerInitPromise) {
    return workerInitPromise;
  }

  isWorkerInitializing = true;
  workerInitPromise = Tesseract.createWorker('eng+chi_sim')
    .then(w => {
      worker = w;
      isWorkerInitializing = false;
      return w;
    })
    .catch(err => {
      isWorkerInitializing = false;
      workerInitPromise = null;
      throw err;
    });

  return workerInitPromise;
}

/**
 * Recognize text from image file
 * Reuses worker for better performance
 */
export async function recognizeImage(imageFile: File): Promise<string> {
  try {
    const w = await getWorker();
    const ret = await w.recognize(imageFile);
    return ret.data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to recognize text from image');
  }
}

/**
 * Terminate the worker (call when app is shutting down)
 */
export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    workerInitPromise = null;
    isWorkerInitializing = false;
  }
}

/**
 * Check if worker is ready
 */
export function isWorkerReady(): boolean {
  return worker !== null;
}

/**
 * Pre-warm the worker (call on app start)
 */
export async function warmupWorker(): Promise<void> {
  await getWorker();
}
