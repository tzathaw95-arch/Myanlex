
export type CitationStatus = 'GOOD_LAW' | 'DISTINGUISHED' | 'OVERRULED' | 'CAUTION';

export interface CaseBrief {
  facts: string;
  issues: string[];
  holding: string;
  reasoning: string;
  principles: string[];
}

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
  status: CitationStatus; // NEW: Lexis-style status
  brief?: CaseBrief; // NEW: Pre-computed brief stored with case
}

export interface ClientFolder {
  id: string;
  name: string;
  clientReference?: string;
  dateCreated: string;
  caseIds: string[];
}

export type ViewState = 'HOME' | 'SEARCH' | 'DETAIL' | 'ADMIN' | 'RESOURCES' | 'SAVED' | 'TEAM' | 'MULTI_ANALYSIS';

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

export type UserRole = 'ADMIN' | 'EDITOR' | 'USER';

export interface Organization {
  id: string;
  name: string;
  adminUserId: string;
  members: string[]; // List of User IDs
  maxSeats: number;
  sharedCaseIds: string[]; // Cases shared with the whole team
  plan: 'TEAM_STARTER' | 'TEAM_ENTERPRISE';
}

export interface User {
  id: string;
  email: string;
  password: string; 
  name: string;
  role: UserRole;
  subscriptionExpiry: string; 
  isTrial: boolean;
  isBanned?: boolean; 
  createdAt: string;
  folders: ClientFolder[]; // NEW: Replaces simple savedCaseIds for better organization
  organizationId?: string; 
  // Legacy support for migration, though we prefer folders now
  savedCaseIds?: string[];
}

export interface PricingPlan {
  id: string;
  title: string;
  price: string;
  isPopular?: boolean;
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
  plans: PricingPlan[];
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
