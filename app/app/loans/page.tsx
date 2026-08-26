"use client";
import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { Loader2, PlusCircle, Search, Eye, Landmark, X } from "lucide-react";
import { memberService, type Member } from "@/lib/api/services";
import { useLoans, type Loan, type LoanProduct } from "@/hooks/useLoans";
const fmt = (v: number, c: string) =>
    new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0,
    }).format(v || 0);
export default function LoansDashboard() {
    const api = useLoans();
    const [groupId, setGroupId] = useState("");
    const [currency, setCurrency] = useState("TZS");
    const [loans, setLoans] = useState<Loan[]>([]);
    const [products, setProducts] = useState<LoanProduct[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [f, setF] = useState({
        memberId: "",
        productId: "",
        amount: "",
        duration: "",
        purpose: "",
    });
    useEffect(() => {
        const raw = localStorage.getItem("v360_currentGroup") || "{}";
        try {
            const g = JSON.parse(raw);
            setGroupId(
                String(
                    g.id ??
                    g.groupId ??
                    localStorage.getItem("v360_currentGroupId") ??
                    "",
                ),
            );
            setCurrency(g.currency || "TZS");
        } catch {
            setMessage("Select a group first.");
        }
    }, []);
    const refresh = async () => {
        if (!groupId) return;
        try {
            const [a, b, c] = await Promise.all([
                api.list(groupId),
                api.products(groupId),
                memberService.list(groupId),
            ]);
            setLoans(a);
            setProducts(b);
            setMembers(((c as { data?: Member[] }).data ?? c) as Member[]);
        } catch { }
    };
    useEffect(() => {
        refresh();
    }, [groupId]);
    const active = useMemo(
        () =>
            loans.filter(
                (l) =>
                    (l.status === "ACTIVE" || l.status === "DEFAULTED") &&
                    `${l.memberName} ${l.loanNumber}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
            ),
        [loans, search],
    );
    const portfolio = active.reduce((s, l) => s + l.remainingBalance, 0);
    const pending = loans.filter(
        (l) => l.status === "PENDING" || l.status === "UNDER_REVIEW",
    ).length;
    const submit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.apply(groupId, {
                groupMemberId: Number(f.memberId),
                loanProductId: f.productId ? Number(f.productId) : undefined,
                principalAmount: Number(f.amount),
                durationMonths: f.duration ? Number(f.duration) : undefined,
                purpose: f.purpose,
            });
            setMessage("Loan application submitted for review.");
            setOpen(false);
            setF({
                memberId: "",
                productId: "",
                amount: "",
                duration: "",
                purpose: "",
            });
            refresh();
        } catch { }
    };
    return (
        <main className="mx-auto max-w-7xl px-6 py-8">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-bold text-neutral-400">
                        Loans / Portfolio
                    </p>
                    <h1 className="mt-2 text-2xl font-black text-neutral-900">
                        Loans &amp; Repayments
                    </h1>
                    <p className="mt-1 text-xs text-neutral-400">
                        Eligibility follows your group contribution multiplier and loan
                        settings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/app/loans/applications"
                        className="rounded-lg border border-[#dfe8e2] px-4 py-2.5 text-xs font-bold"
                    >
                        Review applications ({pending})
                    </Link>
                    <button
                        onClick={() => setOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#087f5b] px-4 py-2.5 text-xs font-bold text-white"
                    >
                        <PlusCircle size={14} />
                        Apply for loan
                    </button>
                </div>
            </header>
            {(message || api.error) && (
                <div
                    className={`mb-5 rounded-lg p-3 text-xs font-semibold ${api.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                    {api.error || message}
                </div>
            )}
            <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    ["Active portfolio", fmt(portfolio, currency)],
                    ["Active loans", String(active.length)],
                    ["Pending review", String(pending)],
                    [
                        "Overdue/defaulted",
                        String(active.filter((l) => l.status === "DEFAULTED").length),
                    ],
                ].map(([t, v]) => (
                    <div
                        key={t}
                        className="rounded-xl border border-[#dfe8e2] bg-white p-5 shadow-sm"
                    >
                        <p className="text-[10px] font-bold uppercase text-neutral-400">
                            {t}
                        </p>
                        <p className="mt-2 text-lg font-black text-neutral-800">{v}</p>
                    </div>
                ))}
            </section>
            <section className="overflow-hidden rounded-xl border border-[#dfe8e2] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-sm font-extrabold">Active loan book</h2>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-2.5 text-neutral-400"
                            size={14}
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search borrower or loan..."
                            className="rounded-lg border p-2 pl-8 text-xs"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-neutral-50 text-[9px] uppercase text-neutral-400">
                                <th className="p-4">Borrower</th>
                                <th className="p-4">Loan</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-right">Paid</th>
                                <th className="p-4 text-right">Outstanding</th>
                                <th className="p-4">Progress</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {api.loading ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center">
                                        <Loader2 className="inline animate-spin" size={16} />{" "}
                                        Loading loans...
                                    </td>
                                </tr>
                            ) : (
                                active.map((l) => (
                                    <tr key={l.id} className="border-t">
                                        <td className="p-4 font-bold">
                                            {l.memberName}
                                            <span className="block text-[10px] font-medium text-neutral-400">
                                                {l.membershipNumber}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {l.loanProductName}
                                            <span className="block text-[10px] text-neutral-400">
                                                {l.loanNumber} · {l.durationMonths} months
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {fmt(l.totalAmount, currency)}
                                        </td>
                                        <td className="p-4 text-right text-emerald-600">
                                            {fmt(l.totalPaid, currency)}
                                        </td>
                                        <td className="p-4 text-right font-black text-red-500">
                                            {fmt(l.remainingBalance, currency)}
                                        </td>
                                        <td className="p-4">
                                            <div className="h-1.5 w-20 overflow-hidden rounded bg-neutral-100">
                                                <div
                                                    className="h-full bg-[#087f5b]"
                                                    style={{ width: `${l.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px]">{l.progress}%</span>
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={`/app/loans/${l.id}`}
                                                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold"
                                            >
                                                <Eye size={12} />
                                                Schedule
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!api.loading && !active.length && (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-neutral-400">
                                        No active loans.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex justify-between border-b pb-3">
                            <h2 className="text-sm font-extrabold">Loan application</h2>
                            <button onClick={() => setOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            <label className="block text-xs font-bold">
                                Applicant
                                <select
                                    required
                                    value={f.memberId}
                                    onChange={(e) => setF({ ...f, memberId: e.target.value })}
                                    className="mt-1 w-full rounded-lg border p-2.5"
                                >
                                    <option value="">Select member</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.fullName ||
                                                m.name ||
                                                `${m.firstName || ""} ${m.lastName || ""}`}{" "}
                                            ({m.membershipNumber || m.memberNo})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="text-xs font-bold">
                                    Product
                                    <select
                                        value={f.productId}
                                        onChange={(e) => setF({ ...f, productId: e.target.value })}
                                        className="mt-1 w-full rounded-lg border p-2.5"
                                    >
                                        <option value="">Group default</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.interestRate}%)
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-bold">
                                    Amount
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={f.amount}
                                        onChange={(e) => setF({ ...f, amount: e.target.value })}
                                        className="mt-1 w-full rounded-lg border p-2.5"
                                    />
                                </label>
                            </div>
                            <label className="block text-xs font-bold">
                                Repayment period (months)
                                <input
                                    type="number"
                                    min="1"
                                    value={f.duration}
                                    onChange={(e) => setF({ ...f, duration: e.target.value })}
                                    placeholder="Uses group default if empty"
                                    className="mt-1 w-full rounded-lg border p-2.5"
                                />
                            </label>
                            <label className="block text-xs font-bold">
                                Purpose
                                <input
                                    required
                                    value={f.purpose}
                                    onChange={(e) => setF({ ...f, purpose: e.target.value })}
                                    className="mt-1 w-full rounded-lg border p-2.5"
                                />
                            </label>
                            <button className="w-full rounded-lg bg-[#087f5b] p-2.5 text-xs font-bold text-white">
                                Submit application
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
