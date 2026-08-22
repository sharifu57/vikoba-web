'use client'

import { useState } from 'react'
import { useVikobaStore } from '@/lib/mockStore'
import { Search, CreditCard, Landmark, CheckCircle, FileSpreadsheet } from 'lucide-react'

export default function PaymentsPage() {
  const { payments, members, currentGroup } = useVikobaStore()
  
  // Search states
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (p.groupId !== currentGroup.id) return false
    
    const memberName = members.find(m => m.id === p.memberId)?.name || ''
    const matchesSearch = memberName.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase())
    
    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter

    return matchesSearch && matchesMethod && matchesType
  })

  // Calculations
  const groupPayments = payments.filter(p => p.groupId === currentGroup.id)
  
  const todayTotal = groupPayments
    .filter(p => p.date === new Date().toISOString().split('T')[0] && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
    
  const monthTotal = groupPayments
    .filter(p => p.status === 'COMPLETED') // crude proxy for active month
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingTotal = groupPayments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Finance</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Payments</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Payments Received</h1>
          <p className="text-xs text-neutral-400">Ledger history of all group cash deposits, mobile money M-Pesa, and bank lines.</p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Today's Collection", val: fmt(todayTotal), color: 'text-emerald-600' },
          { title: 'This Month Total', val: fmt(monthTotal), color: 'text-neutral-800' },
          { title: 'Pending Settlement', val: fmt(pendingTotal), color: 'text-amber-600' },
          { title: 'Completed Ledgers', val: `${groupPayments.filter(p => p.status === 'COMPLETED').length} logs`, color: 'text-[#087f5b]' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{s.title}</span>
            <h3 className={`text-base md:text-lg font-black mt-2 ${s.color}`}>{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Filters search */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Search by reference or borrower..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#dfe8e2] rounded-lg p-2.5 pl-9 text-xs outline-none focus:border-[#087f5b]"
          />
          <Search className="absolute left-3 top-3 text-neutral-400" size={14} />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={methodFilter} 
            onChange={e => setMethodFilter(e.target.value)}
            className="border border-[#dfe8e2] rounded-lg p-2 text-xs bg-[#fcfdfc] outline-none text-neutral-600 font-semibold"
          >
            <option value="ALL">All Methods</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Deposit</option>
          </select>
          
          <select 
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-[#dfe8e2] rounded-lg p-2 text-xs bg-[#fcfdfc] outline-none text-neutral-600 font-semibold"
          >
            <option value="ALL">All Types</option>
            <option value="Contribution">Contribution</option>
            <option value="Loan Repayment">Loan Repayment</option>
            <option value="Share Purchase">Share Purchase</option>
            <option value="Fine Payment">Fine Payment</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Reference</th>
                <th className="p-4 font-bold">Member</th>
                <th className="p-4 font-bold text-right">Amount</th>
                <th className="p-4 font-bold">Allocation Type</th>
                <th className="p-4 font-bold">Method</th>
                <th className="p-4 font-bold">Date Logged</th>
                <th className="p-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredPayments.map((p, idx) => {
                const member = members.find(m => m.id === p.memberId)
                return (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="p-4 font-bold text-[#087f5b]">{p.reference}</td>
                    <td className="p-4">
                      <span className="font-bold text-neutral-800 block">{member?.name}</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">{member?.memberNo}</span>
                    </td>
                    <td className="p-4 font-black text-neutral-800 text-right">{fmt(p.amount)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                        p.type === 'Contribution' ? 'bg-emerald-50 text-emerald-700' :
                        p.type === 'Loan Repayment' ? 'bg-blue-50 text-blue-700' :
                        p.type === 'Share Purchase' ? 'bg-amber-50 text-amber-800' :
                        'bg-neutral-50 text-neutral-600'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-500 font-semibold">{p.method}</td>
                    <td className="p-4 text-neutral-500 font-semibold">{p.date}</td>
                    <td className="p-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-extrabold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400">No payment logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
