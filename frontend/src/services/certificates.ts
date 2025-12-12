import api from './api';
import type { Training } from './trainings';
import type { Employee } from './employees';
import type { Batch } from './batches';

export type WorkflowStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface Certificate {
  id: number;
  employeeId: number;
  employee?: Employee;
  trainingId: number;
  training?: Training;
  batchId: number;
  batch?: Batch;
  workflowStatus: WorkflowStatus;
  certificateNumber: string | null;
  daysAttended: number;
  issueDate: string;
  validFrom: string;
  validUntil: string;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

/**
 * Get all certificates
 */
export async function getCertificates(params?: {
  status?: WorkflowStatus;
  trainingId?: number;
  employeeId?: number;
}): Promise<Certificate[]> {
  const response = await api.get('/certificates', { params });
  return response.data.data.certificates;
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(): Promise<Certificate[]> {
  const response = await api.get('/certificates/pending');
  return response.data.data.certificates;
}

/**
 * Get certificate by ID
 */
export async function getCertificate(id: number): Promise<Certificate> {
  const response = await api.get(`/certificates/${id}`);
  return response.data.data.certificate;
}

/**
 * Generate certificates for a batch
 */
export async function generateCertificates(batchId: number): Promise<{
  generated: number;
  skipped: { id: number; name: string; reason: string }[];
}> {
  const response = await api.post('/certificates/generate', { batchId });
  return response.data.data;
}

/**
 * Submit certificate for approval
 */
export async function submitForApproval(id: number): Promise<Certificate> {
  const response = await api.put(`/certificates/${id}/submit`);
  return response.data.data.certificate;
}

/**
 * Bulk submit for approval
 */
export async function bulkSubmit(certificateIds: number[]): Promise<{ submitted: number }> {
  const response = await api.post('/certificates/submit-bulk', { certificateIds });
  return response.data.data;
}

/**
 * Approve certificate
 */
export async function approveCertificate(id: number): Promise<Certificate> {
  const response = await api.put(`/certificates/${id}/approve`);
  return response.data.data.certificate;
}

/**
 * Bulk approve
 */
export async function bulkApprove(certificateIds: number[]): Promise<{
  approved: { id: number; certificateNumber: string }[];
}> {
  const response = await api.post('/certificates/approve-bulk', { certificateIds });
  return response.data.data;
}

/**
 * Reject certificate
 */
export async function rejectCertificate(id: number, reason: string): Promise<Certificate> {
  const response = await api.put(`/certificates/${id}/reject`, { reason });
  return response.data.data.certificate;
}

/**
 * Resubmit rejected certificate
 */
export async function resubmitCertificate(id: number): Promise<Certificate> {
  const response = await api.put(`/certificates/${id}/resubmit`);
  return response.data.data.certificate;
}

/**
 * Get employee training history
 */
export async function getEmployeeHistory(employeeId: number): Promise<Certificate[]> {
  const response = await api.get(`/certificates/employee/${employeeId}`);
  return response.data.data.certificates;
}

/**
 * Download certificate PDF
 */
export async function downloadCertificatePDF(id: number): Promise<Blob> {
  const response = await api.get(`/certificates/${id}/pdf`, { responseType: 'blob' });
  return response.data;
}

export default {
  getCertificates,
  getPendingApprovals,
  getCertificate,
  generateCertificates,
  submitForApproval,
  bulkSubmit,
  approveCertificate,
  bulkApprove,
  rejectCertificate,
  resubmitCertificate,
  getEmployeeHistory,
  downloadCertificatePDF,
};
