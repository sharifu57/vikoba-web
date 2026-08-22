'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useVikobaStore } from '@/lib/mockStore'
import { PlusCircle, Search, Landmark, Coins, HeartHandshake, Eye, BookOpen, X } from 'lucide-react'

export default function LoansDashboard() {
  const { 
    loans, 
    members, 
    currentGroup, 
    applyLoan 
  } = useVikobaStore()

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [loanForm, setForm] = useState({
    memberId: '',
    loanProduct: 'Standard Dev Loan',
    amount: 1000000,
    purpose: '',
    guarantor1: '',
    guarantor2: ''
  })

  // Search State
  const [search, setSearch] = useState('')

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter disbursed active loans
  const activeLoans = loans.filter(l => {
    if (l.groupId !== currentGroup.id) return false
    if (l.status !== 'DISBURSED') return false
    
    const memberName = members.find(m => m.id === l.memberId)?.name || ''
    return memberName.toLowerCase().includes(search.toLowerCase())
  })

  // Calculations
  const totalPortfolio = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0)
  const totalPrincipal = activeLoans.reduce((sum, l) => sum + l.principal, 0)
  const interestIncome = activeLoans.reduce((sum, l) => sum + l.interest, 0)
  const totalDisbursedCount = activeLoans.length

  const pendingAppsCount = loans.filter(l => l.groupId === currentGroup.id && l.status === 'PENDING').length

  const handleApplyLoan = (e: React.FormEvent) => {
    e.preventDefault()
    if (loanForm.memberId && loanForm.amount > 0) {
      const guarantors: string[] = []
      if (loanForm.guarantor1) {
        const name1 = members.find(m => m.id === loanForm.guarantor1)?.name
        if (name1) guarantors.push(name1)
      }
      if (loanForm.guarantor2) {
        const name2 = members.find(m => m.id === loanForm.guarantor2)?.name
        if (name2) guarantors.push(name2)
      }

      applyLoan({
        memberId: loanForm.memberId,
        loanProduct: loanForm.loanProduct,
        amount: Number(loanForm.amount),
        purpose: loanForm.purpose || 'Personal investment',
        guarantors
      })

      // Reset & close
      setForm({
        memberId: '',
        loanProduct: 'Standard Dev Loan',
        amount: 1000000,
        purpose: '',
        guarantor1: '',
        guarantor2: ''
      })
      setModalOpen(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Loans</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Dashboard</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Loans Portfolio</h1>
          <p className="text-xs text-neutral-400">Review disbursed credit loans, principal collections, and defaults.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link 
            href="/app/loans/applications"
            className="flex-1 sm:flex-none px-4 py-2.5 border border-[#dfe8e2] hover:bg-neutral-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <BookOpen size={14} /> Review Applications ({pendingAppsCount})
          </Link>
          <button 
            onClick={() => setModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <PlusCircle size={14} /> Apply for Loan
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Active Loan Portfolio', val: fmt(totalPortfolio), icon: Landmark, color: 'text-red-600' },
          { title: 'Total Principal Disbursed', val: fmt(totalPrincipal), icon: Coins, color: 'text-neutral-800' },
          { title: 'Accrued Interest Income', val: fmt(interestIncome), icon: HeartHandshake, color: 'text-[#087f5b]' },
          { title: 'Active Credit Lines', val: `${totalDisbursedCount} Loans`, icon: Landmark, color: 'text-neutral-800' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>{s.title}</span>
              <s.icon size={15} />
            </div>
            <h3 className={`text-lg md:text-xl font-black ${s.color}`}>{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Applications notification alert */}
      {pendingAppsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between text-xs text-amber-800">
          <span className="font-semibold">⚠️ Attention: You have {pendingAppsCount} loan applications awaiting review.</span>
          <Link href="/app/loans/applications" className="font-black hover:underline flex items-center gap-0.5 shrink-0 pl-4">
            Open Application Queue <ArrowRight size={13} className="inline" />
          </Link>
        </div>
      )}

      {/* Active Loans list */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h3 className="font-extrabold text-neutral-800 text-sm">Disbursed Active Loans</h3>
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dfe8e2] rounded-lg p-2 pl-8 text-xs outline-none focus:border-[#087f5b]"
            />
            <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={13} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Borrower Info</th>
                <th className="p-4 font-bold">Loan Product</th>
                <th className="p-4 font-bold text-right">Principal</th>
                <th className="p-4 font-bold text-right">Interest (Rate)</th>
                <th className="p-4 font-bold text-right">Total Paid</th>
                <th className="p-4 font-bold text-right">Remaining Balance</th>
                <th className="p-4 font-bold text-center">Progress</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {activeLoans.map(l => {
                const member = members.find(m => m.id === l.memberId)
                return (
                  <tr key={l.id} className="hover:bg-neutral-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                          {member?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-800 block text-xs">{member?.name}</span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">{member?.memberNo}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-neutral-800 block">{l.loanProduct}</span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">Due: {l.nextPaymentDate}</span>
                    </td>
                    <td className="p-4 font-bold text-neutral-800 text-right">{fmt(l.principal)}</td>
                    <td className="p-4 font-bold text-neutral-500 text-right">{fmt(l.interest)} ({l.interestRate}%)</td>
                    <td className="p-4 font-bold text-emerald-600 text-right">{fmt(l.totalPaid)}</td>
                    <td className="p-4 font-black text-red-500 text-right">{fmt(l.remainingBalance)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#087f5b] h-full rounded-full" style={{ width: `${l.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">{l.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Link href={`/app/loans/${l.id}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#dfe8e2] hover:border-[#087f5b] hover:text-[#087f5b] rounded-lg transition text-[10px] font-bold">
                        <Eye size={12} /> Schedule
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {activeLoans.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-neutral-400">
                    No active disbursed loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Loan Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">New Loan Application</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyLoan} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Borrower Member *</label>
                <select
                  required
                  value={loanForm.memberId}
                  onChange={e => setForm({ ...loanForm, memberId: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                >
                  <option value="">Select applicant member...</option>
                  {members.filter(m => m.groupId === currentGroup.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Loan Product *</label>
                  <select
                    value={loanForm.loanProduct}
                    onChange={e => setForm({ ...loanForm, loanProduct: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                  >
                    <option value="Standard Dev Loan">Standard Dev (10% Int)</option>
                    <option value="Emergency Loan">Emergency Fund (5% Int)</option>
                    <option value="Education Loan">Education Fund (10% Int)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Requested Amount *</label>
                  <input 
                    type="number"
                    required
                    min={10000}
                    value={loanForm.amount}
                    onChange={e => setForm({ ...loanForm, amount: Number(e.target.value) })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Loan Purpose / Remarks *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Constructing poultry coop"
                  value={loanForm.purpose}
                  onChange={e => setForm({ ...loanForm, purpose: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Guarantor Member 1 *</label>
                  <select
                    required
                    value={loanForm.guarantor1}
                    onChange={e => setForm({ ...loanForm, guarantor1: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                  >
                    <option value="">Select guarantor 1...</option>
                    {members.filter(m => m.groupId === currentGroup.id && m.id !== loanForm.memberId).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Guarantor Member 2</label>
                  <select
                    value={loanForm.guarantor2}
                    onChange={e => setForm({ ...loanForm, guarantor2: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                  >
                    <option value="">Select guarantor 2...</option>
                    {members.filter(m => m.groupId === currentGroup.id && m.id !== loanForm.memberId && m.id !== loanForm.guarantor1).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#dfe8e2] rounded-lg text-xs font-bold text-neutral-500 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
