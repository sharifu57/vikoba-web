"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  contributionService,
  expenseService,
  fineService,
  groupService,
  loanService,
  memberService,
  meetingService,
  paymentService,
  reportService,
  socialFundService,
  type Contribution,
  type Expense,
  type Fine,
  type Group,
  type Loan,
  type Meeting,
  type Member,
  type Payment,
  type SocialFundRequest,
} from "@/lib/api/services";

const queryKeys = {
  groups: ["groups"],
  members: ["members"],
  contributions: ["contributions"],
  loans: ["loans"],
  meetings: ["meetings"],
  payments: ["payments"],
  expenses: ["expenses"],
  fines: ["fines"],
  socialFund: ["socialFund"],
  dashboard: ["dashboard"],
} as const;

export function useGroups(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.groups, groupId],
    queryFn: () => groupService.list(),
    staleTime: 30_000,
  });
}

export function useMembers(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.members, groupId],
    queryFn: () => memberService.list(groupId),
    staleTime: 30_000,
  });
}

export function useContributions(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.contributions, groupId],
    queryFn: () => contributionService.list(groupId),
    staleTime: 30_000,
  });
}

export function useLoans(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.loans, groupId],
    queryFn: () => loanService.list(groupId),
    staleTime: 30_000,
  });
}

export function useMeetings(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.meetings, groupId],
    queryFn: () =>
      groupId ? meetingService.listByGroup(groupId) : meetingService.list(),
    staleTime: 30_000,
  });
}

export function usePayments(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.payments, groupId],
    queryFn: () => paymentService.list(groupId),
    staleTime: 30_000,
  });
}

export function useExpenses(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses, groupId],
    queryFn: () => expenseService.list(groupId),
    staleTime: 30_000,
  });
}

export function useFines(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.fines, groupId],
    queryFn: () => fineService.list(groupId),
    staleTime: 30_000,
  });
}

export function useSocialFund(groupId?: string) {
  return useQuery({
    queryKey: [...queryKeys.socialFund, groupId],
    queryFn: () => socialFundService.list(groupId),
    staleTime: 30_000,
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => reportService.getSummary(),
    staleTime: 30_000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Group>) => groupService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Member>) => memberService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

export function useCreateContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Contribution>) =>
      contributionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contributions });
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Loan>) => loanService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loans });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Payment>) => paymentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.contributions });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Expense>) => expenseService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
  });
}

export function useCreateFine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Fine>) => fineService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fines });
    },
  });
}

export function useCreateSocialFundRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<SocialFundRequest>) =>
      socialFundService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialFund });
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { groupId: string; data: Partial<Meeting> }) =>
      meetingService.createForGroup(payload.groupId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings });
    },
  });
}
