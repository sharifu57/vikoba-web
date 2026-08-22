'use client'

import { useState } from 'react'
import { useVikobaStore, JamiiRequest } from '@/lib/mockStore'
import { PlusCircle, Search, X, Check, Eye, HelpCircle } from 'lucide-react'

export default function JamiiFundPage() {
  const { 
    jamiiRequests, 
    members, 
    currentGroup, 
    requestJamiiSupport, 
    approveJamiiSupport, 
    rejectJamiiSupport,
    payJamiiSupport
  } = useVikobaStore()

  // State
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [approveModal, setApproveModal] = useState<{ id: string; amount: number } | null>(null)
  const [form, setForm] = useState({
    memberId: '',
    type: 'Hospital' as JamiiRequest['type'],
    amount: 150000
  })

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter requests
  const filteredRequests = jamiiRequests.filter(r => {
    if (r.groupId !== currentGroup.id) return false
    const memberName = members.find(m => m.id === r.memberId)?.name || ''
    return memberName.toLowerCase().includes(search.toLowerCase())
  })

  // Calculations
  const groupRequests = jamiiRequests.filter(r => r.groupId === currentGroup.id)
  const totalReserves = currentGroup.jamiiFund
  const totalPaidSupport = groupRequests
    .filter(r => r.status === 'PAID')
    .reduce((sum, r) => sum + r.approvedAmount, 0)
    
  const totalApprovedUnpaid = groupRequests
    .filter(r => r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.approvedAmount, 0)

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.memberId && form.amount > 0) {
      requestJamiiSupport({
        memberId: form.memberId,
        type: form.type,
        requestedAmount: Number(form.amount)
      })
      setForm({ memberId: '', type: 'Hospital', amount: 150000 })
      setModalOpen(false)
    }
  }

  const handleApproveAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (approveModal && approveModal.amount > 0) {
      approveJamiiSupport(approveModal.id, approveModal.amount)
      setApproveModal(null)
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
            <span className="text-neutral-500">Jamii Fund</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Jamii Social Fund</h1>
          <p className="text-xs text-neutral-400">Manage social/welfare emergency cash support reserves and claims.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm self-stretch sm:self-auto"
        >
          <PlusCircle size={14} /> Request Support
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Jamii Reserves', val: fmt(totalReserves), color: 'text-neutral-800' },
          { title: 'Approved Unpaid Claims', val: fmt(totalApprovedUnpaid), color: 'text-amber-600' },
          { title: 'Paid Support Given', val: fmt(totalPaidSupport), color: 'text-[#087f5b]' },
          { title: 'Available Liquidity', val: fmt(totalReserves - totalApprovedUnpaid), color: 'text-neutral-800' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{s.title}</span>
            <h3 className={`text-lg md:text-xl font-black mt-2 ${s.color}`}>{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Support categories display */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Hospital Bills', icon: '🏥' },
          { label: 'Funeral support', icon: '⚰️' },
          { label: 'Wedding congrats', icon: '💍' },
          { label: 'Accident support', icon: '🚗' },
          { label: 'Emergency assist', icon: '🚨' },
          { label: 'Education grants', icon: '🎓' }
        ].map((c, i) => (
          <div key={i} className="bg-[#fcfdfc] border border-neutral-100 rounded-xl p-3 text-center flex flex-col items-center gap-1">
            <span className="text-xl">{c.icon}</span>
            <span className="text-[10px] text-neutral-600 font-semibold">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Requests table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="font-extrabold text-neutral-800 text-sm">Welfare Claims History</h3>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Applicant</th>
                <th className="p-4 font-bold">Incident Type</th>
                <th className="p-4 font-bold text-right">Requested</th>
                <th className="p-4 font-bold text-right">Approved Amt</th>
                <th className="p-4 font-bold">Request Date</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredRequests.map(r => {
                const member = members.find(m => m.id === r.memberId)
                return (
                  <tr key={r.id} className="hover:bg-neutral-50/50">
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
                    <td className="p-4 font-semibold text-neutral-700">{r.type}</td>
                    <td className="p-4 font-bold text-neutral-800 text-right">{fmt(r.requestedAmount)}</td>
                    <td className="p-4 font-bold text-neutral-800 text-right">
                      {r.status === 'PENDING' || r.status === 'REJECTED' ? '—' : fmt(r.approvedAmount)}
                    </td>
                    <td className="p-4 text-neutral-500 font-semibold">{r.date}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        r.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'APPROVED' ? 'bg-blue-50 text-blue-700' :
                        r.status === 'PENDING' ? 'bg-amber-50 text-amber-800' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {r.status === 'PENDING' && (
                        <div className="flex gap-1 justify-center">
                          <button 
                            onClick={() => setApproveModal({ id: r.id, amount: r.requestedAmount })}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] hover:bg-[#087f5b] hover:text-white"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => rejectJamiiSupport(r.id)}
                            className="px-2 py-1 border border-neutral-200 text-neutral-500 rounded text-[10px] hover:bg-neutral-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'APPROVED' && (
                        <button 
                          onClick={() => payJamiiSupport(r.id)}
                          className="px-2 py-1 bg-[#087f5b] text-white font-bold rounded text-[10px]"
                        >
                          Disburse Cash
                        </button>
                      )}
                      {r.status === 'PAID' && <span className="text-neutral-300">Settled</span>}
                      {r.status === 'REJECTED' && <span className="text-neutral-300">Declined</span>}
                    </td>
                  </tr>
                )
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400">No support requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request support modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Request Jamii Fund Support</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequest} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Borrowing / Supported Member *</label>
                <select
                  required
                  value={form.memberId}
                  onChange={e => setForm({ ...form, memberId: e.target.value })}
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
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Incident Type *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                  >
                    <option value="Hospital">Hospital Stay</option>
                    <option value="Death">Funeral assistance</option>
                    <option value="Wedding">Wedding contribution</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Accident">Accident</option>
                    <option value="Education">Education assistance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Requested Amount *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
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
                  className="px-4 py-2 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold"
                >
                  Log Claim Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve claim amount input modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-sm w-full flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-neutral-800 text-sm">Approve Social Fund Amount</h3>
              <p className="text-[10px] text-neutral-400 mt-1">Specify how much the group will grant for this claim request.</p>
            </div>
            <form onSubmit={handleApproveAction} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Approved Amount ({currentGroup.currency}) *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={approveModal.amount}
                  onChange={e => setApproveModal({ ...approveModal, amount: Number(e.target.value) })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 text-xs font-bold pt-2 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => setApproveModal(null)}
                  className="px-3 py-2 border border-[#dfe8e2] text-neutral-400 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#087f5b] text-white rounded-lg"
                >
                  Approve Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
