"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";
import { groupService, type Group } from "@/lib/api/services";
import {
  useExpenses,
  type ExpenseCategory,
  type ExpenseInput,
  type ExpenseRecord,
} from "@/hooks/useExpenses";

const statusClass = (status: string) =>
  status === "APPROVED" || status === "PAID"
    ? "bg-emerald-50 text-emerald-700"
    : status === "PENDING"
      ? "bg-amber-50 text-amber-800"
      : "bg-red-50 text-red-600";
const pretty = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const blankForm = (category?: ExpenseCategory): ExpenseInput => ({
  categoryId: category?.id,
  categoryName: category?.name,
  description: "",
  amount: undefined,
  expenseDate: new Date().toISOString().slice(0, 10),
  receiptNumber: "",
});

export default function ExpensesPage() {
  const { loading, error, list, categories, create, update, remove } =
    useExpenses();
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);
  const [form, setForm] = useState<ExpenseInput>(blankForm());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      const storedId = localStorage.getItem("v360_currentGroupId") || "";
      let group: Record<string, unknown> = {};
      try {
        group = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
      } catch {
        setMessage("Unable to read the selected group.");
        return;
      }
      setCurrency(String(group.currency || "TZS"));
      const candidate = String(group.groupId ?? group.id ?? storedId);
      if (/^\d+$/.test(candidate)) {
        setGroupId(candidate);
        return;
      }
      try {
        const response = await groupService.list();
        const groups = ((response as { data?: Group[] }).data ??
          response) as Group[];
        const name = String(
          group.groupName ?? group.name ?? storedId,
        ).toLowerCase();
        const selected = groups.find(
          (item) =>
            String(item.id) === storedId || item.name.toLowerCase() === name,
        );
        if (!selected) throw new Error();
        const resolved = String(selected.id);
        localStorage.setItem("v360_currentGroupId", resolved);
        setGroupId(resolved);
      } catch {
        setMessage("Select a valid group before managing expenses.");
      }
    };
    resolve();
  }, []);
  const refresh = async () => {
    if (!groupId) return;
    try {
      const [records, categoryList] = await Promise.all([
        list(groupId),
        categories(groupId),
      ]);
      setExpenses(records);
      setExpenseCategories(categoryList);
    } catch {
      /* hook supplies error */
    }
  };
  useEffect(() => {
    refresh();
  }, [groupId]);
  const money = (amount: number) =>
    new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  const visible = useMemo(
    () =>
      expenses.filter((item) =>
        [
          item.categoryName,
          item.description,
          item.reference,
          item.receiptNumber,
        ].some((value) => value?.toLowerCase().includes(search.toLowerCase())),
      ),
    [expenses, search],
  );
  const approved = expenses.filter(
    (item) => item.status === "APPROVED" || item.status === "PAID",
  );
  const pending = expenses.filter((item) => item.status === "PENDING");
  const edit = (expense: ExpenseRecord) => {
    setEditing(expense);
    setForm({
      categoryId: expense.categoryId,
      categoryName: expense.categoryName,
      reference: expense.reference,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      receiptNumber: expense.receiptNumber,
      status: expense.status,
      rejectionReason: expense.rejectionReason,
    });
    setModalOpen(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!groupId || !form.categoryId || !form.description || !form.amount || form.amount <= 0)
      return;
    try {
      if (editing) await update(groupId, editing.id, form);
      else await create(groupId, form);
      setMessage(
        editing
          ? "Expense updated successfully."
          : "Expense recorded successfully.",
      );
      setModalOpen(false);
      setEditing(null);
      setForm(blankForm(expenseCategories[0]));
      await refresh();
    } catch {
      /* hook error is visible */
    }
  };
  const deleteExpense = async (expense: ExpenseRecord) => {
    if (
      !window.confirm(
        `Delete expense ${expense.reference}? This cannot be undone.`,
      )
    )
      return;
    try {
      await remove(groupId, expense.id);
      setMessage("Expense deleted successfully.");
      await refresh();
    } catch {
      /* hook error is visible */
    }
  };
  const openCreate = () => {
    setEditing(null);
    setForm(blankForm(expenseCategories[0]));
    setModalOpen(true);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-400">
            Finance / Expenses
          </p>
          <h1 className="mt-2 text-2xl font-black text-neutral-900">
            Group Expenses
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Record, update, and retain every group expenditure.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={!groupId}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#087f5b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#066b4c] disabled:opacity-50"
        >
          <PlusCircle size={14} /> Record Expense
        </button>
      </header>
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          [
            "Settled expenses",
            money(approved.reduce((sum, item) => sum + item.amount, 0)),
            "text-neutral-800",
          ],
          [
            "Pending approval",
            money(pending.reduce((sum, item) => sum + item.amount, 0)),
            "text-amber-600",
          ],
          ["Awaiting action", `${pending.length} items`, "text-[#087f5b]"],
          [
            "This month",
            money(
              approved
                .filter(
                  (item) =>
                    item.expenseDate?.slice(0, 7) ===
                    new Date().toISOString().slice(0, 7),
                )
                .reduce((sum, item) => sum + item.amount, 0),
            ),
            "text-neutral-800",
          ],
        ].map(([title, value, color]) => (
          <div
            key={title}
            className="rounded-xl border border-[#dfe8e2] bg-white p-5 shadow-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {title}
            </span>
            <p className={`mt-2 text-lg font-black ${color}`}>{value}</p>
          </div>
        ))}
      </section>
      {(message || error) && (
        <div
          className={`mb-5 rounded-lg p-3 text-xs font-semibold ${error ? "border border-red-100 bg-red-50 text-red-700" : "border border-emerald-100 bg-emerald-50 text-emerald-700"}`}
        >
          {error || message}
        </div>
      )}
      <div className="mb-6 rounded-xl border border-[#dfe8e2] bg-white p-4">
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-3 text-neutral-400"
            size={14}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search category, reference or description..."
            className="w-full rounded-lg border border-[#dfe8e2] p-2.5 pl-9 text-xs outline-none focus:border-[#087f5b]"
          />
        </div>
      </div>
      <section className="overflow-hidden rounded-xl border border-[#dfe8e2] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[9px] uppercase tracking-wider text-neutral-400">
                <th className="p-4">Reference</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4">Expense date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neutral-400">
                    <Loader2 className="mr-2 inline animate-spin" size={16} />{" "}
                    Loading expenses…
                  </td>
                </tr>
              ) : (
                visible.map((expense) => (
                  <tr key={expense.id} className="hover:bg-neutral-50/50">
                    <td className="p-4 font-bold text-[#087f5b]">
                      {expense.reference}
                      <span className="mt-0.5 block text-[10px] font-medium text-neutral-400">
                        {expense.receiptNumber || "No receipt"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
                        {expense.categoryName}
                      </span>
                    </td>
                    <td className="max-w-72 p-4 text-neutral-600">
                      {expense.description}
                    </td>
                    <td className="p-4 text-right font-black text-neutral-800">
                      {money(expense.amount)}
                    </td>
                    <td className="p-4 font-semibold text-neutral-500">
                      {expense.expenseDate}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-extrabold ${statusClass(expense.status)}`}
                      >
                        {pretty(expense.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => edit(expense)}
                          className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-[#087f5b]"
                          title="Edit expense"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteExpense(expense)}
                          className="rounded p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && !visible.length && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-neutral-400">
                    {groupId
                      ? "No expense records."
                      : "Select a group to view expenses."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#122b1c]/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl border border-[#dfe8e2] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-extrabold text-neutral-800">
                {editing ? "Edit Expense" : "Record Outbound Expense"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-bold text-neutral-700">
                  Category
                  <select
                    required
                    value={form.categoryId || ""}
                    onChange={(event) => { const selected = expenseCategories.find(category => category.id === Number(event.target.value)); setForm({ ...form, categoryId: selected?.id, categoryName: selected?.name }); }
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs font-medium outline-none focus:border-[#087f5b]"
                  >
                    <option value="" disabled>{expenseCategories.length ? "Select category" : "No active categories"}</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-neutral-700">
                  Amount ({currency})
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.amount || ""}
                    onChange={(event) =>
                      setForm({ ...form, amount: Number(event.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs font-bold outline-none focus:border-[#087f5b]"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold text-neutral-700">
                Description
                <input
                  required
                  value={form.description || ""}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-bold text-neutral-700">
                  Expense date
                  <input
                    type="date"
                    required
                    value={form.expenseDate || ""}
                    onChange={(event) =>
                      setForm({ ...form, expenseDate: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </label>
                <label className="text-xs font-bold text-neutral-700">
                  Receipt number
                  <input
                    value={form.receiptNumber || ""}
                    onChange={(event) =>
                      setForm({ ...form, receiptNumber: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </label>
              </div>
              {editing && (
                <label className="block text-xs font-bold text-neutral-700">
                  Status
                  <select
                    value={form.status || "PENDING"}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#dfe8e2] bg-white p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  >
                    {[
                      "PENDING",
                      "APPROVED",
                      "PAID",
                      "REJECTED",
                      "CANCELLED",
                    ].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-[#dfe8e2] px-4 py-2 text-xs font-bold text-neutral-500"
                >
                  Cancel
                </button>
                <button className="rounded-lg bg-[#087f5b] px-4 py-2 text-xs font-bold text-white hover:bg-[#066b4c]">
                  {editing ? "Save changes" : "Record expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
