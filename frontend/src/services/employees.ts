import api from './api';
import type { Department } from './departments';

export interface Employee {
  id: number;
  sapId: string;
  fullName: string;
  designation: string;
  departmentId: number;
  department?: Department;
  photoUrl: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface EmployeesResponse {
  employees: Employee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateEmployeeData {
  sapId: string;
  fullName: string;
  designation: string;
  departmentId: number;
}

/**
 * Get all employees with filters
 */
export async function getEmployees(params?: {
  page?: number;
  limit?: number;
  status?: string;
  departmentId?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): Promise<EmployeesResponse> {
  const response = await api.get('/employees', { params });
  return response.data.data;
}

/**
 * Search employees (for autocomplete)
 */
export async function searchEmployees(query: string): Promise<Employee[]> {
  const response = await api.get('/employees/search', { params: { q: query } });
  return response.data.data.employees;
}

/**
 * Get employee by ID
 */
export async function getEmployee(id: number): Promise<Employee> {
  const response = await api.get(`/employees/${id}`);
  return response.data.data.employee;
}

/**
 * Create employee
 */
export async function createEmployee(data: CreateEmployeeData): Promise<Employee> {
  const response = await api.post('/employees', data);
  return response.data.data.employee;
}

/**
 * Update employee
 */
export async function updateEmployee(id: number, data: Partial<CreateEmployeeData>): Promise<Employee> {
  const response = await api.put(`/employees/${id}`, data);
  return response.data.data.employee;
}

/**
 * Delete (deactivate) employee
 */
export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/employees/${id}`);
}

/**
 * Upload employee photo
 */
export async function uploadEmployeePhoto(id: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await api.post(`/employees/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.photoUrl;
}

export default {
  getEmployees,
  searchEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeePhoto,
};
