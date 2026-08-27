"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  HeartHandshake,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  useJamii,
  type JamiiRequest,
  type JamiiSummary,
  type JamiiType,
} from "@/hooks/useJamii";
import {
  groupService,
  memberService,
  type Group,
  type Member,
} from "@/lib/api/services";

const unwrap = <T,>(v: T | { data?: T }): T =>
  v && typeof v === "object" && "data" in v
    ? ((v as { data?: T }).data as T)
    : (v as T);
const emptySummary: JamiiSummary = {
  totalContributions: 0,
  totalApproved: 0,
  totalPaid: 0,
  pendingRequests: 0,
  availableBalance: 0,
  requestCount: 0,
  pendingCount: 0,
};

export default function JamiiFundPage() {
  const api = useJamii();
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [types, setTypes] = useState<JamiiType[]>([]);
  const [requests, setRequests] = useState<JamiiRequest[]>([]);
  const [summary, setSummary] = useState<JamiiSummary>(emptySummary);
  const [open, setOpen] = useState(false),
    [addingType, setAddingType] = useState(false),
    [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    memberId: "",
    fundTypeId: "",
    amount: "",
    reason: "",
  });
  const [typeForm, setTypeForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const money = (v?: number) => `TZS ${Number(v || 0).toLocaleString()}`;
  const memberLabel = (m: Member) =>
    m.name ||
    m.fullName ||
    [m.firstName, m.lastName].filter(Boolean).join(" ") ||
    m.memberNo ||
    "Member";

  const refresh = async () => {
    if (!groupId) return;
    try {
      const [r, s, t, m] = await Promise.all([
        api.requests(groupId),
        api.summary(groupId),
        api.types(groupId),
        memberService.list(groupId),
      ]);
      setRequests(r || []);
      setSummary(s || emptySummary);
      setTypes(t || []);
      setMembers(unwrap(m) as Member[]);
    } catch {
      /* API hook renders the error */
    }
  };
  useEffect(() => {
    const storedId = localStorage.getItem("v360_currentGroupId") || "";
    if (/^\d+$/.test(storedId)) {
      setGroupId(storedId);
      return;
    }
    let name = "";
    try {
      name = String(
        JSON.parse(localStorage.getItem("v360_currentGroup") || "{}").name ||
        "",
      ).toLowerCase();
    } catch {
      /* use the first group */
    }
    groupService
      .list()
      .then((response) => {
        const groups = unwrap(response) as Array<
          Group & { groupId?: string | number }
        >;
        const selected =
          groups.find((g) => g.name?.toLowerCase() === name) || groups[0];
        const id = selected?.id ?? selected?.groupId;
        if (id !== undefined && /^\d+$/.test(String(id))) {
          setGroupId(String(id));
          localStorage.setItem("v360_currentGroupId", String(id));
        } else setMessage("Select a valid group before opening Jamii.");
      })
      .catch(() => setMessage("Unable to load your group."));
  }, []);
  useEffect(() => {
    void refresh();
  }, [groupId]);
  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.memberName.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.fundTypeName.toLowerCase().includes(q),
    );
  }, [requests, search]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.request(groupId, {
        groupMemberId: Number(form.memberId),
        fundTypeId: Number(form.fundTypeId),
        requestedAmount: Number(form.amount),
        reason: form.reason,
      });
      setOpen(false);
      setForm({ memberId: "", fundTypeId: "", amount: "", reason: "" });
      setMessage("Jamii request submitted for approval.");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to submit request.");
    }
  };
  const createType = async () => {
    try {
      const type = await api.createType(groupId, typeForm);
      setTypes((current) =>
        [...current, type].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setForm((current) => ({ ...current, fundTypeId: String(type.id) }));
      setTypeForm({ name: "", code: "", description: "" });
      setAddingType(false);
      setMessage(`“${type.name}” is now available for this group.`);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to create support type.",
      );
    }
  };
  const act = async (operation: () => Promise<unknown>, success: string) => {
    try {
      await operation();
      setMessage(success);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to update request.");
    }
  };
  const statusClass = (s: string) =>
    ({
      PENDING: "bg-amber-100 text-amber-800",
      APPROVED: "bg-sky-100 text-sky-800",
      PAID: "bg-emerald-100 text-emerald-800",
      REJECTED: "bg-red-100 text-red-800",
    })[s] || "bg-neutral-100 text-neutral-700";

  return (
    <main className="min-h-screen bg-linear-to-br from-neutral-50 to-rose-50/30 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rose-700">
              Community / Jamii
            </p>
            <h1 className="mt-2 text-3xl font-black text-neutral-900">
              Jamii social fund
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Requests move from review to approval, then disbursement.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            disabled={!groupId}
            className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Plus size={17} /> Request support
          </button>
        </header>
        {message && (
          <div className="flex justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            <span>{message}</span>
            <button onClick={() => setMessage(null)}>Dismiss</button>
          </div>
        )}
        {api.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} />
            {api.error}
          </div>
        )}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Fund contributions", money(summary.totalContributions)],
            ["Available balance", money(summary.availableBalance)],
            ["Awaiting review", summary.pendingCount],
            ["Support paid", money(summary.totalPaid)],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {label}
              </p>
              <p className="mt-3 text-2xl font-black text-neutral-900">
                {value}
              </p>
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
                <HeartHandshake size={19} />
              </div>
              <div>
                <h2 className="font-black text-neutral-900">
                  Welfare requests
                </h2>
                <p className="text-xs text-neutral-500">
                  Live claims from the Jamii database
                </p>
              </div>
            </div>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-2.5 text-neutral-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests"
                className="w-48 rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Support type</th>
                  <th className="px-4 py-3 text-right">Requested</th>
                  <th className="px-4 py-3 text-right">Approved</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visible.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-4 font-bold text-neutral-800">
                      {r.memberName}
                      <span className="block text-xs font-normal text-neutral-400">
                        {r.membershipNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4">{r.fundTypeName}</td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {money(r.requestedAmount)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {r.approvedAmount ? money(r.approvedAmount) : "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-neutral-500">
                      {r.requestedDate}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {r.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const amount = window.prompt(
                                "Approved amount",
                                String(r.requestedAmount),
                              );
                              if (amount)
                                void act(
                                  () =>
                                    api.approve(groupId, r.id, Number(amount)),
                                  "Request approved; it is ready for disbursement.",
                                );
                            }}
                            className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              void act(
                                () => api.reject(groupId, r.id),
                                "Request rejected.",
                              )
                            }
                            className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === "APPROVED" && (
                        <button
                          onClick={() =>
                            void act(
                              () => api.pay(groupId, r.id),
                              "Support marked as paid.",
                            )
                          }
                          className="rounded bg-rose-600 px-2 py-1 text-xs font-bold text-white"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-14 text-center text-neutral-500"
                    >
                      No Jamii requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">Request support</h2>
                  <p className="text-xs text-neutral-500">
                    Submit a welfare request for review.
                  </p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <select
                  required
                  value={form.memberId}
                  onChange={(e) =>
                    setForm({ ...form, memberId: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={form.fundTypeId}
                  onChange={(e) =>
                    setForm({ ...form, fundTypeId: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                >
                  <option value="">Select support type</option>
                  {types.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingType((v) => !v)}
                  className="text-sm font-bold text-rose-700 hover:text-rose-800"
                >
                  {addingType
                    ? "Use an existing type"
                    : "+ Add a support type for this group"}
                </button>
                {addingType && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                    <p className="mb-2 text-xs font-bold text-rose-800">
                      New group support type
                    </p>
                    <input
                      required
                      value={typeForm.name}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, name: e.target.value })
                      }
                      placeholder="e.g. Medical emergency"
                      className="mb-2 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={typeForm.code}
                      onChange={(e) =>
                        setTypeForm({ ...typeForm, code: e.target.value })
                      }
                      placeholder="Optional code, e.g. MEDICAL"
                      className="mb-2 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={typeForm.description}
                      onChange={(e) =>
                        setTypeForm({
                          ...typeForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description"
                      rows={2}
                      className="w-full rounded border border-neutral-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void createType()}
                      disabled={api.loading || !typeForm.name.trim()}
                      className="mt-2 rounded bg-white px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200 disabled:opacity-50"
                    >
                      Create and select type
                    </button>
                  </div>
                )}
                <input
                  required
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Requested amount"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                />
                <textarea
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Reason for request"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                  rows={4}
                />
                <button
                  disabled={api.loading || !types.length}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {api.loading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}{" "}
                  Submit for approval
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
