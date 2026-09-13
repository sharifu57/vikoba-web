'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Clock3, Loader2, RefreshCw, ShieldCheck, WalletCards, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { resolveActiveGroupId } from '@/lib/api/active-group'
import { useLoans, type Loan } from '@/hooks/useLoans'

const money = (value: number) => `TZS ${Number(value || 0).toLocaleString('en-TZ')}`

export default function LoanApplicationsPage() {
  const api = useLoans()
  const [groupId, setGroupId] = useState('')
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState<Loan | null>(null)
  const [reason, setReason] = useState('')
  useEffect(() => { setGroupId(resolveActiveGroupId(localStorage) || '') }, [])
  const refresh = async (id: string) => {
    setLoading(true)
    try { setLoans(await api.list(id)) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load loan applications') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (groupId) void refresh(groupId); else setLoading(false) }, [groupId])
  const act = async (action: 'approve' | 'reject' | 'disburse', loan: Loan) => {
    if (actingId !== null) return
    setActingId(loan.id)
    try {
      if (action === 'approve') await api.approve(groupId, loan.id)
      else if (action === 'disburse') await api.disburse(groupId, loan.id)
      else await api.reject(groupId, loan.id, reason.trim())
      toast.success(`Loan ${action === 'disburse' ? 'disbursed' : action === 'approve' ? 'approved' : 'rejected'}.`)
      setRejecting(null)
      setReason('')
      await refresh(groupId)
      window.dispatchEvent(new Event('vikoba:approval-updated'))
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to process loan') }
    finally { setActingId(null) }
  }
  const queue = loans.filter(loan => ['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(loan.status))
  const ready = queue.filter(loan => loan.status === 'UNDER_REVIEW').length
  const waiting = queue.filter(loan => loan.status === 'PENDING').length
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6"><Link href="/app/loans" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to loans</Link><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="secondary" className="mb-3"><ShieldCheck className="mr-1 size-3" /> Group loan workflow</Badge><h1 className="text-3xl font-black">Loan applications</h1><p className="mt-2 text-sm text-muted-foreground">Guarantors review first. Loan managers approve only after every required guarantee is accepted.</p></div><Button variant="outline" onClick={() => void refresh(groupId)} disabled={loading || !groupId}><RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button></div><div className="grid gap-3 sm:grid-cols-2"><Card><CardContent className="flex items-center gap-3 p-5"><Clock3 className="size-6 text-amber-700" /><div><p className="text-xs text-muted-foreground">Awaiting guarantors</p><p className="text-2xl font-bold">{waiting}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-5"><Check className="size-6 text-primary" /><div><p className="text-xs text-muted-foreground">Ready for approval</p><p className="text-2xl font-bold">{ready}</p></div></CardContent></Card></div>{loading ? <Card><CardContent className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading applications…</CardContent></Card> : !queue.length ? <Card><CardContent className="p-8 text-sm text-muted-foreground">No loan applications need review.</CardContent></Card> : queue.map(loan => <Card key={loan.id}><CardContent className="space-y-4 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">{loan.memberName}</h2><Badge variant={loan.status === 'UNDER_REVIEW' ? 'default' : 'secondary'}>{loan.status === 'PENDING' ? 'Awaiting guarantors' : loan.status.replaceAll('_', ' ')}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{loan.loanNumber} · {loan.membershipNumber} · {loan.purpose}</p></div><p className="text-lg font-bold text-primary">{money(loan.principalAmount)}</p></div><div className="grid gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-3"><div>Interest: <strong>{loan.interestRate}% monthly</strong></div><div>Period: <strong>{loan.durationMonths} months</strong></div><div>Total due: <strong>{money(loan.totalAmount)}</strong></div></div><div><p className="mb-2 text-sm font-semibold">Guarantors</p><div className="flex flex-wrap gap-2">{loan.guarantors?.length ? loan.guarantors.map(person => <Badge key={person.id} variant={person.status === 'ACCEPTED' ? 'default' : 'secondary'}>{person.name}: {person.status}</Badge>) : <span className="text-sm text-muted-foreground">No guarantors required</span>}</div></div><div className="flex flex-wrap gap-2 border-t pt-4">{loan.status === 'PENDING' && <p className="text-sm text-amber-800">Waiting for all guarantors to accept. A declined guarantor must be replaced by the applicant.</p>}{loan.status === 'UNDER_REVIEW' && <><Button disabled={actingId !== null} onClick={() => void act('approve', loan)}>{actingId === loan.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve loan</Button><Button variant="destructive" disabled={actingId !== null} onClick={() => { setRejecting(loan); setReason('') }}><X className="size-4" /> Reject</Button></>}{loan.status === 'APPROVED' && <Button disabled={actingId !== null} onClick={() => void act('disburse', loan)}>{actingId === loan.id ? <Loader2 className="size-4 animate-spin" /> : <WalletCards className="size-4" />} Disburse</Button>}</div></CardContent></Card>)}<Dialog open={!!rejecting} onOpenChange={open => { if (!open && actingId === null) setRejecting(null) }}><DialogContent><DialogHeader><DialogTitle>Reject loan application?</DialogTitle><DialogDescription>Provide a reason the applicant can review.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="loan-rejection-reason">Reason</Label><Textarea id="loan-rejection-reason" value={reason} onChange={event => setReason(event.target.value)} required /></div><DialogFooter><Button variant="outline" onClick={() => setRejecting(null)} disabled={actingId !== null}>Cancel</Button><Button variant="destructive" disabled={!reason.trim() || actingId !== null} onClick={() => { if (rejecting) void act('reject', rejecting) }}>{actingId !== null && <Loader2 className="size-4 animate-spin" />} Reject loan</Button></DialogFooter></DialogContent></Dialog></main>
}
