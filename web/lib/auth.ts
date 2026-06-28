'use client';
import { api, setToken, clearToken } from './api';

export interface AuthUser { id: string; email: string; name: string }

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password });
  setToken(res.accessToken);
  return res.user;
}

export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/google', { idToken });
  setToken(res.accessToken);
  return res.user;
}

export async function register(email: string, password: string, name: string): Promise<AuthUser> {
  const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/register', { email, password, name });
  setToken(res.accessToken);
  return res.user;
}

export function logout() {
  clearToken();
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>('/auth/me');
  } catch {
    return null;
  }
}
