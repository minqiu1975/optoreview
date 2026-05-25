/* ------------------------------------------------------------------ */
/*  Persistence — save/restore analysis state across page sessions      */
/* ------------------------------------------------------------------ */

import type { LLMConfig } from './llmAdapter';

const STORAGE_KEY = 'optoreview_analysis_state';

export interface SavedState {
  // Report data
  reportContents: (string | null)[];
  thinkingContents: (string | null)[];
  statuses: string[];
  reportsReady: boolean[];
  overallStatus: string;
  activeTab: number;
  charCounts: number[];
  // File metadata (names only, no File objects)
  fileNames: { name: string; size: string; type: string }[];
  // LLM config (without API key)
  llmConfig: Omit<LLMConfig, 'apiKey'> | null;
  // Timestamp
  savedAt: number;
  // Analysis completed flag
  isComplete: boolean;
}

/**
 * Save current analysis state to localStorage (excluding sensitive data)
 */
export function saveState(state: SavedState): void {
  try {
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Load saved state from localStorage
 */
export function loadState(): SavedState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as SavedState;
  } catch {
    return null;
  }
}

/**
 * Clear saved state
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

/**
 * Check if saved analysis was interrupted
 * (status is 'analyzing' but saved more than 5 minutes ago)
 */
export function wasInterrupted(savedState: SavedState): boolean {
  if (savedState.isComplete) return false;
  const now = Date.now();
  const age = now - savedState.savedAt;
  // If saved state is older than 3 minutes and not complete, consider interrupted
  return age > 3 * 60 * 1000;
}

/**
 * Check if browser supports Page Visibility API
 */
export function isPageVisible(): boolean {
  if (typeof document === 'undefined') return true;
  return !document.hidden;
}

/**
 * Register visibility change handler
 */
export function onVisibilityChange(handler: (visible: boolean) => void): () => void {
  const callback = () => handler(!document.hidden);
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}
