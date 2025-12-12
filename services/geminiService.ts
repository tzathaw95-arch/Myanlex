
import { GoogleGenAI, Type, GenerateContentResponse, Part } from "@google/genai";
import { LegalCase, CaseBrief, CitationStatus } from "../types";

// Helper to get API key safely
const getApiKey = () => process.env.API_KEY || '';

// --- RETRY LOGIC HANDLER ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 5, 
  initialDelay: number = 5000
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      // Check for 429 (Too Many Requests) or Resource Exhausted errors
      const isRateLimit = 
        error?.status === 429 || 
        error?.response?.status === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('quota') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (retries < maxRetries && isRateLimit) {
        retries++;
        // If it's a rate limit, use a much aggressive backoff (30s minimum + exponential)
        // Free tier often needs ~60s to reset the counter.
        const baseWait = 30000; 
        const delay = baseWait + (initialDelay * Math.pow(2, retries - 1)); 
        
        console.warn(`⚠️ API Rate Limit hit. Pausing for ${Math.round(delay/1000)}s before retry ${retries}/${maxRetries}...`);
        await wait(delay);
      } else if (retries < 3 && !isRateLimit) {
         // Standard retry for other transient errors (500s, network)
         retries++;
         const delay = 2000 * retries;
         console.warn(`⚠️ Transient Error. Retrying in ${delay}ms...`);
         await wait(delay);
      } else {
        throw error;
      }
    }
  }
}

// --- 1. Batch Extraction & Briefing (TEXT OR VISION) ---

// Schema definition used for both text and image extraction
const CASE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    cleanedContent: { type: Type.STRING, description: "The full case text converted to Standard Myanmar Unicode." },
    caseName: { type: Type.STRING },
    caseNameEnglish: { type: Type.STRING },
    citation: { type: Type.STRING },
    court: { type: Type.STRING },
    judges: { type: Type.ARRAY, items: { type: Type.STRING } },
    date: { type: Type.STRING, description: "YYYY-MM-DD format if possible" },
    caseType: { 
       type: Type.STRING, 
       description: "Must be one of: Administrative, Land, Criminal, Civil, Family, Constitutional, Corporate, Maritime, Labor" 
    },
    status: {
      type: Type.STRING,
      enum: ["GOOD_LAW", "OVERRULED", "DISTINGUISHED", "CAUTION"]
    },
    summary: { type: Type.STRING, description: "Short summary for search results" },
    brief: {
       type: Type.OBJECT,
       properties: {
          facts: { type: Type.STRING },
          issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          holding: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          principles: { type: Type.ARRAY, items: { type: Type.STRING } }
       },
       required: ["facts", "issues", "holding", "reasoning", "principles"]
    },
    parties: {
      type: Type.OBJECT,
      properties: {
        plaintiff: { type: Type.STRING },
        defendant: { type: Type.STRING }
      }
    }
  },
  required: ["cleanedContent", "caseName", "citation", "court", "summary", "brief", "caseType", "status"]
};

// TEXT BASED
export const extractCaseData = async (
  caseText: string, 
  sourceFileName: string,
  index: number
): Promise<LegalCase> => {
  if (!getApiKey()) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const extractionPrompt = `
    You are a legal expert processing a Myanmar court case.
    
    **TASK 1: DECODE & CLEAN**
    - The input usually contains **Zawgyi-One** encoding (appears as English gibberish).
    - Convert ALL text to **Standard Myanmar Unicode**.
    
    **TASK 2: METADATA EXTRACTION**
    - Extract Case Name, Citation, Court, Judges, Date, Parties.
    - Classify Category (Civil, Criminal, etc.).
    
    **TASK 3: BRIEF**
    - Generate comprehensive legal brief.

    **Text to Analyze:**
    "${caseText.substring(0, 25000)}" 
  `;

  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash", 
    contents: extractionPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: CASE_SCHEMA
    }
  }));

  const data = JSON.parse(response.text || "{}");

  return {
    id: `case-${Date.now()}-${index}`,
    content: data.cleanedContent || caseText,
    sourcePdfName: sourceFileName,
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 95, 
    headnotes: [],
    holding: data.brief?.holding || "", 
    legalIssues: data.brief?.issues || [],
    status: data.status || 'GOOD_LAW', 
    ...data
  };
};

// VISION BASED (New Feature)
export const extractCaseFromImages = async (
  base64Images: string[], 
  sourceFileName: string
): Promise<LegalCase[]> => {
  if (!getApiKey()) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const imageParts: Part[] = base64Images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img
    }
  }));

  const textPart: Part = {
    text: `
      You are a Visual Legal OCR Engine.
      The images provided are pages of a Myanmar Court Judgment.
      
      1. **OCR & TRANSLITERATE**: Read the visual text. It may be in standard Myanmar font or old typewriters.
      2. **STRUCTURE**: Extract the legal case data.
      3. **OUTPUT**: Return a JSON ARRAY of cases found (usually just 1, but maybe multiple).
      
      Ensure "cleanedContent" contains the FULL text you read from the images, converted to clean Unicode.
    `
  };

  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash", // Flash supports vision and is cost effective
    contents: { parts: [...imageParts, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: CASE_SCHEMA
      }
    }
  }));

  const rawData = JSON.parse(response.text || "[]");
  
  // Map raw JSON to LegalCase Objects
  return rawData.map((data: any, idx: number) => ({
    id: `case-vis-${Date.now()}-${idx}`,
    content: data.cleanedContent || "Text extracted from image.",
    sourcePdfName: sourceFileName,
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 90, 
    headnotes: [],
    holding: data.brief?.holding || "", 
    legalIssues: data.brief?.issues || [],
    status: data.status || 'GOOD_LAW', 
    ...data
  }));
};

// --- 2. Batch Citation Network Analysis ---

export const analyzeCitationNetwork = async (cases: LegalCase[]): Promise<{ id: string, status: CitationStatus }[]> => {
  if (!getApiKey()) throw new Error("API Key missing");

  // Prepare a condensed list of cases for the model to analyze context
  const condensedCases = cases.map(c => ({
    id: c.id,
    citation: c.citation,
    caseName: c.caseName,
    holding: c.holding.substring(0, 500), // Limit length
    year: c.date.substring(0, 4)
  }));

  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const prompt = `
    You are a "Shepardizing" Engine (Citation Analysis) for a database of Myanmar Law.
    Review the provided list of cases and determine the Citation Status of each.
    Return JSON array of {id, status}.
    Input Data: ${JSON.stringify(condensedCases)}
  `;

  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-3-pro-preview", 
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            status: { 
              type: Type.STRING, 
              enum: ["GOOD_LAW", "OVERRULED", "DISTINGUISHED", "CAUTION"] 
            }
          },
          required: ["id", "status"]
        }
      }
    }
  }));

  return JSON.parse(response.text || "[]");
};

// --- 3. Chat / Legal Research ---

export const askLegalAssistant = async (query: string, currentCaseContext?: string) => {
  if (!getApiKey()) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const systemInstruction = `
    You are an expert Legal Research Assistant for Myanmar Law (Myanlex).
    ALL RESPONSES MUST BE IN BURMESE (Myanmar Language) - UNICODE ONLY.
  `;

  const chat = ai.chats.create({
    model: "gemini-3-pro-preview", 
    config: { systemInstruction }
  });

  const msg = currentCaseContext 
    ? `Context Case: ${currentCaseContext.substring(0, 15000)}\n\nQuestion: ${query}`
    : query;

  const result = await retryWithBackoff<GenerateContentResponse>(() => chat.sendMessage({ message: msg }));
  return result.text;
};

// --- 4. Multi-Case Comparative Analysis ---

export type AnalysisMode = 'POINTS' | 'CONTRADICTIONS' | 'SIMILARITY' | 'CUSTOM';

export const analyzeMultipleCases = async (cases: LegalCase[], mode: AnalysisMode, customPrompt?: string): Promise<string> => {
    if (!getApiKey()) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const inputData = cases.map((c, i) => `
    --- CASE ${i + 1} ---
    Name: ${c.caseName} (${c.citation})
    Year: ${c.date}
    Court: ${c.court}
    Summary: ${c.summary}
    Holding: ${c.holding}
    Reasoning: ${c.brief?.reasoning || c.content.substring(0, 8000)}
    `).join('\n\n');

    let specificInstruction = "";
    if (mode === 'POINTS') specificInstruction = "Synthesize the KEY LEGAL POINTS.";
    else if (mode === 'CONTRADICTIONS') specificInstruction = "Identify CONTRADICTIONS or OVERRULINGS.";
    else if (mode === 'SIMILARITY') specificInstruction = "Identify COMMON PRINCIPLES.";
    else if (mode === 'CUSTOM') specificInstruction = customPrompt || "Analyze these cases.";

    const systemInstruction = `
      You are a Senior Legal Analyst. Output in BURMESE (Unicode).
      Task: ${specificInstruction}
    `;

    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-3-pro-preview", 
        contents: `Analyze:\n${inputData}`,
        config: { systemInstruction }
    }));

    return response.text || "Analysis failed.";
};
