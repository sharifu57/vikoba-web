'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { fineService, groupService, type FineTypeOption, type GroupProfileSettingsPayload } from '@/lib/api/services'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { apiGet, apiPut } from '@/lib/api/client'

type FineRule = { id?: string | number; code: string; name: string; defaultAmount: string; description: string }
const defaultApprovalSteps = [{ role: 'ACCOUNTANT', label: 'Accountant review' }, { role: 'GROUP_CHAIRMAN', label: 'Chair approval' }]
const approvalRoles = ['ACCOUNTANT', 'GROUP_CHAIRMAN', 'CHAIRPERSON', 'VICE_CHAIRPERSON', 'SECRETARY', 'TREASURER', 'LOAN_OFFICER', 'AUDITOR', 'GROUP_ADMIN']

const defaultFineRules: FineRule[] = [
  { code: 'MEETING_ABSENCE', name: 'Meeting absence', defaultAmount: '', description: 'Automatically charged when a member is absent.' },
  { code: 'MEETING_LATE', name: 'Late arrival', defaultAmount: '', description: 'Charged when a member arrives late to a meeting.' },
  { code: 'LATE_LOAN_PAYMENT', name: 'Late loan payment', defaultAmount: '', description: 'Charged for an overdue loan repayment.' },
]

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  currency: 'TZS',
  startDate: '',
  endDate: '',
  requiredLoanGuarantors: 2,
  loanMultiplier: 3,
  defaultInterestRate: 8,
  defaultLoanDurationMonths: 6,
  latePaymentFine: 5000,
}

export default function GroupSettingsPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [jamiiAmount, setJamiiAmount] = useState('')
  const [minimumShareAmount, setMinimumShareAmount] = useState('25000')
  const [sharePriceAmount, setSharePriceAmount] = useState('5000')
  const [approvalSteps, setApprovalSteps] = useState(defaultApprovalSteps)
  const [expenseApprovalSteps, setExpenseApprovalSteps] = useState([{ role: 'ACCOUNTANT', label: 'Accountant review' }])
  const [fineRules, setFineRules] = useState<FineRule[]>(defaultFineRules)
  const [removedFineTypeIds, setRemovedFineTypeIds] = useState<Array<string | number>>([])

  useEffect(() => {
    const storedGroup = localStorage.getItem('v360_currentGroup')
    if (storedGroup) {
      const parsed = JSON.parse(storedGroup)
      setForm((current) => ({
        ...current,
        name: parsed.name || parsed.groupName || '',
        phone: parsed.phone || '',
        email: parsed.email || '',
        currency: parsed.currency || 'TZS',
        startDate: parsed.startDate || parsed.startedAt || '',
        endDate: parsed.endDate || parsed.endsAt || '',
      }))
    }
  }, [])

  useEffect(() => {
    const groupId = localStorage.getItem('v360_currentGroupId') || ''
    if (!/^\d+$/.test(groupId)) return
    groupService.getWithSettings(groupId).then((response) => {
      const data = (response as { data?: typeof response }).data ?? response
      const group = data?.group
      const settings = data?.settings
      if (data?.shareApprovalSteps?.length) setApprovalSteps(data.shareApprovalSteps)
      if (group) setForm((current) => ({
        ...current,
        name: group.groupName ?? current.name,
        currency: group.currency ?? current.currency,
        startDate: group.startDate ?? current.startDate,
        endDate: group.endDate ?? current.endDate,
        requiredLoanGuarantors: Number(settings?.requiredLoanGuarantors ?? current.requiredLoanGuarantors),
        loanMultiplier: Number(settings?.loanMultiplier ?? current.loanMultiplier),
        defaultInterestRate: Number(settings?.defaultInterestRate ?? current.defaultInterestRate),
        defaultLoanDurationMonths: Number(settings?.defaultLoanDurationMonths ?? current.defaultLoanDurationMonths),
        latePaymentFine: Number(settings?.latePaymentFine ?? current.latePaymentFine),
      }))
      setJamiiAmount(settings?.jamiiContributionPerSharePayment == null
        ? '' : String(settings.jamiiContributionPerSharePayment))
      if (settings?.minimumSharePurchaseAmount != null) setMinimumShareAmount(String(settings.minimumSharePurchaseAmount))
      if (settings?.sharePrice != null) setSharePriceAmount(String(settings.sharePrice))
    }).catch(() => toast.error('Unable to load saved group settings.'))
    fineService.types(groupId).then((types) => {
      if (types.length) setFineRules(types.map((type: FineTypeOption) => ({
        id: type.id, code: type.code || type.name, name: type.name,
        defaultAmount: String(type.defaultAmount ?? ''), description: type.description || '',
      })))
    }).catch(() => { /* Fine rules will be created when settings are saved. */ })
    apiGet<{ data: { role: string; label: string }[] }>(`/api/expenses/group/${groupId}/approval-config`, undefined, { auth: true })
      .then(response => { if (response.data?.length) setExpenseApprovalSteps(response.data) })
      .catch(() => toast.error('Unable to load expense approval workflow.'))
  }, [])

  const validateCycleDates = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      return 'Please choose the Kikoba start date and end date before continuing.'
    }

    const trimmedStart = startDate.trim()
    const trimmedEnd = endDate.trim()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedStart) || !/^\d{4}-\d{2}-\d{2}$/.test(trimmedEnd)) {
      return 'Please enter valid Kikoba dates in YYYY-MM-DD format.'
    }

    if (trimmedStart >= trimmedEnd) {
      return 'The Kikoba end date must be after the start date. Please choose a valid date range.'
    }

    return null
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) {
      return
    }

    const dateValidationError = validateCycleDates(form.startDate, form.endDate)
    if (dateValidationError) {
      toast.error(dateValidationError)
      return
    }

    const parsedJamii = Number(jamiiAmount)
    if (!/^\d+(\.\d{1,2})?$/.test(jamiiAmount) || parsedJamii <= 0) {
      toast.error('Enter a Jamii amount greater than zero, with up to two decimal places.')
      return
    }
    if (!/^\d+(\.\d{1,2})?$/.test(minimumShareAmount)) {
      toast.error('Enter a valid minimum share purchase amount, with up to two decimal places.')
      return
    }
    if (!/^\d+(\.\d{1,2})?$/.test(sharePriceAmount) || Number(sharePriceAmount) <= 0) {
      toast.error('Enter a share price greater than zero, with up to two decimal places.')
      return
    }

    if (!approvalSteps.length || new Set(approvalSteps.map(step => step.role)).size !== approvalSteps.length) {
      toast.error('Choose at least one approval step and use each role only once.')
      return
    }
    if (!expenseApprovalSteps.length || new Set(expenseApprovalSteps.map(step => step.role)).size !== expenseApprovalSteps.length) {
      toast.error('Choose at least one expense approval step and use each role only once.')
      return
    }

    const payload: GroupProfileSettingsPayload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      currency: form.currency,

      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      shareApprovalSteps: approvalSteps,
      settings: {
        minimumSharePurchaseAmount: Number(minimumShareAmount),
        sharePrice: Number(sharePriceAmount),
        requiredLoanGuarantors: Number(form.requiredLoanGuarantors),
        loanMultiplier: Number(form.loanMultiplier),
        defaultInterestRate: Number(form.defaultInterestRate),
        defaultLoanDurationMonths: Number(form.defaultLoanDurationMonths),
        latePaymentFine: Number(form.latePaymentFine),
        jamiiContributionPerSharePayment: parsedJamii,
      },
    }

    // console.log('=====>>>>>Saving group settings with payload:', payload)

    try {
      setLoading(true)
      const existingGroupId = localStorage.getItem('v360_currentGroupId') || ''
      const result = /^\d+$/.test(existingGroupId)
        ? await groupService.updateProfileAndSettings(existingGroupId, payload)
        : await groupService.saveProfileAndSettings(payload)

      const apiResponse = result as any
      const isSuccess = apiResponse?.status === true || apiResponse?.status === 'success'
      const responseData = apiResponse?.data ?? result

      if (!isSuccess) {
        toast.error(apiResponse?.message || 'Unable to save group settings.')
        return
      }

      const existingSavedGroup = JSON.parse(localStorage.getItem('v360_currentGroup') || '{}')
      const groupResp = (responseData as any)?.group ?? responseData
      const groupId = groupResp?.groupId ?? groupResp?.id ?? localStorage.getItem('v360_currentGroupId') ?? 'new-group'
      const groupName = groupResp?.groupName || groupResp?.name || form.name
      const groupCode = groupResp?.groupCode || groupResp?.code || existingSavedGroup.groupCode || ''
      const organizationId = groupResp?.organizationId ?? existingSavedGroup.organizationId ?? null
      const organizationName = groupResp?.organizationName ?? existingSavedGroup.organizationName ?? null
      const currency = groupResp?.currency || form.currency || 'TZS'
      const startDate = groupResp?.startDate ?? groupResp?.startedAt ?? (form.startDate || existingSavedGroup.startDate || '')
      const endDate = groupResp?.endDate ?? groupResp?.endsAt ?? (form.endDate || existingSavedGroup.endDate || '')

      const savedGroup = {
        ...existingSavedGroup,
        id: groupId,
        groupId: groupId,
        organizationId,
        organizationName,
        groupCode,
        name: groupName,
        groupName: groupName,
        phone: form.phone,
        email: form.email,
        currency,
        startDate,
        endDate,
      }

      // persist basic group locally first
      localStorage.setItem('v360_currentGroupId', String(groupId))
      localStorage.setItem('v360_currentGroup', JSON.stringify(savedGroup))

      if (/^\d+$/.test(String(groupId))) {
        await Promise.all([
          apiPut(`/api/expenses/group/${groupId}/approval-config`, expenseApprovalSteps, { auth: true }),
          ...removedFineTypeIds.map((id) => fineService.deleteType(String(groupId), id)),
          ...fineRules.filter(rule => rule.name.trim()).map((rule) => {
          const payload = { code: rule.code || rule.name, name: rule.name, defaultAmount: Number(rule.defaultAmount || 0), description: rule.description, active: true }
          return rule.id
            ? fineService.updateType(String(groupId), rule.id, payload)
            : fineService.createType(String(groupId), payload)
          }),
        ])
      }

      // then fetch the freshly-saved group+settings from server to ensure consistency
      try {
        const fetchResp = await (groupService as any).getWithSettings(String(groupId))
        const payload = fetchResp as any
        const isFetchSuccess = payload?.status === true || payload?.status === 'success'
        const fetchData = payload?.data ?? fetchResp
        if (isFetchSuccess && fetchData) {
          const grp = fetchData.group ?? fetchData
          const settings = fetchData.settings ?? null
          if (grp) {
            localStorage.setItem('v360_currentGroup', JSON.stringify(grp))
            localStorage.setItem('v360_currentGroupId', String(grp.groupId ?? groupId))
            if ((grp as any).currency) localStorage.setItem('v360_currentGroupCurrency', (grp as any).currency)
          }
          if (settings) {
            localStorage.setItem('v360_group_settings', JSON.stringify(settings))
            localStorage.setItem('v360_group_setup_complete', 'true')
            localStorage.setItem('v360_group_setup_done', 'true')
          }
        } else {
          // still mark setup complete if server-side call didn't return detailed payload
          localStorage.setItem('v360_group_setup_complete', 'true')
          localStorage.setItem('v360_group_setup_done', 'true')
        }
      } catch (e) {
        // best-effort: mark setup complete locally
        localStorage.setItem('v360_group_setup_complete', 'true')
        localStorage.setItem('v360_group_setup_done', 'true')
      }

      setSuccess(true)
      toast.success(apiResponse?.message || 'Group profile and settings saved successfully.')

      try {
        // Ensure setup flags persisted before navigation
        localStorage.setItem('v360_group_setup_complete', 'true')
        localStorage.setItem('v360_group_setup_done', 'true')

        // Navigate to dashboard and force a full reload so localStorage-driven state is fresh
        try {
          router.push('/app/dashboard')
        } catch (e) {
          // ignore - we'll perform a hard navigation below
        }

        // Give the router a short moment to transition, then do a full-page load to ensure fresh data
        window.setTimeout(() => {
          window.location.href = '/app/dashboard'
        }, 350)
      } catch (navErr) {
        // eslint-disable-next-line no-console
        console.error('Navigation to dashboard failed, falling back to location.href', navErr)
        window.location.href = '/app/dashboard'
      }
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Unable to save group settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
          <span>Administration</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Settings</span>
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mt-2">Group Settings</h1>
        <p className="text-xs text-neutral-400">Configure share buying, loans, jamii fund, and automated fine rules for this Kikoba.</p>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
          A Kikoba group cycle lasts about one year. Please set the start date and the end date for the current cycle before continuing.
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-xs text-emerald-800 font-bold">
          <CheckCircle2 size={16} /> Group settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">VIKOBA Group Profile</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Group Display Name</label>
              <Input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Default Currency</label>
              <NativeSelect
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50] text-neutral-600 font-semibold"
              >
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
              </NativeSelect>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Kikoba Start Date</label>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Kikoba End Date</label>
              <Input
                type="date"
                required
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Group Phone</label>
              <Input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+255 712 345 678"
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Group Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="group@vikoba.com"
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 pb-2 border-b border-neutral-100">
            <div><h3 className="font-extrabold text-neutral-800 text-sm">Fine Rules</h3><p className="mt-1 text-[10px] text-neutral-400">Set the standard amount for every fine type. Automated events, such as meeting absence, use these amounts.</p></div>
            <Button type="button" onClick={() => setFineRules([...fineRules, { code: '', name: '', defaultAmount: '', description: '' }])} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#0B6B50] px-3 py-2 text-xs font-bold text-[#0B6B50]"><Plus size={14} /> Add fine type</Button>
          </div>
          <div className="space-y-3">
            {fineRules.map((rule, index) => <div key={`${rule.id || 'new'}-${index}`} className="grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-3 md:grid-cols-[1fr_1fr_140px_auto]">
              <Input required value={rule.name} onChange={e => setFineRules(fineRules.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="Fine type, e.g. Meeting absence" className="rounded-lg border border-[#E5E7EB] bg-white p-2.5 text-xs outline-none focus:border-[#0B6B50]" />
              <Input value={rule.description} onChange={e => setFineRules(fineRules.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} placeholder="When it applies (optional)" className="rounded-lg border border-[#E5E7EB] bg-white p-2.5 text-xs outline-none focus:border-[#0B6B50]" />
              <Input required min={0} inputMode="decimal" type="text" value={rule.defaultAmount} onChange={e => { const value = e.target.value; if (/^\d*(\.\d{0,2})?$/.test(value)) setFineRules(fineRules.map((item, i) => i === index ? { ...item, defaultAmount: value } : item)) }} placeholder="Amount" className="rounded-lg border border-[#E5E7EB] bg-white p-2.5 text-xs font-bold outline-none focus:border-[#0B6B50]" />
              <Button type="button" aria-label={`Remove ${rule.name || 'fine type'}`} onClick={() => { if (rule.id) setRemovedFineTypeIds([...removedFineTypeIds, rule.id]); setFineRules(fineRules.filter((_, i) => i !== index)) }} className="justify-self-end rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></Button>
            </div>)}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div><h3 className="font-extrabold text-neutral-800">Expense approval workflow</h3><p className="text-xs text-neutral-600">New expenses wait for these reviewers in order. Existing requests keep their saved steps.</p></div>
            {expenseApprovalSteps.map((step, index) => <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2">
              <span className="w-14 text-xs font-bold text-neutral-500">Step {index + 1}</span>
              <NativeSelect aria-label={`Expense reviewer for step ${index + 1}`} value={step.role} onChange={e => setExpenseApprovalSteps(current => current.map((item, i) => i === index ? { ...item, role: e.target.value } : item))}>{approvalRoles.map(role => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</NativeSelect>
              <Input aria-label={`Expense step ${index + 1} label`} value={step.label} onChange={e => setExpenseApprovalSteps(current => current.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} className="min-w-36 flex-1" />
              <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => setExpenseApprovalSteps(current => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next })}>Up</Button>
              <Button type="button" variant="outline" size="sm" disabled={index === expenseApprovalSteps.length - 1} onClick={() => setExpenseApprovalSteps(current => { const next = [...current]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next })}>Down</Button>
              <Button type="button" variant="outline" size="sm" disabled={expenseApprovalSteps.length === 1} onClick={() => setExpenseApprovalSteps(current => current.filter((_, i) => i !== index))}><Trash2 size={14} /></Button>
            </div>)}
            <Button type="button" variant="outline" size="sm" disabled={expenseApprovalSteps.length >= 10} onClick={() => setExpenseApprovalSteps(current => [...current, { role: approvalRoles.find(role => !current.some(step => step.role === role)) || 'GROUP_ADMIN', label: 'Expense approval' }])}><Plus size={14} /> Add expense approval step</Button>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div><h3 className="font-extrabold text-neutral-800">Share purchase approval workflow</h3><p className="text-xs text-neutral-600">Reviewers act in this order. A buyer's own role is skipped, and pending requests keep the steps saved when they were submitted.</p></div>
            {approvalSteps.map((step, index) => <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 border border-neutral-200">
              <span className="text-xs font-bold text-neutral-500 w-14">Step {index + 1}</span>
              <NativeSelect aria-label={`Role for step ${index + 1}`} value={step.role} onChange={e => setApprovalSteps(approvalSteps.map((item, i) => i === index ? { ...item, role: e.target.value } : item))}>
                {approvalRoles.map(role => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}
              </NativeSelect>
              <Input aria-label={`Label for step ${index + 1}`} value={step.label} onChange={e => setApprovalSteps(approvalSteps.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} className="min-w-36 flex-1" />
              <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => setApprovalSteps(current => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next })}>Up</Button>
              <Button type="button" variant="outline" size="sm" disabled={index === approvalSteps.length - 1} onClick={() => setApprovalSteps(current => { const next = [...current]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next })}>Down</Button>
              <Button type="button" variant="outline" size="sm" disabled={approvalSteps.length === 1} onClick={() => setApprovalSteps(current => current.filter((_, i) => i !== index))}><Trash2 size={14} /></Button>
            </div>)}
            <Button type="button" variant="outline" size="sm" disabled={approvalSteps.length >= 10} onClick={() => setApprovalSteps(current => [...current, { role: approvalRoles.find(role => !current.some(step => step.role === role)) || 'GROUP_ADMIN', label: 'Approval' }])}><Plus size={14} /> Add approval step</Button>
          </div>
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Share Rules</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="minimum-share-amount" className="block text-xs font-bold text-neutral-700 mb-1.5">Minimum amount to buy shares</label>
              <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                <span className="border-r border-input px-3 text-sm font-semibold text-neutral-600">{form.currency}</span>
                <Input id="minimum-share-amount" type="text" inputMode="decimal" required value={minimumShareAmount}
                  onChange={e => { if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) setMinimumShareAmount(e.target.value) }}
                  placeholder="e.g. 25000.00" className="border-0 shadow-none focus-visible:ring-0" />
              </div>
            </div>
            <div>
              <label htmlFor="share-price" className="block text-xs font-bold text-neutral-700 mb-1.5">Share Price</label>
              <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                <span className="border-r border-input px-3 text-sm font-semibold text-neutral-600">{form.currency}</span>
                <Input id="share-price" type="text" inputMode="decimal" required value={sharePriceAmount}
                  onChange={e => { if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) setSharePriceAmount(e.target.value) }}
                  placeholder="e.g. 5000.00" className="border-0 shadow-none focus-visible:ring-0" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Loans & Penalties</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Required Loan Guarantors</label>
              <Input type="number" required min={0} value={form.requiredLoanGuarantors} onChange={e => setForm({ ...form, requiredLoanGuarantors: Number(e.target.value) })} className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50] font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Loan Multiplier</label>
              <Input
                type="number"
                required
                value={form.loanMultiplier}
                onChange={e => setForm({ ...form, loanMultiplier: Number(e.target.value) })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50] font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Default Interest Rate (%)</label>
              <Input
                type="number"
                required
                value={form.defaultInterestRate}
                onChange={e => setForm({ ...form, defaultInterestRate: Number(e.target.value) })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50] font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Default Loan Duration (Months)</label>
              <Input
                type="number"
                required
                value={form.defaultLoanDurationMonths}
                onChange={e => setForm({ ...form, defaultLoanDurationMonths: Number(e.target.value) })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-[#0B6B50] font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Late Payment Fine</label>
              <Input
                type="number"
                required
                value={form.latePaymentFine}
                onChange={e => setForm({ ...form, latePaymentFine: Number(e.target.value) })}
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-xs outline-none focus:border-red-500 font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Jamii Amount</h3>
          <div className="max-w-md">
            <label htmlFor="jamii-amount" className="block text-xs font-bold text-neutral-700 mb-1.5">Jamii contribution per share purchase</label>
            <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
              <span className="border-r border-input px-3 text-sm font-semibold text-neutral-600">{form.currency}</span>
              <Input id="jamii-amount" type="text" inputMode="decimal" required value={jamiiAmount}
                onChange={e => { if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) setJamiiAmount(e.target.value) }}
                placeholder="e.g. 2000.00" aria-describedby="jamii-help" className="border-0 shadow-none focus-visible:ring-0" />
            </div>
            <p id="jamii-help" className="mt-1 text-xs text-neutral-500">Saved to group settings. Members see this amount added automatically to each share purchase.</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#0B6B50] hover:bg-[#08503C] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save size={14} /> {loading ? 'Saving...' : 'Save Group + Settings'}
        </Button>
      </form>
    </div>
  )
}
