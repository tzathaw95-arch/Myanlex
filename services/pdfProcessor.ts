
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

// NEW: Convert PDF pages to Images for Vision OCR
export const convertPdfToImages = async (file: File, maxPages: number = 10): Promise<string[]> => {
  if (!window.pdfjsLib) throw new Error("PDF.js not loaded");
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];
  
  // Limit pages to prevent payload explosion (handle first 10 pages for case extraction)
  const pagesToProcess = Math.min(pdf.numPages, maxPages);

  for (let i = 1; i <= pagesToProcess; i++) {
    const page = await pdf.getPage(i);
    // Scale 1.5 is a good balance between OCR quality and size
    const viewport = page.getViewport({ scale: 1.5 }); 
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    // Convert to JPEG base64 (0.8 quality is sufficient for text)
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // Remove "data:image/jpeg;base64," prefix for the Gemini SDK
    const data = base64.split(',')[1]; 
    if (data) images.push(data);
  }
  return images;
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
    .replace(/\s{2,}/g, ' ');

  const caseStartRegex = /(?:Case\s+(?:No|Number)|[A-Z][a-z]+\s+Appeal\s+No|Reg\.\s+No\.|အမှုနံပါတ်|တရားမ(?:ကြီး)?မှု|ရာဇဝတ်(?:ကြီး)?မှု|ပြည်ထောင်စုတရားလွှတ်တော်ချုပ်|rjy.*?kH|w&m;r.*?rjy)/gi;
  
  const matches = [...normalized.matchAll(caseStartRegex)];
  
  let cases: string[] = [];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = matches[i + 1] ? matches[i + 1].index : normalized.length;
      
      if (start !== undefined) {
        const chunk = normalized.substring(start, end).trim();
        if (chunk.length > 300) {
          cases.push(chunk);
        }
      }
    }
  }

  if (cases.length === 0) {
    return [normalized];
  }

  return cases;
};
