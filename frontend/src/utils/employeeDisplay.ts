export function formatSapIdWithToken(employee?: {
  sapId?: string | null;
  tokenNo?: string | null;
}): string {
  if (!employee?.sapId) {
    return "";
  }

  return employee.tokenNo ? `${employee.sapId} (${employee.tokenNo})` : employee.sapId;
}
