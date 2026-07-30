import api from "./api";

export interface MigrationStats {
  totalMigrated: number;
  byTraining: {
    trainingId: number;
    count: number;
    training: { name: string; code: string };
  }[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  existingCertificate?: any;
}

export interface MigrateCertificateData {
  employeeId: number;
  trainingId: number;
  certificateNumber?: string;
  issueDate: string;
  validFrom?: string;
  validUntil?: string;
  daysAttended?: number;
  sourceFileName?: string;
  notes?: string;
}

/**
 * Upload migration file
 */
export async function uploadMigrationFile(file: File): Promise<{
  fileUrl: string;
  filename: string;
  originalName: string;
  mimeType: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/migration/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Check for duplicate certificates
 */
export async function checkDuplicate(data: {
  employeeId?: number;
  trainingId?: number;
  issueDate?: string;
  certificateNumber?: string;
}): Promise<DuplicateCheckResult> {
  const response = await api.post("/migration/check-duplicate", data);
  return response.data.data;
}

/**
 * Migrate a single certificate
 */
export async function migrateCertificate(
  data: MigrateCertificateData,
): Promise<any> {
  const response = await api.post("/migration/certificate", data);
  return response.data.data.certificate;
}

/**
 * Bulk migrate certificates
 */
export async function bulkMigrate(
  certificates: MigrateCertificateData[],
): Promise<{
  success: number;
  failed: number;
  errors: { index: number; error: string }[];
}> {
  const response = await api.post("/migration/bulk", { certificates });
  return response.data.data;
}

/**
 * Get migration stats
 */
export async function getMigrationStats(): Promise<MigrationStats> {
  const response = await api.get("/migration/stats");
  return response.data.data;
}

export default {
  uploadMigrationFile,
  checkDuplicate,
  migrateCertificate,
  bulkMigrate,
  getMigrationStats,
};
