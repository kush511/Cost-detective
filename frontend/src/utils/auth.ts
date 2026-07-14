import type { AuthUser } from '../types';

const TOKEN_KEY = 'cloud-cost-token';
const USER_KEY = 'cloud-cost-user';
const MESSAGE_KEY = 'cloud-cost-auth-message';
export const AUTH_STORAGE_EVENT = 'cloud-cost-auth-storage-changed';

function emitAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emitAuthChange();
}

export function setAuthMessage(message: string) {
  sessionStorage.setItem(MESSAGE_KEY, message);
}

export function consumeAuthMessage() {
  const message = sessionStorage.getItem(MESSAGE_KEY);

  if (message) {
    sessionStorage.removeItem(MESSAGE_KEY);
  }

  return message;
}

export function hasSession() {
  return Boolean(getStoredToken());
}