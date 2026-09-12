"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeftRight,
    Coins,
    Loader2,
    Plus,
    Search,
    TrendingUp,
    Undo2,
    type LucideIcon,
} from "lucide-react";
import {
    useShares,
    type ShareOwnership,
    type SharePurchaseRequest,
    type ShareSummary,
    type ShareTransaction,
} from "@/hooks/useShares";
import { groupService, type Group } from "@/lib/api/services";
import { buildApiUrl } from "@/lib/api/endpoints";
import { getAccessToken } from "@/lib/api/client";

type Action = "purchase" | "redeem" | null;

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
    const {
        loading,
        error,
        getSummary,
        getOwnership,
        getLedger,
        submitPurchaseRequest,
        redeem,
        getPurchaseRequests,
        approvePurchaseRequest,
        rejectPurchaseRequest,
    } = useShares();
    const [groupId, setGroupId] = useState("");
    const [summary, setSummary] = useState(emptySummary);
    const [ownership, setOwnership] = useState<ShareOwnership[]>([]);
    const [ledger, setLedger] = useState<ShareTransaction[]>([]);
    const [purchaseRequests, setPurchaseRequests] = useState<SharePurchaseRequest[]>([]);
    const [canReviewPurchaseProofs, setCanReviewPurchaseProofs] = useState(false);
    const [currentGroupMemberId, setCurrentGroupMemberId] = useState("");
    const [minimumPurchaseAmount, setMinimumPurchaseAmount] = useState(0);
    const [action, setAction] = useState<Action>(null);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [purchaseForm, setPurchaseForm] = useState({
        quantity: "",
        jamiiAmount: "",
        reference: "",
        paymentMethod: "Mobile Money",
    });
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [redeemForm, setRedeemForm] = useState({
        quantity: "",
        reference: "",
    });

    const formatMoney = (value: number) =>
        `TZS ${Number(value || 0).toLocaleString()}`;

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
        } catch {
            /* use stored value */
        }
        groupService
            .list()
            .then((response) => {
                const groups = unwrap(response) as Group[];
                const selected = groups.find(
                    (group) => group.name.toLowerCase() === groupName.toLowerCase(),
                );
                if (selected && /^\d+$/.test(String(selected.id))) {
                    setGroupId(String(selected.id));
                    localStorage.setItem("v360_currentGroupId", String(selected.id));
                }
            })
            .catch(() => setMessage("Unable to resolve the selected group."));
    }, []);

    useEffect(() => {
        if (!groupId) return;
        groupService.getWithSettings(groupId).then((response) => {
            const payload = response as { data?: { settings?: { jamiiContributionPerSharePayment?: number; minimumSharePurchaseAmount?: number } }; settings?: { jamiiContributionPerSharePayment?: number; minimumSharePurchaseAmount?: number } };
            const configuredAmount = payload.data?.settings?.jamiiContributionPerSharePayment ?? payload.settings?.jamiiContributionPerSharePayment;
            const configuredMinimum = payload.data?.settings?.minimumSharePurchaseAmount ?? payload.settings?.minimumSharePurchaseAmount;
            if (configuredAmount !== undefined) setPurchaseForm(current => ({ ...current, jamiiAmount: String(configuredAmount || "") }));
            if (configuredMinimum !== undefined) setMinimumPurchaseAmount(Number(configuredMinimum || 0));
        }).catch(() => { /* The optional Jamii amount can still be entered manually. */ });
    }, [groupId]);

    const loadData = async () => {
        if (!groupId) return;
        try {
            const [nextSummary, nextOwnership, nextLedger, nextRequests] =
                await Promise.all([
                    getSummary(groupId),
                    getOwnership(groupId),
                    getLedger(groupId),
                    canReviewPurchaseProofs ? getPurchaseRequests(groupId) : Promise.resolve([]),
                ]);
            setSummary(nextSummary || emptySummary);
            setOwnership(nextOwnership || []);
            setLedger(nextLedger || []);
            setPurchaseRequests(nextRequests || []);
        } catch {
            /* hook exposes the error */
        }
    };

    useEffect(() => {
        if (typeof window === "undefined" || !groupId) return;
        try {
            const groups = JSON.parse(localStorage.getItem("v360_groups") || "[]") as Array<Record<string, unknown>>;
            const selected = groups.find((item) => {
                const group = (item.group || item) as Record<string, unknown>;
                return String(group.groupId ?? group.id) === groupId;
            });
            const roles = Array.isArray(selected?.roles)
                ? selected.roles.map(String).map((role) => role.toUpperCase())
                : [String(selected?.role || "MEMBER").toUpperCase()];
            const permissions = Array.isArray(selected?.permissions)
                ? selected.permissions.map(String).map((permission) => permission.toUpperCase())
                : [];
            setCanReviewPurchaseProofs(
                roles.some((role) => ["GROUP_ADMIN", "GROUP_CHAIRMAN", "CHAIRPERSON", "ACCOUNTANT"].includes(role)) ||
                permissions.some((permission) => permission.includes("SHARE") && permission.includes("APPROV")),
            );
            setCurrentGroupMemberId(String(selected?.groupMemberId ?? selected?.id ?? localStorage.getItem("v360_currentGroupMemberId") ?? ""));
        } catch {
            setCanReviewPurchaseProofs(false);
        }
    }, [groupId]);

    useEffect(() => {
        loadData();
    }, [groupId, canReviewPurchaseProofs]);

    const reviewRequest = async (request: SharePurchaseRequest, decision: "approve" | "reject") => {
        if (!groupId) return;
        try {
            if (decision === "approve") {
                await approvePurchaseRequest(groupId, request.id);
                setMessage(`${request.memberName}'s payment was approved and shares were added.`);
            } else {
                const reason = window.prompt("Reason for rejecting this proof", "Proof could not be verified") || "Proof could not be verified";
                await rejectPurchaseRequest(groupId, request.id, reason);
                setMessage(`${request.memberName}'s payment proof was rejected.`);
            }
            await loadData();
        } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Unable to review payment proof.");
        }
    };

    const openProof = async (request: SharePurchaseRequest) => {
        if (!groupId) return;
        try {
            const response = await fetch(
                buildApiUrl(`/api/share-purchase-requests/group/${groupId}/${request.id}/proof`),
                { headers: { Authorization: `Bearer ${getAccessToken() || ""}` } },
            );
            if (!response.ok) throw new Error("Unable to open payment proof.");
            const blobUrl = URL.createObjectURL(await response.blob());
            window.open(blobUrl, "_blank", "noopener,noreferrer");
        } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Unable to open payment proof.");
        }
    };

    const visibleOwnership = useMemo(
        () =>
            ownership.filter((item) =>
                item.memberName.toLowerCase().includes(search.toLowerCase()),
            ),
        [ownership, search],
    );
    const currentOwnership = ownership.find((item) => String(item.groupMemberId) === currentGroupMemberId);
    const selectedQuantity = Number(purchaseForm.quantity || 0);
    const shareAmount = selectedQuantity * summary.unitPrice;
    const summaryCards: Array<{
        label: string;
        value: string;
        icon: LucideIcon;
    }> = [
            {
                label: "Share price",
                value: formatMoney(summary.unitPrice),
                icon: Coins,
            },
            {
                label: "Shares in circulation",
                value: summary.totalShares.toLocaleString(),
                icon: TrendingUp,
            },
            {
                label: "Total capital",
                value: formatMoney(summary.totalCapital),
                icon: Coins,
            },
            {
                label: "Shareholders",
                value: `${summary.holdersCount} / ${summary.totalMembers}`,
                icon: ArrowLeftRight,
            },
        ];

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!groupId) return;
        try {
            if (action === "purchase") {
                if (!selectedQuantity) throw new Error("Enter the number of shares you want to buy.");
                if (shareAmount < minimumPurchaseAmount) throw new Error(`The minimum purchase is ${formatMoney(minimumPurchaseAmount)}.`);
                if (!proofFile) throw new Error("Attach a receipt or payment message screenshot.");
                const data = new FormData();
                data.append("amount", String(shareAmount));
                data.append("quantity", String(selectedQuantity));
                data.append("paymentMethod", purchaseForm.paymentMethod);
                if (purchaseForm.reference.trim()) data.append("paymentReference", purchaseForm.reference.trim());
                data.append("proofFile", proofFile);
                await submitPurchaseRequest(groupId, data);
            } else if (action === "redeem") {
                if (!currentGroupMemberId) throw new Error("Your active membership could not be resolved.");
                await redeem(groupId, {
                    groupMemberId: currentGroupMemberId,
                    quantity: Number(redeemForm.quantity),
                    reference: redeemForm.reference || undefined,
                });
            }
            setAction(null);
            setProofFile(null);
            setMessage(action === "purchase" ? "Your share purchase and payment proof were submitted for approval." : "Share redemption recorded successfully.");
            await loadData();
        } catch (cause) {
            setMessage(
                cause instanceof Error
                    ? cause.message
                    : "Unable to record transaction.",
            );
        }
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-neutral-50 to-amber-50/40 px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-7xl space-y-7">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                            Finance / Shares
                        </p>
                        <h1 className="mt-2 text-3xl font-black text-neutral-900">
                            Share ownership
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            A clear view of capital, ownership, and every share movement.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAction("purchase")}
                            disabled={!groupId}
                            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                        >
                            <Plus size={17} /> Buy shares
                        </button>
                        <button
                            onClick={() => setAction("redeem")}
                            disabled={!groupId || !currentOwnership?.sharesOwned}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                            <Undo2 size={17} /> Redeem shares
                        </button>
                    </div>
                </header>

                {message && (
                    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                        <span>{message}</span>
                        <button onClick={() => setMessage(null)}>Dismiss</button>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        <AlertCircle size={17} /> {error}
                    </div>
                )}
                {!groupId && (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
                        Select or create a group to view its shares.
                    </div>
                )}

                {groupId && canReviewPurchaseProofs && (
                    <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm">
                        <div className="flex items-center justify-between border-b border-amber-200 px-6 py-5">
                            <div>
                                <h2 className="font-black text-neutral-900">Payment proofs awaiting review</h2>
                                <p className="mt-1 text-xs text-neutral-600">
                                    Approve only after confirming the M-Pesa reference or attached receipt.
                                </p>
                            </div>
                            <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-black text-white">
                                {purchaseRequests.length} pending
                            </span>
                        </div>
                        <div className="divide-y divide-amber-100 bg-white">
                            {purchaseRequests.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-neutral-500">No payment proofs are waiting.</p>
                            ) : purchaseRequests.map((request) => (
                                <div key={request.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-black text-neutral-900">{request.memberName}</p>
                                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-800">Pending</span>
                                        </div>
                                        <p className="mt-1 text-sm text-neutral-600">
                                            {request.quantity} shares · {formatMoney(request.amount)} · {request.paymentMethod}
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            Ref: {request.paymentReference || "Not provided"} · Submitted {new Date(request.submittedAt).toLocaleString()}
                                        </p>
                                        {request.proofText && <p className="mt-2 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">{request.proofText}</p>}
                                        {request.hasProofFile && (
                                            <button
                                                type="button"
                                                onClick={() => openProof(request)}
                                                className="mt-2 inline-flex text-xs font-bold text-emerald-700 underline"
                                            >
                                                Open {request.proofFileName || "payment proof"}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 lg:justify-end">
                                        <button onClick={() => reviewRequest(request, "reject")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50">Reject</button>
                                        <button onClick={() => reviewRequest(request, "approve")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800">Approve and add shares</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {summaryCards.map(({ label, value, icon: SummaryIcon }) => (
                        <div
                            key={label}
                            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                                    {label}
                                </p>
                                <SummaryIcon size={18} className="text-amber-600" />
                            </div>
                            <p className="mt-3 text-2xl font-black text-neutral-900">
                                {value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-black text-neutral-900">
                                    Ownership distribution
                                </h2>
                                <p className="text-xs text-neutral-500">
                                    Calculated from the share ledger
                                </p>
                            </div>
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-2.5 text-neutral-400"
                                />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Find member"
                                    className="w-44 rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {visibleOwnership.length === 0 ? (
                                <p className="py-8 text-center text-sm text-neutral-500">
                                    No share ownership recorded yet.
                                </p>
                            ) : (
                                visibleOwnership.map((item) => (
                                    <div key={item.groupMemberId}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span className="font-bold text-neutral-800">
                                                {item.memberName}
                                            </span>
                                            <span className="text-neutral-500">
                                                {item.sharesOwned} shares ·{" "}
                                                {item.ownershipPercentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                                            <div
                                                className="h-full rounded-full bg-amber-500"
                                                style={{
                                                    width: `${Math.min(item.ownershipPercentage, 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            {item.membershipNumber || ""} ·{" "}
                                            {formatMoney(item.equityValue)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-6 text-white shadow-sm">
                        <h2 className="font-black">Share rules</h2>
                        <p className="mt-2 text-sm text-neutral-300">
                            One share costs{" "}
                            <strong className="text-amber-300">
                                {formatMoney(summary.unitPrice)}
                            </strong>
                            , taken directly from group settings.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-white/10 p-3">
                                <p className="text-neutral-400">Maximum per member</p>
                                <p className="mt-1 font-bold">
                                    {summary.maximumSharesPerMember || "No limit"}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-3">
                                <p className="text-neutral-400">Valuation basis</p>
                                <p className="mt-1 font-bold">Ledger balance</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAction("redeem")}
                            disabled={!groupId}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/50 px-4 py-2.5 text-sm font-bold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                        >
                            <Undo2 size={16} /> Redeem shares
                        </button>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-100 p-6">
                        <h2 className="font-black text-neutral-900">Share ledger</h2>
                        <p className="text-xs text-neutral-500">
                            Immutable purchase, transfer, and redemption history
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Member</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-right">Shares</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3">Reference</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {ledger.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 text-neutral-500">
                                            {new Date(item.transactionDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-neutral-800">
                                            {item.memberName}
                                            <span className="block text-xs font-normal text-neutral-400">
                                                {item.membershipNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.type === "PURCHASE" ? "bg-emerald-50 text-emerald-700" : item.type === "REDEMPTION" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}
                                            >
                                                {item.type.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            {formatMoney(item.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-neutral-500">
                                            {item.reference}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-red-500 hover:text-red-700">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {ledger.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-neutral-500"
                                        >
                                            No share transactions recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {action && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-neutral-900">
                                    {action === "purchase" ? "Buy shares" : "Redeem shares"}
                                </h2>
                                <p className="text-xs text-neutral-500">
                                    All values use the configured group share price.
                                </p>
                            </div>
                            <button
                                onClick={() => setAction(null)}
                                className="text-sm font-bold text-neutral-400"
                            >
                                Close
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            {action === "purchase" && (
                                <>
                                    <div className="rounded-lg border border-[#B5D7C5] bg-[#F2F7F4] p-3 text-xs text-[#08503C]">This purchase is for your own active membership. Your payment proof will go to the accountant and chair for approval before shares are added.</div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold text-neutral-700">How many shares are you buying?</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={purchaseForm.quantity}
                                            onChange={(event) =>
                                                setPurchaseForm({
                                                    ...purchaseForm,
                                                    quantity: event.target.value,
                                                })
                                            }
                                            placeholder="Number of shares"
                                            className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-neutral-50 p-3"><p className="text-neutral-400">Share amount</p><p className="mt-1 font-black text-neutral-900">{formatMoney(shareAmount)}</p></div><div className="rounded-lg bg-neutral-50 p-3"><p className="text-neutral-400">Jamii amount</p><p className="mt-1 font-black text-neutral-900">{formatMoney(Number(purchaseForm.jamiiAmount || 0))}</p></div></div>
                                    <p className="text-xs text-neutral-500">Minimum purchase: {formatMoney(minimumPurchaseAmount || summary.unitPrice)}. The Jamii amount is configured separately from shares.</p>
                                    <select
                                        value={purchaseForm.paymentMethod}
                                        onChange={(event) =>
                                            setPurchaseForm({
                                                ...purchaseForm,
                                                paymentMethod: event.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                                    >
                                        <option>Cash</option>
                                        <option>Mobile Money</option>
                                        <option>Bank Transfer</option>
                                    </select>
                                    <input
                                        value={purchaseForm.reference}
                                        onChange={(event) =>
                                            setPurchaseForm({
                                                ...purchaseForm,
                                                reference: event.target.value,
                                            })
                                        }
                                        placeholder="Payment reference (optional)"
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                                    />
                                    <label className="block text-xs font-bold text-neutral-700">Payment proof *<input required type="file" accept="image/*,application/pdf" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className="mt-1.5 block w-full text-xs font-normal text-neutral-600" /></label>
                                </>
                            )}
                            {action === "redeem" && (
                                <>
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">You are redeeming from your own balance of {currentOwnership?.sharesOwned || 0} shares. This cannot be undone from the ledger.</div>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={redeemForm.quantity}
                                        onChange={(event) =>
                                            setRedeemForm({
                                                ...redeemForm,
                                                quantity: event.target.value,
                                            })
                                        }
                                        placeholder="Number of shares"
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                                    />
                                    <input
                                        value={redeemForm.reference}
                                        onChange={(event) =>
                                            setRedeemForm({
                                                ...redeemForm,
                                                reference: event.target.value,
                                            })
                                        }
                                        placeholder="Redemption reference (optional)"
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm"
                                    />
                                </>
                            )}
                            <button
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />} Save
                                transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
