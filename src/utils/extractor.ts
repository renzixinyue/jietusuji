export interface ExtractedInfo {
  urls: string[];
  emails: string[];
  keywords: string[];
  sentences: string[];
  suggestedTitle: string;
}

export function extractInfo(text: string): ExtractedInfo {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  
  const urls = text.match(urlRegex) || [];
  const emails = text.match(emailRegex) || [];
  
  // Simple sentence splitting by newline or punctuation
  const sentences = text.split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 5);

  // Keywords: Simple frequency analysis of words > 4 chars
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const freqMap: Record<string, number> = {};
  words.forEach(w => freqMap[w] = (freqMap[w] || 0) + 1);
  const keywords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  // Suggested Title: First sentence or top keyword
  let suggestedTitle = "New Note";
  if (sentences.length > 0) {
    suggestedTitle = sentences[0].substring(0, 30) + (sentences[0].length > 30 ? "..." : "");
  } else if (keywords.length > 0) {
    suggestedTitle = keywords.join(", ") + " Note";
  }

  return {
    urls,
    emails,
    keywords,
    sentences,
    suggestedTitle
  };
}
