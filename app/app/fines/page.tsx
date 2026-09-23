"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Banknote, CheckCircle2, CircleDollarSign, Loader2, Plus, Search, Settings2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { fineService, memberService, type Fine, type FineTypeOption, type Member } from "@/lib/api/services";

type Envelope<T> = { data?: T };
const unwrap = <T,>(value: T | Envelope<T>) => (value && typeof value === "object" && "data" in value ? (value as Envelope<T>).data : value) as T;
const money = (value: number, currency = "TZS") => `${currency} ${Number(value || 0).toLocaleString("en-TZ")}`;
const statusTone: Record<string, string> = {
  UNPAID: "border-destructive/25 bg-destructive/10 text-destructive",
  PARTIAL: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  PAID: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  WAIVED: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

export default function FinesPage() {
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [issueOpen, setIssueOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [paymentFine, setPaymentFine] = useState<Fine | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [form, setForm] = useState({ groupMemberId: "", fineTypeId: "", amount: "", reason: "" });
  const [configForm, setConfigForm] = useState({ id: "", name: "", code: "", defaultAmount: "", description: "", active: true });

  useEffect(() => {
    try {
      const group = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
      setGroupId(String(group.id ?? group.groupId ?? localStorage.getItem("v360_currentGroupId") ?? ""));
      setCurrency(group.currency || "TZS");
    } catch { /* Group selector will populate storage. */ }
  }, []);

  const finesQuery = useQuery({ queryKey: ["fines", groupId], queryFn: () => fineService.list(groupId), enabled: /^\d+$/.test(groupId) });
  const membersQuery = useQuery({ queryKey: ["members", groupId], queryFn: async () => unwrap(await memberService.list(groupId)) || [], enabled: /^\d+$/.test(groupId) });
  const typesQuery = useQuery({ queryKey: ["fine-types", groupId], queryFn: () => fineService.types(groupId), enabled: /^\d+$/.test(groupId) });
  const fines = (finesQuery.data || []) as Fine[];
  const members = (membersQuery.data || []) as Member[];
  const types = (typesQuery.data || []) as FineTypeOption[];

  useEffect(() => {
    if (!types.length || form.fineTypeId) return;
    setForm((current) => ({ ...current, fineTypeId: String(types[0].id), amount: String(Number(types[0].defaultAmount || 0)) }));
  }, [types, form.fineTypeId]);

  const issueFine = useMutation({
    mutationFn: () => fineService.create({ groupId, groupMemberId: form.groupMemberId, fineTypeId: form.fineTypeId, amount: Number(form.amount), reason: form.reason.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fines", groupId] });
      setIssueOpen(false); setForm({ groupMemberId: "", fineTypeId: types[0]?.id ? String(types[0].id) : "", amount: String(Number(types[0]?.defaultAmount || 0)), reason: "" });
    },
  });
  const saveType = useMutation({
    mutationFn: () => {
      const payload = { code: configForm.code || configForm.name, name: configForm.name, defaultAmount: Number(configForm.defaultAmount || 0), description: configForm.description, active: configForm.active };
      return configForm.id ? fineService.updateType(groupId, configForm.id, payload) : fineService.createType(groupId, payload);
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["fine-types", groupId] }); setConfigForm({ id: "", name: "", code: "", defaultAmount: "", description: "", active: true }); },
  });
  const disableType = useMutation({ mutationFn: (id: string | number) => fineService.deleteType(groupId, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fine-types", groupId] }) });
  const updateFine = useMutation({
    mutationFn: ({ fine, status, amount }: { fine: Fine; status?: string; amount?: number }) => fineService.update(String(fine.id), { groupId, status, paymentAmount: amount }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["fines", groupId] }); setPaymentFine(null); setPaymentAmount(""); },
  });

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return fines.filter((fine) => {
      const status = fine.status || "UNPAID";
      return (statusFilter === "ALL" || status === statusFilter) && `${fine.memberName || ""} ${fine.fineTypeName || fine.type || ""} ${fine.reference || ""} ${fine.reason || ""}`.toLowerCase().includes(query);
    });
  }, [fines, search, statusFilter]);

  const totalAssessed = fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
  const totalPaid = fines.reduce((sum, fine) => sum + Number(fine.paidAmount || 0), 0);
  const totalOutstanding = fines.reduce((sum, fine) => sum + Number(fine.balance ?? fine.amount ?? 0), 0);
  const totalWaived = fines.filter((fine) => fine.status === "WAIVED").reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
  const collectionRate = totalAssessed > 0 ? Math.min(100, Math.round((totalPaid / totalAssessed) * 100)) : 0;
  const loading = finesQuery.isLoading || membersQuery.isLoading || typesQuery.isLoading;

  const submitFine = (event: FormEvent) => { event.preventDefault(); if (form.groupMemberId && form.fineTypeId && Number(form.amount) > 0) issueFine.mutate(); };
  const selectType = (id: string) => {
    const type = types.find((item) => String(item.id) === id);
    setForm((current) => ({ ...current, fineTypeId: id, amount: type ? String(Number(type.defaultAmount || 0)) : current.amount }));
  };

  const metrics = [
    { label: "Total assessed", value: money(totalAssessed, currency), note: `${fines.length} fine records`, icon: ShieldAlert, tone: "bg-destructive/10 text-destructive" },
    { label: "Collected", value: money(totalPaid, currency), note: `${collectionRate}% collection rate`, icon: Banknote, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "Outstanding", value: money(totalOutstanding, currency), note: `${fines.filter((fine) => ["UNPAID", "PARTIAL"].includes(fine.status || "UNPAID")).length} open records`, icon: AlertTriangle, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { label: "Waived", value: money(totalWaived, currency), note: "Closed without collection", icon: CheckCircle2, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  ];

  return <main className="min-h-full bg-background text-foreground">
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-destructive/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><Badge variant="outline" className="mb-4 border-destructive/20 bg-destructive/10 text-destructive"><ShieldAlert className="mr-1.5 size-3.5" />Accountability ledger</Badge><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Penalties & fines</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Track every penalty from assessment through payment, partial collection, or waiver.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" size="lg" onClick={() => setConfigOpen(true)}><Settings2 />Configure types</Button><Button size="lg" onClick={() => setIssueOpen(true)} disabled={!groupId}><Plus />Issue fine</Button></div></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, note, icon: Icon, tone }) => <Card key={label} className="rounded-2xl"><CardContent className="flex items-start justify-between gap-4 p-5"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-3 truncate text-xl font-black">{loading ? "—" : value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div><div className={`rounded-xl p-2.5 ${tone}`}><Icon className="size-5" /></div></CardContent></Card>)}</section>

      <Card className="rounded-2xl"><CardContent className="p-5"><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">Overall collection progress</span><span className="font-black text-primary">{collectionRate}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${collectionRate}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{money(totalPaid, currency)} collected</span><span>{money(totalOutstanding, currency)} outstanding</span></div></CardContent></Card>

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Fine register</CardTitle><p className="mt-1 text-sm text-muted-foreground">All penalties, balances, statuses, and collection progress.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member, type or reference" className="pl-9" /></div><NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="sm:w-44"><option value="ALL">All statuses</option><option value="UNPAID">Unpaid</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="WAIVED">Waived</option></NativeSelect></div></CardHeader>
        <CardContent className="p-0">{loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" />Loading fine register…</div> : <Table className="min-w-[1040px]"><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Penalty</TableHead><TableHead className="text-right">Assessed</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Progress</TableHead><TableHead>Issued</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {visible.map((fine) => { const amount = Number(fine.amount || 0); const paid = Number(fine.paidAmount || 0); const balance = Number(fine.balance ?? Math.max(0, amount - paid)); const progress = amount > 0 ? Math.min(100, Math.round((paid / amount) * 100)) : 0; const status = fine.status || "UNPAID"; return <TableRow key={fine.id}><TableCell><p className="font-semibold">{fine.memberName || members.find((member) => String(member.id) === String(fine.groupMemberId || fine.memberId))?.name || "Member"}</p><p className="text-xs text-muted-foreground">{fine.membershipNumber || "Group member"}</p></TableCell><TableCell><p className="font-medium">{fine.fineTypeName || fine.type || "Penalty"}</p><p className="font-mono text-xs text-muted-foreground">{fine.reference || "—"}</p>{fine.reason && <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground">{fine.reason}</p>}</TableCell><TableCell className="text-right font-semibold">{money(amount, currency)}</TableCell><TableCell className="text-right text-emerald-600 dark:text-emerald-400">{money(paid, currency)}</TableCell><TableCell className={`text-right font-black ${balance > 0 ? "text-destructive" : "text-foreground"}`}>{money(balance, currency)}</TableCell><TableCell><div className="w-28"><div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>Collected</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div></TableCell><TableCell className="text-muted-foreground">{fine.fineDate || "—"}</TableCell><TableCell><Badge variant="outline" className={statusTone[status] || "bg-muted text-muted-foreground"}>{status}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{["UNPAID", "PARTIAL"].includes(status) && <><Button size="sm" onClick={() => { setPaymentFine(fine); setPaymentAmount(String(balance)); }}>Record payment</Button><Button size="sm" variant="outline" onClick={() => updateFine.mutate({ fine, status: "WAIVED" })} disabled={updateFine.isPending}>Waive</Button></>}</div></TableCell></TableRow>; })}
          {!visible.length && <TableRow><TableCell colSpan={9} className="h-64 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><div className="rounded-2xl bg-muted p-3 text-muted-foreground"><CircleDollarSign className="size-6" /></div><p className="mt-4 font-semibold">No fines found</p><p className="mt-1 text-sm text-muted-foreground">Issue a fine or change the current search and status filter.</p></div></TableCell></TableRow>}
        </TableBody></Table>}</CardContent>
      </Card>
    </div>

    <Dialog open={issueOpen} onOpenChange={(next) => { if (!issueFine.isPending) setIssueOpen(next); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Issue a fine</DialogTitle><DialogDescription>Add a penalty to a member ledger. The member will receive the configured notification.</DialogDescription></DialogHeader><form onSubmit={submitFine} className="space-y-5"><div className="space-y-2"><Label htmlFor="fine-member">Member</Label><NativeSelect id="fine-member" required value={form.groupMemberId} onChange={(event) => setForm({ ...form, groupMemberId: event.target.value })}><option value="">Select member</option>{members.map((member) => <option key={member.id} value={String(member.id)}>{member.name || member.fullName} ({member.memberNo || member.membershipNumber || "member"})</option>)}</NativeSelect></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="fine-type">Fine type</Label><NativeSelect id="fine-type" required value={form.fineTypeId} onChange={(event) => selectType(event.target.value)} disabled={!types.length}><option value="">Select type</option>{types.map((type) => <option key={type.id} value={String(type.id)}>{type.name}</option>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="fine-amount">Amount</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span><Input id="fine-amount" required inputMode="decimal" value={form.amount} onChange={(event) => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) setForm({ ...form, amount: event.target.value }); }} className="pl-12" /></div></div></div><div className="space-y-2"><Label htmlFor="fine-reason">Reason</Label><Textarea id="fine-reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={3} maxLength={500} placeholder="Explain why this fine was issued" /></div>{issueFine.isError && <p role="alert" className="text-sm text-destructive">{(issueFine.error as Error).message}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => setIssueOpen(false)} disabled={issueFine.isPending}>Cancel</Button><Button type="submit" disabled={issueFine.isPending || !form.groupMemberId || !form.fineTypeId || Number(form.amount) <= 0}>{issueFine.isPending && <Loader2 className="animate-spin" />}Issue fine</Button></DialogFooter></form></DialogContent></Dialog>

    <Dialog open={paymentFine !== null} onOpenChange={(next) => { if (!next && !updateFine.isPending) setPaymentFine(null); }}><DialogContent><DialogHeader><DialogTitle>Record fine payment</DialogTitle><DialogDescription>Apply a payment to {paymentFine?.memberName || "this member"}&apos;s fine. Partial payments remain open.</DialogDescription></DialogHeader><div className="rounded-xl bg-muted/50 p-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Outstanding balance</span><strong>{money(Number(paymentFine?.balance ?? paymentFine?.amount ?? 0), currency)}</strong></div></div><div className="space-y-2"><Label htmlFor="fine-payment">Payment amount</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span><Input id="fine-payment" inputMode="decimal" value={paymentAmount} onChange={(event) => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) setPaymentAmount(event.target.value); }} className="pl-12" /></div></div><DialogFooter><Button variant="outline" onClick={() => setPaymentFine(null)} disabled={updateFine.isPending}>Cancel</Button><Button onClick={() => paymentFine && updateFine.mutate({ fine: paymentFine, amount: Number(paymentAmount) })} disabled={updateFine.isPending || Number(paymentAmount) <= 0 || Number(paymentAmount) > Number(paymentFine?.balance ?? paymentFine?.amount ?? 0)}>{updateFine.isPending && <Loader2 className="animate-spin" />}Record payment</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={configOpen} onOpenChange={(next) => { if (!saveType.isPending && !disableType.isPending) setConfigOpen(next); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Configure fine types</DialogTitle><DialogDescription>Create the group&apos;s penalty catalogue and default amounts.</DialogDescription></DialogHeader><div className="grid gap-5 lg:grid-cols-2"><div className="space-y-2">{types.map((type) => <div key={type.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"><div><p className="font-semibold">{type.name}</p><p className="text-xs text-muted-foreground">{type.code || "—"} · {money(Number(type.defaultAmount || 0), currency)}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setConfigForm({ id: String(type.id || ""), name: type.name, code: type.code || "", defaultAmount: String(Number(type.defaultAmount || 0)), description: type.description || "", active: type.active !== false })}>Edit</Button><Button size="sm" variant="destructive" onClick={() => disableType.mutate(type.id || "")} disabled={disableType.isPending}>Disable</Button></div></div>)}{!types.length && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No fine types configured.</div>}</div><form onSubmit={(event) => { event.preventDefault(); saveType.mutate(); }} className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"><div><p className="font-semibold">{configForm.id ? "Edit fine type" : "New fine type"}</p><p className="text-xs text-muted-foreground">Set a clear category and default amount.</p></div><div className="space-y-2"><Label htmlFor="type-name">Name</Label><Input id="type-name" required value={configForm.name} onChange={(event) => setConfigForm({ ...configForm, name: event.target.value })} placeholder="Late meeting" /></div><div className="space-y-2"><Label htmlFor="type-code">Code</Label><Input id="type-code" value={configForm.code} onChange={(event) => setConfigForm({ ...configForm, code: event.target.value })} placeholder="LATE_MEETING" /></div><div className="space-y-2"><Label htmlFor="type-amount">Default amount</Label><Input id="type-amount" inputMode="decimal" value={configForm.defaultAmount} onChange={(event) => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) setConfigForm({ ...configForm, defaultAmount: event.target.value }); }} /></div><div className="space-y-2"><Label htmlFor="type-description">Description</Label><Textarea id="type-description" value={configForm.description} onChange={(event) => setConfigForm({ ...configForm, description: event.target.value })} rows={3} /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={configForm.active} onChange={(event) => setConfigForm({ ...configForm, active: event.target.checked })} />Active for this group</label><div className="flex gap-2"><Button type="submit" disabled={saveType.isPending || !configForm.name.trim()}>{saveType.isPending && <Loader2 className="animate-spin" />}{configForm.id ? "Update type" : "Create type"}</Button>{configForm.id && <Button type="button" variant="outline" onClick={() => setConfigForm({ id: "", name: "", code: "", defaultAmount: "", description: "", active: true })}>New type</Button>}</div></form></div></DialogContent></Dialog>
  </main>;
}
