"use client";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, PlusCircle, Search, Eye } from "lucide-react";
import { memberService } from "@/lib/api/services";
import { useLoans, type Loan } from "@/hooks/useLoans";
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
    const [myMemberId, setMyMemberId] = useState(0);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState<string | null>(null);
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
            setLoans(await api.list(groupId));
            const access = await memberService.getMyAccess(groupId);
            setMyMemberId(Number(access.data?.id || 0));
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
                        className="rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-xs font-bold"
                    >
                        Review applications ({pending})
                    </Link>
                    <ButtonLink
                        href="/app/loans/apply"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B6B50] px-4 py-2.5 text-xs font-bold text-white"
                    >
                        <PlusCircle size={14} />
                        Apply for loan
                    </ButtonLink>
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
                        className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
                    >
                        <p className="text-[10px] font-bold uppercase text-neutral-400">
                            {t}
                        </p>
                        <p className="mt-2 text-lg font-black text-neutral-800">{v}</p>
                    </div>
                ))}
            </section>
            <section className="mb-8 space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-foreground">My loan applications</h2><Link href="/app/loans/apply" className="text-sm font-semibold text-primary hover:underline">View application</Link></div>{loans.filter(loan => loan.groupMemberId === myMemberId && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(loan.status)).map(loan => <div key={loan.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-foreground">{loan.loanNumber}</p><p className="text-sm text-muted-foreground">{loan.purpose} · {loan.status === 'PENDING' ? 'Awaiting guarantors' : loan.status.replaceAll('_', ' ')}</p></div><p className="font-bold text-primary">{fmt(loan.principalAmount, currency)}</p></div>{loan.guarantors?.length ? <p className="mt-3 text-xs text-muted-foreground">Guarantors: {loan.guarantors.map(person => `${person.name} (${person.status})`).join(' · ')}</p> : null}{loan.guarantors?.some(person => person.status === 'REJECTED') && <Link href="/app/loans/apply" className="mt-3 inline-block text-sm font-semibold text-amber-800 underline">Choose a replacement guarantor</Link>}</div>)}{!loans.some(loan => loan.groupMemberId === myMemberId && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(loan.status)) && <p className="rounded-xl border bg-white p-5 text-sm text-muted-foreground">No current applications.</p>}</section>
            <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-sm font-extrabold">Active loan book</h2>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-2.5 text-neutral-400"
                            size={14}
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search borrower or loan..."
                            className="rounded-lg border p-2 pl-8 text-xs"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table className="w-full text-left text-xs">
                        <TableHeader>
                            <TableRow className="bg-neutral-50 text-[9px] uppercase text-neutral-400">
                                <TableHead className="p-4">Borrower</TableHead>
                                <TableHead className="p-4">Loan</TableHead>
                                <TableHead className="p-4 text-right">Total</TableHead>
                                <TableHead className="p-4 text-right">Paid</TableHead>
                                <TableHead className="p-4 text-right">Outstanding</TableHead>
                                <TableHead className="p-4">Progress</TableHead>
                                <TableHead className="p-4"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {api.loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="p-10 text-center">
                                        <Loader2 className="inline animate-spin" size={16} />{" "}
                                        Loading loans...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                active.map((l) => (
                                    <TableRow key={l.id} className="border-t">
                                        <TableCell className="p-4 font-bold">
                                            {l.memberName}
                                            <span className="block text-[10px] font-medium text-neutral-400">
                                                {l.membershipNumber}
                                            </span>
                                        </TableCell>
                                        <TableCell className="p-4">
                                            {l.loanProductName}
                                            <span className="block text-[10px] text-neutral-400">
                                                {l.loanNumber} · {l.durationMonths} months
                                            </span>
                                        </TableCell>
                                        <TableCell className="p-4 text-right">
                                            {fmt(l.totalAmount, currency)}
                                        </TableCell>
                                        <TableCell className="p-4 text-right text-emerald-600">
                                            {fmt(l.totalPaid, currency)}
                                        </TableCell>
                                        <TableCell className="p-4 text-right font-black text-red-500">
                                            {fmt(l.remainingBalance, currency)}
                                        </TableCell>
                                        <TableCell className="p-4">
                                            <div className="h-1.5 w-20 overflow-hidden rounded bg-neutral-100">
                                                <div
                                                    className="h-full bg-[#0B6B50]"
                                                    style={{ width: `${l.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px]">{l.progress}%</span>
                                        </TableCell>
                                        <TableCell className="p-4">
                                            <Link
                                                href={`/app/loans/${l.id}`}
                                                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold"
                                            >
                                                <Eye size={12} />
                                                Schedule
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!api.loading && !active.length && (
                                <TableRow>
                                    <TableCell colSpan={7} className="p-10 text-center text-neutral-400">
                                        No active loans.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </section>
        </main>
    );
}
