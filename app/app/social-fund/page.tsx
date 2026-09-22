"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock3, HandCoins, HeartHandshake, Loader2, Plus, Search, ShieldCheck, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useJamii, type JamiiRequest, type JamiiSummary, type JamiiType } from "@/hooks/useJamii";
import { groupService, type Group } from "@/lib/api/services";

const unwrap = <T,>(value: T | { data?: T }): T => value && typeof value === "object" && "data" in value ? ((value as { data?: T }).data as T) : value as T;
const emptySummary: JamiiSummary = { totalContributions: 0, totalApproved: 0, totalPaid: 0, pendingRequests: 0, availableBalance: 0, requestCount: 0, pendingCount: 0 };
const statusStyle: Record<string, string> = {
  PENDING: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  APPROVED: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  PAID: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  REJECTED: "border-destructive/25 bg-destructive/10 text-destructive",
};

export default function JamiiFundPage() {
  const api = useJamii();
  const [groupId, setGroupId] = useState("");
  const [types, setTypes] = useState<JamiiType[]>([]);
  const [requests, setRequests] = useState<JamiiRequest[]>([]);
  const [summary, setSummary] = useState<JamiiSummary>(emptySummary);
  const [requestOpen, setRequestOpen] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actingId, setActingId] = useState<string | number | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<JamiiRequest | null>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [form, setForm] = useState({ fundTypeId: "", amount: "", reason: "" });
  const [typeForm, setTypeForm] = useState({ name: "", code: "", description: "" });

  const money = (value?: number) => `TZS ${Number(value || 0).toLocaleString("en-TZ")}`;
  const refresh = async () => {
    if (!groupId) return;
    try {
      const [requestData, summaryData, typeData] = await Promise.all([api.requests(groupId), api.summary(groupId), api.types(groupId)]);
      setRequests(requestData || []); setSummary(summaryData || emptySummary); setTypes(typeData || []);
    } catch { /* The hook exposes the API error. */ } finally { setInitialLoading(false); }
  };

  useEffect(() => {
    const storedId = localStorage.getItem("v360_currentGroupId") || "";
    if (/^\d+$/.test(storedId)) { setGroupId(storedId); return; }
    let groupName = "";
    try { groupName = String(JSON.parse(localStorage.getItem("v360_currentGroup") || "{}").name || "").toLowerCase(); } catch { /* Use first accessible group. */ }
    groupService.list().then((response) => {
      const groups = unwrap(response) as Array<Group & { groupId?: string | number }>;
      const selected = groups.find((group) => group.name?.toLowerCase() === groupName) || groups[0];
      const id = selected?.id ?? selected?.groupId;
      if (id !== undefined && /^\d+$/.test(String(id))) { setGroupId(String(id)); localStorage.setItem("v360_currentGroupId", String(id)); }
      else { setInitialLoading(false); setMessage("Select a valid group before opening Jamii."); }
    }).catch(() => { setInitialLoading(false); setMessage("Unable to load your group."); });
  }, []);
  useEffect(() => { void refresh(); }, [groupId]);

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((request) => [request.memberName, request.reference, request.fundTypeName, request.status].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [requests, search]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.request(groupId, { fundTypeId: Number(form.fundTypeId), requestedAmount: Number(form.amount), reason: form.reason.trim() });
      setRequestOpen(false); setForm({ fundTypeId: "", amount: "", reason: "" }); setMessage("Your Jamii request was submitted and is waiting for approval."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit request."); }
  };
  const createType = async () => {
    try {
      const type = await api.createType(groupId, typeForm);
      setTypes((current) => [...current, type].sort((a, b) => a.name.localeCompare(b.name))); setForm((current) => ({ ...current, fundTypeId: String(type.id) }));
      setTypeForm({ name: "", code: "", description: "" }); setAddingType(false); setMessage(`“${type.name}” is now available for this group.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create support type."); }
  };
  const act = async (id: string | number, operation: () => Promise<unknown>, success: string) => {
    setActingId(id);
    try { await operation(); setMessage(success); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update request."); }
    finally { setActingId(null); }
  };
  const approve = async () => {
    if (!approvalRequest || Number(approvedAmount) <= 0) return;
    await act(approvalRequest.id, () => api.approve(groupId, approvalRequest.id, Number(approvedAmount)), "Request approved and ready for disbursement.");
    setApprovalRequest(null); setApprovedAmount("");
  };

  const metrics = [
    { label: "Fund contributions", value: money(summary.totalContributions), icon: WalletCards, tone: "bg-primary/10 text-primary" },
    { label: "Available balance", value: money(summary.availableBalance), icon: HandCoins, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "Awaiting review", value: Number(summary.pendingCount || 0).toLocaleString(), icon: Clock3, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { label: "Support paid", value: money(summary.totalPaid), icon: CheckCircle2, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  ];

  return <main className="min-h-full bg-background text-foreground">
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-56 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl"><Badge variant="outline" className="mb-4 border-primary/20 bg-primary/10 text-primary"><HeartHandshake className="mr-1.5 size-3.5" />Community care</Badge><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Jamii social fund</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Manage welfare requests, approvals, and disbursements from one clear, accountable workspace.</p></div>
          <Button size="lg" onClick={() => setRequestOpen(true)} disabled={!groupId}><Plus />Request support</Button>
        </div>
      </section>

      {message && <div role="status" className="flex items-start justify-between gap-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground"><div className="flex items-center gap-2"><ShieldCheck className="size-4 shrink-0 text-primary" /><span>{message}</span></div><Button variant="ghost" size="sm" onClick={() => setMessage(null)}>Dismiss</Button></div>}
      {api.error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"><AlertCircle className="size-4" />{api.error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="overflow-hidden rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5"><CardContent className="flex items-start justify-between gap-4 p-5"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-3 truncate text-2xl font-black tracking-tight">{initialLoading ? "—" : value}</p></div><div className={`rounded-xl p-2.5 ${tone}`}><Icon className="size-5" /></div></CardContent></Card>)}</section>

      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardHeader className="gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><HeartHandshake className="size-5" /></div><div><CardTitle className="text-lg">Welfare requests</CardTitle><p className="mt-1 text-sm text-muted-foreground">{summary.requestCount || requests.length} requests recorded in this group</p></div></div><div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member, type or status" className="pl-9" /></div></CardHeader>
        <CardContent className="p-0">{initialLoading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" />Loading Jamii requests…</div> : <Table className="min-w-[920px]"><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Support type</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Requested</TableHead><TableHead className="text-right">Approved</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {visibleRequests.map((request) => <TableRow key={request.id}><TableCell><p className="font-semibold">{request.memberName}</p><p className="mt-0.5 text-xs text-muted-foreground">{request.membershipNumber || "Group member"}</p></TableCell><TableCell><p className="font-medium">{request.fundTypeName}</p>{request.reason && <p className="mt-0.5 max-w-52 truncate text-xs text-muted-foreground">{request.reason}</p>}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{request.reference}</TableCell><TableCell className="text-right font-semibold">{money(request.requestedAmount)}</TableCell><TableCell className="text-right font-semibold">{request.approvedAmount ? money(request.approvedAmount) : "—"}</TableCell><TableCell className="text-muted-foreground">{request.requestedDate}</TableCell><TableCell><Badge variant="outline" className={statusStyle[request.status] || "bg-muted text-muted-foreground"}>{request.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">
            {request.status === "PENDING" && request.canApprove && <><Button size="sm" onClick={() => { setApprovalRequest(request); setApprovedAmount(String(request.requestedAmount)); }} disabled={actingId !== null}>Approve</Button><Button size="sm" variant="destructive" onClick={() => void act(request.id, () => api.reject(groupId, request.id), "Request rejected.")} disabled={actingId !== null}>{actingId === request.id && <Loader2 className="animate-spin" />}Reject</Button></>}
            {request.status === "PENDING" && !request.canApprove && <span className="text-xs text-muted-foreground">Waiting for {request.currentStepLabel || "review"}</span>}
            {request.status === "APPROVED" && request.canDisburse && <Button size="sm" onClick={() => void act(request.id, () => api.pay(groupId, request.id), "Support marked as paid.")} disabled={actingId !== null}>{actingId === request.id ? <Loader2 className="animate-spin" /> : <ArrowUpRight />}Disburse</Button>}
            {request.status === "APPROVED" && !request.canDisburse && <span className="text-xs text-muted-foreground">Waiting for disbursement</span>}
            {(request.status === "PAID" || request.status === "REJECTED") && <span className="text-xs text-muted-foreground">Completed</span>}
          </div></TableCell></TableRow>)}
          {visibleRequests.length === 0 && <TableRow><TableCell colSpan={8} className="h-64 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><div className="rounded-2xl bg-muted p-3 text-muted-foreground"><HeartHandshake className="size-6" /></div><p className="mt-4 font-semibold">No Jamii requests found</p><p className="mt-1 text-sm text-muted-foreground">Create a support request or change your search.</p></div></TableCell></TableRow>}
        </TableBody></Table>}</CardContent>
      </Card>
    </div>

    <Dialog open={requestOpen} onOpenChange={(next) => { if (!api.loading) setRequestOpen(next); }}><DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-card-foreground sm:max-w-lg"><DialogHeader><DialogTitle className="text-xl font-black">Request Jamii support</DialogTitle><DialogDescription>This request will be submitted for your own membership and sent through the group approval workflow.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="jamii-type">Support type</Label><NativeSelect id="jamii-type" required={!addingType} value={form.fundTypeId} onChange={(event) => setForm({ ...form, fundTypeId: event.target.value })} disabled={addingType}><option value="">Select support type</option>{types.map((type) => <option key={type.id} value={String(type.id)}>{type.name}</option>)}</NativeSelect></div>
      <Button type="button" variant="outline" size="sm" onClick={() => setAddingType((current) => !current)}><Plus />{addingType ? "Use an existing type" : "Create support type"}</Button>
      {addingType && <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4"><div><p className="font-semibold">New support type</p><p className="text-xs text-muted-foreground">This type will be available to the whole group.</p></div><div className="space-y-2"><Label htmlFor="type-name">Name</Label><Input id="type-name" value={typeForm.name} onChange={(event) => setTypeForm({ ...typeForm, name: event.target.value })} placeholder="Medical emergency" /></div><div className="space-y-2"><Label htmlFor="type-code">Code <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="type-code" value={typeForm.code} onChange={(event) => setTypeForm({ ...typeForm, code: event.target.value })} placeholder="MEDICAL" /></div><div className="space-y-2"><Label htmlFor="type-description">Description</Label><Textarea id="type-description" value={typeForm.description} onChange={(event) => setTypeForm({ ...typeForm, description: event.target.value })} rows={2} placeholder="When members may use this support" /></div><Button type="button" variant="secondary" onClick={() => void createType()} disabled={api.loading || !typeForm.name.trim()}>{api.loading && <Loader2 className="animate-spin" />}Create and select</Button></div>}
      <div className="space-y-2"><Label htmlFor="jamii-amount">Requested amount</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">TZS</span><Input id="jamii-amount" required inputMode="decimal" value={form.amount} onChange={(event) => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) setForm({ ...form, amount: event.target.value }); }} className="pl-12" placeholder="0.00" /></div></div>
      <div className="space-y-2"><Label htmlFor="jamii-reason">Reason for support</Label><Textarea id="jamii-reason" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={4} maxLength={500} placeholder="Explain why the member needs support" /><p className="text-right text-xs text-muted-foreground">{form.reason.length}/500</p></div>
      <DialogFooter className="border-border bg-muted/50"><Button type="button" variant="outline" onClick={() => setRequestOpen(false)} disabled={api.loading}>Cancel</Button><Button type="submit" disabled={api.loading || !types.length || !form.fundTypeId || Number(form.amount) <= 0 || !form.reason.trim()}>{api.loading && <Loader2 className="animate-spin" />}Submit for approval</Button></DialogFooter>
    </form></DialogContent></Dialog>

    <Dialog open={approvalRequest !== null} onOpenChange={(next) => { if (!next && actingId === null) setApprovalRequest(null); }}><DialogContent className="border-border bg-card text-card-foreground"><DialogHeader><DialogTitle>Approve Jamii request</DialogTitle><DialogDescription>Confirm the support amount for {approvalRequest?.memberName}. It can then be disbursed.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="approved-amount">Approved amount</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">TZS</span><Input id="approved-amount" inputMode="decimal" value={approvedAmount} onChange={(event) => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) setApprovedAmount(event.target.value); }} className="pl-12" /></div><p className="text-xs text-muted-foreground">Requested: {money(approvalRequest?.requestedAmount)}</p></div><DialogFooter className="border-border bg-muted/50"><Button variant="outline" onClick={() => setApprovalRequest(null)} disabled={actingId !== null}>Cancel</Button><Button onClick={() => void approve()} disabled={actingId !== null || Number(approvedAmount) <= 0}>{actingId !== null && <Loader2 className="animate-spin" />}Approve request</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
