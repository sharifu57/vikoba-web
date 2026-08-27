"use client";

import { useCallback, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type UniversalPayment = {
  id: string | number;
  groupMemberId?: string | number;
  memberName: string;
  membershipNumber?: string;
  reference: string;
  externalReference?: string;
  amount: number;
  paymentMethod: "CASH" | "BANK" | "MOBILE_MONEY" | "CONTROL_NUMBER";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  allocationType?:
    | "CONTRIBUTION"
    | "SHARE_PURCHASE"
    | "LOAN_REPAYMENT"
    | "FINE"
    | "SOCIAL_FUND"
    | "OTHER";
  allocationReferenceId?: string | number;
  description?: string;
  paymentDate: string;
};

type ApiResponse<T> = { data?: T; message?: string };

const unwrap = <T>(response: ApiResponse<T> | T): T =>
  response && typeof response === "object" && "data" in response
    ? ((response as ApiResponse<T>).data as T)
    : (response as T);

export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useCallback(async <T>(operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Payment request failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const list = useCallback(
    (groupId: string) =>
      request(
        async () =>
          unwrap(
            await apiGet<ApiResponse<UniversalPayment[]>>(
              `${API_ENDPOINTS.payments}/group/${groupId}`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    [request],
  );

  const record = useCallback(
    (
      groupId: string,
      payload: {
        groupMemberId?: string;
        amount: number;
        paymentMethod: string;
        reference?: string;
        externalReference?: string;
        allocationType: string;
        allocationReferenceId?: number;
        description?: string;
      },
    ) =>
      request(async () =>
        unwrap(
          await apiPost<ApiResponse<UniversalPayment>>(
            `${API_ENDPOINTS.payments}/group/${groupId}`,
            payload,
            { auth: true },
          ),
        ),
      ),
    [request],
  );

  return { loading, error, list, record };
}
