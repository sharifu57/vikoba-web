'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, CheckCircle2, Clock3, FileText, Loader2, RefreshCw, ShieldCheck, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sharePurchaseRequestService, type SharePurchaseRequestRecord } from '@/lib/api/services'

type Filter = 'ALL' | SharePurchaseRequestRecord['status']
type Proof = { url: string; name: string; mimeType: string }

function unwrap<T>(response: T | { data?: T }): T {
  return response && typeof response === 'object' && 'data' in response ? (response as { data?: T }).data as T : response as T
}
function displayTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-TZ', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
function money(value: number) { return `TZS ${Number(value || 0).toLocaleString('en-TZ')}` }

export default function WorkflowsPage() {
  const [groupId, setGroupId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [requests, setRequests] = useState<SharePurchaseRequestRecord[]>([])
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [proofLoadingId, setProofLoadingId] = useState<number | null>(null)
  const [proof, setProof] = useState<Proof | null>(null)
  const [rejecting, setRejecting] = useState<SharePurchaseRequestRecord | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const id = localStorage.getItem('v360_currentGroupId') || ''
    setGroupId(id)
    try {
      const groups = JSON.parse(localStorage.getItem('v360_groups') || '[]') as Array<Record<string, unknown>>
      const selected = groups.find(item => String((item.group as Record<string, unknown> | undefined)?.groupId ?? item.groupId ?? item.id) === id)
      setMemberId(String(selected?.groupMemberId ?? localStorage.getItem('v360_currentGroupMemberId') ?? ''))
      setRoles(Array.isArray(selected?.roles) ? selected.roles.map(String) : [String(selected?.role || '')])
    } catch { /* Access is also checked by the API. */ }
  }, [])

  const refresh = useCallback(async () => {
    if (!groupId) { setLoading(false); return }
    setLoading(true)
    try { setRequests(unwrap(await sharePurchaseRequestService.list(groupId, null)) || []) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load approvals') }
    finally { setLoading(false) }
  }, [groupId])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => () => { if (proof) URL.revokeObjectURL(proof.url) }, [proof])

  const counts = useMemo(() => ({
    ALL: requests.length,
    PENDING: requests.filter(request => request.status === 'PENDING').length,
    APPROVED: requests.filter(request => request.status === 'APPROVED').length,
    REJECTED: requests.filter(request => request.status === 'REJECTED').length,
  }), [requests])
  const visible = useMemo(() => requests.filter(request => filter === 'ALL' || request.status === filter), [requests, filter])

  const approve = async (request: SharePurchaseRequestRecord) => {
    if (actingId !== null) return
    setActingId(request.id)
    try {
      const response = unwrap(await sharePurchaseRequestService.approve(groupId, request.id))
      toast.success(response.status === 'APPROVED' ? 'Share purchase fully approved.' : `Step approved. Next: ${response.currentStepLabel || 'reviewer'}.`)
      if (response.status === 'APPROVED') setFilter('APPROVED')
      await refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to approve request') }
    finally { setActingId(null) }
  }
  const reject = async () => {
    if (!rejecting || actingId !== null) return
    const reason = rejectReason.trim()
    if (!reason) { toast.error('Enter a reason for rejection.'); return }
    setActingId(rejecting.id)
    try {
      await sharePurchaseRequestService.reject(groupId, rejecting.id, reason)
      setRejecting(null)
      setRejectReason('')
      setFilter('REJECTED')
      toast.success('Request rejected. The reason is now visible in its history.')
      await refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to reject request') }
    finally { setActingId(null) }
  }
  const openProof = async (request: SharePurchaseRequestRecord) => {
    if (proofLoadingId !== null) return
    setProofLoadingId(request.id)
    try {
      const blob = await sharePurchaseRequestService.proof(groupId, request.id)
      const name = request.proofFileName || `payment-proof-${request.id}`
      const mimeType = blob.type && blob.type !== 'application/octet-stream' ? blob.type : request.proofContentType || (name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
      setProof({ url: URL.createObjectURL(blob.type === mimeType ? blob : new Blob([blob], { type: mimeType })), name, mimeType })
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to open proof') }
    finally { setProofLoadingId(null) }
  }

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-5" /> Group approvals</div><h1 className="text-3xl font-black tracking-tight text-foreground">Approval workflows</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Follow each share purchase from proof submission through every approval step. Only the assigned reviewer can approve the current step.</p></div>
      <Button variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} /> Refresh</Button>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      {([['PENDING', 'Awaiting review', Clock3], ['APPROVED', 'Completed', CheckCircle2], ['REJECTED', 'Rejected', XCircle]] as const).map(([status, label, Icon]) => <Card key={status} className="border-border shadow-sm"><CardContent className="flex items-center justify-between p-4 pt-4"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black text-foreground">{counts[status]}</p></div><Icon className={`size-6 ${status === 'APPROVED' ? 'text-emerald-700' : status === 'REJECTED' ? 'text-red-700' : 'text-amber-600'}`} /></CardContent></Card>)}
    </div>

    <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="group" aria-label="Filter approval requests">
      {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(status => <Button key={status} variant={filter === status ? 'default' : 'outline'} size="sm" aria-pressed={filter === status} onClick={() => setFilter(status)}>{status === 'ALL' ? 'All requests' : status.charAt(0) + status.slice(1).toLowerCase()} <Badge variant={filter === status ? 'outline' : 'secondary'} className={filter === status ? 'border-white/50 bg-white/20 text-white' : ''}>{counts[status]}</Badge></Button>)}
    </div>

    {loading ? <Card><CardContent className="flex items-center justify-center gap-2 p-10 pt-10 text-muted-foreground"><Loader2 className="animate-spin" /> Loading workflows…</CardContent></Card> : !groupId ? <Card><CardContent className="p-10 pt-10 text-center text-muted-foreground">Select a group to view its workflows.</CardContent></Card> : visible.length === 0 ? <Card><CardContent className="p-10 pt-10 text-center text-muted-foreground">No {filter === 'ALL' ? '' : filter.toLowerCase() + ' '}share purchase requests found.</CardContent></Card> :
      <div className="space-y-4">{visible.map(request => {
        const own = String(request.groupMemberId) === memberId
        const role = request.currentStepRole
        const canReview = request.status === 'PENDING' && !own && !!role && (roles.includes(role) || (role === 'GROUP_CHAIRMAN' && roles.includes('CHAIRPERSON')) || (role === 'CHAIRPERSON' && roles.includes('GROUP_CHAIRMAN')))
        const steps = request.approvalSteps || []
        return <Card key={request.id} className="overflow-hidden border-border shadow-[0_8px_28px_rgba(16,36,29,0.08)]">
          <CardContent className="space-y-5 p-5 pt-5 sm:p-6 sm:pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-foreground">{request.memberName}</h2><Badge variant={request.status === 'APPROVED' ? 'default' : request.status === 'REJECTED' ? 'destructive' : 'secondary'}>{request.status.toLowerCase()}</Badge>{own && <Badge variant="outline">Your request</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">Request #{request.id} · Submitted {displayTime(request.submittedAt)}</p></div>
              <div className="rounded-xl bg-primary-soft px-4 py-3 text-right"><p className="text-xs font-semibold text-muted-foreground">Share amount</p><p className="text-lg font-black text-primary">{money(request.amount)}</p></div>
            </div>
            <div className="grid gap-3 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Shares</p><p className="font-bold text-foreground">{Number(request.quantity).toLocaleString('en-TZ')}</p></div><div><p className="text-xs text-muted-foreground">Jamii</p><p className="font-bold text-foreground">{money(request.jamiiAmount)}</p></div><div><p className="text-xs text-muted-foreground">Payment reference</p><p className="break-all font-bold text-foreground">{request.paymentReference || 'Not provided'}</p></div></div>
            {steps.length > 0 && <div><h3 className="mb-3 text-sm font-bold text-foreground">Approval history</h3><ol className="space-y-0">{steps.map((step, index) => {
              const completed = !!step.approvedAt
              const current = request.status === 'PENDING' && !step.skipped && !completed && role === step.role
              const rejectedHere = request.status === 'REJECTED' && !step.skipped && !completed && role === step.role
              return <li key={`${step.role}-${index}`} className="flex gap-3"><div className="flex w-7 shrink-0 flex-col items-center"><span className={`grid size-7 place-items-center rounded-full border ${completed ? 'border-primary bg-primary text-white' : step.skipped ? 'border-border bg-muted text-muted-foreground' : rejectedHere ? 'border-red-300 bg-red-50 text-red-700' : current ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-border bg-card text-muted-foreground'}`}>{completed ? <Check className="size-4" /> : step.skipped || rejectedHere ? <X className="size-4" /> : index + 1}</span>{index < steps.length - 1 && <span className="min-h-8 w-px bg-border" />}</div><div className="pb-5"><p className="text-sm font-semibold text-foreground">{step.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{step.skipped ? 'Skipped because the buyer holds this role' : completed ? `Approved ${displayTime(step.approvedAt)}` : rejectedHere ? `Rejected ${displayTime(request.reviewedAt)} · ${request.reviewReason || 'No reason provided'}` : current ? 'Current approval step' : request.status === 'REJECTED' ? 'Not reached' : 'Waiting for earlier steps'}</p></div></li>
            })}</ol></div>}
            {request.status === 'REJECTED' && <div role="note" className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-bold text-red-800">Rejected {displayTime(request.reviewedAt)}</p><p className="mt-1 whitespace-pre-wrap text-sm text-red-700">Reason: {request.reviewReason || 'No reason provided'}</p></div>}
            {request.status === 'APPROVED' && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Completed {displayTime(request.reviewedAt)}. Shares have been recorded.</p>}
            {request.status === 'PENDING' && <p className="text-sm font-semibold text-amber-800">{own ? 'Your request is awaiting independent review.' : `Next reviewer: ${request.currentStepLabel || 'group approver'}`}</p>}
            {request.proofText && <p className="rounded-lg border border-border bg-card p-3 text-sm text-foreground">{request.proofText}</p>}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">{request.hasProofFile && <Button variant="outline" disabled={proofLoadingId !== null} onClick={() => void openProof(request)}>{proofLoadingId === request.id ? <Loader2 className="animate-spin" /> : <FileText />} View payment proof</Button>}{canReview && <><Button disabled={actingId !== null} onClick={() => void approve(request)}>{actingId === request.id ? <Loader2 className="animate-spin" /> : <Check />} Approve step</Button><Button variant="destructive" disabled={actingId !== null} onClick={() => { setRejecting(request); setRejectReason('') }}><X /> Reject request</Button></>}</div>
          </CardContent>
        </Card>
      })}</div>}

    <Dialog open={rejecting !== null} onOpenChange={open => { if (!open && actingId === null) setRejecting(null) }}><DialogContent><DialogHeader><DialogTitle>Reject share purchase?</DialogTitle><DialogDescription>The member will see this reason in the workflow history.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="rejection-reason">Reason for rejection</Label><Textarea id="rejection-reason" value={rejectReason} onChange={event => setRejectReason(event.target.value)} placeholder="Explain why this payment proof cannot be accepted" maxLength={500} required /></div><DialogFooter><Button variant="outline" onClick={() => setRejecting(null)} disabled={actingId !== null}>Cancel</Button><Button variant="destructive" onClick={() => void reject()} disabled={actingId !== null || !rejectReason.trim()}>{actingId !== null && <Loader2 className="animate-spin" />} Reject request</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={proof !== null} onOpenChange={open => { if (!open) setProof(null) }}><DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Payment proof</DialogTitle><DialogDescription>{proof?.name}</DialogDescription></DialogHeader>{proof?.mimeType.startsWith('image/') ? <img src={proof.url} alt={proof.name} className="max-h-[70vh] max-w-full object-contain" /> : proof?.mimeType === 'application/pdf' ? <iframe src={proof.url} title={proof.name} className="h-[70vh] w-full" /> : <p>Preview unavailable. Download the file to view it.</p>}{proof && <a href={proof.url} download={proof.name} className="text-sm font-semibold text-primary underline">Download proof</a>}</DialogContent></Dialog>
  </main>
}
