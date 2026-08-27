"use client";

import { useCallback, useState } from "react";
import { apiGet, apiPost, getAccessToken } from "@/lib/api/client";

export type JamiiType = {
  id: string | number;
  code: string;
  name: string;
  description?: string;
  defaultContribution?: number;
};
export type CreateJamiiType = {
  name: string;
  code?: string;
  description?: string;
  defaultContribution?: number;
  mandatory?: boolean;
};
export type JamiiRequest = {
  id: string | number;
  groupMemberId: string | number;
  memberName: string;
  membershipNumber?: string;
  fundTypeId: string | number;
  fundTypeName: string;
  reference: string;
  requestedAmount: number;
  approvedAmount?: number;
  reason?: string;
  status: string;
  requestedDate: string;
};
export type JamiiSummary = {
  totalContributions: number;
  totalApproved: number;
  totalPaid: number;
  pendingRequests: number;
  availableBalance: number;
  requestCount: number;
  pendingCount: number;
};
type Envelope<T> = { data?: T; message?: string };
const unwrap = <T>(response: T | Envelope<T>) =>
  response && typeof response === "object" && "data" in response
    ? ((response as Envelope<T>).data as T)
    : (response as T);

export function useJamii() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T>(operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Jamii request failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);
  const base = (groupId: string) => `/api/social-fund/group/${groupId}`;
  const bearerAuth = () => {
    const token = getAccessToken();
    if (!token)
      throw new Error("Your session has expired. Please sign in again.");
    return { auth: true, headers: { Authorization: `Bearer ${token}` } };
  };
  const requireGroupId = (groupId: string) => {
    if (!/^\d+$/.test(String(groupId || ""))) {
      throw new Error("A valid numeric group ID is required");
    }
    return String(groupId);
  };
  const types = useCallback(
    (groupId: string) =>
      run(
        async () =>
          unwrap(
            await apiGet<Envelope<JamiiType[]>>(
              `${base(requireGroupId(groupId))}/types`,
              undefined,
              bearerAuth(),
            ),
          ) ?? [],
      ),
    [run],
  );
  const requests = useCallback(
    (groupId: string) =>
      run(
        async () =>
          unwrap(
            await apiGet<Envelope<JamiiRequest[]>>(
              `${base(requireGroupId(groupId))}/requests`,
              undefined,
              bearerAuth(),
            ),
          ) ?? [],
      ),
    [run],
  );
  const createType = useCallback(
    (groupId: string, payload: CreateJamiiType) =>
      run(async () =>
        unwrap(
          await apiPost<Envelope<JamiiType>>(
            `${base(requireGroupId(groupId))}/types`,
            payload,
            bearerAuth(),
          ),
        ),
      ),
    [run],
  );
  const summary = useCallback(
    (groupId: string) =>
      run(async () =>
        unwrap(
          await apiGet<Envelope<JamiiSummary>>(
            `${base(requireGroupId(groupId))}/summary`,
            undefined,
            bearerAuth(),
          ),
        ),
      ),
    [run],
  );
  const request = useCallback(
    (groupId: string, payload: unknown) =>
      run(async () =>
        unwrap(
          await apiPost<Envelope<JamiiRequest>>(
            `${base(requireGroupId(groupId))}/requests`,
            payload,
            bearerAuth(),
          ),
        ),
      ),
    [run],
  );
  const approve = useCallback(
    (groupId: string, id: string | number, amount: number) =>
      run(async () =>
        unwrap(
          await apiPost<Envelope<JamiiRequest>>(
            `${base(requireGroupId(groupId))}/requests/${id}/approve?amount=${amount}`,
            {},
            bearerAuth(),
          ),
        ),
      ),
    [run],
  );
  const reject = useCallback(
    (groupId: string, id: string | number) =>
      run(async () =>
        unwrap(
          await apiPost<Envelope<JamiiRequest>>(
            `${base(requireGroupId(groupId))}/requests/${id}/reject`,
            {},
            bearerAuth(),
          ),
        ),
      ),
    [run],
  );
  const pay = useCallback(
    (groupId: string, id: string | number) =>
      run(async () =>
        unwrap(
          await apiPost<Envelope<JamiiRequest>>(
            `${base(requireGroupId(groupId))}/requests/${id}/pay`,
            {},
            bearerAuth(),
          ),
        ),
      ),
    [run],
  );
  return {
    loading,
    error,
    types,
    createType,
    requests,
    summary,
    request,
    approve,
    reject,
    pay,
  };
}
