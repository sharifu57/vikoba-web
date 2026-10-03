import { apiGet, apiPut } from './client'

export type SystemPerson = {
  membershipId: number; memberId: number; name: string; phone: string | null; email: string | null;
  membershipNumber: string; status: string; groupId: number; groupName: string; roles: string[]; eligibleForChair: boolean;
}
export type SystemGroup = {
  id: number; name: string; code: string; organization: string; status: string; currency: string;
  members: number; activeMembers: number; chairs: SystemPerson[];
}
export type SystemOverview = {
  groups: number; activeGroups: number; organizations: number; members: number;
  memberships: number; activeMemberships: number; users: number; leadershipIssues: number;
}
export type SystemAudit = { id: number; actor: string; group: string; action: string; description: string; createdAt: string }
export type SystemPage<T> = { content: T[]; totalElements: number; totalPages: number; number: number }
type Response<T> = { status: boolean; message: string; data: T }
const base = '/api/system-admin'
export const systemAdmin = {
  access: () => apiGet<Response<{ superAdmin: boolean }>>(`${base}/access`, undefined, { auth: true }),
  overview: () => apiGet<Response<SystemOverview>>(`${base}/overview`, undefined, { auth: true }),
  groups: (search: string, page: number) => apiGet<Response<SystemPage<SystemGroup>>>(`${base}/groups?${new URLSearchParams({ search, page: String(page) })}`, undefined, { auth: true }),
  members: (search: string, page: number, groupId?: number) => apiGet<Response<SystemPage<SystemPerson>>>(`${base}/members?${new URLSearchParams({ search, page: String(page), ...(groupId ? { groupId: String(groupId) } : {}) })}`, undefined, { auth: true }),
  audit: (page: number) => apiGet<Response<SystemPage<SystemAudit>>>(`${base}/audit?page=${page}`, undefined, { auth: true }),
  chair: (groupId: number, membershipId: number, expectedChairId: number | null, reason: string) => apiPut<Response<SystemGroup>>(`${base}/groups/${groupId}/chair`, { membershipId, expectedChairId, reason }, { auth: true }),
}
