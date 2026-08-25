"use client";

import { useCallback, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type ShareSummary = {
  unitPrice: number;
  totalShares: number;
  totalCapital: number;
  holdersCount: number;
  totalMembers: number;
  maximumSharesPerMember?: number;
};

export type ShareOwnership = {
  groupMemberId: string | number;
  memberName: string;
  membershipNumber?: string;
  sharesOwned: number;
  unitPrice: number;
  equityValue: number;
  ownershipPercentage: number;
};

export type ShareTransaction = {
  id: string | number;
  groupMemberId: string | number;
  memberName: string;
  membershipNumber?: string;
  type:
    | "PURCHASE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "REDEMPTION"
    | "ADJUSTMENT";
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reference: string;
  transactionDate: string;
};

type ApiResponse<T> = { data?: T; message?: string };

function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data as T;
  }
  return response as T;
}

export function useShares() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Share request failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSummary = useCallback(
    (groupId: string) =>
      request(async () =>
        unwrap(
          await apiGet<ApiResponse<ShareSummary>>(
            `${API_ENDPOINTS.shares}/group/${groupId}/summary`,
            undefined,
            { auth: true },
          ),
        ),
      ),
    [request],
  );

  const getOwnership = useCallback(
    (groupId: string) =>
      request(
        async () =>
          unwrap(
            await apiGet<ApiResponse<ShareOwnership[]>>(
              `${API_ENDPOINTS.shares}/group/${groupId}/ownership`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    [request],
  );

  const getLedger = useCallback(
    (groupId: string) =>
      request(
        async () =>
          unwrap(
            await apiGet<ApiResponse<ShareTransaction[]>>(
              `${API_ENDPOINTS.shares}/group/${groupId}/ledger`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    [request],
  );

  const purchase = useCallback(
    (
      groupId: string,
      payload: {
        groupMemberId: string;
        quantity?: number;
        amount?: number;
        paymentMethod?: string;
        reference?: string;
      },
    ) =>
      request(async () =>
        unwrap(
          await apiPost<ApiResponse<ShareTransaction>>(
            `${API_ENDPOINTS.shares}/group/${groupId}/purchase`,
            payload,
            { auth: true },
          ),
        ),
      ),
    [request],
  );

  const transfer = useCallback(
    (
      groupId: string,
      payload: {
        fromGroupMemberId: string;
        toGroupMemberId: string;
        quantity: number;
        reference?: string;
      },
    ) =>
      request(async () =>
        unwrap(
          await apiPost<ApiResponse<ShareTransaction>>(
            `${API_ENDPOINTS.shares}/group/${groupId}/transfer`,
            payload,
            { auth: true },
          ),
        ),
      ),
    [request],
  );

  const redeem = useCallback(
    (
      groupId: string,
      payload: {
        groupMemberId: string;
        quantity: number;
        reference?: string;
      },
    ) =>
      request(async () =>
        unwrap(
          await apiPost<ApiResponse<ShareTransaction>>(
            `${API_ENDPOINTS.shares}/group/${groupId}/redemption`,
            payload,
            { auth: true },
          ),
        ),
      ),
    [request],
  );

  return {
    loading,
    error,
    getSummary,
    getOwnership,
    getLedger,
    purchase,
    transfer,
    redeem,
  };
}
