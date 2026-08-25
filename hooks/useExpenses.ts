"use client";

import { useCallback, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type ExpenseRecord = {
  id: number;
  groupId: number;
  categoryId: number;
  categoryName: string;
  reference: string;
  description: string;
  amount: number;
  expenseDate: string;
  receiptNumber?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
};
export type ExpenseInput = {
  categoryId?: number;
  categoryName?: string;
  reference?: string;
  description?: string;
  amount?: number;
  expenseDate?: string;
  receiptNumber?: string;
  status?: string;
  rejectionReason?: string;
};
export type ExpenseCategory = {
  id: number;
  groupId: number;
  name: string;
  description?: string;
  active: boolean;
};
type ApiResponse<T> = { data?: T; message?: string };
const unwrap = <T>(response: ApiResponse<T> | T) =>
  response && typeof response === "object" && "data" in response
    ? ((response as ApiResponse<T>).data as T)
    : (response as T);

export function useExpenses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useCallback(async <T>(operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Expense request failed.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);
  const base = (groupId: string) =>
    `${API_ENDPOINTS.expenses}/group/${groupId}`;
  return {
    loading,
    error,
    list: (groupId: string) =>
      request(
        async () =>
          unwrap(
            await apiGet<ApiResponse<ExpenseRecord[]>>(
              base(groupId),
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    categories: (groupId: string) =>
      request(
        async () =>
          unwrap(
            await apiGet<ApiResponse<ExpenseCategory[]>>(
              `${base(groupId)}/categories`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    create: (groupId: string, input: ExpenseInput) =>
      request(async () =>
        unwrap(
          await apiPost<ApiResponse<ExpenseRecord>>(base(groupId), input, {
            auth: true,
          }),
        ),
      ),
    update: (groupId: string, expenseId: number, input: ExpenseInput) =>
      request(async () =>
        unwrap(
          await apiPut<ApiResponse<ExpenseRecord>>(
            `${base(groupId)}/${expenseId}`,
            input,
            { auth: true },
          ),
        ),
      ),
    remove: (groupId: string, expenseId: number) =>
      request(async () =>
        apiDelete(`${base(groupId)}/${expenseId}`, { auth: true }),
      ),
  };
}
