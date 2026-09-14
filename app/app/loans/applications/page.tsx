'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Clock3, Loader2, RefreshCw, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { resolveActiveGroupId } from '@/lib/api/active-group'
import { useLoans, type Loan } from '@/hooks/useLoans'

type Decision = 'reject' | 'return' | 'cancel'
const money = (value: number) => `TZS ${Number(value || 0).toLocaleString('en-TZ')}`
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString('en-TZ') : 'Waiting'

export default function LoanApplicationsPage() {
  const api = useLoans()
  const [groupId, setGroupId] = useState('')
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [decision, setDecision] = useState<{ loan: Loan; action: Decision } | null>(null)
  const [reason, setReason] = useState('')
  useEffect(() => { setGroupId(resolveActiveGroupId(localStorage) || '') }, [])
  const refresh = async (id: string) => {
    if (!id) return
    setLoading(true)
    try { setLoans(await api.list(id)) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load loan applications') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (groupId) void refresh(groupId); else setLoading(false) }, [groupId])
  const act = async (action: 'approve' | 'disburse' | Decision, loan: Loan) => {
    if (actingId !== null) return
    setActingId(loan.id)
    try {
      const result = action === 'approve' ? await api.approve(groupId, loan.id)
        : action === 'disburse' ? await api.disburse(groupId, loan.id)
        : action === 'return' ? await api.returnForReview(groupId, loan.id, reason.trim())
        : action === 'cancel' ? await api.cancel(groupId, loan.id, reason.trim())
        : await api.reject(groupId, loan.id, reason.trim())
      toast.success((action === 'approve' || action === 'disburse') && result?.status === 'ACTIVE' ? 'Final approval complete. Loan disbursed and repayment schedule created.' : `Loan ${action === 'return' ? 'returned to the previous reviewer' : action === 'approve' ? 'approved for the next step' : action === 'cancel' ? 'cancelled' : 'rejected'}.`)
      setDecision(null)
      setReason('')
      await refresh(groupId)
      window.dispatchEvent(new Event('vikoba:approval-updated'))
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to process loan') }
    finally { setActingId(null) }
  }
  const queue = loans.filter(loan => ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(loan.status))
  const history = loans.filter(loan => !['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(loan.status))
  const ready = queue.filter(loan => loan.status === 'UNDER_REVIEW').length
  const waiting = queue.filter(loan => loan.status === 'PENDING').length
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <Link href="/app/loans" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to loans</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="secondary" className="mb-3"><ShieldCheck className="mr-1 size-3" /> Group loan workflow</Badge><h1 className="text-3xl font-black">Loan applications</h1><p className="mt-2 text-sm text-muted-foreground">After guarantors accept, reviewers act in the order saved in group settings. Final approval creates the member loan and schedule.</p></div><Button variant="outline" onClick={() => void refresh(groupId)} disabled={loading || !groupId}><RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button></div>
    <div className="grid gap-3 sm:grid-cols-2"><Card><CardContent className="flex items-center gap-3 p-5"><Clock3 className="size-6 text-amber-700" /><div><p className="text-xs text-muted-foreground">Awaiting guarantors</p><p className="text-2xl font-bold">{waiting}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-5"><Check className="size-6 text-primary" /><div><p className="text-xs text-muted-foreground">In review</p><p className="text-2xl font-bold">{ready}</p></div></CardContent></Card></div>
    {loading ? <Card><CardContent className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading applications…</CardContent></Card> : !queue.length ? <Card><CardContent className="p-8 text-sm text-muted-foreground">No loan applications need review.</CardContent></Card> : queue.map(loan => {
      const steps = loan.approvalSteps || []
      const current = steps.find(step => !step.approvedAt)
      return <Card key={loan.id}><CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3"><div><CardTitle>{loan.memberName}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{loan.loanNumber} · {loan.membershipNumber} · {loan.purpose}</p></div><Badge variant={loan.status === 'UNDER_REVIEW' ? 'default' : 'secondary'}>{loan.status === 'PENDING' ? 'Awaiting guarantors' : loan.status === 'APPROVED' ? 'Legacy approval: accountant disbursement' : `Waiting for ${current?.label || 'chair review'}`}</Badge></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-3"><div>Principal <strong className="block">{money(loan.principalAmount)}</strong></div><div>Period <strong className="block">{loan.durationMonths} months</strong></div><div>Total due <strong className="block">{money(loan.totalAmount)}</strong></div></div><div><p className="mb-2 text-sm font-semibold">Guarantors</p><div className="flex flex-wrap gap-2">{loan.guarantors?.length ? loan.guarantors.map(person => <Badge key={person.id} variant={person.status === 'ACCEPTED' ? 'default' : 'secondary'}>{person.name}: {person.status}</Badge>) : <span className="text-sm text-muted-foreground">No guarantors required</span>}</div></div>{steps.length > 0 && <div><p className="mb-2 text-sm font-semibold">Approval steps</p><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Step</TableHead><TableHead>Reviewer</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader><TableBody>{steps.map(step => <TableRow key={step.stepOrder}><TableCell>{step.stepOrder}</TableCell><TableCell>{step.label}</TableCell><TableCell><Badge variant={step.approvedAt ? 'default' : 'secondary'}>{step.approvedAt ? 'Approved' : step.stepOrder === current?.stepOrder ? 'Current' : 'Waiting'}</Badge></TableCell><TableCell>{dateTime(step.approvedAt)}</TableCell></TableRow>)}</TableBody></Table></div></div>}{loan.approvalEvents?.length ? <div><p className="mb-2 text-sm font-semibold">Decision history</p><div className="space-y-1 text-sm text-muted-foreground">{loan.approvalEvents.map((event, index) => <p key={index}>{dateTime(event.actedAt)} · {event.action.toLowerCase()} {event.stepOrder ? `at step ${event.stepOrder}` : ''}{event.reason ? ` — ${event.reason}` : ''}</p>)}</div></div> : null}<div className="flex flex-wrap gap-2 border-t pt-4">{loan.status === 'APPROVED' ? loan.canDisburse ? <Button disabled={actingId !== null} onClick={() => void act('disburse', loan)}>{actingId === loan.id && <Loader2 className="size-4 animate-spin" />} Disburse approved loan</Button> : <p className="text-sm text-muted-foreground">Awaiting an independent accountant for disbursement.</p> : loan.status === 'PENDING' ? <p className="text-sm text-amber-800">Waiting for all guarantors. A declined guarantor must be replaced by the applicant.</p> : loan.canApprove ? <><Button disabled={actingId !== null} onClick={() => void act('approve', loan)}>{actingId === loan.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve {current?.label || 'current step'}</Button>{steps.some(step => step.stepOrder < (current?.stepOrder || 1) && step.approvedByMemberId) && <Button variant="outline" disabled={actingId !== null} onClick={() => { setDecision({ loan, action: 'return' }); setReason('') }}><RotateCcw className="size-4" /> Return</Button>}<Button variant="destructive" disabled={actingId !== null} onClick={() => { setDecision({ loan, action: 'reject' }); setReason('') }}><X className="size-4" /> Reject</Button></> : <p className="text-sm text-muted-foreground">The current review step is assigned to another group role.</p>}{loan.canCancel && <Button variant="outline" disabled={actingId !== null} onClick={() => { setDecision({ loan, action: 'cancel' }); setReason('') }}>Cancel application</Button>}<Link className={buttonVariants({ variant: "secondary" })} href={`/app/loans/${loan.id}`}>View details</Link></div></CardContent></Card>
    })}
    {history.length > 0 && <Card><CardHeader><CardTitle>Recent decisions and disbursements</CardTitle></CardHeader><CardContent><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Loan</TableHead><TableHead>Member</TableHead><TableHead>Decision</TableHead><TableHead>Amount</TableHead><TableHead>Disbursed</TableHead><TableHead>Details</TableHead></TableRow></TableHeader><TableBody>{history.map(loan => <TableRow key={loan.id}><TableCell className="font-medium">{loan.loanNumber}</TableCell><TableCell>{loan.memberName}</TableCell><TableCell><Badge variant={loan.status === 'ACTIVE' || loan.status === 'COMPLETED' ? 'default' : 'secondary'}>{loan.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell>{money(loan.principalAmount)}</TableCell><TableCell>{loan.disbursementDate || '—'}</TableCell><TableCell><Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={`/app/loans/${loan.id}`}>View schedule</Link></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>}
    <Dialog open={!!decision} onOpenChange={open => { if (!open && actingId === null) setDecision(null) }}><DialogContent><DialogHeader><DialogTitle>{decision?.action === 'return' ? 'Return to previous reviewer' : decision?.action === 'cancel' ? 'Cancel application' : 'Reject application'}</DialogTitle><DialogDescription>This decision and its reason will appear in the loan history.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="loan-decision-reason">Reason</Label><Textarea id="loan-decision-reason" value={reason} onChange={event => setReason(event.target.value)} required /></div><DialogFooter><Button variant="outline" onClick={() => setDecision(null)} disabled={actingId !== null}>Keep application</Button><Button variant={decision?.action === 'return' ? 'default' : 'destructive'} disabled={!reason.trim() || actingId !== null} onClick={() => { if (decision) void act(decision.action, decision.loan) }}>{actingId !== null && <Loader2 className="size-4 animate-spin" />} Confirm</Button></DialogFooter></DialogContent></Dialog>
  </main>
}
