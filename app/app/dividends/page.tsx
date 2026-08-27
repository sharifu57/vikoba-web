"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api/client";
type Dividend = {
    id: number;
    memberName: string;
    sharesOwned: number;
    amount: number;
    contributions?: number; finesAssessed?: number; finesPaid?: number; fineDeduction?: number; shareValue?: number;
    status: string;
};
type Env<T> = { data?: T; message?: string };
const money = (n: number) => `TZS ${Number(n || 0).toLocaleString()}`;
export default function DividendsPage() {
    const qc = useQueryClient();
    const [groupId, setGroupId] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());
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
        } catch { }
    }, []);
    const q = useQuery({
        queryKey: ["dividends", groupId, year],
        queryFn: async () =>
            (
                await apiGet<Env<Dividend[]>>(
                    `/api/dividends?groupId=${groupId}&year=${year}`,
                    undefined,
                    { auth: true }
                )
            ).data || [],
        enabled: /^\d+$/.test(groupId),
    });
    const generate = useMutation({
        mutationFn: () =>
            apiPost<Env<Dividend[]>>(`/api/dividends/generate?groupId=${groupId}`, {
                financialYear: year,
            }),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ["dividends", groupId, year] }),
    });
    const rows = q.data || [];
    return (
        <main className="mx-auto max-w-7xl px-6 py-8">
            <div className="mb-8">
                <p className="text-xs font-bold text-neutral-400">
                    Finance / Dividends
                </p>
                <h1 className="mt-2 text-2xl font-black">Member dividends</h1>
                <p className="text-xs text-neutral-400">
                    Generate a transparent annual share of distributable group surplus.
                </p>
            </div>
            <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-sm font-extrabold">Generate annual dividend</h2>
                <p className="mt-1 text-xs text-neutral-500">
                    The system calculates distributable surplus from completed income,
                    paid expenses, and unpaid fine recoveries.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs font-bold">
                        Financial year
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="mt-1 w-full rounded-lg border p-2.5"
                        />
                    </label>
                    <button
                        disabled={generate.isPending}
                        onClick={() => generate.mutate()}
                        className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#087f5b] px-4 text-xs font-bold text-white disabled:opacity-50"
                    >
                        <Sparkles size={15} />
                        {generate.isPending ? "Generating…" : "Generate dividends"}
                    </button>
                </div>
                {generate.isError && (
                    <p className="mt-3 text-xs text-red-600">
                        {(generate.error as Error).message}
                    </p>
                )}
            </section>
            <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-5">
                    <h2 className="text-sm font-extrabold">{year} allocation register</h2>
                </div>
                {q.isLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="mx-auto animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-neutral-50 text-[10px] uppercase text-neutral-400">
                                    <th className="p-4">Member</th>
                                    <th className="p-4 text-right">Contributions</th><th className="p-4 text-right">Shares</th><th className="p-4 text-right">Fine balance</th>
                                    <th className="p-4 text-right">Dividend</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-t">
                                        <td className="p-4 font-bold">{r.memberName}</td>
                                        <td className="p-4 text-right">{money(r.contributions || 0)}</td><td className="p-4 text-right">{r.sharesOwned}</td><td className="p-4 text-right text-red-600">{money(r.fineDeduction || 0)}</td>
                                        <td className="p-4 text-right font-black text-[#087f5b]">
                                            {money(r.amount)}
                                        </td>
                                        <td className="p-4">{r.status}</td>
                                    </tr>
                                ))}
                                {!rows.length && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-12 text-center text-neutral-400"
                                        >
                                            No dividends generated for this year.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
