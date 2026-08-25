export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8050";

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/lookup",
    register: "/api/auth/register",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
    verifyOtp: "/api/auth/verify-otp",
    resendOtp: "/api/auth/resend-otp",
  },

  organizations: "/api/organizations",
  dashboard: "/api/dashboard",
  groups: "/api/groups",
  members: "/api/members",
  contributions: "/api/contributions",
  shares: "/api/shares",
  loans: "/api/loans",
  meetings: "/api/meetings",
  payments: "/api/payments",
  expenses: "/api/expenses",
  fines: "/api/fines",
  socialFund: "/api/social-fund",
  reports: "/api/reports",
  users: "/api/users",
  roles: "/api/roles",
  settings: "/api/settings",
  auditLogs: "/api/audit-logs",
} as const;

export function buildApiUrl(path: string) {
  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
