'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useVikobaStore, Member } from '@/lib/mockStore'
import { Search, UserPlus, FileDown, Eye, Check, X, Filter } from 'lucide-react'

export default function MembersPage() {
  const { members, currentGroup, addMember } = useVikobaStore()
  
  // Search & Filters state
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [newMem, setNewMem] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: 'Member' as Member['role']
  })

  // Filter members list
  const filteredMembers = members.filter(m => {
    if (m.groupId !== currentGroup.id) return false
    
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.memberNo.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search)
      
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMem.firstName && newMem.lastName && newMem.phone) {
      addMember({
        name: `${newMem.firstName} ${newMem.lastName}`,
        phone: newMem.phone,
        email: newMem.email || 'N/A',
        role: newMem.role,
        status: 'ACTIVE'
      })
      // Reset form & close
      setNewMem({ firstName: '', lastName: '', phone: '', email: '', role: 'Member' })
      setModalOpen(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 relative">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>VIKOBA</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Members</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Members Register</h1>
          <p className="text-xs text-neutral-400">Manage member profiles, savings holdings, and active roles.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <UserPlus size={14} /> Add Member
          </button>
          <button className="px-4 py-2.5 border border-[#dfe8e2] hover:bg-neutral-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
            <FileDown size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search by name, phone or member No..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#dfe8e2] rounded-lg p-2.5 pl-9 text-xs outline-none focus:border-[#087f5b] bg-[#fcfdfc]"
          />
          <Search className="absolute left-3 top-3 text-neutral-400" size={14} />
        </div>

        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter size={12} className="text-neutral-400" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Filters:</span>
          </div>
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-[#dfe8e2] rounded-lg p-2 text-xs bg-[#fcfdfc] outline-none text-neutral-600 font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="Administrator">Administrators</option>
            <option value="Treasurer">Treasurers</option>
            <option value="Loan Officer">Loan Officers</option>
            <option value="Member">Members</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-[#dfe8e2] rounded-lg p-2 text-xs bg-[#fcfdfc] outline-none text-neutral-600 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Member Info</th>
                <th className="p-4 font-bold">Member No</th>
                <th className="p-4 font-bold">Phone Number</th>
                <th className="p-4 font-bold text-right">Shares (Value)</th>
                <th className="p-4 font-bold text-right">Contributions</th>
                <th className="p-4 font-bold text-right">Loan Balance</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredMembers.map(m => (
                <tr key={m.id} className="hover:bg-neutral-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-neutral-800 block text-xs">{m.name}</span>
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">{m.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-neutral-500">{m.memberNo}</td>
                  <td className="p-4 text-neutral-600 font-medium">{m.phone}</td>
                  <td className="p-4 text-right">
                    <span className="font-bold text-neutral-800 block">{m.shares} shares</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">{currentGroup.currency} {(m.shares * 5000).toLocaleString()}</span>
                  </td>
                  <td className="p-4 font-black text-neutral-800 text-right">{currentGroup.currency} {m.contributions.toLocaleString()}</td>
                  <td className="p-4 font-black text-right text-neutral-800">
                    {m.loanBalance > 0 ? (
                      <span className="text-red-600">{currentGroup.currency} {m.loanBalance.toLocaleString()}</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${m.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link href={`/app/members/${m.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#dfe8e2] hover:border-[#087f5b] hover:text-[#087f5b] rounded-lg transition text-[10px] font-bold">
                      <Eye size={12} /> Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-400 text-xs">
                    No members match search query or filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Add New Member</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">First Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Juma"
                    value={newMem.firstName}
                    onChange={e => setNewMem({ ...newMem, firstName: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Last Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Majid"
                    value={newMem.lastName}
                    onChange={e => setNewMem({ ...newMem, lastName: e.target.value })}
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
                  value={newMem.phone}
                  onChange={e => setNewMem({ ...newMem, phone: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  placeholder="juma@example.com"
                  value={newMem.email}
                  onChange={e => setNewMem({ ...newMem, email: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">System Role</label>
                <select
                  value={newMem.role}
                  onChange={e => setNewMem({ ...newMem, role: e.target.value as any })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-medium"
                >
                  <option value="Member">Regular Group Member</option>
                  <option value="Administrator">System Administrator</option>
                  <option value="Treasurer">Group Treasurer</option>
                  <option value="Loan Officer">Group Loan Officer</option>
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
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
