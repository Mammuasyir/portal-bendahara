import { API_BASE_URL } from '../config/env';

const STORAGE_KEY_TOKEN = 'portal_bendahara_session_token';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base HTTP request helper
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
  
  // Format URL: if endpoint already starts with http, use as is, else combine with API_BASE_URL
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${cleanBase}${cleanEndpoint}`;

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse JSON response
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network error or server unreachable', 0, error);
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      headers,
    }),

  put: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      headers,
    }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),
};

