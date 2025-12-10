/**
 * Handles PDF text extraction and Case Splitting.
 * Uses PDF.js for binary PDF parsing and regex heuristics for splitting.
 */

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// 1. Read PDF Binary and Extract Text
export const readPdfFile = async (file: File): Promise<string> => {
  if (!window.pdfjsLib) {
    console.error("PDF.js library not loaded in index.html");
    throw new Error("PDF parser not initialized. Please refresh or check connection.");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Load the PDF document
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    // Iterate through all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text items and join them with spaces
      // Note: PDF text extraction can sometimes be messy with whitespace
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      fullText += pageText + "\n\n";
    }
    return fullText;
  } catch (error) {
    console.error("PDF Parse Error:", error);
    throw new Error("Failed to parse PDF file. Ensure it is a valid PDF.");
  }
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// 2. Intelligent Case Splitting
export const detectAndSplitCases = async (fullText: string): Promise<string[]> => {
  // Normalize text: remove excessive newlines and page breaks
  const normalized = fullText
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n\n')
    // Fix common PDF extraction artifact where letters are spaced out (e.g., "C a s e  N o")
    // This is hard to do perfectly without AI, but we can do basic cleanup
    .replace(/\s{2,}/g, ' ');

  // Heuristic patterns to identify the START of a new case.
  // We include both English and Myanmar standard headers.
  // 1. "Case No" / "Civil Appeal No"
  // 2. "Judgement" / "Order" headers if they appear as titles
  // 3. "အမှုနံပါတ်" (Case No)
  // 4. "တရားမ" (Civil) / "ရာဇဝတ်" (Criminal) followed by Case/Suit
  
  // ZAWGYI/ASCII PATTERNS:
  // "အမှု" (Case) often maps to "rjyKR" or "rjy" 
  // "နံပါတ်" (No) often maps to "eHygwf" or "kHygwf"
  // "တရားမ" (Civil) often maps to "w&m;r"
  
  const caseStartRegex = /(?:Case\s+(?:No|Number)|[A-Z][a-z]+\s+Appeal\s+No|Reg\.\s+No\.|အမှုနံပါတ်|တရားမ(?:ကြီး)?မှု|ရာဇဝတ်(?:ကြီး)?မှု|ပြည်ထောင်စုတရားလွှတ်တော်ချုပ်|rjy.*?kH|w&m;r.*?rjy)/gi;
  
  const matches = [...normalized.matchAll(caseStartRegex)];
  
  let cases: string[] = [];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      // The end of this case is the start of the next case, or the end of the file
      const end = matches[i + 1] ? matches[i + 1].index : normalized.length;
      
      if (start !== undefined) {
        // We include a buffer before the match index if possible.
        // Let's assume the match is the *anchor* of the case.
        // We will grab the text chunk.
        const chunk = normalized.substring(start, end).trim();
        
        // Filter out tiny chunks (noise/page numbers)
        if (chunk.length > 300) {
          cases.push(chunk);
        }
      }
    }
  }

  // If regex failed to find multiple cases (or only found 1 match which implies 1 case found via regex), 
  // check if we should just return the whole text.
  if (cases.length === 0) {
    // No matches found, treat whole file as one case
    return [normalized];
  }

  return cases;
};