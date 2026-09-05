// File: vikoba-web/hooks/useContributions.ts
// API Hook for Contribution Operations

import { useState, useCallback } from "react";
import {
  apiGet,
  apiPost,
  apiPut,
  apiRequest,
  getAccessToken,
} from "@/lib/api/client";
import { API_ENDPOINTS, buildApiUrl } from "@/lib/api/endpoints";

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberAccountNumber?: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  contributionType: string;
  expectedAmount: number;
  paidAmount: number;
  balance: number;
  status: "PAID" | "PARTIAL" | "PENDING";
  paymentMethod?: string;
  paymentReference?: string;
  paymentDate?: string;
  remarks?: string;
}

export interface ContributionPeriod {
  id: string;
  name: string;
  displayText: string;
  startDate: string;
  endDate: string;
  expectedAmount: number;
}

export interface ContributionSummary {
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  membersCompleted: number;
  membersPartial: number;
  membersPending: number;
}

type ContributionSummaryResponse = {
  totalExpected?: number;
  totalCollected?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  totalBalance?: number;
  collectionRate?: number;
  membersCompleted?: number;
  membersPartial?: number;
  membersPending?: number;
};

export const useContributions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Record a single contribution
   */
  const recordContribution = useCallback(
    async (data: {
      groupMemberId: string;
      contributionPeriodId: string;
      paidAmount: number;
      paymentMethod: string;
      paymentReference?: string;
      remarks?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiPost<ApiResponse<unknown>>(
          `${API_ENDPOINTS.contributions}/record`,
          data,
          { auth: true },
        );
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to record contribution";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Upload bulk contributions from Excel file
   */
  const bulkUploadContributions = useCallback(
    async (groupId: string, file: File, remarks?: string) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("groupId", groupId);
        formData.append("file", file);
        if (remarks) {
          formData.append("remarks", remarks);
        }

        const response = await apiRequest<ApiResponse<unknown>>(
          `${API_ENDPOINTS.contributions}/bulk-upload`,
          {
            method: "POST",
            body: formData,
            auth: true,
          },
        );
        return response;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to upload contributions";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get all contributions for a group with filters
   */
  const getGroupContributions = useCallback(
    async (
      groupId: string,
      filters?: {
        status?: "PENDING" | "PAID" | "PARTIAL";
        periodId?: string;
        memberId?: string;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters?.status) params.append("status", filters.status);
        if (filters?.periodId) params.append("periodId", filters.periodId);
        if (filters?.memberId) params.append("memberId", filters.memberId);

        const response = await apiGet<ApiResponse<Contribution[]>>(
          `${API_ENDPOINTS.contributions}/group/${groupId}${params.toString() ? "?" + params.toString() : ""}`,
          undefined,
          { auth: true },
        );
        return response.data ?? [];
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch contributions";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get contribution summary for a group
   */
  const getContributionSummary = useCallback(
    async (groupId: string): Promise<ContributionSummary> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiGet<ApiResponse<ContributionSummaryResponse>>(
          `${API_ENDPOINTS.contributions}/group/${groupId}/summary`,
          undefined,
          { auth: true },
        );
        const summary = response.data;
        return {
          totalExpected: summary?.totalExpected ?? 0,
          totalCollected: summary?.totalCollected ?? summary?.totalPaid ?? 0,
          totalOutstanding:
            summary?.totalOutstanding ?? summary?.totalBalance ?? 0,
          collectionRate: summary?.collectionRate ?? 0,
          membersCompleted: summary?.membersCompleted ?? 0,
          membersPartial: summary?.membersPartial ?? 0,
          membersPending: summary?.membersPending ?? 0,
        };
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch summary";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get contribution periods for a group
   */
  const getContributionPeriods = useCallback(
    async (groupId: string): Promise<ContributionPeriod[]> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiGet<ApiResponse<ContributionPeriod[]>>(
          `${API_ENDPOINTS.contributions}/periods?groupId=${groupId}`,
          undefined,
          { auth: true },
        );
        return (response.data ?? []).map((period: any) => ({
          id: String(period.id),
          name: period.name ?? period.contributionTypeName ?? "Contribution",
          displayText:
            period.displayText ??
            period.contributionTypeName ??
            "Contribution period",
          startDate: period.startDate ?? period.periodStart,
          endDate: period.endDate ?? period.periodEnd,
          expectedAmount: Number(period.expectedAmount ?? 0),
        }));
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch periods";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get member contribution history
   */
  const getMemberContributions = useCallback(
    async (groupMemberId: string): Promise<Contribution[]> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiGet<ApiResponse<Contribution[]>>(
          `${API_ENDPOINTS.contributions}/member/${groupMemberId}`,
          undefined,
          { auth: true },
        );
        return response.data ?? [];
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch member contributions";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Update a contribution
   */
  const updateContribution = useCallback(
    async (
      contributionId: string,
      data: {
        groupMemberId: string;
        contributionPeriodId: string;
        paidAmount: number;
        paymentMethod: string;
        paymentReference?: string;
        remarks?: string;
      },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiPut<ApiResponse<unknown>>(
          `${API_ENDPOINTS.contributions}/${contributionId}`,
          data,
          { auth: true },
        );
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to update contribution";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Download Excel template
   */
  const downloadExcelTemplate = useCallback(async () => {
    try {
      const headers: HeadersInit = {};
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.contributions}/template/download`),
        { headers },
      );
      if (!response.ok) throw new Error("Failed to download template");
      const blob = await response.blob();

      // Create blob link to download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `contribution_template_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to download template";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    loading,
    error,
    recordContribution,
    bulkUploadContributions,
    getGroupContributions,
    getContributionSummary,
    getContributionPeriods,
    getMemberContributions,
    updateContribution,
    downloadExcelTemplate,
  };
};
