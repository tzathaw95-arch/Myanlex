export interface LegalCase {
  id: string;
  caseName: string; // Myanmar text
  caseNameEnglish?: string;
  citation: string;
  court: string;
  judges: string[];
  content: string; // Full text
  date: string; // YYYY-MM-DD
  headnotes: string[];
  caseType: string; // Criminal/Civil/Constitutional
  summary: string;
  holding: string;
  legalIssues: string[];
  parties: {
    plaintiff?: string;
    defendant?: string;
  };
  extractionDate: string;
  sourcePdfName: string;
  extractionConfidence: number;
  extractedSuccessfully: boolean;
}

export interface CaseBrief {
  facts: string;
  issues: string[];
  holding: string;
  reasoning: string;
  principles: string[];
}

export type ViewState = 'HOME' | 'SEARCH' | 'DETAIL' | 'ADMIN' | 'RESOURCES' | 'SAVED';

export interface SearchFilters {
  query: string;
  court?: string;
  year?: string;
  type?: string;
}

export interface UploadQueueItem {
  id: string;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  totalCasesDetected: number;
  processedCases: number;
  error?: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  password: string; // In a real app, this would be hashed
  name: string;
  role: UserRole;
  subscriptionExpiry: string; // ISO Date string
  isTrial: boolean;
  isBanned?: boolean; // For manual violations/terminations
  createdAt: string;
  savedCaseIds: string[]; // List of IDs saved by user
}

export interface BillingConfig {
  kbz: {
    name: string;
    phone: string;
  };
  wave: {
    name: string;
    phone: string;
  };
  support: {
    phone: string;
    email: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  senderName: string;
  contactInfo: string;
  subject: string;
  message: string;
  category: string;
  status: 'OPEN' | 'RESOLVED';
  date: string;
}

// --- NEW RESOURCE TYPES ---

export interface Statute {
  id: string;
  title: string;
  titleMm: string;
  year: string;
  category: string;
  description: string;
}

export interface DictionaryTerm {
  id: string;
  term: string;
  definitionMm: string;
  definitionEn: string;
  category: string;
}

export interface LegalTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  format: 'DOCX' | 'PDF';
}
