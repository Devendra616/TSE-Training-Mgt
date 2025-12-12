import api from './api';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'training_officer' | 'mines_manager';
  signatureUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await api.post('/auth/login', credentials);
  return response.data.data.user;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get('/auth/me');
  return response.data.data.user;
}

/**
 * Change password
 */
export async function changePassword(data: ChangePasswordData): Promise<void> {
  await api.put('/auth/password', data);
}

export default { login, logout, getCurrentUser, changePassword };
