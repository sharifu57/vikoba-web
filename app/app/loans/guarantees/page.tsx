'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { resolveActiveGroupId } from '@/lib/api/active-group'
import { useLoans, type LoanGuaranteeRequest } from '@/hooks/useLoans'

export default function LoanGuaranteesPage() {
  const api = useLoans()
  const [groupId, setGroupId] = useState('')
  const [requests, setRequests] = useState<LoanGuaranteeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  useEffect(() => { setGroupId(resolveActiveGroupId(localStorage) || '') }, [])
  const refresh = async (id: string) => {
    try { setRequests(await api.guaranteesMine(id)) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load guarantee requests') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (groupId) void refresh(groupId); else setLoading(false) }, [groupId])
  const decide = async (request: LoanGuaranteeRequest, decision: 'accept' | 'reject') => {
    if (actingId !== null) return
    setActingId(request.id)
    try {
      await api.decideGuarantee(groupId, request.id, decision)
      toast.success(decision === 'accept' ? 'You accepted the guarantee.' : 'You declined the guarantee. The applicant must select a replacement.')
      await refresh(groupId)
      window.dispatchEvent(new Event('vikoba:approval-updated'))
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to record your decision') }
    finally { setActingId(null) }
  }
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6"><Link href="/app/loans" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to loans</Link><div><Badge variant="secondary" className="mb-3"><ShieldCheck className="mr-1 size-3" /> Guarantor workflow</Badge><h1 className="text-3xl font-black">Guarantee requests for you</h1><p className="mt-2 text-sm text-muted-foreground">Accept only when you understand the obligation. Declining asks the applicant to choose another eligible guarantor.</p></div>{loading ? <Card><CardContent className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading requests…</CardContent></Card> : !requests.length ? <Card><CardContent className="p-8 text-sm text-muted-foreground">No guarantee requests are waiting for you.</CardContent></Card> : requests.map(request => <Card key={request.id}><CardContent className="space-y-4 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{request.applicantName}</h2><p className="text-sm text-muted-foreground">Loan {request.loanNumber} · {request.purpose}</p></div><Badge variant="secondary">Awaiting your decision</Badge></div><p className="rounded-xl bg-muted/50 p-4 text-sm">Your guaranteed share: <strong>TZS {Number(request.guaranteedAmount).toLocaleString('en-TZ')}</strong></p><div className="flex gap-2"><Button disabled={actingId !== null} onClick={() => void decide(request, 'accept')}>{actingId === request.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Accept</Button><Button variant="destructive" disabled={actingId !== null} onClick={() => void decide(request, 'reject')}><X className="size-4" /> Decline</Button></div></CardContent></Card>)}</main>
}
