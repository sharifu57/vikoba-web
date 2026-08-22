'use client'

import { useState } from 'react'
import { ShieldCheck, Info } from 'lucide-react'

export default function RolesMatrixPage() {
  const [matrix, setMatrix] = useState({
    Admin: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    Treasurer: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    LoanOfficer: { view: true, create: true, edit: true, delete: false, approve: true, export: false },
    Member: { view: true, create: false, edit: false, delete: false, approve: false, export: true }
  })

  const togglePermission = (role: keyof typeof matrix, permission: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export') => {
    // Simple toggle simulation
    const updatedRole = { ...matrix[role], [permission]: !matrix[role][permission] }
    setMatrix({ ...matrix, [role]: updatedRole })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
          <span>Administration</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Roles & Permissions</span>
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mt-2">Roles & Permissions Matrix</h1>
        <p className="text-xs text-neutral-400">Review system actions mapped to cooperative roles (Admins, Treasurers, Loan Officers, Members).</p>
      </div>

      {/* Info Warning banner */}
      <div className="bg-[#eff7f1] border border-[#b9d7c2] rounded-xl p-4 mb-6 flex items-start gap-3 text-xs text-neutral-600 leading-normal">
        <Info className="text-[#087f5b] shrink-0 mt-0.5" size={16} />
        <div>
          <span className="font-bold text-neutral-800 block mb-1">Standard Security Context</span>
          Permissions are set by default to protect the integrity of financial ledger entries. Changes to the permission matrix take effect for logged-in sessions immediately.
        </div>
      </div>

      {/* Permissions Matrix grid table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Scope / Resource</th>
                <th className="p-4 font-bold text-center">View</th>
                <th className="p-4 font-bold text-center">Create</th>
                <th className="p-4 font-bold text-center">Edit</th>
                <th className="p-4 font-bold text-center">Delete</th>
                <th className="p-4 font-bold text-center">Approve</th>
                <th className="p-4 font-bold text-center">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-neutral-700 font-medium">
              {[
                { id: 'Admin', label: 'Administrator' },
                { id: 'Treasurer', label: 'Treasurer' },
                { id: 'LoanOfficer', label: 'Loan Officer' },
                { id: 'Member', label: 'Regular Member' }
              ].map(role => {
                const rKey = role.id as keyof typeof matrix
                return (
                  <tr key={role.id} className="hover:bg-neutral-50/50">
                    <td className="p-4">
                      <span className="font-bold text-neutral-800 text-xs block">{role.label}</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">System access group</span>
                    </td>
                    {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).map(scope => (
                      <td key={scope} className="p-4 text-center">
                        <input 
                          type="checkbox"
                          checked={matrix[rKey][scope]}
                          onChange={() => togglePermission(rKey, scope)}
                          className="accent-[#087f5b] cursor-pointer w-4 h-4"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
