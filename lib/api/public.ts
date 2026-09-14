import { apiGet } from "./client";

export type PublicStatistics = {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  totalContributions: number;
  totalShares: number;
  totalLoansIssued: number;
  totalLoanAmount: number;
  totalTransactions: number;
};

export type PublicGrowthPoint = {
  label: string;
  groups: number;
  members: number;
};

export type PublicFinancialPoint = {
  label: string;
  contributions: number;
  shares: number;
  loans: number;
};

export type PublicPlatformData = {
  statistics: PublicStatistics;
  growth: PublicGrowthPoint[];
  financialActivity: PublicFinancialPoint[];
};

const emptyStatistics: PublicStatistics = {
  totalGroups: 0,
  activeGroups: 0,
  totalMembers: 0,
  totalContributions: 0,
  totalShares: 0,
  totalLoansIssued: 0,
  totalLoanAmount: 0,
  totalTransactions: 0,
};

export async function getPublicPlatformData(): Promise<PublicPlatformData> {
  try {
    const response = await apiGet<{ data?: Partial<PublicPlatformData> }>(
      "/api/v1/public/platform-summary",
      undefined,
      { auth: false, cache: "no-store" },
    );
    const payload = response?.data ?? {};

    return {
      statistics: { ...emptyStatistics, ...(payload.statistics ?? {}) },
      growth: Array.isArray(payload.growth) ? payload.growth : [],
      financialActivity: Array.isArray(payload.financialActivity)
        ? payload.financialActivity
        : [],
    };
  } catch (error) {
    console.warn("Public platform summary unavailable", error);
    throw error;
  }
}
