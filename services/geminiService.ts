import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { LegalCase, CaseBrief } from "../types";

// Helper to get API key safely
const getApiKey = () => process.env.API_KEY || '';

// --- 1. Batch Extraction ---

export const extractCaseData = async (
  caseText: string, 
  sourceFileName: string,
  index: number
): Promise<LegalCase> => {
  if (!getApiKey()) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const extractionPrompt = `
    You are a legal expert processing a Myanmar court case extracted from a PDF.
    
    **CRITICAL ENCODING REPAIR TASK**:
    The input text usually contains **Zawgyi-One** or legacy font encoding which appears as **English Gibberish** (e.g., "rjyKvkyfcJhaMumif;?." or similar nonsense characters).
    
    **STEP 1: DECODE TO UNICODE**
    - You MUST identify this "pseudo-English" and **CONVERT** it entirely into **Standard Myanmar Unicode**.
    - If the text is already Unicode or standard English, keep it as is.
    - The field \`cleanedContent\` in the response MUST contain the fully converted, readable Unicode text of the case.
    
    **STEP 2: EXTRACT METADATA**
    From the *Converted Unicode Text*, extract the following:
    - Case Name (Full title)
    - Citation (e.g., "2020 MLR 150")
    - Court (e.g., "Supreme Court of the Union", "Yangon Region High Court")
    - Judges (List names)
    - Date (YYYY-MM-DD)
    - Summary (2-3 paragraphs in Myanmar Unicode)
    - Holding (Decision in Myanmar Unicode)
    - Legal Issues (List in Myanmar Unicode)
    - Parties (Plaintiff vs Defendant)

    **STEP 3: CATEGORIZATION (CRITICAL)**
    Analyze the legal issues and facts to classify the case into EXACTLY ONE of the following categories:
    - "Administrative" (Government, writ petitions, civil service)
    - "Land" (Farmland, inheritance of land, property disputes)
    - "Criminal" (Penal code offenses, narcotics, theft)
    - "Civil" (Contract, money disputes, torts)
    - "Family" (Divorce, inheritance, adoption)
    - "Constitutional" (Rights, interpretation of constitution)
    - "Corporate" (Company law, banking, trade)
    - "Maritime" (Admiralty, shipping)
    - "Labor" (Employment disputes)

    **Text to Analyze:**
    "${caseText.substring(0, 20000)}"
  `;

  // We use responseSchema to ensure strict JSON output matching our interface
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: extractionPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
          summary: { type: Type.STRING },
          holding: { type: Type.STRING },
          legalIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
          parties: {
            type: Type.OBJECT,
            properties: {
              plaintiff: { type: Type.STRING },
              defendant: { type: Type.STRING }
            }
          }
        },
        required: ["cleanedContent", "caseName", "citation", "court", "summary", "holding", "caseType"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");

  // Construct the full LegalCase object
  return {
    id: `case-${Date.now()}-${index}`,
    // CRITICAL: Use the AI-cleaned content if available, otherwise fallback to raw (but raw is likely garbage)
    content: data.cleanedContent || caseText,
    sourcePdfName: sourceFileName,
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 95, 
    headnotes: [], 
    ...data
  };
};

// --- 2. On-Demand Brief Generation ---

export const generateCaseBrief = async (caseText: string): Promise<CaseBrief> => {
  if (!getApiKey()) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const prompt = `
    Create a formal legal brief for this case.
    
    **INPUT WARNING**: The input text might be "Zawgyi/Pseudo-English" encoded. 
    1. First, treat the input as potentially encoded Myanmar text and decode it internally.
    2. Then generate the brief based on the decoded meaning.
    
    **OUTPUT REQUIREMENT**: The output MUST be in **Standard Myanmar Unicode**. 
    
    Format as JSON with fields: facts, issues, holding, reasoning, principles.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: prompt },
      { text: caseText.substring(0, 25000) }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          facts: { type: Type.STRING },
          issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          holding: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          principles: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

// --- 3. Chat / Legal Research ---

export const askLegalAssistant = async (query: string, currentCaseContext?: string) => {
  if (!getApiKey()) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const systemInstruction = `
    You are an expert Legal Research Assistant for Myanmar Law (Myanlex).
    
    **DATA HANDLING**: 
    The context provided might be in "Zawgyi/Pseudo-English" encoding (e.g. "rjyKvky...").
    You must intelligently decode this to understand the case facts before answering.
    
    **LANGUAGE INSTRUCTION**:
    - **ALL RESPONSES MUST BE IN BURMESE (Myanmar Language) - UNICODE ONLY.**
    
    Context:
    You answer questions based on Myanmar statutes, common law, and case precedents.
  `;

  const chat = ai.chats.create({
    model: "gemini-3-pro-preview", 
    config: { systemInstruction }
  });

  const msg = currentCaseContext 
    ? `Context Case (Warning: Potential Zawgyi Encoding): ${currentCaseContext.substring(0, 10000)}\n\nQuestion: ${query}`
    : query;

  const result = await chat.sendMessage({ message: msg });
  return result.text;
};
