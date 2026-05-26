import { AuthUser } from './auth';

export interface BranchFilter {
  whereClause: string;
  params: any[];
}

// Assuming superadmin role id = 1 (adjust if different)
const SUPERADMIN_ROLE_ID = 1;

export function enforceBranchIsolation(
  user: AuthUser | null,
  tableAlias: string = '',
  columnName: string = 'branch_id'
): BranchFilter {
  if (!user) return { whereClause: '', params: [] };
  if (user.roleId === SUPERADMIN_ROLE_ID) return { whereClause: '', params: [] };
  if (user.branchId) {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    return {
      whereClause: ` AND ${prefix}${columnName} = $1`,
      params: [user.branchId],
    };
  }
  return { whereClause: ' AND 1=0', params: [] };
}