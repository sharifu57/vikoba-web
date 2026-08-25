"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { usePayments, type UniversalPayment } from "@/hooks/usePayments";
import { groupService, type Group } from "@/lib/api/services";

const ALL = "ALL";

const label = (value?: string) =>
  (value || "OTHER")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
const paymentDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
    : "—";

export default function PaymentsPage() {
  const { loading, error, list } = usePayments();
  const [payments, setPayments] = useState<UniversalPayment[]>([]);
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const resolveCurrentGroup = async () => {
      const storedGroupId = localStorage.getItem("v360_currentGroupId") || "";
      let storedGroup: Record<string, unknown> = {};
      try {
        storedGroup = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
      } catch {
        setLoadError("Unable to read the selected group.");
        return;
      }

      setCurrency(String(storedGroup.currency || "TZS"));
      const directId = String(storedGroup.groupId ?? storedGroup.id ?? storedGroupId);
      if (/^\d+$/.test(directId)) {
        setGroupId(directId);
        return;
      }

      try {
        const response = await groupService.list();
        const groups = ((response as { data?: Group[] }).data ?? response) as Group[];
        const selectedName = String(storedGroup.groupName ?? storedGroup.name ?? storedGroupId).toLowerCase();
        const selectedGroup = groups.find(group =>
          String(group.id) === storedGroupId || group.name.toLowerCase() === selectedName,
        );
        if (!selectedGroup || !/^\d+$/.test(String(selectedGroup.id))) {
          setLoadError("Select a valid group before viewing payments.");
          return;
        }
        const resolvedId = String(selectedGroup.id);
        localStorage.setItem("v360_currentGroupId", resolvedId);
        setGroupId(resolvedId);
      } catch {
        setLoadError("Unable to resolve the selected group.");
      }
    };

    resolveCurrentGroup();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    list(groupId)
      .then(setPayments)
      .catch((cause: Error) => setLoadError(cause.message));
  }, [groupId, list]);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  const visiblePayments = useMemo(
    () =>
      payments.filter((payment) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          [
            payment.memberName,
            payment.membershipNumber,
            payment.reference,
            payment.externalReference,
            payment.description,
          ].some((value) => value?.toLowerCase().includes(query));
        return (
          matchesSearch &&
          (methodFilter === ALL || payment.paymentMethod === methodFilter) &&
          (typeFilter === ALL || payment.allocationType === typeFilter)
        );
      }),
    [payments, search, methodFilter, typeFilter],
  );

  const today = new Date().toISOString().slice(0, 10);
  const completed = payments.filter(
    (payment) => payment.status === "COMPLETED",
  );
  const todayTotal = completed
    .filter((payment) => payment.paymentDate?.slice(0, 10) === today)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const monthTotal = completed
    .filter((payment) => payment.paymentDate?.slice(0, 7) === today.slice(0, 7))
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const pendingTotal = payments
    .filter((payment) => payment.status === "PENDING")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const methods = Array.from(
    new Set(payments.map((payment) => payment.paymentMethod)),
  ).sort();
  const types = Array.from(
    new Set(
      payments
        .map((payment) => payment.allocationType)
        .filter(Boolean) as string[],
    ),
  ).sort();
  const statusClass = (status: string) =>
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "PENDING"
        ? "bg-amber-50 text-amber-800"
        : "bg-red-50 text-red-600";
  const typeClass = (type?: string) =>
    type === "CONTRIBUTION"
      ? "bg-emerald-50 text-emerald-700"
      : type === "LOAN_REPAYMENT"
        ? "bg-blue-50 text-blue-700"
        : type === "SHARE_PURCHASE"
          ? "bg-amber-50 text-amber-800"
          : "bg-neutral-100 text-neutral-600";

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <p className="flex items-center gap-1 text-xs font-bold text-neutral-400">
          Finance <span className="text-neutral-300">/</span> Payments
        </p>
        <h1 className="mt-2 text-2xl font-black text-neutral-900">
          Payments Received
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          Database-backed ledger of group collections and allocations.
        </p>
      </header>
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Today's collection", formatMoney(todayTotal), "text-emerald-600"],
          ["This month total", formatMoney(monthTotal), "text-neutral-800"],
          ["Pending settlement", formatMoney(pendingTotal), "text-amber-600"],
          ["Completed ledgers", `${completed.length} logs`, "text-[#087f5b]"],
        ].map(([title, value, color]) => (
          <div
            key={title}
            className="rounded-xl border border-[#dfe8e2] bg-white p-5 shadow-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {title}
            </span>
            <p className={`mt-2 text-base font-black md:text-lg ${color}`}>
              {value}
            </p>
          </div>
        ))}
      </section>
      <section className="mb-6 flex flex-col gap-4 rounded-xl border border-[#dfe8e2] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3 top-3 text-neutral-400"
            size={14}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member, reference or description..."
            className="w-full rounded-lg border border-[#dfe8e2] p-2.5 pl-9 text-xs outline-none focus:border-[#087f5b]"
          />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-[#dfe8e2] bg-[#fcfdfc] p-2 text-xs font-semibold text-neutral-600 sm:flex-none"
          >
            <option value={ALL}>All methods</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {label(method)}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-[#dfe8e2] bg-[#fcfdfc] p-2 text-xs font-semibold text-neutral-600 sm:flex-none"
          >
            <option value={ALL}>All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {label(type)}
              </option>
            ))}
          </select>
        </div>
      </section>
      {(loadError || error) && (
        <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {loadError || error}
        </div>
      )}
      <section className="overflow-hidden rounded-xl border border-[#dfe8e2] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[9px] uppercase tracking-wider text-neutral-400">
                <th className="p-4">Reference</th>
                <th className="p-4">Member</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4">Allocation</th>
                <th className="p-4">Method</th>
                <th className="p-4">Date logged</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neutral-400">
                    <Loader2 className="mr-2 inline animate-spin" size={16} />{" "}
                    Loading payments…
                  </td>
                </tr>
              ) : (
                visiblePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-neutral-50/50">
                    <td className="p-4 font-bold text-[#087f5b]">
                      <span className="block">{payment.reference}</span>
                      {payment.externalReference && (
                        <span className="mt-0.5 block text-[10px] font-medium text-neutral-400">
                          {payment.externalReference}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="block font-bold text-neutral-800">
                        {payment.memberName || "Group payment"}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-neutral-400">
                        {payment.membershipNumber || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-neutral-800">
                      {formatMoney(payment.amount)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded px-2.5 py-0.5 text-[9px] font-bold ${typeClass(payment.allocationType)}`}
                      >
                        {label(payment.allocationType)}
                      </span>
                      {payment.description && (
                        <span
                          className="mt-1 block max-w-44 truncate text-[10px] text-neutral-400"
                          title={payment.description}
                        >
                          {payment.description}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-neutral-500">
                      {label(payment.paymentMethod)}
                    </td>
                    <td className="whitespace-nowrap p-4 font-semibold text-neutral-500">
                      {paymentDate(payment.paymentDate)}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-extrabold ${statusClass(payment.status)}`}
                      >
                        {label(payment.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {!loading && !visiblePayments.length && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neutral-400">
                    {groupId
                      ? "No payment logs match your filters."
                      : "Select a group to view its payments."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
