/**
 * Security & Anti-Spam Utilities
 * Provides client-side rate limiting, cooldown tracking, brute-force protection,
 * and input sanitization for application UX only. All security limits are enforced by the server.
 */

import {api} from './api';
// In-memory / storage cooldown tracker
interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_RULES: Record<string, RateLimitRule> = {
  rating: { maxRequests: 3, windowMs: 60 * 1000 },       // max 3 updates per minute
  send_dm: { maxRequests: 5, windowMs: 30 * 1000 },      // max 5 DMs per 30s
  post_story: { maxRequests: 2, windowMs: 60 * 1000 },   // max 2 stories per minute
  login_attempt: { maxRequests: 5, windowMs: 60 * 1000 },// max 5 attempts per min
  comment: { maxRequests: 6, windowMs: 30 * 1000 }       // max 6 comments per 30s
};

/**
 * Checks if an action is allowed based on rate limiting rules.
 * Returns { allowed: boolean, remainingMs: number, retryAfterSec: number }
 */
export function checkRateLimit(actionKey: string, customRule?: RateLimitRule): {
  allowed: boolean;
  retryAfterSec: number;
  remainingMs: number;
} {
  const rule = customRule || DEFAULT_RULES[actionKey] || { maxRequests: 5, windowMs: 30 * 1000 };
  const storageKey = `sec_rl_${actionKey}`;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(storageKey);
    let timestamps: number[] = raw ? JSON.parse(raw) : [];

    // Filter out timestamps outside the current sliding window
    timestamps = timestamps.filter(t => now - t < rule.windowMs);

    if (timestamps.length >= rule.maxRequests) {
      const oldestInWindow = timestamps[0];
      const remainingMs = Math.max(0, rule.windowMs - (now - oldestInWindow));
      return {
        allowed: false,
        retryAfterSec: Math.ceil(remainingMs / 1000),
        remainingMs
      };
    }

    // Record this attempt
    timestamps.push(now);
    localStorage.setItem(storageKey, JSON.stringify(timestamps));

    return { allowed: true, retryAfterSec: 0, remainingMs: 0 };
  } catch (err) {
    // Fallback gracefully if localStorage is unavailable
    return { allowed: true, retryAfterSec: 0, remainingMs: 0 };
  }
}

/**
 * Sanitizes user input string to prevent XSS payloads, excessive spaces, and dangerous protocols
 */
export function sanitizeInput(text: string, maxLength: number = 1000): string {
  if (!text) return '';
  let clean = text
    // Replace script tags and event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload=|onerror=|onclick=/gi, '')
    .trim();

  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }
  return clean;
}

/**
 * Brute-force protection for login attempts
 */
const LOGIN_ATTEMPTS_KEY = 'sec_login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout

export function recordFailedLogin(): { locked: boolean; remainingSec: number } {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    let data = raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 };

    if (data.lockedUntil && now < data.lockedUntil) {
      return {
        locked: true,
        remainingSec: Math.ceil((data.lockedUntil - now) / 1000)
      };
    }

    data.count = (data.count || 0) + 1;
    if (data.count >= MAX_LOGIN_ATTEMPTS) {
      data.lockedUntil = now + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
      return {
        locked: true,
        remainingSec: Math.ceil(LOCKOUT_DURATION_MS / 1000)
      };
    }

    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
    return { locked: false, remainingSec: 0 };
  } catch {
    return { locked: false, remainingSec: 0 };
  }
}

export function checkLoginLockout(): { locked: boolean; remainingSec: number } {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { locked: false, remainingSec: 0 };
    const data = JSON.parse(raw);

    if (data.lockedUntil && now < data.lockedUntil) {
      return {
        locked: true,
        remainingSec: Math.ceil((data.lockedUntil - now) / 1000)
      };
    }
    return { locked: false, remainingSec: 0 };
  } catch {
    return { locked: false, remainingSec: 0 };
  }
}

export function resetLoginAttempts(): void {
  try {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  } catch {}
}

/**
 * User ID Moderation & Blacklisting
 * Allows administrators to moderate/block malicious User IDs (both guests and users).
 */
let blocked:string[]=[];
export const getBlockedUserIds=()=>blocked;
export const isUserIdBlocked=(id?:string|null)=>!!id&&blocked.includes(id);
export async function syncBlockedUserIdsFromFirestore(){const r=await api('/admin/accounts');blocked=r.items.filter((a:any)=>['suspended','banned'].includes(a.status)).map((a:any)=>a.uid);return blocked;}
export async function blockUserIdPersisted(id:string){await api('/admin/accounts/'+encodeURIComponent(id),{action:'status',status:'banned'});await syncBlockedUserIdsFromFirestore();}
export async function unblockUserIdPersisted(id:string){await api('/admin/accounts/'+encodeURIComponent(id),{action:'status',status:'active'});await syncBlockedUserIdsFromFirestore();}
export const blockUserId=blockUserIdPersisted;
export const unblockUserId=unblockUserIdPersisted;
