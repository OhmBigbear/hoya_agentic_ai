import { AGENTIC_CORE_API_BASE_URL, APP_MODE } from '../config/env';

type QueryParams = Record<string, string | number | boolean | string[] | undefined>;

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function getBaseUrl(): string {
  if (APP_MODE === 'mock') {
    throw new Error('Agentic Core API client cannot be used while APP_MODE is "mock".');
  }

  const baseUrl = AGENTIC_CORE_API_BASE_URL.trim();
  if (!baseUrl) {
    throw new Error('AGENTIC_CORE_API_BASE_URL must be configured when APP_MODE is not "mock".');
  }

  return baseUrl.replace(/\/+$/, '');
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${getBaseUrl()}${normalizePath(path)}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        url.searchParams.append(key, item);
      });
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const responseBody = await response.text();
  const detail = responseBody ? `: ${responseBody}` : '';

  throw new Error(`Agentic Core API request failed with ${response.status} ${response.statusText}${detail}`);
}

export const agenticCoreClient = {
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    const response = await fetch(buildUrl(path, params), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    return parseResponse<T>(response);
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return parseResponse<T>(response);
  },
};
