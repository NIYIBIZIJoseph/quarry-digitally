// src/lib/auth-client.ts

export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return {};
  }
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function getUserRoleFromToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function getUserBranchIdFromToken(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.branchId || null;
  } catch {
    return null;
  }
}