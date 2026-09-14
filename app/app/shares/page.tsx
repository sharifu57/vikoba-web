"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
import { groupService, sharePurchaseRequestService, type Group } from "@/lib/api/services";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";

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
        error,
        getSummary,
        getOwnership,
        getLedger,
        redeem,
    } = useShares();
    const [groupId, setGroupId] = useState("");
    const [summary, setSummary] = useState(emptySummary);
    const [ownership, setOwnership] = useState<ShareOwnership[]>([]);
    const [ledger, setLedger] = useState<ShareTransaction[]>([]);
    const [myPurchaseRequests, setMyPurchaseRequests] = useState<SharePurchaseRequest[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshingAfterSubmit, setIsRefreshingAfterSubmit] = useState(false);
    const submitInFlight = useRef(false);
    const [canReviewPurchaseProofs, setCanReviewPurchaseProofs] = useState(false);
    const [currentGroupMemberId, setCurrentGroupMemberId] = useState("");
    const [minimumPurchaseAmount, setMinimumPurchaseAmount] = useState(0);
    const [configuredJamiiAmount, setConfiguredJamiiAmount] = useState<number | null>(null);
    const [action, setAction] = useState<Action>(null);
    const [search, setSearch] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [purchaseForm, setPurchaseForm] = useState({
        amount: "",
        reference: "",
        paymentMethod: "Mobile Money",
    });
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<{ url: string; name: string; mimeType: string } | null>(null);
    const [proofLoadingId, setProofLoadingId] = useState<number | null>(null);
    const [redeemForm, setRedeemForm] = useState({
        quantity: "",
        reference: "",
    });

    const formatMoney = (value: number) =>
        `TZS ${Number(value || 0).toLocaleString()}`;

    useEffect(() => () => {
        if (proofPreview) URL.revokeObjectURL(proofPreview.url);
    }, [proofPreview]);

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
        setConfiguredJamiiAmount(null);
        groupService.getWithSettings(groupId).then((response) => {
            const payload = response as { data?: { settings?: { jamiiContributionPerSharePayment?: number; minimumSharePurchaseAmount?: number } }; settings?: { jamiiContributionPerSharePayment?: number; minimumSharePurchaseAmount?: number } };
            const configuredAmount = payload.data?.settings?.jamiiContributionPerSharePayment ?? payload.settings?.jamiiContributionPerSharePayment;
            const configuredMinimum = payload.data?.settings?.minimumSharePurchaseAmount ?? payload.settings?.minimumSharePurchaseAmount;
            setConfiguredJamiiAmount(Number(configuredAmount || 0));
            if (configuredMinimum !== undefined) setMinimumPurchaseAmount(Number(configuredMinimum || 0));
        }).catch(() => setConfiguredJamiiAmount(0));
    }, [groupId]);

    const loadData = async () => {
        if (!groupId) return;
        const [nextSummary, nextOwnership, nextLedger, nextMine] =
            await Promise.allSettled([
                getSummary(groupId),
                getOwnership(groupId),
                getLedger(groupId),
                sharePurchaseRequestService.listMine(groupId).then(unwrap),
            ]);
        if (nextSummary.status === "fulfilled") setSummary(nextSummary.value || emptySummary);
        if (nextOwnership.status === "fulfilled") setOwnership(nextOwnership.value || []);
        if (nextLedger.status === "fulfilled") setLedger(nextLedger.value || []);
        if (nextMine.status === "fulfilled") setMyPurchaseRequests(nextMine.value || []);
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

    const openProof = async (request: SharePurchaseRequest) => {
        if (!groupId || proofLoadingId !== null) return;
        setProofLoadingId(request.id);
        try {
            const proof = await sharePurchaseRequestService.proof(groupId, request.id);
            const name = request.proofFileName || `share-payment-proof-${request.id}`;
            const mimeType = proof.type && proof.type !== "application/octet-stream"
                ? proof.type : request.proofContentType || (name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
            const previewBlob = proof.type === mimeType ? proof : new Blob([proof], { type: mimeType });
            setProofPreview({ url: URL.createObjectURL(previewBlob), name, mimeType });
        } catch (cause) {
            const errorMessage = cause instanceof Error ? cause.message : "Unable to open payment proof.";
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setProofLoadingId(null);
        }
    };

    const currentOwnership = ownership.find((item) => String(item.groupMemberId) === currentGroupMemberId);
    const scopedOwnership = canReviewPurchaseProofs
        ? ownership
        : ownership.filter((item) => String(item.groupMemberId) === currentGroupMemberId);
    const visibleOwnership = useMemo(
        () =>
            scopedOwnership.filter((item) =>
                item.memberName.toLowerCase().includes(search.toLowerCase()),
            ),
        [scopedOwnership, search],
    );
    const visibleLedger = canReviewPurchaseProofs
        ? ledger
        : ledger.filter((item) => String(item.groupMemberId) === currentGroupMemberId);
    const totalPaymentAmount = Number(purchaseForm.amount || 0);
    const shareAmount = Math.max(0, Math.round((totalPaymentAmount - (configuredJamiiAmount || 0)) * 100) / 100);
    const selectedQuantity = summary.unitPrice > 0 && shareAmount > 0
        ? shareAmount / summary.unitPrice : 0;
    const displayedQuantity = Number(selectedQuantity.toFixed(8));
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
        if (!groupId || submitInFlight.current) return;
        submitInFlight.current = true;
        setIsSubmitting(true);
        setIsRefreshingAfterSubmit(false);
        try {
            if (action === "purchase") {
                if (!/^\d+(\.\d{1,2})?$/.test(purchaseForm.amount) || totalPaymentAmount <= 0) throw new Error("Enter a valid total payment amount.");
                if (!summary.unitPrice) throw new Error("The share price is not configured. Ask your group admin to configure it first.");
                if (!configuredJamiiAmount || configuredJamiiAmount <= 0) throw new Error("Jamii is not configured. Ask your group admin to configure the Jamii amount first.");
                if (totalPaymentAmount <= configuredJamiiAmount) throw new Error(`The total payment must be greater than the Jamii amount of ${formatMoney(configuredJamiiAmount)}.`);
                if (shareAmount < minimumPurchaseAmount) throw new Error(`After Jamii, the minimum share purchase is ${formatMoney(minimumPurchaseAmount)}.`);
                if (!proofFile) throw new Error("Attach a receipt or payment message screenshot.");
                const data = new FormData();
                data.append("amount", purchaseForm.amount);
                data.append("paymentMethod", purchaseForm.paymentMethod);
                if (purchaseForm.reference.trim()) data.append("paymentReference", purchaseForm.reference.trim());
                data.append("proofFile", proofFile);
                const response = await sharePurchaseRequestService.submit(groupId, data);
                if (response.status === false || !response.data) {
                    throw new Error(response.message || "The share purchase request was not accepted.");
                }
                const submitted = response.data;
                setMyPurchaseRequests((current) => [submitted, ...current.filter((item) => item.id !== submitted.id)]);
                setIsRefreshingAfterSubmit(true);
                await loadData();
                setAction(null);
                setProofFile(null);
                setPurchaseForm({ amount: "", reference: "", paymentMethod: "Mobile Money" });
                const successMessage = response.message || "Your share purchase proof was submitted for approval.";
                setMessage(successMessage);
                toast.success(successMessage);
                window.dispatchEvent(new Event("vikoba:approval-updated"));
            } else if (action === "redeem") {
                if (!currentGroupMemberId) throw new Error("Your active membership could not be resolved.");
                await redeem(groupId, {
                    groupMemberId: currentGroupMemberId,
                    quantity: Number(redeemForm.quantity),
                    reference: redeemForm.reference || undefined,
                });
                await loadData();
                setAction(null);
                setMessage("Share redemption recorded successfully.");
            }
        } catch (cause) {
            const errorMessage = cause instanceof Error ? cause.message : "Unable to record transaction.";
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            submitInFlight.current = false;
            setIsSubmitting(false);
            setIsRefreshingAfterSubmit(false);
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
                        <Button
                            onClick={() => setAction("purchase")}
                            disabled={!groupId || !currentGroupMemberId}
                            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                        >
                            <Plus size={17} /> Buy shares
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setAction("redeem")}
                            disabled={!groupId || !currentOwnership?.sharesOwned}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                            <Undo2 size={17} /> Redeem shares
                        </Button>
                    </div>
                </header>

                {message && (
                    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                        <span>{message}</span>
                        <Button onClick={() => setMessage(null)}>Dismiss</Button>
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

                {groupId && myPurchaseRequests.length > 0 && (
                    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <h2 className="font-black text-neutral-900">My share purchase requests</h2>
                        <p className="mt-1 text-xs text-neutral-500">Shares are added to your balance after both approvals.</p>
                        <div className="mt-4 divide-y divide-neutral-100">
                            {myPurchaseRequests.slice(0, 5).map((request) => (
                                <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-neutral-900">{formatMoney(request.amount + request.jamiiAmount)} paid · {request.quantity} shares</p>
                                        <p className="text-xs text-neutral-500">{formatMoney(request.amount)} shares + {formatMoney(request.jamiiAmount)} Jamii · {new Date(request.submittedAt).toLocaleString()}</p>
                                    </div>
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                                        {request.status === "PENDING"
                                            ? request.accountantApprovedAt ? "Awaiting chair approval" : request.chairApprovedAt ? "Awaiting accountant approval" : "Awaiting both approvals"
                                            : request.status === "APPROVED" ? "Approved" : "Rejected"}
                                    </span>
                                    {request.hasProofFile && (
                                        <Button type="button" variant="outline" size="sm" disabled={proofLoadingId !== null} onClick={() => openProof(request)}>
                                            {proofLoadingId === request.id && <Loader2 className="animate-spin" aria-hidden="true" />}
                                            View proof
                                        </Button>
                                    )}
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
                                    {canReviewPurchaseProofs ? "Ownership distribution" : "My share ownership"}
                                </h2>
                                <p className="text-xs text-neutral-500">
                                    {canReviewPurchaseProofs ? "Calculated from the group share ledger" : "Calculated from your approved share transactions"}
                                </p>
                            </div>
                            {canReviewPurchaseProofs && <div className="relative">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-2.5 text-neutral-400"
                                />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Find member"
                                    className="w-44 rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-500"
                                />
                            </div>}
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
                        <h2 className="font-black">My share statement</h2>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-white/10 p-3">
                                <p className="text-neutral-400">Shares owned</p>
                                <p className="mt-1 font-bold">{currentOwnership?.sharesOwned || 0}</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-3">
                                <p className="text-neutral-400">Equity value</p>
                                <p className="mt-1 font-bold">{formatMoney(currentOwnership?.equityValue || 0)}</p>
                            </div>
                        </div>
                        <h3 className="mt-6 font-black">Share rules</h3>
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
                        <Button
                            onClick={() => setAction("redeem")}
                            disabled={!groupId || !currentOwnership?.sharesOwned}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/50 px-4 py-2.5 text-sm font-bold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                        >
                            <Undo2 size={16} /> Redeem shares
                        </Button>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-100 p-6">
                        <h2 className="font-black text-neutral-900">{canReviewPurchaseProofs ? "Share ledger" : "My share statement"}</h2>
                        <p className="text-xs text-neutral-500">
                            {canReviewPurchaseProofs ? "Immutable group purchase, transfer, and redemption history" : "Your immutable purchase and redemption history"}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <Table className="w-full text-left text-sm">
                            <TableHeader className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                                <TableRow>
                                    <TableHead className="px-6 py-3">Date</TableHead>
                                    <TableHead className="px-6 py-3">Member</TableHead>
                                    <TableHead className="px-6 py-3">Type</TableHead>
                                    <TableHead className="px-6 py-3 text-right">Shares</TableHead>
                                    <TableHead className="px-6 py-3 text-right">Amount</TableHead>
                                    <TableHead className="px-6 py-3">Reference</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-neutral-100">
                                {visibleLedger.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="px-6 py-4 text-neutral-500">
                                            {new Date(item.transactionDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-bold text-neutral-800">
                                            {item.memberName}
                                            <span className="block text-xs font-normal text-neutral-400">
                                                {item.membershipNumber}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.type === "PURCHASE" ? "bg-emerald-50 text-emerald-700" : item.type === "REDEMPTION" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}
                                            >
                                                {item.type.replace("_", " ")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right font-bold">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right font-bold">
                                            {formatMoney(item.totalAmount)}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-xs text-neutral-500">
                                            {item.reference}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {visibleLedger.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-neutral-500"
                                        >
                                            No share transactions recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            </div>

            <Dialog open={proofPreview !== null} onOpenChange={(open) => { if (!open) setProofPreview(null); }}>
                <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Payment proof</DialogTitle>
                        <DialogDescription>{proofPreview?.name}</DialogDescription>
                    </DialogHeader>
                    {proofPreview?.mimeType.startsWith("image/") ? (
                        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-neutral-100 p-3">
                            <img src={proofPreview.url} alt={`Payment proof: ${proofPreview.name}`} className="max-h-[65vh] max-w-full rounded-md object-contain" />
                        </div>
                    ) : proofPreview?.mimeType === "application/pdf" ? (
                        <iframe src={proofPreview.url} title={`Payment proof: ${proofPreview.name}`} className="h-[65vh] w-full rounded-lg border border-neutral-200" />
                    ) : (
                        <p className="rounded-lg bg-neutral-50 p-5 text-sm text-neutral-600">Preview is unavailable for this file type. Download it to review the proof.</p>
                    )}
                    {proofPreview && (
                        <a href={proofPreview.url} download={proofPreview.name} className="self-end rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                            Download proof
                        </a>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={action !== null} onOpenChange={(open) => { if (!open && !isSubmitting) setAction(null); }}>
                <DialogContent showCloseButton={!isSubmitting} className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{action === "purchase" ? "Buy shares" : "Redeem shares"}</DialogTitle>
                        <DialogDescription>All values use the configured group share price.</DialogDescription>
                    </DialogHeader>
                        <form onSubmit={submit} aria-busy={isSubmitting} className="space-y-4">
                            {action === "purchase" && (
                                <>
                                    <div className="rounded-lg border border-[#B5D7C5] bg-[#F2F7F4] p-3 text-xs text-[#08503C]">This purchase is for your own active membership. Your payment proof will go to the accountant and chair for approval before shares are added.</div>
                                    <div>
                                        <label htmlFor="share-purchase-amount" className="mb-1.5 block text-xs font-bold text-neutral-700">Total payment amount (TZS)</label>
                                        <Input
                                            id="share-purchase-amount"
                                            required
                                            type="text"
                                            inputMode="decimal"
                                            value={purchaseForm.amount}
                                            onChange={(event) => {
                                                if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) setPurchaseForm({
                                                    ...purchaseForm,
                                                    amount: event.target.value,
                                                })
                                            }}
                                            placeholder="e.g. 10000"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-neutral-50 p-3"><p className="text-neutral-500">Jamii deducted</p><p className="mt-1 font-black text-neutral-900">{formatMoney(configuredJamiiAmount || 0)}</p></div><div className="rounded-lg bg-neutral-50 p-3"><p className="text-neutral-500">Amount for shares</p><p className="mt-1 font-black text-neutral-900">{formatMoney(shareAmount)}</p></div></div>
                                    <p className="text-xs text-neutral-500">Share price: {formatMoney(summary.unitPrice)} · Minimum share amount after Jamii: {formatMoney(minimumPurchaseAmount)}.</p>
                                    {configuredJamiiAmount === 0 && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Jamii is not configured. Ask your group admin to configure the Jamii amount before submitting.</p>}
                                    <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{formatMoney(totalPaymentAmount)} total payment − {formatMoney(configuredJamiiAmount || 0)} Jamii = {formatMoney(shareAmount)} for {displayedQuantity.toLocaleString()} shares</p>
                                    <NativeSelect
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
                                    </NativeSelect>
                                    <Input
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
                                    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
                                        <label htmlFor="share-proof" className="block text-sm font-semibold text-neutral-800">Upload payment proof *</label>
                                        <p className="mb-2 text-xs text-neutral-500">Attach a receipt or payment screenshot (image or PDF, up to 5 MB).</p>
                                        <Input id="share-proof" required type="file" accept="image/*,application/pdf" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className="h-auto min-h-10 bg-white" />
                                        {proofFile && <p className="mt-2 text-xs text-neutral-700">Selected: {proofFile.name}</p>}
                                    </div>
                                </>
                            )}
                            {action === "redeem" && (
                                <>
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">You are redeeming from your own balance of {currentOwnership?.sharesOwned || 0} shares. This cannot be undone from the ledger.</div>
                                    <Input
                                        required
                                        type="number"
                                        min="0.00000001"
                                        step="0.00000001"
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
                                    <Input
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
                            <Button
                                type="submit"
                                disabled={isSubmitting || (action === "purchase" && (!configuredJamiiAmount || !summary.unitPrice))}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
                                {isSubmitting
                                    ? isRefreshingAfterSubmit ? "Refreshing shares..." : "Submitting payment proof..."
                                    : action === "purchase" ? "Submit for approval" : "Redeem shares"}
                            </Button>
                        </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
