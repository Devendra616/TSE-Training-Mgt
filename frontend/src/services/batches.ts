import api from './api';
import type { Training } from './trainings';
import type { Employee } from './employees';

export type BatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Batch {
  id: number;
  trainingId: number;
  training?: Training;
  startDate: string;
  endDate: string;
  capacity: number;
  venue: string;
  instructorName: string;
  status: BatchStatus;
  notes: string | null;
  enrolledCount?: number;
  employees?: Employee[];
  createdAt: string;
}

export interface CreateBatchData {
  trainingId: number;
  startDate: string;
  endDate: string;
  capacity: number;
  venue: string;
  instructorName: string;
  notes?: string;
}

export interface AttendanceRecord {
  employee: Employee;
  days: { day: number; isPresent: boolean; markedAt: string | null }[];
  totalPresent: number;
  isComplete: boolean;
}

export interface BatchAttendanceResponse {
  batch: Batch;
  durationDays: number;
  attendance: AttendanceRecord[];
}

/**
 * Get all batches
 */
export async function getBatches(params?: {
  trainingId?: number;
  status?: BatchStatus;
}): Promise<Batch[]> {
  const response = await api.get('/batches', { params });
  return response.data.data.batches;
}

/**
 * Get batch by ID
 */
export async function getBatch(id: number): Promise<Batch> {
  const response = await api.get(`/batches/${id}`);
  return response.data.data.batch;
}

/**
 * Create batch
 */
export async function createBatch(data: CreateBatchData): Promise<Batch> {
  const response = await api.post('/batches', data);
  return response.data.data.batch;
}

/**
 * Update batch
 */
export async function updateBatch(id: number, data: Partial<CreateBatchData & { status: BatchStatus }>): Promise<Batch> {
  const response = await api.put(`/batches/${id}`, data);
  return response.data.data.batch;
}

/**
 * Delete batch
 */
export async function deleteBatch(id: number): Promise<void> {
  await api.delete(`/batches/${id}`);
}

/**
 * Enroll employees in batch
 */
export async function enrollEmployees(batchId: number, employeeIds: number[]): Promise<{ enrolled: number; skipped: number }> {
  const response = await api.post(`/batches/${batchId}/enroll`, { employeeIds });
  return response.data.data;
}

/**
 * Remove employee from batch
 */
export async function removeEmployee(batchId: number, employeeId: number): Promise<void> {
  await api.delete(`/batches/${batchId}/enroll/${employeeId}`);
}

/**
 * Get batch attendance
 */
export async function getBatchAttendance(batchId: number): Promise<BatchAttendanceResponse> {
  const response = await api.get(`/batches/${batchId}/attendance`);
  return response.data.data;
}

/**
 * Mark single attendance
 */
export async function markAttendance(
  batchId: number,
  employeeId: number,
  dayNumber: number,
  isPresent: boolean
): Promise<void> {
  await api.post(`/batches/${batchId}/attendance`, { employeeId, dayNumber, isPresent });
}

/**
 * Bulk mark attendance
 */
export async function bulkMarkAttendance(
  batchId: number,
  dayNumber: number,
  records: { employeeId: number; isPresent: boolean }[]
): Promise<void> {
  await api.post(`/batches/${batchId}/attendance/bulk`, { dayNumber, records });
}

/**
 * Clone a batch
 */
export async function cloneBatch(
  batchId: number,
  data?: { startDate?: string; endDate?: string; venue?: string; instructorName?: string }
): Promise<Batch> {
  const response = await api.post(`/batches/${batchId}/clone`, data || {});
  return response.data.data.batch;
}

export default {
  getBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
  enrollEmployees,
  removeEmployee,
  getBatchAttendance,
  markAttendance,
  bulkMarkAttendance,
  cloneBatch,
};

