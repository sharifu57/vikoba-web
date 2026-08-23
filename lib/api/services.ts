import { API_ENDPOINTS } from "./endpoints";
import { apiDelete, apiGet, apiPost, apiPut, setAuthTokens } from "./client";

export type UserSession = {
  id?: string | number | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  lastLoginAt?: string | null;
};

export type ApiResponse<T> = {
  status?: boolean;
  message?: string;
  token?: string | null;
  refreshToken?: string | null;
  expired?: string | null;
  data?: T;
};

export const authService = {
  login: (payload: { phone: string }) =>
    apiPost<ApiResponse<{ status: string | null }>>(
      API_ENDPOINTS.auth.login,
      payload,
      {
        auth: false,
      },
    ),
  register: (payload: { fullName: string; email: string; phone: string }) =>
    apiPost<ApiResponse<{ status: string | null }>>(
      API_ENDPOINTS.auth.register,
      payload,
      {
        auth: false,
      },
    ),
  verifyOtp: (payload: { phone: string; code: string; purpose?: string }) =>
    apiPost<ApiResponse<UserSession>>(API_ENDPOINTS.auth.verifyOtp, payload, {
      auth: false,
    }),
  resendOtp: (payload: { phone: string; purpose?: string }) =>
    apiPost<ApiResponse<null>>(API_ENDPOINTS.auth.resendOtp, payload, {
      auth: false,
    }),
  saveSession: (response: ApiResponse<unknown>) => {
    const payload = response as Record<string, unknown> & {
      data?: UserSession | Record<string, unknown>;
      token?: string | null;
      accessToken?: string | null;
      refreshToken?: string | null;
      expired?: string | null;
    };

    const user =
      payload?.data && (payload.data as any).user
        ? (payload.data as any).user
        : (payload?.data ?? null);
    const dataRecord =
      payload?.data && typeof payload.data === "object"
        ? (payload.data as Record<string, unknown>)
        : null;
    const tokenValue =
      typeof payload?.token === "string"
        ? payload.token
        : typeof dataRecord?.token === "string"
          ? dataRecord.token
          : typeof payload?.accessToken === "string"
            ? payload.accessToken
            : typeof dataRecord?.accessToken === "string"
              ? dataRecord.accessToken
              : null;
    const refreshTokenValue =
      typeof payload?.refreshToken === "string"
        ? payload.refreshToken
        : typeof dataRecord?.refreshToken === "string"
          ? dataRecord.refreshToken
          : null;
    const expiredValue =
      typeof payload?.expired === "string"
        ? payload.expired
        : typeof dataRecord?.expired === "string"
          ? dataRecord.expired
          : null;

    if (tokenValue) {
      setAuthTokens(tokenValue, refreshTokenValue || null);
      if (user) {
        const normalizedUser = {
          id: user.id ?? null,
          name: user.username || user.email || user.phone || "User",
          username: user.username || user.email || user.phone || "User",
          email: user.email || "",
          phone: user.phone || "",
          role: "Administrator",
          status: user.status || "ACTIVE",
          lastLoginAt: user.lastLoginAt || null,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("v360_user", JSON.stringify(normalizedUser));
          localStorage.setItem(
            "v360_session",
            JSON.stringify({
              user: normalizedUser,
              accessToken: tokenValue,
              refreshToken: refreshTokenValue || null,
              expired: expiredValue || null,
            }),
          );

          // Persist group(s) and settings if returned by the auth response
          try {
            // New server shape: data.groups = [{ group, settings, settingsConfigured }, ...]
            const groupsArray =
              (dataRecord?.groups as
                | Array<Record<string, unknown>>
                | undefined) ?? null;

            if (Array.isArray(groupsArray) && groupsArray.length > 0) {
              // persist full groups list for reference
              localStorage.setItem("v360_groups", JSON.stringify(groupsArray));

              // choose primary group: prefer the first item with settingsConfigured === true
              let primary =
                groupsArray.find((g) => (g as any)?.settingsConfigured) ??
                groupsArray[0];
              const grp = (primary as any)?.group ?? primary;
              const settings = (primary as any)?.settings ?? null;

              if (grp && (grp.groupId || grp.id)) {
                localStorage.setItem("v360_currentGroup", JSON.stringify(grp));
                localStorage.setItem(
                  "v360_currentGroupId",
                  String(grp.groupId ?? grp.id),
                );
                if (typeof grp.currency === "string") {
                  localStorage.setItem(
                    "v360_currentGroupCurrency",
                    grp.currency as string,
                  );
                }
              }

              if (settings) {
                localStorage.setItem(
                  "v360_group_settings",
                  JSON.stringify(settings),
                );
                localStorage.setItem("v360_group_setup_complete", "true");
                localStorage.setItem("v360_group_setup_done", "true");
              }
            } else {
              // legacy: single group at top-level
              const group = dataRecord?.group as
                | Record<string, unknown>
                | undefined;
              const settings = dataRecord?.settings as
                | Record<string, unknown>
                | undefined;
              if (group && (group.groupId || group.id)) {
                localStorage.setItem(
                  "v360_currentGroup",
                  JSON.stringify(group),
                );
                localStorage.setItem(
                  "v360_currentGroupId",
                  String(group.groupId ?? group.id),
                );
                if (typeof group.currency === "string") {
                  localStorage.setItem(
                    "v360_currentGroupCurrency",
                    group.currency as string,
                  );
                }
                localStorage.setItem("v360_group_setup_complete", "true");
                localStorage.setItem("v360_group_setup_done", "true");
              }
              if (settings) {
                localStorage.setItem(
                  "v360_group_settings",
                  JSON.stringify(settings),
                );
              }
            }
          } catch (e) {
            // ignore storage errors
            // eslint-disable-next-line no-console
            console.error("Failed to persist auth group data", e);
          }
        }
      }
    }
    return response;
  },
};

export type Group = {
  id: string;
  name: string;
  currency: string;
  phone?: string | null;
  email?: string | null;
  region?: string;
  createdAt?: string;
};

export type GroupSettingsPayload = {
  minimumContribution?: number;
  maximumContribution?: number;
  sharePrice?: number;
  maximumSharesPerMember?: number;
  loanMultiplier?: number;
  defaultInterestRate?: number;
  defaultLoanDurationMonths?: number;
  latePaymentFine?: number;
};

export type GroupProfileSettingsPayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  settings?: GroupSettingsPayload;
};

export type VikobaGroupCreateResponse = {
  organizationId?: number | null;
  groupId?: number | string | null;
  organizationName?: string | null;
  groupName?: string | null;
  groupCode?: string | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type GroupWithSettingsResponse = {
  group?: VikobaGroupCreateResponse | null;
  settings?: GroupSettingsPayload | null;
};

export type Member = {
  id: string;
  name?: string;
  memberNo?: string;
  groupId?: string;
  phone?: string;
  status?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  membershipNumber?: string;
  membershipType?: string;
  joinedDate?: string;
  fullName?: string;
};

export type MemberRoleOption = {
  value: string;
  label: string;
  description?: string;
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
  getWithSettings: (id: string) =>
    apiGet<GroupWithSettingsResponse>(
      `${API_ENDPOINTS.groups}/${id}`,
      undefined,
      { auth: true },
    ),
  create: (payload: Partial<Group>) =>
    apiPost<Group>(API_ENDPOINTS.groups, payload),
  saveProfileAndSettings: (payload: GroupProfileSettingsPayload) => {
    return apiPost<ApiResponse<GroupWithSettingsResponse>>(
      `${API_ENDPOINTS.groups}/setup`,
      payload,
      {
        auth: true,
      },
    );
  },
  remove: (id: string) => apiDelete(`${API_ENDPOINTS.groups}/${id}`),
};

export const memberService = {
  list: (groupId?: string) => {
    if (!groupId) {
      return apiGet<Member[]>(API_ENDPOINTS.members, undefined, { auth: true });
    }

    return apiGet<Member[]>(
      `${API_ENDPOINTS.members}/group/${groupId}`,
      undefined,
      {
        auth: true,
      },
    );
  },
  getRoles: () =>
    apiGet<MemberRoleOption[]>(`${API_ENDPOINTS.members}/roles`, undefined, {
      auth: true,
    }),
  getById: (id: string) =>
    apiGet<Member>(`${API_ENDPOINTS.members}/${id}`, undefined, { auth: true }),
  create: (payload: Record<string, unknown>) =>
    apiPost<Record<string, unknown>>(`${API_ENDPOINTS.members}`, payload, {
      auth: true,
    }),
  update: (id: string, payload: Partial<Member>) =>
    apiPut<Member>(`${API_ENDPOINTS.members}/${id}`, payload, { auth: true }),
  remove: (id: string) =>
    apiDelete(`${API_ENDPOINTS.members}/${id}`, { auth: true }),
  get360: (groupMemberId: string) =>
    apiGet<Member360Response>(
      `${API_ENDPOINTS.members}/${groupMemberId}/360`,
      undefined,
      { auth: true },
    ),
};
export type Member360Response = {
  member?: Member | null;
  contributions?: Contribution[];
  loans?: Loan[];
  fines?: Fine[];
  meetingAttendance?: Meeting[];
  socialFundContributions?: Payment[];
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
  listByGroup: (groupId: string) =>
    apiGet<Meeting[]>(
      `${API_ENDPOINTS.groups}/${groupId}/meetings`,
      undefined,
      {
        auth: true,
      },
    ),
  createForGroup: (groupId: string, payload: Partial<Meeting>) =>
    apiPost<Meeting>(`${API_ENDPOINTS.groups}/${groupId}/meetings`, payload, {
      auth: true,
    }),
  recordAttendance: (meetingId: string, payload: any) =>
    apiPost(`${API_ENDPOINTS.meetings}/${meetingId}/attendance`, payload, {
      auth: true,
    }),
  getAttendance: (meetingId: string) =>
    apiGet<any[]>(
      `${API_ENDPOINTS.meetings}/${meetingId}/attendance`,
      undefined,
      {
        auth: true,
      },
    ),
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
  getSummary: (groupId?: string) =>
    apiGet<DashboardSummary>(
      `${API_ENDPOINTS.dashboard}`,
      groupId ? { groupId } : undefined,
      { auth: true },
    ),
};
