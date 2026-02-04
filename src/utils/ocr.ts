import Tesseract from 'tesseract.js';

export async function recognizeImage(imageFile: File): Promise<string> {
  // Create a worker
  const worker = await Tesseract.createWorker('eng+chi_sim'); // Support English and Simplified Chinese
  
  const ret = await worker.recognize(imageFile);
  const text = ret.data.text;
  
  await worker.terminate();
  return text;
}
