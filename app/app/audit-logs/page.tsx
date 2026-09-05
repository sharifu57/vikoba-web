"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Clock3, Filter, History, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { auditLogService, type AuditLog } from "@/lib/api/services";

const PAGE_SIZE = 25;
const dateText = (value?: string) => value ? new Date(value).toLocaleString() : "-";
const actionStyles: Record<string, string> = {
    CREATE: "bg-emerald-50 text-emerald-700",
    UPDATE: "bg-blue-50 text-blue-700",
    DELETE: "bg-red-50 text-red-700",
    APPROVE: "bg-teal-50 text-teal-700",
    REJECT: "bg-orange-50 text-orange-700",
    REVERSE: "bg-purple-50 text-purple-700",
    LOGIN: "bg-sky-50 text-sky-700",
    LOGOUT: "bg-neutral-100 text-neutral-700",
};

export default function AuditLogsPage() {
    const [groupId, setGroupId] = useState("");
    const [groupName, setGroupName] = useState("Current group");
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("ALL");
    const [expanded, setExpanded] = useState<string | number | null>(null);

    useEffect(() => {
        try {
            const group = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
            setGroupId(String(group.id ?? group.groupId ?? localStorage.getItem("v360_currentGroupId") ?? ""));
            setGroupName(group.name || "Current group");
        } catch { /* storage may be unavailable during sign-out */ }
    }, []);

    const logsQ = useQuery({
        queryKey: ["audit-logs-page", groupId, page],
        queryFn: () => auditLogService.list(groupId, page, PAGE_SIZE),
        enabled: /^\d+$/.test(groupId),
    });
    const logs = (logsQ.data?.content || []) as AuditLog[];
    const total = logsQ.data?.totalElements || 0;
    const visible = useMemo(() => logs.filter((log) => {
        const matchesAction = action === "ALL" || log.action === action;
        const needle = search.trim().toLowerCase();
        return matchesAction && (!needle || `${log.username || ""} ${log.entityType} ${log.description || ""} ${log.ipAddress || ""}`.toLowerCase().includes(needle));
    }), [action, logs, search]);
    const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
    const firstRecord = total === 0 ? 0 : page * PAGE_SIZE + 1;
    const lastRecord = Math.min((page + 1) * PAGE_SIZE, total);

    return (
        <main className="mx-auto max-w-7xl px-6 py-8">
            <header className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#087f5b]">Governance / Security</p>
                    <div className="mt-2 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#087f5b]"><ShieldCheck size={23} /></div><div><h1 className="text-3xl font-black tracking-tight text-neutral-900">Audit logs</h1><p className="mt-1 text-xs text-neutral-500">A permanent record of activity across {groupName}.</p></div></div>
                </div>
                <button onClick={() => void logsQ.refetch()} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#dfe8e2] bg-white px-4 py-2.5 text-xs font-bold lg:self-auto"><RefreshCw size={14} className={logsQ.isFetching ? "animate-spin" : ""} /> Refresh records</button>
            </header>

            <section className="mb-6 grid gap-4 md:grid-cols-[1fr_220px_auto]">
                <div className="flex items-center rounded-xl border border-[#dfe8e2] bg-white px-4 shadow-sm"><Search size={15} className="mr-2 shrink-0 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user, area, description, or IP..." className="w-full py-3 text-xs outline-none" /></div>
                <label className="flex items-center gap-2 rounded-xl border border-[#dfe8e2] bg-white px-4 text-xs font-bold text-neutral-600 shadow-sm"><Filter size={14} className="text-[#087f5b]" /><select value={action} onChange={(event) => setAction(event.target.value)} className="w-full bg-transparent py-3 outline-none"><option value="ALL">All actions</option>{actions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <div className="flex items-center justify-center gap-2 rounded-xl border border-[#dfe8e2] bg-white px-4 text-xs font-bold text-neutral-600 shadow-sm"><History size={14} className="text-[#087f5b]" /> {total.toLocaleString()} records</div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#dfe8e2] bg-white shadow-sm">
                <div className="border-b border-neutral-100 bg-[#f8faf8] px-5 py-4"><div className="flex items-center gap-2"><Clock3 size={15} className="text-[#087f5b]" /><div><h2 className="text-sm font-black">Activity history</h2><p className="text-[10px] text-neutral-500">Records are generated automatically from authenticated system activity.</p></div></div></div>
                {logsQ.isLoading && <div className="p-16 text-center text-xs text-neutral-500">Loading audit records...</div>}
                {logsQ.isError && <div className="p-8 text-center text-xs text-red-600">Unable to load audit logs. {(logsQ.error as Error).message}</div>}
                {!logsQ.isLoading && !logsQ.isError && <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead><tr className="border-b bg-white text-[9px] uppercase tracking-wider text-neutral-400"><th className="px-5 py-3">When</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">IP address</th><th className="px-5 py-3" /></tr></thead><tbody>{visible.map((log) => { const isExpanded = expanded === log.id; return <tr key={log.id} className="border-b border-neutral-100 align-top hover:bg-[#fbfdfb]"><td className="whitespace-nowrap px-5 py-4 text-neutral-500">{dateText(log.createdAt)}</td><td className="px-5 py-4"><span className="font-bold text-neutral-900">{log.username || "System"}</span>{log.entityId && <span className="mt-1 block text-[10px] text-neutral-400">Record #{log.entityId}</span>}</td><td className="px-5 py-4"><span className={`rounded px-2 py-1 text-[9px] font-black ${actionStyles[log.action] || "bg-neutral-100 text-neutral-700"}`}>{log.action}</span></td><td className="px-5 py-4 font-bold text-neutral-700">{log.entityType}</td><td className="max-w-[330px] px-5 py-4 text-neutral-600">{log.description || "No description"}{isExpanded && <div className="mt-3 space-y-2 rounded-lg bg-neutral-50 p-3 text-[10px]"><Detail label="Old values" value={log.oldValues} /><Detail label="New values" value={log.newValues} /></div>}</td><td className="px-5 py-4 font-mono text-[10px] text-neutral-500">{log.ipAddress || "-"}</td><td className="px-5 py-4 text-right"><button title={isExpanded ? "Hide details" : "Show details"} onClick={() => setExpanded(isExpanded ? null : log.id)} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"><ChevronDown size={16} className={isExpanded ? "rotate-180" : ""} /></button></td></tr>; })}</tbody></table>{!visible.length && <div className="p-14 text-center text-xs text-neutral-400">No audit records match the current filters.</div>}</div>}
                <footer className="flex flex-col justify-between gap-3 border-t border-neutral-100 px-5 py-4 text-xs text-neutral-500 sm:flex-row sm:items-center"><span>Showing {firstRecord.toLocaleString()}-{lastRecord.toLocaleString()} of {total.toLocaleString()}</span><div className="flex items-center gap-2"><button disabled={page === 0 || logsQ.isFetching} onClick={() => { setPage((current) => Math.max(0, current - 1)); setExpanded(null); }} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe8e2] px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={14} /> Previous</button><span className="px-2 font-bold text-neutral-700">Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><button disabled={lastRecord >= total || logsQ.isFetching} onClick={() => { setPage((current) => current + 1); setExpanded(null); }} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe8e2] px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight size={14} /></button></div></footer>
            </section>
        </main>
    );
}

function Detail({ label, value }: { label: string; value?: string }) { return <div><span className="font-black uppercase tracking-wider text-neutral-400">{label}</span><pre className="mt-1 whitespace-pre-wrap break-all font-mono text-neutral-600">{value || "-"}</pre></div>; }
