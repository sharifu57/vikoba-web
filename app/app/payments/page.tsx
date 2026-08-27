"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Filter, Loader2, Search, WalletCards } from "lucide-react";
import { usePayments, type UniversalPayment } from "@/hooks/usePayments";
import { groupService, memberService, type Group, type Member } from "@/lib/api/services";

const unwrap = <T,>(value: T | { data?: T }): T =>
    value && typeof value === "object" && "data" in value
        ? (value as { data?: T }).data as T
        : value as T;

export default function PaymentsPage() {
    const { list, record, loading, error } = usePayments();
    const [groupId, setGroupId] = useState("");
    const [payments, setPayments] = useState<UniversalPayment[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [methodFilter, setMethodFilter] = useState("ALL");
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [form, setForm] = useState({ memberId: "", amount: "", method: "CASH", type: "OTHER", reference: "", description: "" });

    const money = (value: number) => `TZS ${Number(value || 0).toLocaleString()}`;

    useEffect(() => {
        if (typeof window === "undefined") return;
        const storedId = localStorage.getItem("v360_currentGroupId") || "";
        if (/^\d+$/.test(storedId)) { setGroupId(storedId); return; }
        let groupName = storedId;
        try { groupName = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}").name || storedId; } catch { /* fallback */ }
        groupService.list().then(response => {
            const selected = (unwrap(response) as Group[]).find(group => group.name.toLowerCase() === groupName.toLowerCase());
            if (selected) { setGroupId(String(selected.id)); localStorage.setItem("v360_currentGroupId", String(selected.id)); }
        }).catch(() => setMessage("Unable to resolve the selected group."));
    }, []);

    const refresh = async () => {
        if (!groupId) return;
        try {
            const [paymentRows, memberRows] = await Promise.all([list(groupId), memberService.list(groupId)]);
            setPayments(paymentRows || []);
            setMembers(unwrap(memberRows) as Member[]);
        } catch { /* hook exposes the request error */ }
    };

    useEffect(() => { refresh(); }, [groupId]);

    const filtered = useMemo(() => payments.filter(payment => {
        const query = search.toLowerCase();
        return (!query || payment.memberName.toLowerCase().includes(query) || payment.reference.toLowerCase().includes(query)) &&
            (typeFilter === "ALL" || payment.allocationType === typeFilter) &&
            (methodFilter === "ALL" || payment.paymentMethod === methodFilter);
    }), [payments, search, typeFilter, methodFilter]);

    const completed = payments.filter(payment => payment.status === "COMPLETED");
    const total = completed.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayTotal = completed.filter(payment => payment.paymentDate?.startsWith(today)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const pending = payments.filter(payment => payment.status === "PENDING").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!groupId) return;
        try {
            await record(groupId, { groupMemberId: form.memberId || undefined, amount: Number(form.amount), paymentMethod: form.method, allocationType: form.type, reference: form.reference || undefined, description: form.description || undefined });
            setForm({ memberId: "", amount: "", method: "CASH", type: "OTHER", reference: "", description: "" });
            setShowForm(false);
            setMessage("Payment recorded successfully.");
            await refresh();
        } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Unable to record payment."); }
    };

    return <main className="min-h-screen bg-linear-to-br from-neutral-50 to-emerald-50/30 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Finance / Payments</p><h1 className="mt-2 text-3xl font-black text-neutral-900">Payments ledger</h1><p className="mt-1 text-sm text-neutral-500">One reliable record for contributions, shares, loans, fines, and fund payments.</p></div><button onClick={() => setShowForm(true)} disabled={!groupId} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><CreditCard size={17} /> Record payment</button></header>
        {message && <div className="flex justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><span>{message}</span><button onClick={() => setMessage(null)}>Dismiss</button></div>}{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Today", money(todayTotal)], ["Completed", money(total)], ["Pending", money(pending)], ["Transactions", String(payments.length)]].map(([label, value]) => <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p><p className="mt-3 text-2xl font-black text-neutral-900">{value}</p></div>)}</section>
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-neutral-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search member or reference" className="w-full rounded-lg border border-neutral-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" /></div><div className="flex gap-2"><select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-xs font-semibold"><option value="ALL">All allocations</option><option value="CONTRIBUTION">Contributions</option><option value="SHARE_PURCHASE">Share purchases</option><option value="LOAN_REPAYMENT">Loan repayments</option><option value="FINE">Fines</option><option value="SOCIAL_FUND">Social fund</option><option value="OTHER">Other</option></select><select value={methodFilter} onChange={event => setMethodFilter(event.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-xs font-semibold"><option value="ALL">All methods</option><option value="CASH">Cash</option><option value="BANK">Bank</option><option value="MOBILE_MONEY">Mobile money</option><option value="CONTROL_NUMBER">Control number</option></select></div></div></section>
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-neutral-100 p-5"><WalletCards size={18} className="text-emerald-600" /><div><h2 className="font-black text-neutral-900">All payment activity</h2><p className="text-xs text-neutral-500">Live records from the group payment table</p></div></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500"><tr><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Allocation</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-neutral-100">{filtered.map(payment => <tr key={payment.id} className="hover:bg-neutral-50"><td className="px-5 py-4 font-bold text-emerald-700">{payment.reference}</td><td className="px-5 py-4 font-bold text-neutral-800">{payment.memberName}<span className="block text-xs font-normal text-neutral-400">{payment.membershipNumber || "Group payment"}</span></td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{(payment.allocationType || "OTHER").replaceAll("_", " ")}</span></td><td className="px-5 py-4 text-xs text-neutral-600">{payment.paymentMethod.replaceAll("_", " ")}</td><td className="px-5 py-4 text-xs text-neutral-500">{new Date(payment.paymentDate).toLocaleDateString()}</td><td className="px-5 py-4 text-right font-black">{money(payment.amount)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${payment.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{payment.status}</span></td></tr>)}{filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center text-neutral-500">No payments found for this group.</td></tr>}</tbody></table></div></section>
        {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">Record payment</h2><p className="text-xs text-neutral-500">Allocate one payment to the correct module.</p></div><button onClick={() => setShowForm(false)} className="text-sm font-bold text-neutral-400">Close</button></div><form onSubmit={submit} className="space-y-4"><select value={form.memberId} onChange={event => setForm({ ...form, memberId: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option value="">Group payment / no member</option>{members.map(member => <option key={member.id} value={String(member.id)}>{member.name || member.fullName || member.memberNo}</option>)}</select><input required type="number" min="1" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} placeholder="Amount" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" /><div className="grid grid-cols-2 gap-3"><select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })} className="rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option value="OTHER">Other</option><option value="CONTRIBUTION">Contribution</option><option value="SHARE_PURCHASE">Share purchase</option><option value="LOAN_REPAYMENT">Loan repayment</option><option value="FINE">Fine</option><option value="SOCIAL_FUND">Social fund</option></select><select value={form.method} onChange={event => setForm({ ...form, method: event.target.value })} className="rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option value="CASH">Cash</option><option value="BANK">Bank</option><option value="MOBILE_MONEY">Mobile money</option><option value="CONTROL_NUMBER">Control number</option></select></div><input value={form.reference} onChange={event => setForm({ ...form, reference: event.target.value })} placeholder="Reference (optional)" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" /><textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Description" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" rows={3} /><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{loading && <Loader2 size={16} className="animate-spin" />} Save payment</button></form></div></div>}
    </div></main>;
}
