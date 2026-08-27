"use client";
import { useCallback, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
export type Loan = {
  id: number;
  groupMemberId: number;
  memberName: string;
  membershipNumber: string;
  loanProductId: number;
  loanProductName: string;
  interestRate: number;
  loanNumber: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  durationMonths: number;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  maturityDate?: string;
  status: string;
  purpose: string;
  rejectionReason?: string;
  totalPaid: number;
  remainingBalance: number;
  progress: number;
};
export type LoanProduct = {
  id: number;
  code: string;
  name: string;
  minimumAmount: number;
  maximumAmount: number;
  interestRate: number;
  maxDurationMonths: number;
  active: boolean;
};
export type Installment = {
  id: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
};
type Envelope<T> = { data?: T };
const unbox = <T>(v: Envelope<T> | T) =>
  v && typeof v === "object" && "data" in v
    ? ((v as Envelope<T>).data as T)
    : (v as T);
export function useLoans() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T>(op: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await op();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Loan request failed.";
      setError(m);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  const base = (g: string) => `${API_ENDPOINTS.loans}/group/${g}`;
  return {
    loading,
    error,
    list: (g: string) =>
      run(
        async () =>
          unbox(
            await apiGet<Envelope<Loan[]>>(`${base(g)}`, undefined, {
              auth: true,
            }),
          ) ?? [],
      ),
    products: (g: string) =>
      run(
        async () =>
          unbox(
            await apiGet<Envelope<LoanProduct[]>>(
              `${base(g)}/products`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    apply: (g: string, p: unknown) =>
      run(async () =>
        unbox(
          await apiPost<Envelope<Loan>>(`${base(g)}/applications`, p, {
            auth: true,
          }),
        ),
      ),
    approve: (g: string, id: number) =>
      run(async () =>
        unbox(
          await apiPost<Envelope<Loan>>(
            `${base(g)}/${id}/approve`,
            {},
            { auth: true },
          ),
        ),
      ),
    reject: (g: string, id: number, rejectionReason: string) =>
      run(async () =>
        unbox(
          await apiPost<Envelope<Loan>>(
            `${base(g)}/${id}/reject`,
            { rejectionReason },
            { auth: true },
          ),
        ),
      ),
    disburse: (g: string, id: number) =>
      run(async () =>
        unbox(
          await apiPost<Envelope<Loan>>(
            `${base(g)}/${id}/disburse`,
            {},
            { auth: true },
          ),
        ),
      ),
    schedule: (g: string, id: number) =>
      run(
        async () =>
          unbox(
            await apiGet<Envelope<Installment[]>>(
              `${base(g)}/${id}/schedule`,
              undefined,
              { auth: true },
            ),
          ) ?? [],
      ),
    repay: (g: string, id: number, amount: number, paymentMethod: string) =>
      run(async () =>
        unbox(
          await apiPost<Envelope<Loan>>(
            `${base(g)}/${id}/repayments`,
            { amount, paymentMethod },
            { auth: true },
          ),
        ),
      ),
    assessOverdue: (g: string) =>
      run(async () =>
        unbox(
          await apiPost<Envelope<number>>(
            `${base(g)}/assess-overdue`,
            {},
            { auth: true },
          ),
        ),
      ),
  };
}
