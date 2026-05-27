export const APP_MODE = import.meta.env.VITE_APP_MODE || 'mock';
export const AGENTIC_CORE_API_BASE_URL = import.meta.env.VITE_AGENTIC_CORE_API_BASE_URL || 'http://localhost:8100';

const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const MAINTENANCE_API_BASE_URL =
  import.meta.env.VITE_MAINTENANCE_API_BASE_URL ||
  import.meta.env.MAINTENANCE_API_BASE_URL ||
  processEnv.VITE_MAINTENANCE_API_BASE_URL ||
  processEnv.MAINTENANCE_API_BASE_URL ||
  'http://localhost:3101';
