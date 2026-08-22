'use client'

import { useState } from 'react'
import { useVikobaStore } from '@/lib/mockStore'
import { Coins, Plus, Search, X, Check, Landmark, AlertCircle } from 'lucide-react'

export default function ContributionsPage() {
  const { 
    contributions, 
    members, 
    currentGroup, 
    recordPayment 
  } = useVikobaStore()

  // Search & Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Payment Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    memberId: '',
    amount: 50000,
    method: 'Mobile Money' as const,
    type: 'Contribution' as const
  })

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter contributions
  const filteredContributions = contributions.filter(c => {
    if (c.groupId !== currentGroup.id) return false
    
    const memberName = members.find(m => m.id === c.memberId)?.name || ''
    const matchesSearch = memberName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Aggregates
  const totalExpected = contributions
    .filter(c => c.groupId === currentGroup.id)
    .reduce((sum, c) => sum + c.expected, 0)
    
  const totalCollected = contributions
    .filter(c => c.groupId === currentGroup.id)
    .reduce((sum, c) => sum + c.paid, 0)
    
  const totalOutstanding = contributions
    .filter(c => c.groupId === currentGroup.id)
    .reduce((sum, c) => sum + c.balance, 0)

  const collectionRate = totalExpected > 0 
    ? Math.round((totalCollected / totalExpected) * 100) 
    : 100

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentForm.memberId && paymentForm.amount > 0) {
      recordPayment({
        memberId: paymentForm.memberId,
        amount: Number(paymentForm.amount),
        type: paymentForm.type,
        method: paymentForm.method
      })
      // Reset & close
      setPaymentForm({
        memberId: '',
        amount: 50000,
        method: 'Mobile Money',
        type: 'Contribution'
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
            <span>Finance</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Contributions</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Contributions (Michango)</h1>
          <p className="text-xs text-neutral-400">Track and manage weekly, monthly, and emergency contributions.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm self-stretch sm:self-auto"
        >
          <Plus size={14} /> Record Payment
        </button>
      </div>

      {/* Aggregates Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Expected This Period', val: fmt(totalExpected), color: 'text-neutral-800' },
          { title: 'Collected Amount', val: fmt(totalCollected), color: 'text-emerald-600' },
          { title: 'Total Outstanding', val: fmt(totalOutstanding), color: 'text-red-500' },
          { title: 'Collection Rate', val: `${collectionRate}%`, color: 'text-[#087f5b]', sub: 'Target: 100%' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{s.title}</span>
            <h3 className={`text-lg md:text-xl font-black mt-2 ${s.color}`}>{s.val}</h3>
            {s.sub && <span className="text-[9px] text-neutral-400 mt-1 block font-semibold">{s.sub}</span>}
          </div>
        ))}
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Search by member name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#dfe8e2] rounded-lg p-2.5 pl-9 text-xs outline-none focus:border-[#087f5b] bg-[#fcfdfc]"
          />
          <Search className="absolute left-3 top-3 text-neutral-400" size={14} />
        </div>

        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto border border-[#dfe8e2] rounded-lg p-2 text-xs bg-[#fcfdfc] outline-none text-neutral-600 font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PARTIALLY PAID">PARTIALLY PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
      </div>

      {/* Contributions table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Member</th>
                <th className="p-4 font-bold text-right">Expected Amount</th>
                <th className="p-4 font-bold text-right">Paid Amount</th>
                <th className="p-4 font-bold text-right">Balance Due</th>
                <th className="p-4 font-bold">Last Payment Date</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredContributions.map(c => {
                const member = members.find(m => m.id === c.memberId)
                return (
                  <tr key={c.id} className="hover:bg-neutral-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                          {member?.name.split(' ').map(n => n[0]).join('') || 'M'}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-800 block text-xs">{member?.name}</span>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">{member?.memberNo}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-neutral-800 text-right">{fmt(c.expected)}</td>
                    <td className="p-4 font-bold text-neutral-800 text-right">{fmt(c.paid)}</td>
                    <td className="p-4 font-black text-red-500 text-right">{fmt(c.balance)}</td>
                    <td className="p-4 text-neutral-500 font-semibold">{c.lastPaymentDate || '—'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        c.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        c.status === 'PARTIALLY PAID' ? 'bg-amber-50 text-amber-800' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {c.status !== 'PAID' ? (
                        <button 
                          onClick={() => {
                            setPaymentForm({ ...paymentForm, memberId: c.memberId, amount: c.balance })
                            setModalOpen(true)
                          }}
                          className="px-2.5 py-1 bg-[#087f5b]/10 text-[#087f5b] rounded text-[10px] font-bold hover:bg-[#087f5b] hover:text-white transition"
                        >
                          Record Pay
                        </button>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredContributions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-400">
                    No contributions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Record Payment / Deposit</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Select Member *</label>
                <select
                  required
                  value={paymentForm.memberId}
                  onChange={e => setPaymentForm({ ...paymentForm, memberId: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                >
                  <option value="">Choose a member...</option>
                  {members.filter(m => m.groupId === currentGroup.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Payment Type *</label>
                  <select
                    value={paymentForm.type}
                    onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value as any })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                  >
                    <option value="Contribution">Weekly Contribution</option>
                    <option value="Share Purchase">Share Purchase (Hisa)</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                    <option value="Fine Payment">Fine Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Amount ({currentGroup.currency}) *</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Payment Method *</label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                >
                  <option value="Mobile Money">Mobile Money (M-Pesa/Tigo/Airtel)</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank">Bank Deposit/Transfer</option>
                </select>
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
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
