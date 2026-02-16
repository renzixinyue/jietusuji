export async function captionImageFromFile(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const mobilenetMod: any = await (import('@tensorflow-models/mobilenet') as any);
  const tfMod: any = await (import('@tensorflow/tfjs') as any);
  await tfMod.ready();
  const model = await mobilenetMod.load();
  const predictions = await model.classify(img);
  const top = (predictions as any[]).slice(0, 3).map(p => p.className);
  return top.length ? `Content detected: ${top.join(', ')}` : 'No content detected';
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for vision'));
    };
    img.src = url;
  });
}
