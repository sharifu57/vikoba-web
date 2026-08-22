'use client'

import { useState } from 'react'
import { useVikobaStore, Fine } from '@/lib/mockStore'
import { PlusCircle, Search, X, Check, Eye } from 'lucide-react'

export default function FinesPage() {
  const {
    fines,
    members,
    currentGroup,
    issueFine,
    waiveFine,
    payFine
  } = useVikobaStore()

  // Search state
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [fineForm, setForm] = useState({
    memberId: '',
    fineType: 'Late Meeting' as Fine['fineType'],
    amount: 5000
  })

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter fines table
  const filteredFines = fines.filter(f => {
    if (f.groupId !== currentGroup.id) return false
    const memberName = members.find(m => m.id === f.memberId)?.name || ''
    return memberName.toLowerCase().includes(search.toLowerCase())
  })

  // Calculations
  const groupFines = fines.filter(f => f.groupId === currentGroup.id)
  const totalFinesCount = groupFines.length

  const paidFines = groupFines
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + f.amount, 0)

  const outstandingFines = groupFines
    .filter(f => f.status === 'UNPAID')
    .reduce((sum, f) => sum + (f.outstanding ?? 0), 0)

  const waivedFines = groupFines
    .filter(f => f.status === 'WAIVED')
    .reduce((sum, f) => sum + f.amount, 0) // assumes full waiver

  const handleIssueFine = (e: React.FormEvent) => {
    e.preventDefault()
    if (fineForm.memberId && fineForm.amount > 0) {
      issueFine({
        memberId: fineForm.memberId,
        fineType: fineForm.fineType,
        amount: Number(fineForm.amount)
      })
      // Reset & close
      setForm({ memberId: '', fineType: 'Late Meeting', amount: 5000 })
      setModalOpen(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Community</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Fines</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Penalties & Fines</h1>
          <p className="text-xs text-neutral-400">Issue attendance, meeting arrival, or late payment fines.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm self-stretch sm:self-auto"
        >
          <PlusCircle size={14} /> Issue Fine
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Fines Logged', val: `${totalFinesCount} incidents`, color: 'text-neutral-800' },
          { title: 'Paid Fines', val: fmt(paidFines), color: 'text-emerald-600' },
          { title: 'Outstanding Arrears', val: fmt(outstandingFines), color: 'text-red-500' },
          { title: 'Waived Fines Total', val: fmt(waivedFines), color: 'text-neutral-400' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{s.title}</span>
            <h3 className={`text-lg md:text-xl font-black mt-2 ${s.color}`}>{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Filters search */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-4 mb-6 flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search by member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#dfe8e2] rounded-lg p-2 pl-8 text-xs outline-none focus:border-[#087f5b]"
          />
          <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={13} />
        </div>
      </div>

      {/* Fines list table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Member</th>
                <th className="p-4 font-bold">Fine Type</th>
                <th className="p-4 font-bold text-right">Amount</th>
                <th className="p-4 font-bold text-right">Outstanding</th>
                <th className="p-4 font-bold">Date Issued</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredFines.map(f => {
                const member = members.find(m => m.id === f.memberId)
                return (
                  <tr key={f.id} className="hover:bg-neutral-50/50">
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
                    <td className="p-4 font-semibold text-neutral-700">{f.fineType}</td>
                    <td className="p-4 font-bold text-neutral-800 text-right">{fmt(f.amount)}</td>
                    <td className="p-4 font-black text-red-500 text-right">{fmt(f.outstanding ?? 0)}</td>
                    <td className="p-4 text-neutral-500 font-semibold">{f.date}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${f.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                          f.status === 'UNPAID' ? 'bg-red-50 text-red-600' :
                            'bg-neutral-100 text-neutral-400'
                        }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {f.status === 'UNPAID' ? (
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => payFine(f.id)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-[#087f5b] hover:text-white rounded text-[10px] font-bold transition"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => waiveFine(f.id)}
                            className="px-2 py-1 border border-neutral-200 hover:bg-neutral-50 rounded text-[10px] font-bold transition"
                          >
                            Waive
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredFines.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400">No logs generated.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Fine Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Issue Fine / Penalty</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueFine} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Select Member *</label>
                <select
                  required
                  value={fineForm.memberId}
                  onChange={e => setForm({ ...fineForm, memberId: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                >
                  <option value="">Select member...</option>
                  {members.filter(m => m.groupId === currentGroup.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Fine Type *</label>
                  <select
                    value={fineForm.fineType}
                    onChange={e => setForm({ ...fineForm, fineType: e.target.value as any })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                  >
                    <option value="Late Meeting">Late Meeting</option>
                    <option value="Absence">Meeting Absence</option>
                    <option value="Late Contribution">Late Contribution</option>
                    <option value="Late Loan Payment">Late Loan Payment</option>
                    <option value="Other">Other Penalty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Amount ({currentGroup.currency}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={fineForm.amount}
                    onChange={e => setForm({ ...fineForm, amount: Number(e.target.value) })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
                  />
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Penalty Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
