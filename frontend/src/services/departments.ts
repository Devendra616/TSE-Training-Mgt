import api from './api';

export interface Department {
  id: number;
  name: string;
  createdAt: string;
}

/**
 * Get all departments
 */
export async function getDepartments(): Promise<Department[]> {
  const response = await api.get('/departments');
  return response.data.data.departments;
}

/**
 * Create department
 */
export async function createDepartment(name: string): Promise<Department> {
  const response = await api.post('/departments', { name });
  return response.data.data.department;
}

/**
 * Update department
 */
export async function updateDepartment(id: number, name: string): Promise<Department> {
  const response = await api.put(`/departments/${id}`, { name });
  return response.data.data.department;
}

/**
 * Delete department
 */
export async function deleteDepartment(id: number): Promise<void> {
  await api.delete(`/departments/${id}`);
}

export default { getDepartments, createDepartment, updateDepartment, deleteDepartment };
