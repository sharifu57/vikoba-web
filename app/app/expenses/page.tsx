'use client'

import { useState } from 'react'
import { useVikobaStore, Expense } from '@/lib/mockStore'
import { Search, PlusCircle, X, Check, Eye } from 'lucide-react'

export default function ExpensesPage() {
  const { 
    expenses, 
    currentGroup, 
    recordExpense, 
    approveExpense, 
    rejectExpense 
  } = useVikobaStore()

  // States
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    category: 'Stationery' as Expense['category'],
    description: '',
    amount: 10000
  })

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter list
  const filteredExpenses = expenses.filter(e => {
    if (e.groupId !== currentGroup.id) return false
    return e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  })

  // Calculations
  const groupExpenses = expenses.filter(e => e.groupId === currentGroup.id)
  
  const totalApprovedExpenses = groupExpenses
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalPendingVal = groupExpenses
    .filter(e => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0)

  const pendingCount = groupExpenses.filter(e => e.status === 'PENDING').length

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.description && form.amount > 0) {
      recordExpense({
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        createdBy: 'Juma Majid' // Mocked current logged in user
      })
      setForm({ category: 'Stationery', description: '', amount: 10000 })
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
            <span className="text-neutral-500">Expenses</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Group Expenses</h1>
          <p className="text-xs text-neutral-400">Track group stationary, banking lines, refreshments, and communications expenses.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm self-stretch sm:self-auto"
        >
          <PlusCircle size={14} /> Record Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Settled Expenses', val: fmt(totalApprovedExpenses), color: 'text-neutral-800' },
          { title: 'Pending Approval Value', val: fmt(totalPendingVal), color: 'text-amber-600' },
          { title: 'Awaiting Signatures', val: `${pendingCount} items`, color: 'text-[#087f5b]' },
          { title: 'Active Month Cost', val: fmt(totalApprovedExpenses), color: 'text-neutral-800' } // simple mirror for demo
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{s.title}</span>
            <h3 className={`text-base md:text-lg font-black mt-2 ${s.color}`}>{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Filters search */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-4 mb-6 flex justify-between items-center">
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Search by category or desc..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#dfe8e2] rounded-lg p-2 pl-8 text-xs outline-none focus:border-[#087f5b]"
          />
          <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={13} />
        </div>
      </div>

      {/* Expenses list Table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Expense ID</th>
                <th className="p-4 font-bold">Category</th>
                <th className="p-4 font-bold">Description</th>
                <th className="p-4 font-bold text-right">Amount</th>
                <th className="p-4 font-bold">Date Issued</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredExpenses.map((e, idx) => (
                <tr key={e.id} className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-500">#{e.id.substring(4)}</td>
                  <td className="p-4 font-semibold text-neutral-700">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700 font-bold">{e.category}</span>
                  </td>
                  <td className="p-4 text-neutral-600 font-medium">{e.description}</td>
                  <td className="p-4 font-black text-neutral-800 text-right">{fmt(e.amount)}</td>
                  <td className="p-4 text-neutral-500 font-semibold">{e.date}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                      e.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      e.status === 'PENDING' ? 'bg-amber-50 text-amber-800' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {e.status === 'PENDING' ? (
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => approveExpense(e.id)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] hover:bg-[#087f5b] hover:text-white"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => rejectExpense(e.id)}
                          className="px-2 py-1 border border-neutral-200 text-neutral-500 rounded text-[10px] hover:bg-neutral-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-neutral-300">Logged by {e.createdBy}</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400">No expense records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Record Outbound Expense</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Transport">Transport / Fuel</option>
                    <option value="Meeting Expenses">refreshments & venue</option>
                    <option value="Communication">Airtime / bundles</option>
                    <option value="Bank Charges">Bank fees</option>
                    <option value="Other">Other spends</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Amount ({currentGroup.currency}) *</label>
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Description *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Printer inks and paper pack"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
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
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
