import api from './api';
import type { User } from './auth';

export interface CreateUserData {
  email: string;
  fullName: string;
  role: 'admin' | 'training_officer' | 'mines_manager';
  password?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  role?: 'admin' | 'training_officer' | 'mines_manager';
  isActive?: boolean;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<UsersResponse> {
  const response = await api.get('/users');
  return response.data.data;
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserData): Promise<User> {
  const response = await api.post('/users', data);
  return response.data.data.user;
}

/**
 * Update user
 */
export async function updateUser(id: number, data: UpdateUserData): Promise<User> {
  const response = await api.put(`/users/${id}`, data);
  return response.data.data.user;
}

/**
 * Delete (deactivate) user
 */
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  await api.put(`/users/${id}/reset-password`, { newPassword });
}
