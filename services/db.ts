import { LegalCase, User, BillingConfig, Announcement, SupportTicket, Statute, DictionaryTerm, LegalTemplate } from "../types";

// Keys
const DB_KEY_CASES = "myanlex_cases";
const DB_KEY_USERS = "myanlex_users";
const DB_KEY_CONFIG = "myanlex_config";
const DB_KEY_ANNOUNCEMENTS = "myanlex_announcements";
const DB_KEY_TICKETS = "myanlex_tickets";

// Initial seed data for Cases
const SEED_CASES: LegalCase[] = [
  {
    id: "seed-1",
    caseName: "U Hla Maung v. Daw Aye",
    citation: "2020 MLR 150",
    court: "Supreme Court of the Union",
    judges: ["U Htun Htun Oo", "Daw Khin May Yi"],
    date: "2020-03-15",
    caseType: "Civil Appeal",
    content: "Full text of U Hla Maung v. Daw Aye...",
    summary: "This case concerns a dispute over inheritance of agricultural land in the Magway Region. The primary issue was whether the verbal agreement prior to the 2012 Farmland Law was valid.",
    holding: "The Supreme Court dismissed the appeal, upholding the lower court's decision that the verbal transfer was invalid without registration.",
    legalIssues: ["Validity of verbal land transfer", "Application of 2012 Farmland Law"],
    parties: { plaintiff: "U Hla Maung", defendant: "Daw Aye" },
    extractionDate: "2023-10-01",
    sourcePdfName: "SeedData.pdf",
    extractionConfidence: 100,
    extractedSuccessfully: true,
    headnotes: ["Land Law", "Inheritance"]
  },
  {
    id: "seed-2",
    caseName: "The State v. Kyaw Kyaw",
    citation: "2021 MLR 45",
    court: "Yangon High Court",
    judges: ["U Myint Thein"],
    date: "2021-06-10",
    caseType: "Criminal",
    content: "Full text of The State v. Kyaw Kyaw...",
    summary: "A criminal case involving charges under the Narcotic Drugs and Psychotropic Substances Law. The accused was found with 50 tablets of stimulant.",
    holding: "Conviction upheld but sentence reduced due to lack of prior criminal record.",
    legalIssues: ["Search and Seizure procedures", "Sentencing guidelines"],
    parties: { plaintiff: "The State", defendant: "Kyaw Kyaw" },
    extractionDate: "2023-11-15",
    sourcePdfName: "SeedData.pdf",
    extractionConfidence: 100,
    extractedSuccessfully: true,
    headnotes: ["Criminal Procedure", "Narcotics"]
  }
];

// Initial seed data for Users (Admin)
const SEED_USERS: User[] = [
  {
    id: "admin-1",
    email: "tzathaw.95@gmail.com",
    password: "W@termelon123",
    name: "System Administrator",
    role: "ADMIN",
    subscriptionExpiry: "2099-12-31T00:00:00.000Z",
    isTrial: false,
    isBanned: false,
    createdAt: new Date().toISOString(),
    savedCaseIds: []
  }
];

// Default Billing Config
const DEFAULT_CONFIG: BillingConfig = {
  kbz: { name: "U Admin Name", phone: "09-123-456-789" },
  wave: { name: "U Admin Name", phone: "09-123-456-789" },
  support: { phone: "09-123-456-789", email: "support@myanlex.com" }
};

// --- RESOURCES SEED DATA ---

const SEED_STATUTES: Statute[] = [
  { id: 'st-1', title: 'The Penal Code', titleMm: 'ရာဇသတ်ကြီး', year: '1861', category: 'Criminal', description: 'The primary criminal code of Myanmar.' },
  { id: 'st-2', title: 'The Code of Criminal Procedure', titleMm: 'ပြစ်မှုဆိုင်ရာကျင့်ထုံးဥပဒေ', year: '1898', category: 'Criminal', description: 'Procedure for administration of criminal law.' },
  { id: 'st-3', title: 'The Evidence Act', titleMm: 'သက်သေခံဥပဒေ', year: '1872', category: 'Civil/Criminal', description: 'Rules of evidence in court proceedings.' },
  { id: 'st-4', title: 'The Contract Act', titleMm: 'ပဋိညာဉ်အက်ဥပဒေ', year: '1872', category: 'Civil', description: 'Law relating to contracts.' },
  { id: 'st-5', title: 'The Farmland Law', titleMm: 'လယ်ယာမြေဥပဒေ', year: '2012', category: 'Land', description: 'Regulations regarding farmland rights and management.' },
];

const SEED_DICTIONARY: DictionaryTerm[] = [
  { id: 'dt-1', term: 'Res Judicata', definitionMm: 'အမှုစီရင်ပြီးသားအရာ', definitionEn: 'A matter that has been adjudicated by a competent court and may not be pursued further by the same parties.', category: 'Civil Procedure' },
  { id: 'dt-2', term: 'Mens Rea', definitionMm: 'ပြစ်မှုကျူးလွန်လိုစိတ်', definitionEn: 'The intention or knowledge of wrongdoing that constitutes part of a crime.', category: 'Criminal Law' },
  { id: 'dt-3', term: 'Habeas Corpus', definitionMm: 'ူးခန္ဓာကိုယ်ကို ရှေ့တော်သွင်းစေ', definitionEn: 'A writ requiring a person under arrest to be brought before a judge or into court.', category: 'Constitutional' },
  { id: 'dt-4', term: 'Prima Facie', definitionMm: 'အပေါ်ယံအားဖြင့်', definitionEn: 'Based on the first impression; accepted as correct until proved otherwise.', category: 'General' },
  { id: 'dt-5', term: 'Alibi', definitionMm: 'အခင်းဖြစ်ပွားချိန်တခြားနေရာ၌ရှိနေခြင်း', definitionEn: 'A claim or piece of evidence that one was elsewhere when an act is alleged to have taken place.', category: 'Criminal Law' },
];

const SEED_TEMPLATES: LegalTemplate[] = [
  { id: 'tmp-1', title: 'General Power of Attorney (GP)', category: 'Notary', description: 'Standard GP format for authorizing an agent.', format: 'DOCX' },
  { id: 'tmp-2', title: 'Special Power of Attorney (SP)', category: 'Notary', description: 'SP format for specific legal actions.', format: 'DOCX' },
  { id: 'tmp-3', title: 'Apartment Lease Agreement', category: 'Contract', description: 'Bilingual lease agreement for residential property.', format: 'DOCX' },
  { id: 'tmp-4', title: 'Employment Contract', category: 'Labor', description: 'Standard employment contract compliant with Myanmar Labor Law.', format: 'DOCX' },
];

// --- CASES ---

export const getCases = (): LegalCase[] => {
  const stored = localStorage.getItem(DB_KEY_CASES);
  if (!stored) {
    localStorage.setItem(DB_KEY_CASES, JSON.stringify(SEED_CASES));
    return SEED_CASES;
  }
  return JSON.parse(stored);
};

export const saveCase = (newCase: LegalCase) => {
  const cases = getCases();
  cases.unshift(newCase);
  localStorage.setItem(DB_KEY_CASES, JSON.stringify(cases));
};

export const searchCases = (query: string): LegalCase[] => {
  const cases = getCases();
  if (!query) return cases;
  
  const lowerQ = query.toLowerCase();
  return cases.filter(c => 
    c.caseName.toLowerCase().includes(lowerQ) ||
    c.citation.toLowerCase().includes(lowerQ) ||
    c.court.toLowerCase().includes(lowerQ) ||
    c.summary.toLowerCase().includes(lowerQ) ||
    (c.caseNameEnglish && c.caseNameEnglish.toLowerCase().includes(lowerQ))
  );
};

export const getCaseById = (id: string): LegalCase | undefined => {
  return getCases().find(c => c.id === id);
};

export const clearDatabase = () => {
  localStorage.removeItem(DB_KEY_CASES);
  localStorage.setItem(DB_KEY_CASES, JSON.stringify(SEED_CASES));
};

// --- USERS & SAVING ---

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(DB_KEY_USERS);
  if (!stored) {
    localStorage.setItem(DB_KEY_USERS, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  return JSON.parse(stored);
};

export const saveUser = (user: User) => {
  const users = getUsers();
  // Check if exists
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const toggleSavedCase = (userId: string, caseId: string): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) return null;

  const user = users[index];
  if (!user.savedCaseIds) user.savedCaseIds = []; // Ensure array exists

  const savedIndex = user.savedCaseIds.indexOf(caseId);
  if (savedIndex >= 0) {
    // Remove
    user.savedCaseIds.splice(savedIndex, 1);
  } else {
    // Add
    user.savedCaseIds.push(caseId);
  }

  users[index] = user;
  localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
  
  // Update current session if applicable
  const currentUserStr = localStorage.getItem("myanlex_current_user");
  if(currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      if(currentUser.id === userId) {
          localStorage.setItem("myanlex_current_user", JSON.stringify(user));
      }
  }

  return user;
};

// --- CONFIG ---

export const getConfig = (): BillingConfig => {
  const stored = localStorage.getItem(DB_KEY_CONFIG);
  
  const config = stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  // Migration for existing configs that don't have support field
  if (!config.support) {
    config.support = DEFAULT_CONFIG.support;
  }
  return config;
};

export const saveConfig = (config: BillingConfig) => {
  localStorage.setItem(DB_KEY_CONFIG, JSON.stringify(config));
};

// --- ANNOUNCEMENTS ---

export const getAnnouncements = (): Announcement[] => {
  const stored = localStorage.getItem(DB_KEY_ANNOUNCEMENTS);
  return stored ? JSON.parse(stored) : [];
};

export const saveAnnouncement = (announcement: Announcement) => {
  const list = getAnnouncements();
  list.unshift(announcement);
  localStorage.setItem(DB_KEY_ANNOUNCEMENTS, JSON.stringify(list));
};

export const deleteAnnouncement = (id: string) => {
  const list = getAnnouncements();
  const newList = list.filter(a => a.id !== id);
  localStorage.setItem(DB_KEY_ANNOUNCEMENTS, JSON.stringify(newList));
};

// --- SUPPORT TICKETS ---

export const getTickets = (): SupportTicket[] => {
  const stored = localStorage.getItem(DB_KEY_TICKETS);
  return stored ? JSON.parse(stored) : [];
};

export const saveTicket = (ticket: SupportTicket) => {
  const list = getTickets();
  list.unshift(ticket);
  localStorage.setItem(DB_KEY_TICKETS, JSON.stringify(list));
};

export const updateTicketStatus = (id: string, status: 'OPEN' | 'RESOLVED') => {
  const list = getTickets();
  const index = list.findIndex(t => t.id === id);
  if (index >= 0) {
    list[index].status = status;
    localStorage.setItem(DB_KEY_TICKETS, JSON.stringify(list));
  }
};

export const deleteTicket = (id: string) => {
  const list = getTickets();
  const newList = list.filter(t => t.id !== id);
  localStorage.setItem(DB_KEY_TICKETS, JSON.stringify(newList));
};

// --- RESOURCES GETTERS (MOCKED) ---
export const getStatutes = (): Statute[] => SEED_STATUTES;
export const getDictionaryTerms = (query: string): DictionaryTerm[] => {
  if (!query) return SEED_DICTIONARY;
  const q = query.toLowerCase();
  return SEED_DICTIONARY.filter(t => 
    t.term.toLowerCase().includes(q) || 
    t.definitionEn.toLowerCase().includes(q) ||
    t.definitionMm.includes(q)
  );
};
export const getTemplates = (): LegalTemplate[] => SEED_TEMPLATES;
