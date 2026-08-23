'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, CheckCircle2 } from 'lucide-react'
import { groupService, type GroupProfileSettingsPayload } from '@/lib/api/services'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  currency: 'TZS',
  startDate: '',
  endDate: '',
  minimumContribution: 25000,
  maximumContribution: 500000,
  sharePrice: 5000,
  maximumSharesPerMember: 20,
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

    const payload: GroupProfileSettingsPayload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      currency: form.currency,
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      settings: {
        minimumContribution: Number(form.minimumContribution),
        maximumContribution: Number(form.maximumContribution),
        sharePrice: Number(form.sharePrice),
        maximumSharesPerMember: Number(form.maximumSharesPerMember),
        loanMultiplier: Number(form.loanMultiplier),
        defaultInterestRate: Number(form.defaultInterestRate),
        defaultLoanDurationMonths: Number(form.defaultLoanDurationMonths),
        latePaymentFine: Number(form.latePaymentFine),
      },
    }

    // console.log('=====>>>>>Saving group settings with payload:', payload)

    try {
      setLoading(true)
      const result = await groupService.saveProfileAndSettings(payload)

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
        <p className="text-xs text-neutral-400">Configure the cooperative rules, contribution bands, share values, and default finance settings.</p>
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
        <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">VIKOBA Group Profile</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Group Display Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Default Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
              >
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Kikoba Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Kikoba End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Group Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+255 712 345 678"
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Group Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="group@vikoba.com"
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Contribution & Share Rules</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Minimum Contribution</label>
              <input
                type="number"
                required
                value={form.minimumContribution}
                onChange={e => setForm({ ...form, minimumContribution: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Maximum Contribution</label>
              <input
                type="number"
                required
                value={form.maximumContribution}
                onChange={e => setForm({ ...form, maximumContribution: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Share Price</label>
              <input
                type="number"
                required
                value={form.sharePrice}
                onChange={e => setForm({ ...form, sharePrice: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Max Shares Per Member</label>
              <input
                type="number"
                required
                min={1}
                value={form.maximumSharesPerMember}
                onChange={e => setForm({ ...form, maximumSharesPerMember: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Loans & Penalties</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Loan Multiplier</label>
              <input
                type="number"
                required
                value={form.loanMultiplier}
                onChange={e => setForm({ ...form, loanMultiplier: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Default Interest Rate (%)</label>
              <input
                type="number"
                required
                value={form.defaultInterestRate}
                onChange={e => setForm({ ...form, defaultInterestRate: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Default Loan Duration (Months)</label>
              <input
                type="number"
                required
                value={form.defaultLoanDurationMonths}
                onChange={e => setForm({ ...form, defaultLoanDurationMonths: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Late Payment Fine</label>
              <input
                type="number"
                required
                value={form.latePaymentFine}
                onChange={e => setForm({ ...form, latePaymentFine: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-red-500 font-semibold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save size={14} /> {loading ? 'Saving...' : 'Save Group + Settings'}
        </button>
      </form>
    </div>
  )
}
