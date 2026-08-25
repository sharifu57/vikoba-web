"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Landmark,
  Loader2,
  PlusCircle,
  Search,
  X,
} from "lucide-react";
import { groupService, type Group } from "@/lib/api/services";
import {
  useAccounting,
  type Account,
  type LedgerLine,
} from "@/hooks/useAccounting";

const cash = (value: number, currency: string) =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function FinanceOverviewPage() {
  const api = useAccounting();
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ledger, setLedger] = useState<LedgerLine[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    reference: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
    debitAccountId: "",
    creditAccountId: "",
    amount: "",
  });
  useEffect(() => {
    const resolve = async () => {
      const saved = localStorage.getItem("v360_currentGroupId") || "";
      let stored: Record<string, unknown> = {};
      try {
        stored = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
      } catch {
        setMessage("Unable to read the selected group.");
        return;
      }
      setCurrency(String(stored.currency || "TZS"));
      const candidate = String(stored.id ?? stored.groupId ?? saved);
      if (/^\d+$/.test(candidate)) {
        setGroupId(candidate);
        return;
      }
      try {
        const response = await groupService.list();
        const groups = ((response as { data?: Group[] }).data ??
          response) as Group[];
        const selected = groups.find(
          (group) =>
            String(group.id) === saved ||
            group.name.toLowerCase() ===
              String(stored.name ?? stored.groupName ?? saved).toLowerCase(),
        );
        if (!selected) throw new Error();
        localStorage.setItem("v360_currentGroupId", String(selected.id));
        setGroupId(String(selected.id));
      } catch {
        setMessage("Select a valid group before viewing the general ledger.");
      }
    };
    resolve();
  }, []);
  const refresh = async () => {
    if (!groupId) return;
    try {
      const [nextAccounts, nextLedger] = await Promise.all([
        api.accounts(groupId),
        api.ledger(groupId),
      ]);
      setAccounts(nextAccounts);
      setLedger(nextLedger);
    } catch {
      /* hook displays error */
    }
  };
  useEffect(() => {
    refresh();
  }, [groupId]);
  const visible = useMemo(
    () =>
      ledger.filter((line) =>
        [
          line.reference,
          line.description,
          line.accountCode,
          line.accountName,
        ].some((value) => value.toLowerCase().includes(search.toLowerCase())),
      ),
    [ledger, search],
  );
  const liquidity = accounts.filter((account) =>
    ["1000", "1010", "1020"].includes(account.code),
  );
  const assets = accounts
    .filter((account) => account.type === "ASSET")
    .reduce((sum, account) => sum + account.balance, 0);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (
      !groupId ||
      !form.description ||
      !form.debitAccountId ||
      !form.creditAccountId ||
      amount <= 0 ||
      form.debitAccountId === form.creditAccountId
    ) {
      setMessage("Choose two different accounts and enter a valid amount.");
      return;
    }
    try {
      await api.post(groupId, {
        reference: form.reference || undefined,
        description: form.description,
        transactionDate: new Date(form.date).toISOString(),
        lines: [
          { accountId: Number(form.debitAccountId), debit: amount },
          { accountId: Number(form.creditAccountId), credit: amount },
        ],
      });
      setMessage("Balanced journal entry posted successfully.");
      setModal(false);
      setForm({
        reference: "",
        description: "",
        date: new Date().toISOString().slice(0, 16),
        debitAccountId: "",
        creditAccountId: "",
        amount: "",
      });
      await refresh();
    } catch {
      /* hook displays error */
    }
  };
  const accountOptions = accounts
    .filter((account) => account.active)
    .map((account) => (
      <option key={account.id} value={account.id}>
        {account.code} — {account.name}
      </option>
    ));
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-400">
            Finance / Ledger Accounts
          </p>
          <h1 className="mt-2 text-2xl font-black text-neutral-900">
            Accounts &amp; General Ledger
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Track balanced journal entries and live account positions.
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          disabled={!groupId}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#087f5b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#066b4c] disabled:opacity-50"
        >
          <PlusCircle size={14} /> Post journal entry
        </button>
      </header>
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ...liquidity,
          { code: "TOTAL", name: "Total assets", balance: assets } as Account,
        ].map((account) => (
          <div
            key={account.code}
            className={`rounded-xl border p-5 shadow-sm ${account.code === "TOTAL" ? "border-[#087f5b] bg-[#087f5b] text-white" : "border-[#dfe8e2] bg-white"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase ${account.code === "TOTAL" ? "text-emerald-100" : "text-neutral-400"}`}
                >
                  {account.name}
                </span>
                <p className="mt-2 text-lg font-black">
                  {cash(account.balance, currency)}
                </p>
                <span
                  className={`mt-1 block text-[9px] ${account.code === "TOTAL" ? "text-emerald-100" : "text-neutral-400"}`}
                >
                  {account.code === "TOTAL"
                    ? "All asset accounts"
                    : `Account ${account.code}`}
                </span>
              </div>
              <div
                className={`rounded-lg p-2 ${account.code === "TOTAL" ? "bg-white/15" : "bg-[#eaf6ef] text-[#087f5b]"}`}
              >
                <Landmark size={16} />
              </div>
            </div>
          </div>
        ))}
      </section>
      {(message || api.error) && (
        <div
          className={`mb-5 rounded-lg p-3 text-xs font-semibold ${api.error ? "border border-red-100 bg-red-50 text-red-700" : "border border-emerald-100 bg-emerald-50 text-emerald-700"}`}
        >
          {api.error || message}
        </div>
      )}
      <section className="mb-8 rounded-xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-neutral-800">
            Trial balance
          </h2>
          <span className="text-[10px] font-semibold text-neutral-400">
            Calculated from posted entries
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((type) => {
            const amount = accounts
              .filter((account) => account.type === type)
              .reduce((sum, account) => sum + account.balance, 0);
            return (
              <div
                key={type}
                className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
              >
                <p className="text-[9px] font-bold uppercase text-neutral-400">
                  {type.toLowerCase()}
                </p>
                <p className="mt-1 text-xs font-black text-neutral-800">
                  {cash(amount, currency)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="mb-8 overflow-hidden rounded-xl border border-[#dfe8e2] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          <h2 className="text-sm font-extrabold text-neutral-800">
            Chart of accounts
          </h2>
          <span className="text-[10px] font-semibold text-neutral-400">
            {accounts.length} accounts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-[9px] uppercase tracking-wider text-neutral-400">
                <th className="p-3">Code</th>
                <th className="p-3">Account</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Credit</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-neutral-50/50">
                  <td className="p-3 font-bold text-[#087f5b]">
                    {account.code}
                  </td>
                  <td className="p-3 font-semibold text-neutral-700">
                    {account.name}
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-600">
                      {account.type}
                    </span>
                  </td>
                  <td className="p-3 text-right text-emerald-600">
                    {cash(account.debit, currency)}
                  </td>
                  <td className="p-3 text-right text-red-500">
                    {cash(account.credit, currency)}
                  </td>
                  <td className="p-3 text-right font-black text-neutral-800">
                    {cash(account.balance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border border-[#dfe8e2] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#087f5b]" />
            <h2 className="text-sm font-extrabold text-neutral-800">
              General transaction ledger
            </h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-3 text-neutral-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference or account..."
              className="w-full rounded-lg border border-[#dfe8e2] p-2.5 pl-9 text-xs outline-none focus:border-[#087f5b]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[9px] uppercase tracking-wider text-neutral-400">
                <th className="p-4">Date</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Description</th>
                <th className="p-4">Account</th>
                <th className="p-4 text-right">Debit</th>
                <th className="p-4 text-right">Credit</th>
                <th className="p-4 text-right">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {api.loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neutral-400">
                    <Loader2 className="mr-2 inline animate-spin" size={16} />{" "}
                    Loading ledger...
                  </td>
                </tr>
              ) : (
                visible.map((line) => (
                  <tr key={line.id} className="hover:bg-neutral-50/50">
                    <td className="p-4 font-semibold text-neutral-500">
                      {new Date(line.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-[#087f5b]">
                      {line.reference}
                    </td>
                    <td className="p-4 text-neutral-700">{line.description}</td>
                    <td className="p-4">
                      <span className="font-bold text-neutral-700">
                        {line.accountCode}
                      </span>
                      <span className="ml-1 text-neutral-400">
                        {line.accountName}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600">
                      {line.debit > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <ArrowDownRight size={12} />
                          {cash(line.debit, currency)}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-red-500">
                      {line.credit > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <ArrowUpRight size={12} />
                          {cash(line.credit, currency)}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-black text-neutral-800">
                      {cash(line.balance, currency)}
                    </td>
                  </tr>
                ))
              )}
              {!api.loading && !visible.length && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neutral-400">
                    {groupId
                      ? "No journal entries have been posted."
                      : "Select a group to view its ledger."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#122b1c]/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl border border-[#dfe8e2] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-neutral-800">
                  Post balanced journal entry
                </h2>
                <p className="mt-1 text-[10px] text-neutral-400">
                  The same amount is debited and credited.
                </p>
              </div>
              <button
                onClick={() => setModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-bold text-neutral-700">
                  Reference
                  <input
                    value={form.reference}
                    onChange={(event) =>
                      setForm({ ...form, reference: event.target.value })
                    }
                    placeholder="Auto-generated"
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </label>
                <label className="text-xs font-bold text-neutral-700">
                  Date &amp; time
                  <input
                    type="datetime-local"
                    required
                    value={form.date}
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold text-neutral-700">
                Description
                <input
                  required
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-bold text-neutral-700">
                  Debit account
                  <select
                    required
                    value={form.debitAccountId}
                    onChange={(event) =>
                      setForm({ ...form, debitAccountId: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  >
                    <option value="">Select account</option>
                    {accountOptions}
                  </select>
                </label>
                <label className="text-xs font-bold text-neutral-700">
                  Credit account
                  <select
                    required
                    value={form.creditAccountId}
                    onChange={(event) =>
                      setForm({ ...form, creditAccountId: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  >
                    <option value="">Select account</option>
                    {accountOptions}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-bold text-neutral-700">
                Amount ({currency})
                <input
                  type="number"
                  required
                  min="1"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs font-bold outline-none focus:border-[#087f5b]"
                />
              </label>
              <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="rounded-lg border border-[#dfe8e2] px-4 py-2.5 text-xs font-bold text-neutral-600"
                >
                  Cancel
                </button>
                <button className="rounded-lg bg-[#087f5b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#066b4c]">
                  Post entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
