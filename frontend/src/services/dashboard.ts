import api from './api';

export interface DashboardStats {
  totalEmployees: number;
  totalTrainings: number;
  activeBatches: number;
  pendingApprovals: number;
}

export interface ComplianceData {
  total: number;
  compliant: number;
  dueSoon: number;
  overdue: number;
  neverTrained: number;
  complianceRate: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  compliance: ComplianceData;
  recentActivity: {
    type: string;
    employee: string;
    training: string;
    timestamp: string;
  }[];
  upcomingDue: {
    id: number;
    employee: { fullName: string; sapId: string; tokenNo: string | null };
    training: { name: string; code: string };
    validUntil: string;
    complianceStatus: 'compliant' | 'due_soon' | 'overdue';
    daysRemaining: number;
  }[];
}

export interface DepartmentStats {
  department_id: number;
  department_name: string;
  total_employees: number;
  compliant_employees: number;
  overdue_employees: number;
}

/**
 * Get dashboard overview
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await api.get('/dashboard');
  return response.data.data;
}

/**
 * Get compliance details
 */
export async function getComplianceOverview(): Promise<{
  stats: ComplianceData;
  upcoming: any[];
  overdue: any[];
}> {
  const response = await api.get('/dashboard/compliance');
  return response.data.data;
}

/**
 * Get stats by department
 */
export async function getStatsByDepartment(): Promise<DepartmentStats[]> {
  const response = await api.get('/dashboard/by-department');
  return response.data.data.departments;
}

/**
 * Get stats by training
 */
export async function getStatsByTraining(): Promise<any[]> {
  const response = await api.get('/dashboard/by-training');
  return response.data.data.trainings;
}

export default {
  getDashboardOverview,
  getComplianceOverview,
  getStatsByDepartment,
  getStatsByTraining,
};
