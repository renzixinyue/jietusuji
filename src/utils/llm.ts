import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedInfo } from "./extractor";

export interface AIAnalysisResult {
  summary: string;
  extractedInfo: ExtractedInfo;
}

export async function analyzeImageWithGemini(
  apiKey: string,
  base64Image: string,
  mimeType: string = "image/png"
): Promise<AIAnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Extract mimeType from base64 string if present (e.g. "data:image/jpeg;base64,...")
  let finalMimeType = mimeType;
  let base64Data = base64Image;

  if (base64Image.includes("data:") && base64Image.includes(";base64,")) {
    const matches = base64Image.match(/data:(.*?);base64,(.*)/);
    if (matches && matches.length === 3) {
      finalMimeType = matches[1];
      base64Data = matches[2];
    }
  } else {
    // If no prefix, assume base64Image is the raw data
    // and mimeType is passed as argument or default
    base64Data = base64Image;
  }

  const prompt = `
    Analyze this screenshot. 
    1. Summarize the main content in a concise paragraph.
    2. Extract the following structured data if available:
       - URLs
       - Email addresses
       - Key technical terms or keywords (max 5)
       - Important sentences or quotes
    3. Suggest a short, descriptive title for this note.
    
    Return the result in strictly valid JSON format like this:
    {
      "title": "Suggested Title",
      "summary": "The main content summary...",
      "urls": ["url1", "url2"],
      "emails": ["email1"],
      "keywords": ["keyword1", "keyword2"],
      "sentences": ["sentence1", "sentence2"]
    }
  `;

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: finalMimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Improved JSON parsing: find the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON found in response");
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    const data = JSON.parse(jsonString);

    return {
      summary: data.summary || "No summary available.",
      extractedInfo: {
        urls: data.urls || [],
        emails: data.emails || [],
        keywords: data.keywords || [],
        sentences: data.sentences || [],
        suggestedTitle: data.title || "AI Note",
      },
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
