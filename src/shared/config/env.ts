export const APP_MODE = import.meta.env.VITE_APP_MODE || 'mock';
export const AGENTIC_CORE_API_BASE_URL = import.meta.env.VITE_AGENTIC_CORE_API_BASE_URL || 'http://localhost:8100';

const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const WORKORDER_AGENT_RUNTIME_BASE_URL =
  import.meta.env.VITE_WORKORDER_AGENT_RUNTIME_BASE_URL ||
  processEnv.VITE_WORKORDER_AGENT_RUNTIME_BASE_URL ||
  '';
export const WORKORDER_AGENT_RUNTIME_ENDPOINT_URL =
  import.meta.env.VITE_WORKORDER_AGENT_RUNTIME_URL ||
  processEnv.VITE_WORKORDER_AGENT_RUNTIME_URL ||
  '';
export const WORKORDER_AGENT_RUNTIME_PATH =
  import.meta.env.VITE_WORKORDER_AGENT_RUNTIME_PATH ||
  processEnv.VITE_WORKORDER_AGENT_RUNTIME_PATH ||
  '/api/workorder-agent/runtime';
export const WORKORDER_AGENT_RUNTIME_TIMEOUT_MS = Number(
  import.meta.env.VITE_WORKORDER_AGENT_RUNTIME_TIMEOUT_MS ||
  processEnv.VITE_WORKORDER_AGENT_RUNTIME_TIMEOUT_MS ||
  10000,
);
export const WORKORDER_WIDGET_SHADOW_MODE_ENABLED = readBooleanEnv(
  import.meta.env.VITE_WORKORDER_WIDGET_SHADOW_MODE_ENABLED ||
  processEnv.VITE_WORKORDER_WIDGET_SHADOW_MODE_ENABLED,
);
export const WORKORDER_WIDGET_DEV_PREVIEW_ENABLED = readBooleanEnv(
  import.meta.env.VITE_WORKORDER_WIDGET_DEV_PREVIEW_ENABLED ||
  processEnv.VITE_WORKORDER_WIDGET_DEV_PREVIEW_ENABLED,
);
export const WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED = readBooleanEnv(
  import.meta.env.VITE_WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED ||
  processEnv.VITE_WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED,
);

export const MAINTENANCE_API_BASE_URL =
  import.meta.env.VITE_MAINTENANCE_API_BASE_URL ||
  import.meta.env.MAINTENANCE_API_BASE_URL ||
  processEnv.VITE_MAINTENANCE_API_BASE_URL ||
  processEnv.MAINTENANCE_API_BASE_URL ||
  'http://localhost:3101';

function readBooleanEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}
