import { User } from "../types";
import { getUsers, saveUser, getUserByEmail } from "./db";

const CURRENT_USER_KEY = "myanlex_current_user";
const GUEST_BRIEF_USAGE_KEY = "myanlex_guest_brief_usage";

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const login = (email: string, pass: string): { success: boolean; user?: User; error?: string } => {
  const user = getUserByEmail(email);
  
  if (!user) {
    return { success: false, error: "Account not found. Please register for a trial." };
  }

  if (user.password !== pass) {
    return { success: false, error: "Incorrect password." };
  }

  if (user.isBanned) {
    return { success: false, error: "Account suspended due to policy violation." };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const registerTrial = (email: string, pass: string, name: string): { success: boolean; user?: User; error?: string } => {
  if (getUserByEmail(email)) {
    return { success: false, error: "Email already exists." };
  }

  // Calculate 2 weeks from now
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

  const newUser: User = {
    id: `user-${Date.now()}`,
    email,
    password: pass,
    name,
    role: 'USER',
    isTrial: true,
    isBanned: false,
    subscriptionExpiry: twoWeeksLater.toISOString(),
    createdAt: now.toISOString(),
    savedCaseIds: []
  };

  saveUser(newUser);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return { success: true, user: newUser };
};

export const checkSubscription = (user: User): { valid: boolean; message?: string } => {
  if (user.role === 'ADMIN') return { valid: true };

  // 1. Check Violation Status
  if (user.isBanned) {
    return { valid: false, message: "Account suspended due to policy violation." };
  }

  // 2. Check Expiry
  const now = new Date();
  const expiry = new Date(user.subscriptionExpiry);

  if (now > expiry) {
    return { valid: false, message: "Subscription expired" };
  }

  return { valid: true };
};

// --- GUEST USAGE TRACKING ---

export const canGenerateBrief = (user: User | null): { allowed: boolean; reason?: string } => {
  // 1. If Paid/Trial User
  if (user) {
    const sub = checkSubscription(user);
    if (!sub.valid) return { allowed: false, reason: "SUBSCRIPTION_EXPIRED" };
    return { allowed: true };
  }

  // 2. If Guest (Not logged in)
  const usageRaw = localStorage.getItem(GUEST_BRIEF_USAGE_KEY);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`; // e.g., "2023-10"

  let usage = usageRaw ? JSON.parse(usageRaw) : { month: currentMonth, count: 0 };

  // Reset if new month
  if (usage.month !== currentMonth) {
    usage = { month: currentMonth, count: 0 };
    localStorage.setItem(GUEST_BRIEF_USAGE_KEY, JSON.stringify(usage));
  }

  if (usage.count >= 1) {
    return { allowed: false, reason: "GUEST_LIMIT_REACHED" };
  }

  return { allowed: true };
};

export const incrementBriefUsage = (user: User | null) => {
  // Only track for guests
  if (user) return;

  const usageRaw = localStorage.getItem(GUEST_BRIEF_USAGE_KEY);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
  
  let usage = usageRaw ? JSON.parse(usageRaw) : { month: currentMonth, count: 0 };
  
  if (usage.month !== currentMonth) {
    usage = { month: currentMonth, count: 0 };
  }

  usage.count += 1;
  localStorage.setItem(GUEST_BRIEF_USAGE_KEY, JSON.stringify(usage));
};
