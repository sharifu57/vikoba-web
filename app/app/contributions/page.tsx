'use client'

import { useState, useRef } from 'react'
import { Coins, Plus, Search, X, Check, Landmark, AlertCircle, Upload, Download, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react'
import { useContributions } from '@/hooks/useContributions'
import { groupService, memberService, type Group, type Member as ApiMember } from '@/lib/api/services'
import { useEffect } from 'react'

interface Member {
  id: string
  name: string
  accountNumber?: string
  phone?: string
}

interface Contribution {
  id: string
  memberId: string
  memberName: string
  memberPhone?: string
  memberAccountNumber?: string
  period: string
  periodStart: string
  periodEnd: string
  contributionType: string
  expectedAmount: number
  paidAmount: number
  balance: number
  status: 'PAID' | 'PARTIAL' | 'PENDING'
  paymentMethod?: string
  paymentReference?: string
  paymentDate?: string
  remarks?: string
}

interface ContributionPeriod {
  id: string
  name: string
  displayText: string
  startDate: string
  endDate: string
  expectedAmount: number
}

export default function ContributionsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'single' | 'bulk'>('overview')
  const {
    recordContribution,
    bulkUploadContributions,
    getGroupContributions,
    getContributionSummary,
    getContributionPeriods,
    downloadExcelTemplate,
    loading: apiLoading,
    error: apiError
  } = useContributions()

  const [groupId, setGroupId] = useState('')

  // Resolve the selected group's database ID. Contribution endpoints use Long IDs,
  // while older client state may still contain a group slug such as "umoja".
  useEffect(() => {
    if (typeof window === 'undefined') return

    const resolveCurrentGroup = async () => {
      const storedGroupId = localStorage.getItem('v360_currentGroupId') || ''
      const storedGroup = localStorage.getItem('v360_currentGroup')
      let parsedGroup: Record<string, unknown> = {}

      try {
        parsedGroup = storedGroup ? JSON.parse(storedGroup) : {}
      } catch {
        parsedGroup = {}
      }

      const directId = String(parsedGroup.groupId ?? parsedGroup.id ?? storedGroupId)
      if (/^\d+$/.test(directId)) {
        setGroupId(directId)
        return
      }

      try {
        const response = await groupService.list()
        const groups = (response as { data?: Group[] })?.data ?? response
        const selectedName = String(parsedGroup.groupName ?? parsedGroup.name ?? storedGroupId).toLowerCase()
        const selectedGroup = (groups as Group[]).find(group =>
          String(group.id) === storedGroupId ||
          group.name.toLowerCase() === selectedName,
        )

        if (selectedGroup && /^\d+$/.test(String(selectedGroup.id))) {
          const resolvedId = String(selectedGroup.id)
          setGroupId(resolvedId)
          localStorage.setItem('v360_currentGroupId', resolvedId)
        } else {
          setToast({ type: 'error', message: 'Select a valid group before viewing contributions.' })
        }
      } catch {
        setToast({ type: 'error', message: 'Unable to load your selected group.' })
      }
    }

    resolveCurrentGroup()
  }, [])

  useEffect(() => {
    if (!groupId) return

    const loadData = async () => {
      try {
        const [periodData, contributionData, summaryData, memberData] = await Promise.all([
          getContributionPeriods(groupId),
          getGroupContributions(groupId),
          getContributionSummary(groupId),
          memberService.list(groupId),
        ])

        setPeriods(periodData)
        setPeriodFilter(current => current || periodData[0]?.id || '')
        setContributions(contributionData as Contribution[])
        setSummary(summaryData)

        const rawMembers = (memberData as { data?: ApiMember[] })?.data ?? memberData
        setMembers((rawMembers as ApiMember[]).map(member => ({
          id: String(member.id ?? member.memberId ?? ''),
          name: member.name || member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
          accountNumber: member.membershipNumber || member.memberNo,
          phone: member.phone,
        })))
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [groupId])

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [periods, setPeriods] = useState<ContributionPeriod[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    membersCompleted: 0,
    membersPartial: 0,
    membersPending: 0,
  })

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Search & Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [periodFilter, setPeriodFilter] = useState<string>(periods[0]?.id || '')

  // Single contribution form state
  const [singleForm, setSingleForm] = useState({
    memberId: '',
    periodId: '',
    amount: '',
    paymentMethod: 'Mobile Money',
    paymentReference: '',
    remarks: ''
  })

  // Bulk upload state
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkRemarks, setBulkRemarks] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [bulkResults, setBulkResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format currency
  const fmt = (val: number) => {
    return `TZS ${val.toLocaleString()}`
  }

  // Filter contributions based on search and filters
  const filteredContributions = contributions.filter(c => {
    const matchesSearch = c.memberName.toLowerCase().includes(search.toLowerCase()) ||
      c.memberId.includes(search)
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    const selectedPeriod = periods.find(p => p.id === periodFilter)
    const matchesPeriod = !periodFilter || !selectedPeriod || c.periodStart === selectedPeriod.startDate

    return matchesSearch && matchesStatus && matchesPeriod
  })

  // Handle single contribution submission
  const handleRecordSingle = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!singleForm.memberId || !singleForm.periodId || !singleForm.amount) {
      setToast({ type: 'error', message: 'Please fill all required fields' })
      return
    }

    setLoading(true)
    try {
      await recordContribution({
        groupMemberId: singleForm.memberId,
        contributionPeriodId: singleForm.periodId,
        paidAmount: parseFloat(singleForm.amount),
        paymentMethod: singleForm.paymentMethod,
        paymentReference: singleForm.paymentReference,
        remarks: singleForm.remarks
      })

      // Reload contributions
      const [updatedContribs, updatedSummary] = await Promise.all([
        getGroupContributions(groupId),
        getContributionSummary(groupId),
      ])
      setContributions(updatedContribs as Contribution[])
      setSummary(updatedSummary)

      setToast({ type: 'success', message: 'Contribution recorded successfully!' })

      // Reset form
      setSingleForm({
        memberId: '',
        periodId: '',
        amount: '',
        paymentMethod: 'Mobile Money',
        paymentReference: '',
        remarks: ''
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to record contribution'
      setToast({ type: 'error', message: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  // Handle bulk file upload
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bulkFile) {
      setToast({ type: 'error', message: 'Please select an Excel file' })
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      setUploadProgress(50)

      const result = await bulkUploadContributions(groupId, bulkFile, bulkRemarks)

      setUploadProgress(100)
      setBulkResults(result.data)
      setShowResults(true)
      setToast({ type: 'success', message: 'Bulk upload processed successfully!' })

      // Reload contributions
      const [updatedContribs, updatedSummary] = await Promise.all([
        getGroupContributions(groupId),
        getContributionSummary(groupId),
      ])
      setContributions(updatedContribs as Contribution[])
      setSummary(updatedSummary)

      // Reset form
      setBulkFile(null)
      setBulkRemarks('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process bulk upload'
      setToast({ type: 'error', message: errorMsg })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  // Download Excel template
  const handleDownloadTemplate = async () => {
    try {
      await downloadExcelTemplate()
      setToast({ type: 'success', message: 'Template downloaded successfully!' })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download template'
      setToast({ type: 'error', message: errorMsg })
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Toast Notifications */}
        {toast && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg text-white font-bold text-sm z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1 mb-2">
            <span>Finance</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Contributions</span>
          </div>
          <h1 className="text-3xl font-black text-neutral-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Coins size={24} className="text-emerald-600" />
            </div>
            Contributions Management
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Record and track member contributions</p>
          {!groupId && <p className="text-xs text-amber-700 mt-3">Select a valid group to load contributions.</p>}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: 'Total Expected', value: fmt(summary.totalExpected), icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
            { title: 'Total Collected', value: fmt(summary.totalCollected), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
            { title: 'Outstanding', value: fmt(summary.totalOutstanding), icon: AlertCircle, color: 'bg-red-100 text-red-600' },
            { title: 'Collection Rate', value: `${summary.collectionRate}%`, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' }
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{stat.title}</span>
                  <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-neutral-900">{stat.value}</h3>
              </div>
            )
          })}
        </div>

        {/* Member Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Completed', count: summary.membersCompleted, color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Partial', count: summary.membersPartial, color: 'bg-amber-50 text-amber-700' },
            { label: 'Pending', count: summary.membersPending, color: 'bg-red-50 text-red-700' }
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.color} rounded-xl p-6 border-2 border-current border-opacity-20`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold block">{stat.label}</span>
                  <span className="text-3xl font-black mt-2 block">{stat.count}</span>
                </div>
                <Users size={32} className="opacity-20" />
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-neutral-200 rounded-xl p-1 mb-8 flex gap-1">
          {[
            { id: 'overview', label: 'Contributions List', icon: BarChart3 },
            { id: 'single', label: 'Record Single', icon: Plus },
            { id: 'bulk', label: 'Bulk Upload', icon: Upload }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-600 hover:bg-neutral-50'
                }`}
            >
              {<tab.icon size={16} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2 uppercase tracking-wider">Search</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search by name or member ID..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2 uppercase tracking-wider">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2 uppercase tracking-wider">Period</label>
                  <select
                    value={periodFilter}
                    onChange={e => setPeriodFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    {periods.map(period => (
                      <option key={period.id} value={period.id}>{period.displayText}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contributions Table */}
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-6 py-4 text-left font-bold text-neutral-700">Member</th>
                      <th className="px-6 py-4 text-left font-bold text-neutral-700">Phone</th>
                      <th className="px-6 py-4 text-left font-bold text-neutral-700">Account</th>
                      <th className="px-6 py-4 text-left font-bold text-neutral-700">Period</th>
                      <th className="px-6 py-4 text-right font-bold text-neutral-700">Expected</th>
                      <th className="px-6 py-4 text-right font-bold text-neutral-700">Paid</th>
                      <th className="px-6 py-4 text-right font-bold text-neutral-700">Balance</th>
                      <th className="px-6 py-4 text-center font-bold text-neutral-700">Status</th>
                      <th className="px-6 py-4 text-left font-bold text-neutral-700">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredContributions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                          <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="font-semibold">No contributions found</p>
                          <p className="text-xs mt-1">Try adjusting your filters or add a new contribution</p>
                        </td>
                      </tr>
                    ) : (
                      filteredContributions.map(c => (
                        <tr key={c.id} className="hover:bg-neutral-50 transition">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-neutral-900">{c.memberName}</p>
                              <p className="text-xs text-neutral-500 mt-1">{c.memberId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-600">{c.memberPhone || '—'}</td>
                          <td className="px-6 py-4 text-neutral-600">{c.memberAccountNumber || '—'}</td>
                          <td className="px-6 py-4 text-neutral-600">
                            {c.period || (c.periodStart ? new Date(c.periodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—')}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-neutral-900">{fmt(c.expectedAmount)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-emerald-600">{fmt(c.paidAmount)}</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">{fmt(c.balance)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                              c.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-neutral-600">{c.paymentMethod || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Record Single Contribution Tab */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <Plus size={24} className="text-emerald-600" />
                  Record Single Contribution
                </h2>

                <form onSubmit={handleRecordSingle} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Member *</label>
                      <select
                        required
                        value={singleForm.memberId}
                        onChange={e => setSingleForm({ ...singleForm, memberId: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Choose a member...</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.accountNumber})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Period *</label>
                      <select
                        required
                        value={singleForm.periodId}
                        onChange={e => setSingleForm({ ...singleForm, periodId: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Choose a period...</option>
                        {periods.map(p => (
                          <option key={p.id} value={p.id}>{p.displayText}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Amount (TZS) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        value={singleForm.amount}
                        onChange={e => setSingleForm({ ...singleForm, amount: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Payment Method *</label>
                      <select
                        value={singleForm.paymentMethod}
                        onChange={e => setSingleForm({ ...singleForm, paymentMethod: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Check">Check</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Payment Reference</label>
                    <input
                      type="text"
                      value={singleForm.paymentReference}
                      onChange={e => setSingleForm({ ...singleForm, paymentReference: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      placeholder="e.g., Transaction ID, Receipt Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Remarks</label>
                    <textarea
                      value={singleForm.remarks}
                      onChange={e => setSingleForm({ ...singleForm, remarks: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                      rows={3}
                      placeholder="Add any notes or remarks..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          Record Contribution
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Help Panel */}
            <div className="lg:col-span-1">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 sticky top-6">
                <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <Landmark size={20} />
                  Tips
                </h3>
                <ul className="space-y-3 text-sm text-emerald-800">
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">1.</span>
                    <span>Select the member who made the contribution</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">2.</span>
                    <span>Choose the contribution period from the dropdown</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">3.</span>
                    <span>Enter the exact amount received</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">4.</span>
                    <span>Select how the payment was made</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">5.</span>
                    <span>Add reference number for tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Tab */}
        {activeTab === 'bulk' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <Upload size={24} className="text-emerald-600" />
                  Bulk Upload Contributions
                </h2>

                {!showResults ? (
                  <form onSubmit={handleBulkUpload} className="space-y-6">
                    {/* File Upload Area */}
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault()
                        const files = e.dataTransfer.files
                        if (files[0]) setBulkFile(files[0])
                      }}
                      className="border-2 border-dashed border-neutral-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={e => setBulkFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Upload size={24} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">
                            {bulkFile ? bulkFile.name : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Excel (.xlsx, .xls) or CSV file • Max 10MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Upload Remarks</label>
                      <textarea
                        value={bulkRemarks}
                        onChange={e => setBulkRemarks(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                        rows={3}
                        placeholder="Add notes about this batch (optional)..."
                      />
                    </div>

                    {/* Progress Bar */}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-neutral-600">Uploading...</span>
                          <span className="text-xs font-bold text-neutral-600">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="flex-1 border-2 border-neutral-300 hover:border-neutral-400 text-neutral-600 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        Download Template
                      </button>

                      <button
                        type="submit"
                        disabled={!bulkFile || loading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload size={18} />
                            Upload & Process
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Results Display */
                  <div className="space-y-6">
                    <div className={`p-6 rounded-lg border-2 ${bulkResults.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-300' :
                      bulkResults.status === 'PARTIAL' ? 'bg-amber-50 border-amber-300' :
                        'bg-red-50 border-red-300'
                      }`}>
                      <h3 className="font-bold mb-2">Upload Summary</h3>
                      <p className="text-sm mb-4">{bulkResults.summary}</p>

                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="font-bold">{bulkResults.totalRows}</p>
                          <p className="text-xs text-neutral-600">Total Rows</p>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-600">{bulkResults.successCount}</p>
                          <p className="text-xs text-neutral-600">Successful</p>
                        </div>
                        <div>
                          <p className="font-bold text-red-600">{bulkResults.failureCount}</p>
                          <p className="text-xs text-neutral-600">Failed</p>
                        </div>
                      </div>
                    </div>

                    {/* Failed Rows */}
                    {bulkResults.failedRows.length > 0 && (
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-3">Failed Rows</h3>
                        <div className="space-y-2">
                          {bulkResults.failedRows.map((row: any, idx: number) => (
                            <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="font-bold text-red-700">Row {row.rowNumber}: {row.memberIdentifier}</p>
                              <p className="text-sm text-red-600 mt-1">{row.errorMessage}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowResults(false)
                          setBulkFile(null)
                          setBulkRemarks('')
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition"
                      >
                        Upload Another Batch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 sticky top-6">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Excel Format
                </h3>
                <p className="text-sm text-blue-800 mb-4">Your Excel file should have these columns:</p>
                <div className="space-y-2 text-sm text-blue-800 font-mono bg-white p-3 rounded">
                  <p>Column A: Member ID</p>
                  <p>Column B: Period (YYYY-MM)</p>
                  <p>Column C: Amount</p>
                  <p>Column D: Payment Method</p>
                  <p>Column E: Reference</p>
                  <p>Column F: Remarks</p>
                </div>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h3 className="font-bold text-emerald-900 mb-4">Example Row</h3>
                <div className="text-xs text-emerald-800 space-y-2 font-mono bg-white p-3 rounded">
                  <p>MEM001 | 2024-01 | 50000</p>
                  <p>Mobile Money | TXN123 | January</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
