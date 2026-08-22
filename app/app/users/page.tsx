'use client'

import { useState } from 'react'
import { useVikobaStore, Member } from '@/lib/mockStore'
import { Users, Plus, ShieldCheck, Mail, Phone, Clock, Search, X } from 'lucide-react'

export default function UsersAdministrationPage() {
  const { members, currentGroup, addMember } = useVikobaStore()
  
  // States
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: 'Treasurer' as Member['role']
  })

  // Filter members that have actual system access roles (Admin, Treasurer, Loan Officer)
  const adminUsers = members.filter(m => {
    if (m.groupId !== currentGroup.id) return false
    if (m.role === 'Member') return false // only show admins, treasurers, loan officers

    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.firstName && form.lastName && form.phone) {
      addMember({
        name: `${form.firstName} ${form.lastName}`,
        phone: form.phone,
        email: form.email || 'N/A',
        role: form.role,
        status: 'ACTIVE'
      })
      setForm({ firstName: '', lastName: '', phone: '', email: '', role: 'Treasurer' })
      setModalOpen(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Administration</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Users</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2 font-sans">System Users</h1>
          <p className="text-xs text-neutral-400">Invite, configure, and review access privileges for group officers.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm self-stretch sm:self-auto"
        >
          <Plus size={14} /> Add System User
        </button>
      </div>

      {/* Search panel */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-4 mb-6 flex justify-between items-center">
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#dfe8e2] rounded-lg p-2 pl-8 text-xs outline-none focus:border-[#087f5b]"
          />
          <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={13} />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">User Officer</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Phone Number</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Last Activity</th>
                <th className="p-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {adminUsers.map(u => (
                <tr key={u.id} className="hover:bg-neutral-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-neutral-800 block text-xs">{u.name}</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">{u.memberNo}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-neutral-700 block">{u.role}</span>
                  </td>
                  <td className="p-4 text-neutral-600 font-semibold">{u.phone}</td>
                  <td className="p-4 text-neutral-600 font-semibold">{u.email}</td>
                  <td className="p-4 text-neutral-500 font-medium flex items-center gap-1">
                    <Clock size={12} className="text-neutral-400" /> Today, 09:12 AM
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-extrabold">
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add system user Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Add Officer Account</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">First Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Juma"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Last Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Majid"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone Number *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="+255 7XX XXX XXX"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  placeholder="juma@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">System Access Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as any })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
                >
                  <option value="Treasurer">Group Treasurer</option>
                  <option value="Loan Officer">Group Loan Officer</option>
                  <option value="Administrator">System Administrator</option>
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
