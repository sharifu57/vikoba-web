'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, HandCoins, Loader2, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { resolveActiveGroupId } from '@/lib/api/active-group'
import { useLoans, type Loan, type LoanApplicationContext } from '@/hooks/useLoans'

const purposes = ['Business capital', 'Education', 'Medical expenses', 'Agriculture', 'Home improvement', 'Emergency', 'Other']
const money = (value: number) => `TZS ${Number(value || 0).toLocaleString('en-TZ', { maximumFractionDigits: 2 })}`

export default function ApplyForLoanPage() {
  const api = useLoans()
  const router = useRouter()
  const [groupId, setGroupId] = useState('')
  const [context, setContext] = useState<LoanApplicationContext | null>(null)
  const [openLoan, setOpenLoan] = useState<Loan | null>(null)
  const [replacement, setReplacement] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [months, setMonths] = useState('')
  const [purpose, setPurpose] = useState('')
  const [otherPurpose, setOtherPurpose] = useState('')
  const [guarantorIds, setGuarantorIds] = useState<number[]>([])
  const [consent, setConsent] = useState(false)

  useEffect(() => { setGroupId(resolveActiveGroupId(localStorage) || '') }, [])
  useEffect(() => {
    if (!groupId) { setLoading(false); return }
    let active = true
    api.applicationContext(groupId).then(data => {
      if (!active) return
      setContext(data)
      api.list(groupId).then(loans => {
        if (active) setOpenLoan(loans.find(loan => loan.groupMemberId === data.groupMemberId && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'ACTIVE', 'DEFAULTED'].includes(loan.status)) || null)
      }).catch(() => {})
      setMonths(data.maxDurationMonths > 0 ? String(Math.min(data.defaultDurationMonths || data.maxDurationMonths, data.maxDurationMonths)) : '')
      setGuarantorIds(Array(Math.max(0, data.requiredGuarantors || 0)).fill(0))
    }).catch(error => toast.error(error instanceof Error ? error.message : 'Unable to load loan eligibility'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [groupId])

  const principal = Number(amount || 0)
  const duration = Number(months || 0)
  const rate = Number(context?.interestRate || 0)
  const interest = Math.round(principal * rate * duration) / 100
  const selected = useMemo(() => context?.guarantors.filter(person => guarantorIds.includes(person.id)) || [], [context, guarantorIds])
  const canSubmit = !!context && principal > 0 && principal <= Number(context.maximumLoan) && duration > 0 &&
    context.maxDurationMonths > 0 && duration <= context.maxDurationMonths &&
    !openLoan &&
    guarantorIds.length === Number(context.requiredGuarantors || 0) && guarantorIds.every(id => id > 0) &&
    new Set(guarantorIds).size === guarantorIds.length && !!(purpose === 'Other' ? otherPurpose.trim() : purpose) && consent

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || submitting || !context) return
    setSubmitting(true)
    try {
      const loan = await api.apply(groupId, { principalAmount: principal, durationMonths: duration,
        purpose: purpose === 'Other' ? otherPurpose.trim() : purpose, guarantorIds, consentAccepted: true })
      toast.success(`Application ${loan.loanNumber} submitted. Guarantors will review it before loan approval.`)
      window.dispatchEvent(new Event('vikoba:approval-updated'))
      router.push('/app/loans')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to submit loan application') }
    finally { setSubmitting(false) }
  }

  const replace = async (guaranteeId: number) => {
    if (!openLoan || !replacement[guaranteeId] || submitting) return
    setSubmitting(true)
    try {
      const updated = await api.replaceGuarantor(groupId, openLoan.id, guaranteeId, replacement[guaranteeId])
      setOpenLoan(updated)
      setContext(await api.applicationContext(groupId))
      toast.success('Replacement guarantor invited.')
      window.dispatchEvent(new Event('vikoba:approval-updated'))
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to replace guarantor') }
    finally { setSubmitting(false) }
  }

  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
    <Link href="/app/loans" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to loans</Link>
    <div><Badge variant="secondary" className="mb-3"><HandCoins className="mr-1 size-3" /> Self-service application</Badge><h1 className="text-3xl font-black text-foreground">Apply for a group loan</h1><p className="mt-2 text-sm text-muted-foreground">Your identity and borrowing limit come from your group record. Guarantors must accept before the application goes to approval.</p></div>
    {loading ? <Card><CardContent className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading your eligibility…</CardContent></Card> : !context ? <Card><CardContent className="p-8 text-sm text-destructive">{api.error || 'Select a valid group and ensure your loan settings are configured.'}</CardContent></Card> :
    openLoan ? <Card><CardContent className="space-y-4 p-6"><div><h2 className="text-lg font-bold">Your current application · {openLoan.loanNumber}</h2><p className="mt-1 text-sm text-muted-foreground">Status: {openLoan.status.replaceAll('_', ' ')}. Complete any outstanding guarantor decisions before another application.</p></div>{(openLoan.guarantors || []).map(person => <div key={person.id} className="rounded-xl border p-4"><p className="font-semibold">{person.name} · <span className="text-sm text-muted-foreground">{person.status}</span></p><p className="text-sm text-muted-foreground">{person.phone || 'No phone'} · {person.address || 'No address recorded'}</p>{person.status === 'REJECTED' && <div className="mt-3 flex flex-wrap gap-2"><NativeSelect aria-label={`Replacement for ${person.name}`} value={replacement[person.id] || ''} onChange={event => setReplacement(current => ({ ...current, [person.id]: Number(event.target.value) }))}><option value="">Choose a replacement</option>{context.guarantors.filter(candidate => candidate.available).map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.membershipNumber}</option>)}</NativeSelect><Button type="button" disabled={!replacement[person.id] || submitting} onClick={() => void replace(person.id)}>{submitting && <Loader2 className="size-4 animate-spin" />} Invite replacement</Button></div>}</div>)}</CardContent></Card> : <form onSubmit={submit} className="space-y-6">{context.maxDurationMonths > 0 ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Repayment must finish by {context.groupEndDate}. The maximum period you can choose is {context.maxDurationMonths} month(s), after applying group settings and the Kikoba break date.</p> : <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">No full repayment month remains before the Kikoba break date ({context.groupEndDate || "not configured"}). Ask your group admin to review the group cycle.</p>}
      <Card><CardContent className="space-y-5 p-6"><div className="flex items-center gap-2"><Users className="size-5 text-primary" /><h2 className="text-lg font-bold">Your details</h2></div><div className="grid gap-4 sm:grid-cols-2">{[['Full name', context.name], ['Membership number', context.membershipNumber], ['Identity number', context.nationalId || 'Not on profile'], ['Phone', context.phone || 'Not on profile'], ['Address', context.address || 'Not on profile']].map(([label, value]) => <div key={label} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div>{(!context.nationalId || !context.phone) && <p className="text-sm text-amber-800">Ask your group admin to complete missing identity or phone details in your member profile.</p>}</CardContent></Card>
      <Card><CardContent className="space-y-5 p-6"><div><h2 className="text-lg font-bold">Loan amount and purpose</h2><p className="text-sm text-muted-foreground">Your limit is based on approved share value × the group loan multiplier.</p></div><div className="grid gap-3 sm:grid-cols-3">{[['Your share value', money(context.sharesValue)], ['Group multiplier', `${context.loanMultiplier}×`], ['Maximum loan', money(context.maximumLoan)]].map(([label, value]) => <div key={label} className="rounded-xl border bg-primary-soft p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold text-primary">{value}</p></div>)}</div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="loan-amount">Amount requested (TZS)</Label><Input id="loan-amount" type="number" min="1" max={context.maximumLoan} value={amount} onChange={event => setAmount(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="loan-months">Repayment period (months)</Label><Input id="loan-months" type="number" min="1" max={context.maxDurationMonths || undefined} value={months} onChange={event => setMonths(event.target.value)} required /></div></div>{principal > context.maximumLoan && <p className="text-sm font-semibold text-destructive">The amount exceeds your limit by {money(principal - context.maximumLoan)}.</p>}<div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Interest rate</p><p className="font-bold">{rate}% per month</p></div><div><p className="text-muted-foreground">Estimated interest</p><p className="font-bold">{money(interest)}</p></div><div><p className="text-muted-foreground">Estimated total due</p><p className="font-bold text-primary">{money(principal + interest)}</p></div></div><div className="space-y-2"><Label htmlFor="loan-purpose">Purpose of loan</Label><NativeSelect id="loan-purpose" value={purpose} onChange={event => setPurpose(event.target.value)} required><option value="">Select purpose</option>{purposes.map(value => <option key={value} value={value}>{value}</option>)}</NativeSelect></div>{purpose === 'Other' && <div className="space-y-2"><Label htmlFor="other-purpose">Describe your purpose</Label><Textarea id="other-purpose" value={otherPurpose} onChange={event => setOtherPurpose(event.target.value)} required /></div>}</CardContent></Card>
      <Card><CardContent className="space-y-5 p-6"><div><h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-primary" /> Guarantors (wadhamini)</h2><p className="mt-1 text-sm text-muted-foreground">Choose {context.requiredGuarantors} eligible group {context.requiredGuarantors === 1 ? 'member' : 'members'}. You cannot be your own guarantor. Members with an open loan or another active guarantee cannot be selected.</p></div>{guarantorIds.map((id, index) => <div key={index} className="space-y-2"><Label htmlFor={`guarantor-${index}`}>Guarantor {index + 1}</Label><NativeSelect id={`guarantor-${index}`} value={id || ''} onChange={event => setGuarantorIds(current => current.map((value, i) => i === index ? Number(event.target.value) : value))} required><option value="">Select group member</option>{context.guarantors.map(person => <option key={person.id} value={person.id} disabled={!person.available || (guarantorIds.includes(person.id) && person.id !== id)}>{person.name} · {person.membershipNumber}{person.available ? '' : ` — ${person.reason}`}</option>)}</NativeSelect></div>)}{selected.map(person => <div key={person.id} className="rounded-lg border bg-muted/40 p-3 text-sm"><p className="font-semibold">{person.name}</p><p className="text-muted-foreground">{person.phone || 'No phone'} · {person.address || 'No address recorded'}</p></div>)}</CardContent></Card>
      <Card><CardContent className="space-y-4 p-6"><div><h2 className="text-lg font-bold">Applicant declaration and consent</h2><p className="mt-1 text-sm text-muted-foreground">Read and accept before submitting.</p></div><ul className="list-disc space-y-2 pl-5 text-sm text-foreground"><li>I confirm that the information in my group profile and this application is accurate.</li><li>I understand the interest estimate and agree to repay the principal, interest, and any applicable late fees under the group rules.</li><li>My selected guarantors will be asked to accept or decline. A declined guarantor must be replaced before the loan can proceed.</li><li>Submitting this application records my consent and sends it for guarantor review; it does not approve or disburse the loan.</li></ul><div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft p-4"><Checkbox id="loan-consent" checked={consent} onChange={event => setConsent(event.target.checked)} /><Label htmlFor="loan-consent" className="leading-relaxed">I have read and agree to the loan terms and authorize submission of this application.</Label></div></CardContent></Card>
      <Button type="submit" disabled={!canSubmit || submitting} className="w-full sm:w-auto">{submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{submitting ? 'Submitting application…' : 'Submit for guarantor review'}</Button>
    </form>}
  </main>
}
