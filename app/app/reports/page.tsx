"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart, Filter, History, Printer, RefreshCw } from "lucide-react";
import { auditLogService, reportService, type AuditLog, type GroupReport } from "@/lib/api/services";

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const money = (amount = 0, currency = "TZS") => `${currency} ${Number(amount || 0).toLocaleString()}`;
const dateText = (value?: string) => value ? new Date(value).toLocaleString() : "-";

type View = "overview" | "contributions" | "loans" | "fines" | "members" | "audit";

export default function ReportsPage() {
    const [groupId, setGroupId] = useState("");
    const [groupName, setGroupName] = useState("Group reports");
    const [currency, setCurrency] = useState("TZS");
    const [start, setStart] = useState(monthStart);
    const [end, setEnd] = useState(today);
    const [view, setView] = useState<View>("overview");

    useEffect(() => {
        try {
            const group = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
            setGroupId(String(group.id ?? group.groupId ?? localStorage.getItem("v360_currentGroupId") ?? ""));
            setGroupName(group.name || "Group reports");
            setCurrency(group.currency || "TZS");
        } catch { /* storage may be unavailable during sign-out */ }
    }, []);

    const reportQ = useQuery({
        queryKey: ["group-report", groupId, start, end],
        queryFn: () => reportService.getGroupReport(groupId, start, end),
        enabled: /^\d+$/.test(groupId),
    });
    const auditQ = useQuery({
        queryKey: ["audit-logs", groupId],
        queryFn: () => auditLogService.list(groupId, 0, 50),
        enabled: view === "audit" && /^\d+$/.test(groupId),
    });
    const report = reportQ.data as GroupReport | undefined;
    const summary = report?.summary;
    const audit = (auditQ.data?.content || []) as AuditLog[];
    const tabs: Array<[View, string]> = [["overview", "Executive overview"], ["contributions", "Contributions"], ["loans", "Loan portfolio"], ["fines", "Fines & penalties"], ["members", "Member balances"], ["audit", "Audit trail"]];

    return (
        <main className="mx-auto max-w-7xl px-6 py-8 print:px-0">
            <header className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end print:mb-5">
                <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#087f5b]">Governance / Reporting</p><h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-900">Reports center</h1><p className="mt-1 text-xs text-neutral-500">Classic group statements, portfolio oversight, and a defensible activity trail.</p></div>
                <div className="flex gap-2 print:hidden"><button onClick={() => void reportQ.refetch()} className="inline-flex items-center gap-2 rounded-lg border border-[#dfe8e2] bg-white px-3 py-2 text-xs font-bold"><RefreshCw size={14} className={reportQ.isFetching ? "animate-spin" : ""} /> Refresh</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-[#087f5b] px-3 py-2 text-xs font-bold text-white"><Printer size={14} /> Print statement</button></div>
            </header>

            <section className="mb-6 grid gap-4 rounded-2xl border border-[#dfe8e2] bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_1fr_auto] print:hidden">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Period from<input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#dfe8e2] p-2 text-xs font-semibold text-neutral-800" /></label>
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Period to<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="mt-1 block w-full rounded-lg border border-[#dfe8e2] p-2 text-xs font-semibold text-neutral-800" /></label>
                <div className="flex items-end text-xs font-semibold text-neutral-500"><Filter size={14} className="mr-2 text-[#087f5b]" /> All group activity</div>
                <button onClick={() => { setStart(monthStart); setEnd(today); }} className="rounded-lg border border-[#dfe8e2] px-3 py-2 text-xs font-bold">This month</button>
            </section>

            <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-[#dfe8e2] print:hidden">{tabs.map(([id, label]) => <button key={id} onClick={() => setView(id)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-bold ${view === id ? "border-[#087f5b] text-[#087f5b]" : "border-transparent text-neutral-500"}`}>{label}</button>)}</nav>

            {reportQ.isLoading && <div className="rounded-2xl border border-[#dfe8e2] bg-white p-16 text-center text-xs text-neutral-500">Preparing the group statement...</div>}
            {reportQ.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-xs text-red-700">Unable to load the group report. {(reportQ.error as Error).message}</div>}
            {report && <div className="rounded-2xl border border-[#dfe8e2] bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
                <div className="mb-7 flex items-start justify-between border-b border-dashed border-neutral-200 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#087f5b]">Official group statement</p><h2 className="mt-1 text-2xl font-black uppercase">{report.groupName || groupName}</h2><p className="mt-1 text-xs text-neutral-500">{report.periodStart} to {report.periodEnd} · {currency}</p></div><FileBarChart className="text-[#087f5b]" size={30} /></div>
                {view !== "audit" && <><div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">{[["Members", summary?.members], ["Contributions", money(summary?.contributions, currency)], ["Share capital", money(summary?.shareCapital, currency)], ["Loan exposure", money(summary?.loanOutstanding, currency)], ["Income", money(summary?.income, currency)], ["Expenses", money(summary?.expenses, currency)], ["Net income", money(summary?.netIncome, currency)], ["Outstanding fines", money(summary?.finesOutstanding, currency)]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-[#f5f8f5] p-4"><p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">{label}</p><p className="mt-2 text-sm font-black text-neutral-900">{value}</p></div>)}</div>
                    {view === "overview" && <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr]"><div><h3 className="mb-3 text-sm font-black">Monthly movement</h3><table className="w-full text-left text-xs"><thead><tr className="border-b text-[9px] uppercase text-neutral-400"><th className="py-2">Month</th><th className="py-2 text-right">Contributions</th><th className="py-2 text-right">Payments</th><th className="py-2 text-right">Expenses</th></tr></thead><tbody>{report.monthlyTotals.map((row) => <tr key={row.month} className="border-b border-neutral-100"><td className="py-3 font-bold">{row.month}</td><td className="py-3 text-right">{money(row.contributions, currency)}</td><td className="py-3 text-right">{money(row.payments, currency)}</td><td className="py-3 text-right text-red-600">{money(row.expenses, currency)}</td></tr>)}</tbody></table></div><div><h3 className="mb-3 text-sm font-black">Operational pulse</h3><div className="space-y-2 text-xs">{[["Active loans", summary?.activeLoans], ["Unpaid fines", summary?.unpaidFines], ["Meetings in period", summary?.meetings]].map(([label, value]) => <div key={String(label)} className="flex justify-between border-b border-neutral-100 py-3"><span className="text-neutral-500">{label}</span><strong>{value}</strong></div>)}</div></div></div>}
                    {view === "contributions" && <TransactionTable rows={report.recentTransactions.filter((row) => row.category?.includes("CONTRIBUTION"))} currency={currency} />}
                    {view === "loans" && <div><h3 className="mb-3 text-sm font-black">Loan portfolio</h3><p className="mb-4 text-xs text-neutral-500">Current exposure: <strong>{money(summary?.loanOutstanding, currency)}</strong> across {summary?.activeLoans} active or disbursed loans.</p><MemberTable rows={report.memberBalances.filter((row) => row.loanBalance > 0)} currency={currency} loan /></div>}
                    {view === "fines" && <div><h3 className="mb-3 text-sm font-black">Fines and penalties</h3><p className="mb-4 text-xs text-neutral-500">Outstanding fines: <strong>{money(summary?.finesOutstanding, currency)}</strong> across {summary?.unpaidFines} open records.</p><MemberTable rows={report.memberBalances.filter((row) => row.fines > 0)} currency={currency} fines /></div>}
                    {view === "members" && <MemberTable rows={report.memberBalances} currency={currency} />}</>}
                {view === "audit" && <AuditTable rows={audit} loading={auditQ.isLoading} />}
                <footer className="mt-10 grid grid-cols-2 gap-10 border-t border-dashed border-neutral-200 pt-10 text-center text-[10px] font-bold text-neutral-500"><div><div className="mx-auto mb-2 h-7 w-40 border-b border-neutral-300" />Treasurer signature</div><div><div className="mx-auto mb-2 h-7 w-40 border-b border-neutral-300" />Group administrator signature</div></footer>
            </div>}
        </main>
    );
}
function TransactionTable({ rows, currency }: { rows: GroupReport["recentTransactions"]; currency: string }) { return <div><h3 className="mb-3 text-sm font-black">Activity statement</h3><table className="w-full text-left text-xs"><thead><tr className="border-b text-[9px] uppercase text-neutral-400"><th className="py-2">Date</th><th className="py-2">Reference</th><th className="py-2">Member</th><th className="py-2">Category</th><th className="py-2 text-right">Amount</th><th className="py-2">Status</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.reference}-${index}`} className="border-b border-neutral-100"><td className="py-3">{row.date || "-"}</td><td className="py-3 font-bold">{row.reference || "-"}</td><td className="py-3">{row.memberName || "-"}</td><td className="py-3">{row.category || "-"}</td><td className={`py-3 text-right font-black ${row.amount < 0 ? "text-red-600" : ""}`}>{money(row.amount, currency)}</td><td className="py-3 text-[10px] font-bold">{row.status || "-"}</td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-xs text-neutral-400">No matching activity in this period.</p>}</div>; }
function MemberTable({ rows, currency, loan, fines }: { rows: GroupReport["memberBalances"]; currency: string; loan?: boolean; fines?: boolean }) { return <table className="w-full text-left text-xs"><thead><tr className="border-b text-[9px] uppercase text-neutral-400"><th className="py-2">Member</th><th className="py-2">Membership</th><th className="py-2 text-right">Contributions</th><th className="py-2 text-right">Fines</th><th className="py-2 text-right">Loan balance</th></tr></thead><tbody>{rows.map((row) => <tr key={row.groupMemberId} className="border-b border-neutral-100"><td className="py-3 font-bold">{row.memberName}</td><td className="py-3 text-neutral-500">{row.membershipNumber || "-"}</td><td className="py-3 text-right">{money(row.contributions, currency)}</td><td className={`py-3 text-right ${fines ? "font-black text-red-600" : ""}`}>{money(row.fines, currency)}</td><td className={`py-3 text-right ${loan ? "font-black text-amber-700" : ""}`}>{money(row.loanBalance, currency)}</td></tr>)}</tbody></table>; }
function AuditTable({ rows, loading }: { rows: AuditLog[]; loading: boolean }) { return <div><div className="mb-4 flex items-center gap-2"><History size={16} className="text-[#087f5b]" /><div><h3 className="text-sm font-black">System audit trail</h3><p className="text-xs text-neutral-500">Every authenticated API action is recorded for future review.</p></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-[9px] uppercase text-neutral-400"><th className="py-2">When</th><th className="py-2">User</th><th className="py-2">Action</th><th className="py-2">Area</th><th className="py-2">Details</th><th className="py-2">IP</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-10 text-center">Loading audit records...</td></tr> : rows.map((row) => <tr key={row.id} className="border-b border-neutral-100"><td className="py-3 whitespace-nowrap">{dateText(row.createdAt)}</td><td className="py-3 font-bold">{row.username || "System"}</td><td className="py-3"><span className="rounded bg-[#eaf6ef] px-2 py-1 text-[9px] font-black text-[#087f5b]">{row.action}</span></td><td className="py-3 font-semibold">{row.entityType}</td><td className="py-3 text-neutral-600">{row.description || "-"}</td><td className="py-3 text-neutral-500">{row.ipAddress || "-"}</td></tr>)}</tbody></table>{!loading && !rows.length && <p className="p-8 text-center text-xs text-neutral-400">No audit records have been recorded for this group yet.</p>}</div></div>; }
