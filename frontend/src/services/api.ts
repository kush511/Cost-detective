import axios, { AxiosError } from 'axios';
import { clearSession, getStoredToken } from '../utils/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && getStoredToken()) {
      clearSession();
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = 'Request failed.') {
  if (axios.isAxiosError(error)) {
    const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;

    if (responseMessage) {
      return responseMessage;
    }

    if (error.response?.status === 401) {
      return 'Invalid credentials or expired session.';
    }

    if (error.response?.status === 409) {
      return 'Email already exists.';
    }

    if (error.response?.status === 403) {
      return 'You do not have access to that report.';
    }

    if (error.response?.status === 503) {
      return 'Database unavailable. Please try again later.';
    }

    return error.message || fallback;
  }

  return fallback;
}