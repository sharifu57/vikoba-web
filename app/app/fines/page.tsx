"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import {
  fineService,
  memberService,
  type Fine,
  type FineTypeOption,
  type Member,
} from "@/lib/api/services";
type Envelope<T> = { data?: T; message?: string };
const unwrap = <T,>(v: T | Envelope<T>) =>
  (v && typeof v === "object" && "data" in v
    ? (v as Envelope<T>).data
    : v) as T;

    ///PUSH
const money = (n: number, c = "TZS") =>
  `${c} ${Number(n || 0).toLocaleString()}`;
export default function FinesPage() {
  const qc = useQueryClient();
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [form, setForm] = useState({
    groupMemberId: "",
    fineTypeId: "",
    amount: "5000",
    reason: "",
  });
  const [configForm, setConfigForm] = useState({
    id: "",
    name: "",
    code: "",
    defaultAmount: "",
    description: "",
    active: true,
  });
  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
      setGroupId(
        String(
          g.id ??
          g.groupId ??
          localStorage.getItem("v360_currentGroupId") ??
          "",
        ),
      );
      setCurrency(g.currency || "TZS");
    } catch { }
  }, []);
  const finesQ = useQuery({
    queryKey: ["fines", groupId],
    queryFn: () => fineService.list(groupId),
    enabled: /^\d+$/.test(groupId),
  });
  const membersQ = useQuery({
    queryKey: ["members", groupId],
    queryFn: async () => unwrap(await memberService.list(groupId)) || [],
    enabled: /^\d+$/.test(groupId),
  });
  const typesQ = useQuery({
    queryKey: ["fine-types", groupId],
    queryFn: () => fineService.types(groupId),
    enabled: /^\d+$/.test(groupId),
  });
  const typeList = (typesQ.data || []) as FineTypeOption[];
  const selectedType = useMemo(
    () => typeList.find((t) => String(t.id) === String(form.fineTypeId)) || null,
    [form.fineTypeId, typeList],
  );
  useEffect(() => {
    if (!selectedType) return;
    const nextAmount = Number(selectedType.defaultAmount ?? 0);
    setForm((current) => ({
      ...current,
      amount: current.amount && Number(current.amount) > 0 ? current.amount : String(nextAmount || 5000),
      fineTypeId: String(selectedType.id ?? ""),
    }));
  }, [selectedType]);
  useEffect(() => {
    if (!typeList.length) return;
    if (!form.fineTypeId) {
      setForm((current) => ({
        ...current,
        fineTypeId: String(typeList[0].id),
        amount: String(Number(typeList[0].defaultAmount ?? 0) || 5000),
      }));
    }
  }, [form.fineTypeId, typeList]);
  const issue = useMutation({
    mutationFn: () =>
      fineService.create({
        groupId,
        groupMemberId: form.groupMemberId,
        fineTypeId: form.fineTypeId,
        amount: Number(form.amount),
        reason: form.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fines", groupId] });
      setOpen(false);
      setForm({
        groupMemberId: "",
        fineTypeId: typeList[0] ? String(typeList[0].id) : "",
        amount: "5000",
        reason: "",
      });
    },
  });
  const saveType = useMutation({
    mutationFn: () => {
      if (!groupId) throw new Error("A group must be selected first.");
      const payload = {
        code: configForm.code || configForm.name,
        name: configForm.name,
        defaultAmount: Number(configForm.defaultAmount || 0),
        description: configForm.description,
        active: configForm.active,
      };

      if (configForm.id) {
        return fineService.updateType(groupId, configForm.id, payload);
      }
      return fineService.createType(groupId, payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["fine-types", groupId] });
      const nextType = data as FineTypeOption;
      setForm((current) => ({
        ...current,
        fineTypeId: nextType?.id ? String(nextType.id) : current.fineTypeId,
        amount: String(Number(nextType?.defaultAmount ?? (current.amount || 0)) || 5000),
      }));
      setConfigForm({
        id: "",
        name: "",
        code: "",
        defaultAmount: "",
        description: "",
        active: true,
      });
    },
  });
  const deleteType = useMutation({
    mutationFn: (id: string | number) => fineService.deleteType(groupId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fine-types", groupId] });
    },
  });
  const update = useMutation({
    mutationFn: ({
      id,
      status,
      paymentAmount,
    }: {
      id: string;
      status?: string;
      paymentAmount?: number;
    }) => fineService.update(id, { groupId, status, paymentAmount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fines", groupId] }),
  });
  const members = (membersQ.data || []) as Member[];
  const fines = (finesQ.data || []) as Fine[];
  const visible = useMemo(
    () =>
      fines.filter((f) =>
        `${f.memberName || ""} ${f.fineTypeName || f.type || ""} ${f.reference || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [fines, search],
  );
  const outstanding = fines.reduce(
    (n, f) => n + Number(f.balance ?? f.amount ?? 0),
    0,
  );
  const paid = fines.reduce((n, f) => n + Number(f.paidAmount || 0), 0);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.groupMemberId && form.fineTypeId && Number(form.amount) > 0) issue.mutate();
  };
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold text-neutral-400">
            Community / Fines
          </p>
          <h1 className="mt-2 text-2xl font-black">Penalties & Fines</h1>
          <p className="text-xs text-neutral-400">
            Record, collect, and reconcile member penalties.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dfe8e2] bg-white px-4 py-2.5 text-xs font-bold text-neutral-700"
          >
            Configure types
          </button>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087f5b] px-4 py-2.5 text-xs font-bold text-white"
          >
            <Plus size={15} /> Issue fine
          </button>
        </div>
      </div>
      {configOpen && (
        <div className="mb-8 rounded-2xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">Fine types</h2>
              <p className="text-[10px] text-neutral-400">
                Configure penalties for this group and assign them when issuing a fine.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfigForm({ id: "", name: "", code: "", defaultAmount: "", description: "", active: true })}
              className="rounded-lg border border-[#dfe8e2] px-3 py-2 text-[10px] font-bold"
            >
              New type
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {(typeList || []).length ? (
                typeList.map((type) => (
                  <div key={type.id} className="flex items-center justify-between rounded-xl border border-[#dfe8e2] bg-neutral-50 p-3">
                    <div>
                      <p className="text-xs font-bold">{type.name}</p>
                      <p className="text-[10px] text-neutral-400">{type.code || "—"} • {money(Number(type.defaultAmount ?? 0), currency)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfigForm({
                          id: String(type.id ?? ""),
                          name: type.name || "",
                          code: type.code || "",
                          defaultAmount: String(Number(type.defaultAmount ?? 0)),
                          description: type.description || "",
                          active: type.active !== false,
                        })}
                        className="rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deleteType.isPending}
                        onClick={() => deleteType.mutate(type.id ?? "")}
                        className="rounded bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 disabled:opacity-50"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#dfe8e2] bg-neutral-50 p-6 text-center text-xs text-neutral-400">
                  No fine types configured yet.
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveType.mutate();
              }}
              className="space-y-3 rounded-xl border border-[#dfe8e2] bg-neutral-50 p-4"
            >
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Name</label>
                <input
                  value={configForm.name}
                  onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                  className="w-full rounded-lg border border-[#dfe8e2] bg-white p-2.5 text-xs"
                  placeholder="Late Meeting"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Code</label>
                <input
                  value={configForm.code}
                  onChange={(e) => setConfigForm({ ...configForm, code: e.target.value })}
                  className="w-full rounded-lg border border-[#dfe8e2] bg-white p-2.5 text-xs"
                  placeholder="LATE_MEETING"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Default amount</label>
                <input
                  type="number"
                  min="0"
                  value={configForm.defaultAmount}
                  onChange={(e) => setConfigForm({ ...configForm, defaultAmount: e.target.value })}
                  className="w-full rounded-lg border border-[#dfe8e2] bg-white p-2.5 text-xs"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Description</label>
                <textarea
                  value={configForm.description}
                  onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-[#dfe8e2] bg-white p-2.5 text-xs"
                  placeholder="Optional note for this fine category"
                />
              </div>
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <input
                  type="checkbox"
                  checked={configForm.active}
                  onChange={(e) => setConfigForm({ ...configForm, active: e.target.checked })}
                />
                Active for group
              </label>
              <button
                type="submit"
                disabled={saveType.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#087f5b] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {saveType.isPending && <Loader2 size={14} className="animate-spin" />}
                {configForm.id ? "Update type" : "Save type"}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Total logged", `${fines.length} incidents`],
          ["Collected", money(paid, currency)],
          ["Outstanding", money(outstanding, currency)],
          [
            "Waived",
            money(
              fines
                .filter((f) => f.status === "WAIVED")
                .reduce((n, f) => n + Number(f.amount || 0), 0),
              currency,
            ),
          ],
        ].map(([a, b]) => (
          <div
            key={a}
            className="rounded-xl border border-[#dfe8e2] bg-white p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {a}
            </p>
            <p className="mt-2 text-lg font-black">{b}</p>
          </div>
        ))}
      </div>
      <div className="mb-6 flex items-center rounded-xl border border-[#dfe8e2] bg-white p-4">
        <Search size={15} className="mr-2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member, type, or reference..."
          className="w-full text-xs outline-none"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#dfe8e2] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-neutral-50 text-[9px] uppercase text-neutral-400">
                <th className="p-4">Member</th>
                <th className="p-4">Type / reference</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Balance</th>
                <th className="p-4">Issued</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(finesQ.isLoading || membersQ.isLoading) && (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Loader2 className="mx-auto animate-spin" size={20} />
                  </td>
                </tr>
              )}
              {!finesQ.isLoading &&
                visible.map((f) => (
                  <tr key={f.id} className="border-b border-neutral-50">
                    <td className="p-4 font-bold">
                      {f.memberName ||
                        members.find(
                          (m) =>
                            String(m.id) ===
                            String(f.groupMemberId || f.memberId),
                        )?.name ||
                        "Member"}
                      <span className="block text-[10px] font-normal text-neutral-400">
                        {f.membershipNumber || ""}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">
                        {f.fineTypeName || f.type || "Penalty"}
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        {f.reference || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold">
                      {money(Number(f.amount), currency)}
                    </td>
                    <td className="p-4 text-right font-black text-red-600">
                      {money(Number(f.balance ?? f.amount), currency)}
                    </td>
                    <td className="p-4">{f.fineDate || "—"}</td>
                    <td className="p-4">
                      <span className="rounded bg-red-50 px-2 py-1 text-[9px] font-extrabold">
                        {f.status || "UNPAID"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {["UNPAID", "PARTIAL"].includes(f.status || "UNPAID") && (
                        <>
                          <button
                            onClick={() => {
                              const n = window.prompt(
                                "Payment amount",
                                String(f.balance ?? f.amount ?? 0),
                              );
                              if (n)
                                update.mutate({
                                  id: String(f.id),
                                  paymentAmount: Number(n),
                                });
                            }}
                            className="mr-1 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() =>
                              update.mutate({
                                id: String(f.id),
                                status: "WAIVED",
                              })
                            }
                            className="rounded border px-2 py-1 text-[10px] font-bold"
                          >
                            Waive
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              {!finesQ.isLoading && !visible.length && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-400">
                    No fines found for this group.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#122b1c]/30 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex justify-between border-b pb-3">
              <div>
                <h2 className="text-sm font-extrabold">Issue a fine</h2>
                <p className="text-[10px] text-neutral-400">
                  Saved to the member ledger.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <label className="mb-1 block text-xs font-bold">Member</label>
            <select
              required
              value={form.groupMemberId}
              onChange={(e) =>
                setForm({ ...form, groupMemberId: e.target.value })
              }
              className="mb-4 w-full rounded-lg border p-2.5 text-xs"
            >
              <option value="">Select member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.fullName} (
                  {m.memberNo || m.membershipNumber || ""})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Fine type
                </label>
                <select
                  value={form.fineTypeId}
                  onChange={(e) =>
                    setForm({ ...form, fineTypeId: e.target.value })
                  }
                  disabled={!typeList.length}
                  className="w-full rounded-lg border p-2.5 text-xs"
                >
                  {!typeList.length && (
                    <option value="">No configured types yet</option>
                  )}
                  {typeList.map((t) => (
                    <option key={t.id} value={String(t.id ?? "")}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Amount ({currency})
                </label>
                <input
                  required
                  min="1"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-lg border p-2.5 text-xs"
                />
              </div>
            </div>
            <label className="mb-1 mt-4 block text-xs font-bold">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              className="w-full rounded-lg border p-2.5 text-xs"
            />
            <button
              disabled={issue.isPending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#087f5b] py-3 text-xs font-bold text-white disabled:opacity-50"
            >
              {issue.isPending && (
                <Loader2 size={14} className="animate-spin" />
              )}
              <Check size={14} /> Save fine to member ledger
            </button>
            {issue.isError && (
              <p className="mt-3 text-xs text-red-600">
                {(issue.error as Error).message}
              </p>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
