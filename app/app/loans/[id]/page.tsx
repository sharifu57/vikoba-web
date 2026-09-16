'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLoans, type Installment, type Loan, type LoanRepayment } from '@/hooks/useLoans'
import { resolveActiveGroupId } from '@/lib/api/active-group'

const money = (value: number, currency: string) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value || 0)
const when = (value?: string | null) => value ? new Date(value).toLocaleString('en-TZ') : 'Waiting'

export default function LoanDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const api = useLoans()
  const [groupId, setGroupId] = useState('')
  const [currency, setCurrency] = useState('TZS')
  const [loan, setLoan] = useState<Loan | null>(null)
  const [rows, setRows] = useState<Installment[]>([])
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('MOBILE_MONEY')
  const [externalReference, setExternalReference] = useState('')
  const [repayments, setRepayments] = useState<LoanRepayment[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const load = async (gid: string) => {
    setLoading(true)
    try {
      const all = await api.list(gid)
      setLoan(all.find(item => item.id === Number(id)) || null)
      setRows(await api.schedule(gid, Number(id)))
      setRepayments((await api.repayments(gid)).filter(item => item.loanId === Number(id)))
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load loan') }
    finally { setLoading(false) }
  }
  useEffect(() => {
    const gid = resolveActiveGroupId(localStorage) || ''
    setGroupId(gid)
    try { setCurrency(JSON.parse(localStorage.getItem('v360_currentGroup') || '{}').currency || 'TZS') } catch { /* Keep TZS */ }
    if (gid) void load(gid)
    else setLoading(false)
  }, [id])
  const pay = async () => {
    if (paying || !groupId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return
    setPaying(true)
    try { await api.repay(groupId, Number(id), Number(amount), paymentMethod, externalReference.trim() || undefined); toast.success('Repayment submitted. The schedule will update after accountant approval.'); setAmount(''); setExternalReference(''); await load(groupId) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to record repayment') }
    finally { setPaying(false) }
  }
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <div className="flex items-center justify-between"><Link href="/app/loans" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to loans</Link><Button variant="outline" disabled={!groupId || loading} onClick={() => void load(groupId)}><RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button></div>
    {loading && !loan ? <Card><CardContent className="flex items-center gap-2 p-8"><Loader2 className="size-4 animate-spin" /> Loading loan…</CardContent></Card> : !loan ? <Card><CardContent className="p-8">Loan not found.</CardContent></Card> : <>
      <Card><CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-muted-foreground">{loan.loanNumber}</p><CardTitle className="mt-1 text-2xl">{loan.memberName}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{loan.purpose}</p></div><Badge variant={loan.status === 'ACTIVE' ? 'default' : 'secondary'}>{loan.status.replaceAll('_', ' ')}</Badge></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Principal', loan.principalAmount], ['Interest', loan.interestAmount], ['Total due', loan.totalAmount], ['Outstanding', loan.remainingBalance]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-muted/50 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{money(Number(value), currency)}</p></div>)}</div><p className="mt-4 text-sm text-muted-foreground">Disbursed {loan.disbursementDate || 'after final approval'} · Matures {loan.maturityDate || 'after final approval'} · {loan.durationMonths} monthly repayments</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg">Approval history</CardTitle></CardHeader><CardContent className="space-y-4"><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Step</TableHead><TableHead>Reviewer</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader><TableBody>{loan.approvalSteps?.map(step => <TableRow key={step.stepOrder}><TableCell>{step.stepOrder}</TableCell><TableCell>{step.label}</TableCell><TableCell><Badge variant={step.approvedAt ? 'default' : 'secondary'}>{step.approvedAt ? 'Completed' : 'Waiting'}</Badge></TableCell><TableCell>{when(step.approvedAt)}</TableCell></TableRow>) || <TableRow><TableCell colSpan={4}>Approval begins after guarantors accept.</TableCell></TableRow>}</TableBody></Table></div>{loan.approvalEvents?.length ? <div className="space-y-1 text-sm text-muted-foreground">{loan.approvalEvents.map((event, index) => <p key={index}>{when(event.actedAt)} · {event.action.toLowerCase().replaceAll('_', ' ')}{event.reason ? ` — ${event.reason}` : ''}</p>)}</div> : null}</CardContent></Card>
      {(loan.status === 'ACTIVE' || loan.status === 'DEFAULTED') && <Card><CardHeader><CardTitle className="text-lg">Submit repayment</CardTitle><p className="text-sm text-muted-foreground">The accountant must confirm the payment before balances change. Any amount above the first unpaid installment automatically continues into the next installment.</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="repayment-amount">Amount paid</Label><Input id="repayment-amount" type="number" min="0.01" max={loan.remainingBalance} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Enter amount" /></div><div className="space-y-2"><Label htmlFor="repayment-method">Payment method</Label><NativeSelect id="repayment-method" value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><option value="MOBILE_MONEY">Mobile money</option><option value="BANK">Bank</option><option value="CASH">Cash</option><option value="CONTROL_NUMBER">Control number</option></NativeSelect></div><div className="space-y-2"><Label htmlFor="repayment-reference">Transaction reference</Label><Input id="repayment-reference" value={externalReference} onChange={event => setExternalReference(event.target.value)} placeholder="Optional receipt/reference" /></div></div>{Number(amount) > 0 && (() => { let remaining = Number(amount); const allocations = rows.filter(row => row.balance > 0).map(row => { const applied = Math.min(remaining, row.balance); remaining -= applied; return { number: row.installmentNumber, amount: applied } }).filter(item => item.amount > 0); return <div className="rounded-lg border bg-muted/40 p-3 text-sm"><p className="font-semibold">Expected allocation after approval</p><div className="mt-2 flex flex-wrap gap-2">{allocations.map(item => <Badge key={item.number} variant="secondary">Installment {item.number}: {money(item.amount, currency)}</Badge>)}</div></div> })()}<Button disabled={paying || !Number(amount) || Number(amount) > loan.remainingBalance} onClick={() => void pay()}>{paying && <Loader2 className="size-4 animate-spin" />} Submit for accountant approval</Button></CardContent></Card>}
      {repayments.length > 0 && <Card><CardHeader><CardTitle className="text-lg">Repayment requests</CardTitle></CardHeader><CardContent><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Submitted</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{repayments.map(item => <TableRow key={item.id}><TableCell>{when(item.submittedAt)}</TableCell><TableCell>{money(item.amount, currency)}</TableCell><TableCell>{item.paymentMethod.replaceAll('_', ' ')}</TableCell><TableCell>{item.externalReference || '—'}</TableCell><TableCell><Badge variant={item.status === 'COMPLETED' ? 'default' : item.status === 'FAILED' ? 'destructive' : 'secondary'}>{item.status === 'PENDING' ? 'Waiting for accountant' : item.status}</Badge>{item.rejectionReason && <p className="mt-1 text-xs text-destructive">{item.rejectionReason}</p>}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-lg">Repayment schedule</CardTitle><p className="text-sm text-muted-foreground">Configured late fine: {money(loan.latePaymentFine || 0, currency)} for each overdue installment. Fine is added only when an overdue installment is assessed.</p></CardHeader><CardContent>{rows.length ? <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Due date</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Interest</TableHead><TableHead className="text-right">Fine</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}><TableCell>{row.installmentNumber}</TableCell><TableCell>{row.dueDate}</TableCell><TableCell className="text-right">{money(row.principalAmount, currency)}</TableCell><TableCell className="text-right">{money(row.interestAmount, currency)}</TableCell><TableCell className="text-right">{money(row.penaltyAmount, currency)}</TableCell><TableCell className="text-right">{money(row.paidAmount, currency)}</TableCell><TableCell className="text-right font-semibold">{money(row.balance, currency)}</TableCell><TableCell><Badge variant={row.status === 'PAID' ? 'default' : 'secondary'}>{row.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div> : <p className="text-sm text-muted-foreground">Repayment dates appear after the final approval and disbursement.</p>}</CardContent></Card>
    </>}
  </main>
}
