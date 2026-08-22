'use client'

import { useState } from 'react'
import { useVikobaStore } from '@/lib/mockStore'
import { Settings, Save, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function GroupSettingsPage() {
  const { currentGroup, addAuditLog } = useVikobaStore()
  
  // State
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: currentGroup.name,
    currency: currentGroup.currency,
    weeklyContribution: 50000,
    sharePrice: 5000,
    lateFine: 5000,
    absentFine: 15000,
    emergencyLimit: 300000
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(true)
    
    // update state simulation
    currentGroup.name = form.name
    currentGroup.currency = form.currency
    
    addAuditLog('Update Group Settings', 'Administration', 'SET-0001', 'Group rules and transaction default rates updated')

    setTimeout(() => {
      setSuccess(false)
    }, 2500)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
          <span>Administration</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Settings</span>
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mt-2">Group Settings</h1>
        <p className="text-xs text-neutral-400">Configure default constitution bylaws, contribution rates, and fine prices.</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-xs text-emerald-800 font-bold">
          <CheckCircle2 size={16} /> Changes saved successfully!
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Group Profile Settings */}
        <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">VIKOBA Group Profile</h3>
          
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Financial configuration rules */}
        <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Financial Rules & Bylaws</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Expected Weekly Contribution</label>
              <input 
                type="number"
                required
                value={form.weeklyContribution}
                onChange={e => setForm({ ...form, weeklyContribution: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Fixed Share Unit Price</label>
              <input 
                type="number"
                required
                value={form.sharePrice}
                onChange={e => setForm({ ...form, sharePrice: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-neutral-50 pt-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Meeting Late Fine</label>
              <input 
                type="number"
                required
                value={form.lateFine}
                onChange={e => setForm({ ...form, lateFine: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-red-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Meeting Absence Fine</label>
              <input 
                type="number"
                required
                value={form.absentFine}
                onChange={e => setForm({ ...form, absentFine: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-red-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Emergency Support limit</label>
              <input 
                type="number"
                required
                value={form.emergencyLimit}
                onChange={e => setForm({ ...form, emergencyLimit: Number(e.target.value) })}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] font-semibold"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 shadow-sm transition"
        >
          <Save size={14} /> Save Config Settings
        </button>
      </form>
    </div>
  )
}
