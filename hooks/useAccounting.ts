"use client";

import { useCallback, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type Account = {
  id: number;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  active: boolean;
  debit: number;
  credit: number;
  balance: number;
};
export type LedgerLine = {
  id: number;
  transactionId: number;
  transactionDate: string;
  reference: string;
  description: string;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
};
export type TrialBalance = {
  accounts: Account[];
  totalDebit: number;
  totalCredit: number;
};
export type JournalLineInput = {
  accountId: number;
  debit?: number;
  credit?: number;
  description?: string;
};
export type JournalEntryInput = {
  reference?: string;
  description: string;
  transactionDate?: string;
  lines: JournalLineInput[];
};
type Envelope<T> = { data?: T };
const unwrap = <T>(value: Envelope<T> | T) =>
  value && typeof value === "object" && "data" in value
    ? ((value as Envelope<T>).data as T)
    : (value as T);

export function useAccounting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useCallback(async <T>(operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Accounting request failed.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);
  const base = (groupId: string) =>
    `${API_ENDPOINTS.accounting}/group/${groupId}`;
  return {
    loading,
    error,
    accounts: (groupId: string) =>
      request(
        async () =>
          unwrap(
            await apiGet<Envelope<Account[]>>(
              `${base(groupId)}/accounts`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    ledger: (groupId: string) =>
      request(
        async () =>
          unwrap(
            await apiGet<Envelope<LedgerLine[]>>(
              `${base(groupId)}/ledger`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    trialBalance: (groupId: string) =>
      request(async () =>
        unwrap(
          await apiGet<Envelope<TrialBalance>>(
            `${base(groupId)}/trial-balance`,
            undefined,
            { auth: true },
          ),
        ),
      ),
    post: (groupId: string, input: JournalEntryInput) =>
      request(async () =>
        unwrap(
          await apiPost<Envelope<LedgerLine>>(
            `${base(groupId)}/journal-entries`,
            input,
            { auth: true },
          ),
        ),
      ),
  };
}
