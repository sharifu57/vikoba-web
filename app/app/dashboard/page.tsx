"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useVikobaStore, type Group } from "@/lib/mockStore";
import { SystemLoader } from "@/components/system-loader";
import {
  memberService,
  reportService,
  type DashboardOverview,
  type DashboardSummary,
  type Member360Response,
} from "@/lib/api/services";
import {
  Users,
  WalletCards,
  BarChart3,
  HandCoins,
  Landmark,
  CircleDollarSign,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  UserRound,
  CalendarRange,
  TrendingUp,
} from "lucide-react";

type DashboardAccess = {
  roles: string[];
  permissions: string[];
  groupMemberId: string | null;
  canViewGroupDashboard: boolean;
};

type StoredGroupMembership = {
  group?: { id?: string | number; groupId?: string | number };
  id?: string | number;
  groupId?: string | number;
  groupMemberId?: string | number;
  membershipId?: string | number;
  role?: string;
  roles?: string[];
  permissions?: string[];
};

const dashboardRoleOrder = [
  "GROUP_ADMIN",
  "GROUP_CHAIRMAN",
  "ACCOUNTANT",
  "TREASURER",
  "LOAN_OFFICER",
  "SECRETARY",
  "AUDITOR",
  "MEMBER",
];

const toAccessList = (value: unknown) =>
  Array.isArray(value)
    ? value.map(String).map((item) => item.toUpperCase())
    : [];

const primaryRole = (roles: string[]) =>
  dashboardRoleOrder.find((role) => roles.includes(role)) ?? "MEMBER";

const canAccessGroupDashboard = (roles: string[], permissions: string[]) => {
  if (roles.includes("GROUP_ADMIN") || permissions.includes("DASHBOARD_GROUP_VIEW")) {
    return true;
  }

  return roles.some((role) => role !== "MEMBER") && permissions.includes("REPORT_VIEW");
};

const formatCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function DashboardPage() {
  const {
    isHydrated,
    currentGroup,
    members,
    payments,
    loans,
    fines,
    meetings,
  } = useVikobaStore();

  const [currentUser, setCurrentUser] = useState({
    name: "User",
    email: "",
    phone: "",
    role: "MEMBER",
  });

  const [serverStats, setServerStats] = useState<DashboardSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [access, setAccess] = useState<DashboardAccess>({
    roles: ["MEMBER"],
    permissions: [],
    groupMemberId: null,
    canViewGroupDashboard: false,
  });
  const [accessReady, setAccessReady] = useState(false);
  const [memberOverview, setMemberOverview] = useState<Member360Response | null>(null);
  const [loadingMemberOverview, setLoadingMemberOverview] = useState(false);
  const [memberOverviewError, setMemberOverviewError] = useState("");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userJson = window.localStorage.getItem("v360_user");
    const sessionJson = window.localStorage.getItem("v360_session");
    const currentGroupJson = window.localStorage.getItem("v360_currentGroup");
    const storedGroupsJson = window.localStorage.getItem("v360_groups");

    let sessionUser: Record<string, unknown> | null = null;
    let storedUser: Record<string, unknown> | null = null;
    let currentGroupRecord: Record<string, unknown> | null = null;
    let storedGroups: StoredGroupMembership[] = [];

    try {
      sessionUser = sessionJson ? JSON.parse(sessionJson)?.user ?? null : null;
      storedUser = userJson ? JSON.parse(userJson) : null;
      currentGroupRecord = currentGroupJson ? JSON.parse(currentGroupJson) : null;
      storedGroups = storedGroupsJson ? JSON.parse(storedGroupsJson) : [];
    } catch {
      // A malformed local session must not grant dashboard access.
    }

    const selectedUser = sessionUser || storedUser;
    const selectedGroupId = String(
      currentGroupRecord?.id ??
      currentGroupRecord?.groupId ??
      window.localStorage.getItem("v360_currentGroupId") ??
      currentGroup?.id ??
      "",
    );
    const membership = storedGroups.find((item) =>
      String(item.group?.groupId ?? item.group?.id ?? item.groupId ?? item.id) === selectedGroupId,
    );
    const storedRoles = toAccessList(membership?.roles);
    const fallbackRole = String(
      membership?.role ?? window.localStorage.getItem("v360_currentGroupRole") ?? "MEMBER",
    ).toUpperCase();
    const roles = Array.from(new Set(storedRoles.length ? storedRoles : [fallbackRole]));
    const storedPermissions = toAccessList(membership?.permissions);
    let fallbackPermissions: string[] = [];

    try {
      fallbackPermissions = toAccessList(
        JSON.parse(window.localStorage.getItem("v360_currentGroupPermissions") ?? "[]"),
      );
    } catch {
      fallbackPermissions = [];
    }

    const permissions = Array.from(new Set(storedPermissions.length ? storedPermissions : fallbackPermissions));
    const groupMemberId = membership?.groupMemberId ?? membership?.membershipId ??
      window.localStorage.getItem("v360_currentGroupMemberId");

    setAccess({
      roles,
      permissions,
      groupMemberId: groupMemberId === null || groupMemberId === undefined ? null : String(groupMemberId),
      canViewGroupDashboard: canAccessGroupDashboard(roles, permissions),
    });
    setAccessReady(true);

    if (selectedUser) {
      setCurrentUser({
        name: String(selectedUser.name || selectedUser.username || "User"),
        email: String(selectedUser.email || ""),
        phone: String(selectedUser.phone || ""),
        role: primaryRole(roles),
      });
    }
  }, [currentGroup?.id]);

  useEffect(() => {
    // Resolve numeric group id: try v360_currentGroup JSON, fallback to v360_currentGroupId, then currentGroup.id
    if (typeof window === "undefined") return;
    if (!access.canViewGroupDashboard) {
      setServerStats(null);
      setLoadingStats(false);
      return;
    }

    const currentGroupRaw = window.localStorage.getItem("v360_currentGroup");
    const fallbackGroupId = window.localStorage.getItem("v360_currentGroupId");

    let resolvedId: number | null = null;

    if (currentGroupRaw) {
      try {
        const parsed = JSON.parse(currentGroupRaw);
        const candidate = parsed?.id ?? parsed?.groupId ?? parsed?.id;
        if (candidate !== undefined && candidate !== null) {
          const asNum = Number(candidate);
          if (!Number.isNaN(asNum)) resolvedId = asNum;
        }
      } catch {
        // ignore
      }
    }

    if (resolvedId === null && fallbackGroupId) {
      const asNum = Number(fallbackGroupId);
      if (!Number.isNaN(asNum)) resolvedId = asNum;
    }

    if (
      resolvedId === null &&
      currentGroup?.id !== undefined &&
      currentGroup?.id !== null
    ) {
      const asNum = Number(currentGroup.id);
      if (!Number.isNaN(asNum)) resolvedId = asNum;
    }

    if (resolvedId === null) {
      console.log(
        "No numeric group id available; skipping server stats fetch.",
      );
      return;
    }

    console.log("Fetching ======>>>> numeric group ID:", resolvedId);
    setLoadingStats(true);
    reportService
      .getSummary(String(resolvedId))
      .then((res) => {
        const payload = res as any;
        const data = payload?.data ?? res;

        const normalized: DashboardSummary = {
          totalMembers: (data?.totalGroupMembers ??
            data?.totalMembers ??
            0) as number,
          totalSaved: (data?.totalGroupContributionAmount ??
            data?.totalSaved ??
            0) as number,
          totalOutstanding: (data?.totalGroupOutStandingLoan ??
            data?.totalOutstanding ??
            0) as number,
          // backend may return totalShares (count) or not; fall back to outstanding loan amount
          totalLoans: (data?.totalShares ??
            data?.totalLoans ??
            data?.totalGroupOutStandingLoan ??
            0) as number,
        };

        setServerStats(normalized);
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats", err);
        setServerStats(null);
      })
      .finally(() => setLoadingStats(false));
  }, [access.canViewGroupDashboard, currentGroup?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!access.canViewGroupDashboard) {
      setOverview(null);
      return;
    }
    const storedId = window.localStorage.getItem("v360_currentGroupId") || "";
    const numericGroupId = /^\d+$/.test(storedId) ? storedId : "";
    if (!numericGroupId) return;

    reportService.getOverview(numericGroupId)
      .then((response) => setOverview(response.data ?? null))
      .catch((error) =>
        console.error("Failed to load live dashboard overview", error),
      );
  }, [access.canViewGroupDashboard, currentGroup?.id]);

  useEffect(() => {
    if (access.canViewGroupDashboard) {
      setMemberOverview(null);
      setMemberOverviewError("");
      setLoadingMemberOverview(false);
      return;
    }

    if (!access.groupMemberId) {
      setMemberOverview(null);
      setMemberOverviewError("Your membership details are not available in this session. Please sign out and sign in again.");
      return;
    }

    let active = true;
    setLoadingMemberOverview(true);
    setMemberOverviewError("");

    memberService.get360(access.groupMemberId)
      .then((response) => {
        if (!active) return;
        if (response.status && response.data) {
          setMemberOverview(response.data);
          return;
        }
        setMemberOverviewError(response.message || "Unable to load your member information.");
      })
      .catch((error: Error) => {
        if (active) setMemberOverviewError(error.message || "Unable to load your member information.");
      })
      .finally(() => {
        if (active) setLoadingMemberOverview(false);
      });

    return () => {
      active = false;
    };
  }, [access.canViewGroupDashboard, access.groupMemberId]);

  if (!isHydrated || !accessReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SystemLoader label="Preparing your dashboard" />
      </div>
    );
  }

  if (!access.canViewGroupDashboard) {
    return (
      <MemberDashboard
        currentGroup={currentGroup}
        currentUser={currentUser}
        memberOverview={memberOverview}
        loading={loadingMemberOverview}
        error={memberOverviewError}
      />
    );
  }

  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalMembers = overview?.summary.totalMembers ?? serverStats?.totalMembers ?? 0;
  const groupSharesVal = overview?.summary.shareCapital ?? 0;

  const activeLoans = loans.filter(
    (l) => l.groupId === currentGroup.id && l.status === "DISBURSED",
  );
  const totalOutstandingLoans = overview?.summary.outstandingLoans ?? serverStats?.totalOutstanding ?? 0;

  const unpaidFines = fines.filter(
    (f) => f.groupId === currentGroup.id && f.status === "UNPAID",
  );
  const totalOutstandingFines = unpaidFines.reduce(
    (sum, f) => sum + (f.outstanding ?? 0),
    0,
  );

  const upcomingMeeting = overview?.nextMeetings[0];
  const pendingLoans = overview?.actions.pendingLoanApplications ?? 0;
  const contributionArrears = overview?.actions.membersWithContributionArrears ?? 0;
  const outstandingFinesCount = overview?.actions.unpaidFines ?? 0;
  const upcomingMeetingsCount = overview?.actions.upcomingMeetings ?? 0;
  const groupPayments = [...(overview?.recentActivities ?? [])]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 5);
  const actionItems = [
    {
      label: "Loan applications",
      count: pendingLoans,
      href: "/app/loans/applications",
      badgeClass: "bg-orange-100 text-orange-700",
    },
    {
      label: "Contribution arrears",
      count: contributionArrears,
      href: "/app/contributions",
      badgeClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Unpaid fines",
      count: outstandingFinesCount,
      href: "/app/fines",
      badgeClass: "bg-red-100 text-red-700",
    },
    {
      label: "Upcoming meetings",
      count: upcomingMeetingsCount,
      href: "/app/meetings",
      badgeClass: "bg-[#E7F2ED] text-[#0B6B50]",
    },
    {
      label: "Active loans to review",
      count: activeLoans.length,
      href: "/app/loans",
      badgeClass: "bg-[#F4E5C5] text-[#8A5A10]",
    },
  ].slice(0, 5);
  const cashBalance = overview?.finance.cashReceived ?? 0;
  const bankBalance = overview?.finance.bankReceived ?? 0;
  const jamiiFund = overview?.finance.socialFundReceived ?? 0;

  const chartMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return date;
  });
  const shareTrend = chartMonths.map((month) => overview?.shareTrend.find(point => point.month === `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`)?.amount ?? 0);
  const maxTrend = Math.max(...shareTrend, 1);
  const groupStart = currentGroup.startDate || "2024-01-15";
  const groupEnd = currentGroup.endDate || "2030-01-15";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 rounded-xl border border-[#0B6B50] bg-[#0B6B50] p-6 text-white shadow-[0_12px_28px_rgba(11,107,80,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
              <span>Overview</span>
              <span className="text-emerald-200">/</span>
              <span>Dashboard</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {greeting}, {currentUser.name}
            </h1>
            <p className="mt-2 text-sm text-emerald-50">
              {currentGroup.name} is active today • {todayStr}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm min-w-55">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
              Current KIKOBA group
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-black text-[#0B6B50]">
                {currentGroup.name.substring(0, 1)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {currentGroup.name}
                </p>
                <p className="text-[10px] text-emerald-100">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
              <CalendarRange size={12} />
              Started
            </div>
            <p className="mt-2 text-base font-black text-white">
              {formatDate(groupStart)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
              <CalendarDays size={12} />
              End date
            </div>
            <p className="mt-2 text-base font-black text-white">
              {formatDate(groupEnd)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
              <UserRound size={12} />
              Active member
            </div>
            <p className="mt-2 text-base font-black text-white">
              {currentUser.name}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Members",
            value: totalMembers,
            meta: "Active members",
            icon: Users,
            href: "/app/members",
          },
          {
            title: "Shares",
            value: formatCurrency(groupSharesVal, currentGroup.currency),
            meta: "Capital value",
            icon: BarChart3,
            href: "/app/shares",
          },
          {
            title: "Outstanding Loans",
            value: formatCurrency(totalOutstandingLoans, currentGroup.currency),
            meta: `${activeLoans.length} active`,
            icon: HandCoins,
            href: "/app/loans",
          },
          {
            title: "Jamii Fund",
            value: formatCurrency(jamiiFund, currentGroup.currency),
            meta: "Community support fund",
            icon: CircleDollarSign,
            href: "/app/social-fund",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  {item.title}
                </p>
                <div className="rounded-xl bg-[#E7F2ED] p-2 text-[#0B6B50]">
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-4 text-xl font-black text-neutral-900">
                {item.value}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2 text-[10px] text-neutral-500">
                <span>{item.meta}</span>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 font-bold text-[#0B6B50]"
                >
                  View <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-neutral-800">
                Share purchase trend
              </h2>
              <p className="text-[10px] text-neutral-400">
                Monthly collection performance
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#E7F2ED] px-2 py-1 text-[9px] font-bold text-[#0B6B50]">
              <span className="h-2 w-2 rounded-full bg-[#D99A2B]" /> Shares
            </div>
          </div>

          <div className="mt-6 flex h-56 items-stretch gap-3">
            {shareTrend.map((value, index) => (
              <div
                key={index}
                className="flex min-w-0 flex-1 flex-col"
              >
                <div className="relative min-h-0 flex-1 border-b border-l border-neutral-200 bg-[linear-gradient(to_bottom,transparent_24%,#f5f5f5_25%,transparent_26%,transparent_49%,#f5f5f5_50%,transparent_51%,transparent_74%,#f5f5f5_75%,transparent_76%)] px-1">
                  <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-center gap-1">
                    <div
                      className="w-full min-h-0 rounded-t-lg bg-[#D99A2B] transition-[height] duration-500"
                      style={{ height: `${(value / maxTrend) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="pt-2 text-center text-[9px] font-semibold text-neutral-400">
                  {chartMonths[index].toLocaleString("en-GB", {
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h2 className="text-sm font-black text-neutral-800">
                  Next meeting
                </h2>
                <p className="text-[10px] text-neutral-400">Weekly assembly</p>
              </div>
              <CalendarDays className="text-[#0B6B50]" size={18} />
            </div>

            {upcomingMeeting ? (
              <div className="mt-3 rounded-2xl bg-[#F2F7F4] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white text-[#0B6B50] shadow-sm">
                    <span className="text-lg font-black">
                      {new Date(upcomingMeeting.date).getDate()}
                    </span>
                    <span className="text-[8px] font-black uppercase">
                      {new Date(upcomingMeeting.date).toLocaleString("en-GB", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-800">
                      {upcomingMeeting.title ||
                        upcomingMeeting.agenda ||
                        "Group meeting"}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {upcomingMeeting.location || "Location not set"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-2.5 py-2 text-[10px] text-neutral-600">
                  <span>
                    {upcomingMeeting.startTime || "Time not set"}
                  </span>
                  <span>{upcomingMeeting.status || "SCHEDULED"}</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-[#E5E7EB] p-4 text-center text-xs text-neutral-400">
                No upcoming meeting scheduled.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h2 className="text-sm font-black text-neutral-800">
                  Group finance
                </h2>
                <p className="text-[10px] text-neutral-400">Quick summary</p>
              </div>
              <Landmark className="text-[#0B6B50]" size={18} />
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "Cash received",
                  value: formatCurrency(cashBalance, currentGroup.currency),
                  icon: Landmark,
                },
                {
                  label: "Bank received",
                  value: formatCurrency(bankBalance, currentGroup.currency),
                  icon: Landmark,
                },
                {
                  label: "Jamii fund",
                  value: formatCurrency(jamiiFund, currentGroup.currency),
                  icon: CircleDollarSign,
                },
                {
                  label: "Unpaid fines",
                  value: formatCurrency(
                    totalOutstandingFines,
                    currentGroup.currency,
                  ),
                  icon: AlertCircle,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="rounded-lg bg-white p-1.5 text-[#0B6B50]">
                        <Icon size={12} />
                      </div>
                      <span className="text-[10px] font-semibold">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-neutral-800">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-sm font-black text-neutral-800">
                Recent activity
              </h2>
              <p className="text-[10px] text-neutral-400">
                Latest payment records
              </p>
            </div>
            <Link
              href="/app/payments"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B6B50]"
            >
              View ledger <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-bold">Date</th>
                  <th className="px-3 py-2 font-bold">Member</th>
                  <th className="px-3 py-2 font-bold">Type</th>
                  <th className="px-3 py-2 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {groupPayments.map((payment, index) => {
                  const memberName = payment.memberName || "Group payment";
                  return (
                    <tr
                      key={`${payment.reference}-${index}`}
                      className="border-t border-neutral-100"
                    >
                      <td className="px-3 py-2 text-neutral-600">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-neutral-800">
                        {memberName}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                          {payment.type || "OTHER"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-black text-neutral-800">
                        {formatCurrency(payment.amount, currentGroup.currency)}
                      </td>
                    </tr>
                  );
                })}
                {groupPayments.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-5 text-center text-neutral-400"
                    >
                      No payments logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-sm font-black text-neutral-800">
                Actions needed
              </h2>
              <p className="text-[10px] text-neutral-400">Priority notices</p>
            </div>
            <CheckCircle2 className="text-[#0B6B50]" size={18} />
          </div>

          <div className="space-y-3">
            {actionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 transition-colors hover:border-[#E9EFEB] hover:bg-[#F2F7F4]"
              >
                <span className="text-[10px] font-semibold text-neutral-700">
                  {item.label}
                </span>
                <span className={`rounded-full px-2 py-1 text-[9px] font-black ${item.badgeClass}`}>
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type MemberDashboardProps = {
  currentGroup: Group;
  currentUser: { name: string; email: string; phone: string; role: string };
  memberOverview: Member360Response | null;
  loading: boolean;
  error: string;
};

function MemberDashboard({
  currentGroup,
  currentUser,
  memberOverview,
  loading,
  error,
}: MemberDashboardProps) {
  const member = memberOverview?.member;
  const loans = memberOverview?.loans ?? [];
  const fines = memberOverview?.fines ?? [];
  const socialFund = memberOverview?.socialFundContributions ?? [];
  const upcomingMeetings = (memberOverview?.upcomingMeetings ?? []).slice(0, 5);
  const memberName = member?.fullName || [member?.firstName, member?.lastName].filter(Boolean).join(" ") || currentUser.name;
  const memberNumber = member?.membershipNumber || member?.memberNo || "Not assigned";
  const sharesOwned = Math.max(0, Number(memberOverview?.sharesOwned ?? 0));
  const activeLoans = loans.filter((item) => ["APPROVED", "DISBURSED", "ACTIVE"].includes(item.status ?? ""));
  const unpaidFines = fines
    .filter((item) => item.status !== "PAID" && item.status !== "WAIVED")
    .reduce((sum, item) => sum + Number(item.balance ?? item.amount ?? 0), 0);
  const activities = [
    ...socialFund.map((item) => ({
      id: `social-${item.id}`,
      label: "Jamii fund payment",
      detail: item.reference || "Recorded",
      date: item.contributionDate,
      amount: Number(item.amount ?? 0),
    })),
    ...loans.map((item) => ({
      id: `loan-${item.id}`,
      label: item.loanNumber || "Loan application",
      detail: item.status || "Submitted",
      date: item.disbursementDate || item.approvalDate || item.applicationDate,
      amount: Number(item.totalAmount ?? item.principalAmount ?? 0),
    })),
    ...fines.map((item) => ({
      id: `fine-${item.id}`,
      label: "Fine record",
      detail: item.status || "Open",
      date: item.fineDate,
      amount: Number(item.balance ?? item.amount ?? 0),
    })),
  ]
    .sort((a, b) => Date.parse(b.date ?? "") - Date.parse(a.date ?? ""))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SystemLoader label="Preparing your member dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
          <UserRound className="mx-auto text-[#0B6B50]" size={24} />
          <h1 className="mt-4 text-xl font-black text-neutral-900">Your member dashboard is not ready yet</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <section className="mb-6 rounded-xl border border-[#0B6B50] bg-[#0B6B50] p-6 text-white shadow-[0_12px_28px_rgba(11,107,80,0.18)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">My membership</p>
            <h1 className="mt-3 text-3xl font-black">Welcome back, {memberName}</h1>
            <p className="mt-2 text-sm text-emerald-50">Your member information for {currentGroup.name}.</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-emerald-50">
              <span>Member no. <strong className="text-white">{memberNumber}</strong></span>
              <span>Role <strong className="text-white">{member?.role || currentUser.role}</strong></span>
              <span>Joined <strong className="text-white">{formatDate(member?.joinedDate)}</strong></span>
            </div>
          </div>
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
            {member?.membershipStatus || member?.status || "ACTIVE"}
          </span>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "My shares", value: `${sharesOwned} shares`, icon: BarChart3, tone: "text-[#0B6B50]" },
          { label: "Active loans", value: String(activeLoans.length), icon: HandCoins, tone: activeLoans.length ? "text-[#EF6C4D]" : "text-[#0B6B50]" },
          { label: "Outstanding fines", value: formatCurrency(unpaidFines, currentGroup.currency), icon: AlertCircle, tone: unpaidFines ? "text-[#EF6C4D]" : "text-[#0B6B50]" },
          { label: "Invited meetings", value: String(upcomingMeetings.length), icon: CalendarDays, tone: "text-[#D99A2B]" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">{item.label}</p>
                <Icon className={item.tone} size={16} />
              </div>
              <p className={`mt-4 text-xl font-black ${item.tone}`}>{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-sm font-black text-neutral-800">My recent activity</h2>
              <p className="text-[10px] text-neutral-400">Your latest five loan, fine, and fund records</p>
            </div>
            {member?.id && (
              <Link href={`/app/members/${member.id}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B6B50]">
                My record <ArrowUpRight size={12} />
              </Link>
            )}
          </div>

          <div className="divide-y divide-neutral-100 border-y border-neutral-100">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-neutral-800">{activity.label}</p>
                  <p className="mt-1 text-[10px] text-neutral-500">{activity.detail} - {formatDate(activity.date)}</p>
                </div>
                <span className="shrink-0 text-xs font-black text-neutral-800">{formatCurrency(activity.amount, currentGroup.currency)}</span>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="py-8 text-center text-xs text-neutral-400">No personal activity recorded yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-sm font-black text-neutral-800">Upcoming meetings</h2>
              <p className="text-[10px] text-neutral-400">Meetings you are invited to attend</p>
            </div>
            <CalendarDays className="text-[#0B6B50]" size={18} />
          </div>

          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <Link key={meeting.id} href={`/app/meetings/${meeting.id}`} className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 transition-colors hover:border-[#E9EFEB] hover:bg-[#F2F7F4]">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-[#0B6B50] shadow-sm">
                  <span className="text-sm font-black">{meeting.meetingDate ? new Date(meeting.meetingDate).getDate() : "-"}</span>
                  <span className="text-[8px] font-bold uppercase">{meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleString("en-GB", { month: "short" }) : ""}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold text-neutral-800">{meeting.title || "Group meeting"}</p>
                  <p className="mt-1 truncate text-[9px] text-neutral-500">{meeting.startTime || "Time not set"} - {meeting.location || "Location not set"}</p>
                </div>
                <ArrowRight className="shrink-0 text-[#0B6B50]" size={14} />
              </Link>
            ))}
            {upcomingMeetings.length === 0 && (
              <div className="rounded-lg border border-[#E9EFEB] bg-[#F2F7F4] px-3 py-4 text-center text-xs font-semibold text-[#0B6B50]">
                No upcoming meetings have been scheduled.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
