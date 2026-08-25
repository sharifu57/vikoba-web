"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeftRight, Coins, Loader2, Plus, Search, TrendingUp, Undo2, type LucideIcon } from "lucide-react";
import { useShares, type ShareOwnership, type ShareSummary, type ShareTransaction } from "@/hooks/useShares";
import { groupService, memberService, type Group, type Member } from "@/lib/api/services";

type Action = "purchase" | "transfer" | "redeem" | null;

const emptySummary: ShareSummary = {
    unitPrice: 0,
    totalShares: 0,
    totalCapital: 0,
    holdersCount: 0,
    totalMembers: 0,
};

function unwrap<T>(response: T | { data?: T }): T {
    if (response && typeof response === "object" && "data" in response) {
        return (response as { data?: T }).data as T;
    }
    return response as T;
}

export default function SharesPage() {
    const { loading, error, getSummary, getOwnership, getLedger, purchase, transfer, redeem } = useShares();
    const [groupId, setGroupId] = useState("");
    const [summary, setSummary] = useState(emptySummary);
    const [ownership, setOwnership] = useState<ShareOwnership[]>([]);
    const [ledger, setLedger] = useState<ShareTransaction[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [action, setAction] = useState<Action>(null);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [purchaseForm, setPurchaseForm] = useState({ memberId: "", quantity: "", amount: "", reference: "", paymentMethod: "Cash" });
    const [transferForm, setTransferForm] = useState({ from: "", to: "", quantity: "", reference: "" });
    const [redeemForm, setRedeemForm] = useState({ memberId: "", quantity: "", reference: "" });

    const formatMoney = (value: number) => `TZS ${Number(value || 0).toLocaleString()}`;

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem("v360_currentGroupId") || "";
        if (/^\d+$/.test(stored)) {
            setGroupId(stored);
            return;
        }
        const storedGroup = localStorage.getItem("v360_currentGroup");
        let groupName = stored;
        try {
            const parsed = storedGroup ? JSON.parse(storedGroup) : {};
            groupName = parsed.groupName || parsed.name || stored;
        } catch { /* use stored value */ }
        groupService.list().then(response => {
            const groups = unwrap(response) as Group[];
            const selected = groups.find(group => group.name.toLowerCase() === groupName.toLowerCase());
            if (selected && /^\d+$/.test(String(selected.id))) {
                setGroupId(String(selected.id));
                localStorage.setItem("v360_currentGroupId", String(selected.id));
            }
        }).catch(() => setMessage("Unable to resolve the selected group."));
    }, []);

    const loadData = async () => {
        if (!groupId) return;
        try {
            const [nextSummary, nextOwnership, nextLedger, memberResponse] = await Promise.all([
                getSummary(groupId), getOwnership(groupId), getLedger(groupId), memberService.list(groupId),
            ]);
            setSummary(nextSummary || emptySummary);
            setOwnership(nextOwnership || []);
            setLedger(nextLedger || []);
            setMembers(unwrap(memberResponse) as Member[]);
        } catch { /* hook exposes the error */ }
    };

    useEffect(() => { loadData(); }, [groupId]);

    const visibleOwnership = useMemo(() => ownership.filter(item => item.memberName.toLowerCase().includes(search.toLowerCase())), [ownership, search]);
    const memberName = (id: string) => members.find(member => String(member.id) === id)?.name || "Selected member";
    const summaryCards: Array<{ label: string; value: string; icon: LucideIcon }> = [
        { label: "Share price", value: formatMoney(summary.unitPrice), icon: Coins },
        { label: "Shares in circulation", value: summary.totalShares.toLocaleString(), icon: TrendingUp },
        { label: "Total capital", value: formatMoney(summary.totalCapital), icon: Coins },
        { label: "Shareholders", value: `${summary.holdersCount} / ${summary.totalMembers}`, icon: ArrowLeftRight },
    ];

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!groupId) return;
        try {
            if (action === "purchase") {
                const quantity = purchaseForm.quantity ? Number(purchaseForm.quantity) : undefined;
                const amount = purchaseForm.amount ? Number(purchaseForm.amount) : undefined;
                if (!quantity && !amount) throw new Error("Enter shares or an amount.");
                await purchase(groupId, { groupMemberId: purchaseForm.memberId, quantity, amount, reference: purchaseForm.reference || undefined, paymentMethod: purchaseForm.paymentMethod });
            } else if (action === "transfer") {
                await transfer(groupId, { fromGroupMemberId: transferForm.from, toGroupMemberId: transferForm.to, quantity: Number(transferForm.quantity), reference: transferForm.reference || undefined });
            } else if (action === "redeem") {
                await redeem(groupId, { groupMemberId: redeemForm.memberId, quantity: Number(redeemForm.quantity), reference: redeemForm.reference || undefined });
            }
            setAction(null);
            setMessage("Share transaction recorded successfully.");
            await loadData();
        } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Unable to record transaction.");
        }
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-neutral-50 to-amber-50/40 px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-7">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Finance / Shares</p>
                        <h1 className="mt-2 text-3xl font-black text-neutral-900">Share ownership</h1>
                        <p className="mt-1 text-sm text-neutral-500">A clear view of capital, ownership, and every share movement.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setAction("purchase")} disabled={!groupId} className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"><Plus size={17} /> Buy shares</button>
                        <button onClick={() => setAction("transfer")} disabled={!groupId} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"><ArrowLeftRight size={17} /> Transfer</button>
                    </div>
                </header>

                {message && <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"><span>{message}</span><button onClick={() => setMessage(null)}>Dismiss</button></div>}
                {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={17} /> {error}</div>}
                {!groupId && <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">Select or create a group to view its shares.</div>}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {summaryCards.map(({ label, value, icon: SummaryIcon }) => <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p><SummaryIcon size={18} className="text-amber-600" /></div><p className="mt-3 text-2xl font-black text-neutral-900">{value}</p></div>)}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-black text-neutral-900">Ownership distribution</h2><p className="text-xs text-neutral-500">Calculated from the share ledger</p></div><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-neutral-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find member" className="w-44 rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-500" /></div></div>
                        <div className="space-y-4">{visibleOwnership.length === 0 ? <p className="py-8 text-center text-sm text-neutral-500">No share ownership recorded yet.</p> : visibleOwnership.map(item => <div key={item.groupMemberId}><div className="mb-1 flex justify-between text-sm"><span className="font-bold text-neutral-800">{item.memberName}</span><span className="text-neutral-500">{item.sharesOwned} shares · {item.ownershipPercentage.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(item.ownershipPercentage, 100)}%` }} /></div><p className="mt-1 text-xs text-neutral-500">{item.membershipNumber || ""} · {formatMoney(item.equityValue)}</p></div>)}</div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-white shadow-sm"><h2 className="font-black">Share rules</h2><p className="mt-2 text-sm text-neutral-300">One share costs <strong className="text-amber-300">{formatMoney(summary.unitPrice)}</strong>, taken directly from group settings.</p><div className="mt-6 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-white/10 p-3"><p className="text-neutral-400">Maximum per member</p><p className="mt-1 font-bold">{summary.maximumSharesPerMember || "No limit"}</p></div><div className="rounded-lg bg-white/10 p-3"><p className="text-neutral-400">Valuation basis</p><p className="mt-1 font-bold">Ledger balance</p></div></div><button onClick={() => setAction("redeem")} disabled={!groupId} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/50 px-4 py-2.5 text-sm font-bold text-red-200 hover:bg-red-500/20 disabled:opacity-50"><Undo2 size={16} /> Redeem shares</button></div>
                </section>

                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"><div className="border-b border-neutral-100 p-6"><h2 className="font-black text-neutral-900">Share ledger</h2><p className="text-xs text-neutral-500">Immutable purchase, transfer, and redemption history</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Member</th><th className="px-6 py-3">Type</th><th className="px-6 py-3 text-right">Shares</th><th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3">Reference</th></tr></thead><tbody className="divide-y divide-neutral-100">{ledger.map(item => <tr key={item.id}><td className="px-6 py-4 text-neutral-500">{new Date(item.transactionDate).toLocaleDateString()}</td><td className="px-6 py-4 font-bold text-neutral-800">{item.memberName}<span className="block text-xs font-normal text-neutral-400">{item.membershipNumber}</span></td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.type === "PURCHASE" ? "bg-emerald-50 text-emerald-700" : item.type === "REDEMPTION" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{item.type.replace("_", " ")}</span></td><td className="px-6 py-4 text-right font-bold">{item.quantity}</td><td className="px-6 py-4 text-right font-bold">{formatMoney(item.totalAmount)}</td><td className="px-6 py-4 text-xs text-neutral-500">{item.reference}</td></tr>)}{ledger.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-500">No share transactions recorded yet.</td></tr>}</tbody></table></div></section>
            </div>

            {action && <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-neutral-900">{action === "purchase" ? "Buy shares" : action === "transfer" ? "Transfer shares" : "Redeem shares"}</h2><p className="text-xs text-neutral-500">All values use the configured group share price.</p></div><button onClick={() => setAction(null)} className="text-sm font-bold text-neutral-400">Close</button></div><form onSubmit={submit} className="space-y-4">{action === "purchase" && <><select required value={purchaseForm.memberId} onChange={event => setPurchaseForm({ ...purchaseForm, memberId: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option value="">Select member</option>{members.map(member => <option key={member.id} value={String(member.id)}>{member.name || member.fullName || member.memberNo}</option>)}</select><div className="grid grid-cols-2 gap-3"><input type="number" min="1" value={purchaseForm.quantity} onChange={event => setPurchaseForm({ ...purchaseForm, quantity: event.target.value, amount: "" })} placeholder="Number of shares" className="rounded-lg border border-neutral-200 px-3 py-3 text-sm" /><input type="number" min="1" value={purchaseForm.amount} onChange={event => setPurchaseForm({ ...purchaseForm, amount: event.target.value, quantity: "" })} placeholder="Amount paid" className="rounded-lg border border-neutral-200 px-3 py-3 text-sm" /></div><p className="text-xs text-neutral-500">{purchaseForm.quantity ? `Total: ${formatMoney(Number(purchaseForm.quantity) * summary.unitPrice)}` : purchaseForm.amount ? `Shares: ${Math.floor(Number(purchaseForm.amount) / summary.unitPrice)}` : "Enter shares or amount"}</p><select value={purchaseForm.paymentMethod} onChange={event => setPurchaseForm({ ...purchaseForm, paymentMethod: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option></select><input value={purchaseForm.reference} onChange={event => setPurchaseForm({ ...purchaseForm, reference: event.target.value })} placeholder="Payment reference (optional)" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" /></>}{action === "transfer" && <><select required value={transferForm.from} onChange={event => setTransferForm({ ...transferForm, from: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option value="">Transfer from</option>{ownership.filter(item => item.sharesOwned > 0).map(item => <option key={item.groupMemberId} value={String(item.groupMemberId)}>{item.memberName} ({item.sharesOwned})</option>)}</select><select required value={transferForm.to} onChange={event => setTransferForm({ ...transferForm, to: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option value="">Transfer to</option>{members.map(member => <option key={member.id} value={String(member.id)}>{member.name || member.fullName || member.memberNo}</option>)}</select><input required type="number" min="1" value={transferForm.quantity} onChange={event => setTransferForm({ ...transferForm, quantity: event.target.value })} placeholder="Number of shares" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" /><input value={transferForm.reference} onChange={event => setTransferForm({ ...transferForm, reference: event.target.value })} placeholder="Transfer reference (optional)" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" /></>}{action === "redeem" && <><select required value={redeemForm.memberId} onChange={event => setRedeemForm({ ...redeemForm, memberId: event.target.value })} className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"><option value="">Select member</option>{ownership.filter(item => item.sharesOwned > 0).map(item => <option key={item.groupMemberId} value={String(item.groupMemberId)}>{item.memberName} ({item.sharesOwned})</option>)}</select><input required type="number" min="1" value={redeemForm.quantity} onChange={event => setRedeemForm({ ...redeemForm, quantity: event.target.value })} placeholder="Number of shares" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" /><input value={redeemForm.reference} onChange={event => setRedeemForm({ ...redeemForm, reference: event.target.value })} placeholder="Redemption reference (optional)" className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm" /></>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">{loading && <Loader2 size={16} className="animate-spin" />} Save transaction</button></form></div></div>}
        </main>
    );
}
