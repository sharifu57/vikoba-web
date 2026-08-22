import { API_ENDPOINTS } from "./endpoints";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export type Group = {
  id: string;
  name: string;
  currency: string;
  region?: string;
  createdAt?: string;
};

export type Member = {
  id: string;
  name: string;
  memberNo?: string;
  groupId: string;
  phone?: string;
  status?: string;
  role?: string;
};

export type Contribution = {
  id: string;
  groupId: string;
  memberId: string;
  expected: number;
  paid: number;
  balance: number;
  status: "PAID" | "PARTIALLY PAID" | "PENDING" | "OVERDUE";
  lastPaymentDate?: string;
};

export type Loan = {
  id: string;
  groupId: string;
  memberId: string;
  loanProduct: string;
  amount: number;
  principal: number;
  interest: number;
  interestRate: number;
  remainingBalance: number;
  totalPaid: number;
  status: "PENDING" | "DISBURSED" | "REPAID";
  nextPaymentDate?: string;
  progress?: number;
};

export type Meeting = {
  id: string;
  groupId: string;
  title: string;
  date: string;
  venue?: string;
  status?: string;
};

export type Payment = {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  type: string;
  method: string;
  createdAt?: string;
};

export type Expense = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  approved?: boolean;
  createdAt?: string;
};

export type Fine = {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  type?: string;
  status?: string;
};

export type SocialFundRequest = {
  id: string;
  groupId: string;
  memberId: string;
  requestedAmount: number;
  status?: string;
};

export type DashboardSummary = {
  totalMembers: number;
  totalSaved: number;
  totalOutstanding: number;
  totalLoans: number;
};

export const groupService = {
  list: () => apiGet<Group[]>(API_ENDPOINTS.groups),
  getById: (id: string) => apiGet<Group>(`${API_ENDPOINTS.groups}/${id}`),
  create: (payload: Partial<Group>) =>
    apiPost<Group>(API_ENDPOINTS.groups, payload),
  update: (id: string, payload: Partial<Group>) =>
    apiPut<Group>(`${API_ENDPOINTS.groups}/${id}`, payload),
  remove: (id: string) => apiDelete(`${API_ENDPOINTS.groups}/${id}`),
};

export const memberService = {
  list: (groupId?: string) =>
    apiGet<Member[]>(API_ENDPOINTS.members, groupId ? { groupId } : undefined),
  getById: (id: string) => apiGet<Member>(`${API_ENDPOINTS.members}/${id}`),
  create: (payload: Partial<Member>) =>
    apiPost<Member>(API_ENDPOINTS.members, payload),
  update: (id: string, payload: Partial<Member>) =>
    apiPut<Member>(`${API_ENDPOINTS.members}/${id}`, payload),
  remove: (id: string) => apiDelete(`${API_ENDPOINTS.members}/${id}`),
};

export const contributionService = {
  list: (groupId?: string) =>
    apiGet<Contribution[]>(
      API_ENDPOINTS.contributions,
      groupId ? { groupId } : undefined,
    ),
  getById: (id: string) =>
    apiGet<Contribution>(`${API_ENDPOINTS.contributions}/${id}`),
  create: (payload: Partial<Contribution>) =>
    apiPost<Contribution>(API_ENDPOINTS.contributions, payload),
  update: (id: string, payload: Partial<Contribution>) =>
    apiPut<Contribution>(`${API_ENDPOINTS.contributions}/${id}`, payload),
  remove: (id: string) => apiDelete(`${API_ENDPOINTS.contributions}/${id}`),
};

export const loanService = {
  list: (groupId?: string) =>
    apiGet<Loan[]>(API_ENDPOINTS.loans, groupId ? { groupId } : undefined),
  getById: (id: string) => apiGet<Loan>(`${API_ENDPOINTS.loans}/${id}`),
  create: (payload: Partial<Loan>) =>
    apiPost<Loan>(API_ENDPOINTS.loans, payload),
  update: (id: string, payload: Partial<Loan>) =>
    apiPut<Loan>(`${API_ENDPOINTS.loans}/${id}`, payload),
  remove: (id: string) => apiDelete(`${API_ENDPOINTS.loans}/${id}`),
};

export const meetingService = {
  list: (groupId?: string) =>
    apiGet<Meeting[]>(
      API_ENDPOINTS.meetings,
      groupId ? { groupId } : undefined,
    ),
  getById: (id: string) => apiGet<Meeting>(`${API_ENDPOINTS.meetings}/${id}`),
  create: (payload: Partial<Meeting>) =>
    apiPost<Meeting>(API_ENDPOINTS.meetings, payload),
  update: (id: string, payload: Partial<Meeting>) =>
    apiPut<Meeting>(`${API_ENDPOINTS.meetings}/${id}`, payload),
  remove: (id: string) => apiDelete(`${API_ENDPOINTS.meetings}/${id}`),
};

export const paymentService = {
  list: (groupId?: string) =>
    apiGet<Payment[]>(
      API_ENDPOINTS.payments,
      groupId ? { groupId } : undefined,
    ),
  create: (payload: Partial<Payment>) =>
    apiPost<Payment>(API_ENDPOINTS.payments, payload),
};

export const expenseService = {
  list: (groupId?: string) =>
    apiGet<Expense[]>(
      API_ENDPOINTS.expenses,
      groupId ? { groupId } : undefined,
    ),
  create: (payload: Partial<Expense>) =>
    apiPost<Expense>(API_ENDPOINTS.expenses, payload),
  update: (id: string, payload: Partial<Expense>) =>
    apiPut<Expense>(`${API_ENDPOINTS.expenses}/${id}`, payload),
};

export const fineService = {
  list: (groupId?: string) =>
    apiGet<Fine[]>(API_ENDPOINTS.fines, groupId ? { groupId } : undefined),
  create: (payload: Partial<Fine>) =>
    apiPost<Fine>(API_ENDPOINTS.fines, payload),
  update: (id: string, payload: Partial<Fine>) =>
    apiPut<Fine>(`${API_ENDPOINTS.fines}/${id}`, payload),
};

export const socialFundService = {
  list: (groupId?: string) =>
    apiGet<SocialFundRequest[]>(
      API_ENDPOINTS.socialFund,
      groupId ? { groupId } : undefined,
    ),
  create: (payload: Partial<SocialFundRequest>) =>
    apiPost<SocialFundRequest>(API_ENDPOINTS.socialFund, payload),
  update: (id: string, payload: Partial<SocialFundRequest>) =>
    apiPut<SocialFundRequest>(`${API_ENDPOINTS.socialFund}/${id}`, payload),
};

export const reportService = {
  list: () => apiGet<unknown[]>(API_ENDPOINTS.reports),
  getSummary: () => apiGet<DashboardSummary>(`${API_ENDPOINTS.dashboard}`),
};
