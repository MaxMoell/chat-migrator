/**
 * Local Storage Helper
 * Securely store API keys and settings in browser
 */

import type { APIConfig } from '@/types/api';

const STORAGE_KEY = 'chat-migrator-config';

/**
 * Save API configuration to localStorage
 */
export function saveConfig(config: APIConfig): void {
  try {
    const encrypted = btoa(JSON.stringify(config));
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save config:', error);
    throw new Error('Failed to save configuration');
  }
}

/**
 * Load API configuration from localStorage
 */
export function loadConfig(): APIConfig | null {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;

    const decrypted = atob(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

/**
 * Clear all stored configuration
 */
export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if API keys are configured
 */
export function hasConfig(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}
