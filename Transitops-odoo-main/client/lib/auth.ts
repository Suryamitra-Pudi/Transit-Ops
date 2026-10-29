import { User } from '@/types';

// Session storage (not localStorage) keeps the demo session scoped to the
// current tab and cleared when it's closed - a reasonable default for an
// internal ops tool during evaluation.
export function saveSession(token: string, user: User) {
  window.sessionStorage.setItem('transitops_token', token);
  window.sessionStorage.setItem('transitops_user', JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem('transitops_user');
  return raw ? JSON.parse(raw) : null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem('transitops_token');
}

export function clearSession() {
  window.sessionStorage.removeItem('transitops_token');
  window.sessionStorage.removeItem('transitops_user');
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};
