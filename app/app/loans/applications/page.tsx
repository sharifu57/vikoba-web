'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useVikobaStore, Loan } from '@/lib/mockStore'
import { ArrowLeft, Check, X, Eye, FileSpreadsheet, UserCheck } from 'lucide-react'

export default function LoanApplicationsPage() {
  const { 
    loans, 
    members, 
    currentGroup, 
    approveLoan, 
    rejectLoan 
  } = useVikobaStore()

  const [selectedApp, setSelectedApp] = useState<Loan | null>(null)

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter application loans (PENDING, UNDER_REVIEW, REJECTED)
  const applications = loans.filter(l => 
    l.groupId === currentGroup.id && 
    (l.status === 'PENDING' || l.status === 'UNDER_REVIEW' || l.status === 'REJECTED')
  )

  const handleApprove = (id: string) => {
    approveLoan(id)
    setSelectedApp(null)
  }

  const handleReject = (id: string) => {
    rejectLoan(id)
    setSelectedApp(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <Link href="/app/loans" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-700 transition mb-6">
        <ArrowLeft size={14} /> Back to Loans Portfolio
      </Link>

      <div className="mb-8">
        <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
          <span>Loans</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Applications</span>
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mt-2">Loan Applications Queue</h1>
        <p className="text-xs text-neutral-400">Validate credit risk, guarantor coverage, and grant approvals.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Applications Table */}
        <div className="lg:col-span-2 bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-100">
            <h3 className="font-extrabold text-neutral-800 text-sm">Pending Request List</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                  <th className="p-4 font-bold">Borrower</th>
                  <th className="p-4 font-bold">Product</th>
                  <th className="p-4 font-bold text-right">Amount</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {applications.map(app => {
                  const borrower = members.find(m => m.id === app.memberId)
                  return (
                    <tr 
                      key={app.id} 
                      className={`hover:bg-[#f3f8f4]/40 cursor-pointer transition ${selectedApp?.id === app.id ? 'bg-[#eaf6ef]/30' : ''}`}
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                            {borrower?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-800 block text-xs">{borrower?.name}</span>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">{borrower?.memberNo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-neutral-800 block">{app.loanProduct}</span>
                        <span className="text-[9px] text-neutral-400 block mt-0.5">Date: {app.requestedDate}</span>
                      </td>
                      <td className="p-4 font-black text-neutral-800 text-right">{fmt(app.amount)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          app.status === 'PENDING' ? 'bg-amber-50 text-amber-800' :
                          app.status === 'UNDER_REVIEW' ? 'bg-blue-50 text-blue-700' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedApp(app)
                          }}
                          className="px-2 py-1.5 border border-[#dfe8e2] hover:border-[#087f5b] hover:text-[#087f5b] rounded text-[10px] font-bold transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-neutral-400">
                      All loan requests are completed. No pending items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detailed Review Card */}
        <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm min-h-[300px]">
          {selectedApp ? (
            <div className="flex flex-col gap-5">
              <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block">Application Details</span>
                  <span className="text-xs font-black text-neutral-700 block mt-0.5">#{selectedApp.id}</span>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={16} />
                </button>
              </div>

              {/* Applicant Info */}
              <div className="flex items-center gap-3 bg-[#fcfdfc] border border-neutral-100 rounded-xl p-3">
                <div className="w-9 h-9 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center shrink-0">
                  {members.find(m => m.id === selectedApp.memberId)?.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <span className="font-extrabold text-neutral-800 text-xs block">
                    {members.find(m => m.id === selectedApp.memberId)?.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Savings Balance: {fmt(members.find(m => m.id === selectedApp.memberId)?.contributions || 0)}
                  </span>
                </div>
              </div>

              {/* Requested Stats */}
              <div className="flex flex-col gap-2.5 text-xs text-neutral-600 border-b border-neutral-50 pb-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-neutral-400">Loan Product</span>
                  <span className="font-bold text-neutral-800">{selectedApp.loanProduct}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-neutral-400">Requested Amount</span>
                  <span className="font-black text-neutral-900">{fmt(selectedApp.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-neutral-400">Expected Interest</span>
                  <span className="font-bold text-neutral-800">{fmt(selectedApp.interest)} (10%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-neutral-400">Purpose</span>
                  <span className="font-semibold text-neutral-700 italic">"{selectedApp.purpose}"</span>
                </div>
              </div>

              {/* Guarantors */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Co-sign Guarantors</span>
                <div className="flex flex-col gap-1.5">
                  {selectedApp.guarantors.map((g, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
                      <UserCheck size={13} className="text-[#087f5b]" />
                      <span>{g}</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1 rounded ml-auto">SIGNED</span>
                    </div>
                  ))}
                  {selectedApp.guarantors.length === 0 && (
                    <span className="text-neutral-400 text-[10px] italic">No guarantor signatures assigned.</span>
                  )}
                </div>
              </div>

              {/* Approval controls */}
              {selectedApp.status !== 'REJECTED' && (
                <div className="flex gap-2 pt-4 border-t border-neutral-100 mt-2">
                  <button 
                    onClick={() => handleReject(selectedApp.id)}
                    className="w-1/3 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <X size={13} /> Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(selectedApp.id)}
                    className="flex-1 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Check size={13} strokeWidth={3} /> Approve & Disburse
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400 gap-3">
              <FileSpreadsheet size={36} className="text-neutral-300" />
              <span className="text-xs font-medium max-w-xs leading-normal">
                Select a loan application from the register list to review details and issue decision approvals.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
