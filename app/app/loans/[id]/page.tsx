'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useVikobaStore } from '@/lib/mockStore'
import { ArrowLeft, CheckCircle, Clock, CalendarDays, Coins } from 'lucide-react'

export default function LoanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const { 
    loans, 
    members, 
    currentGroup, 
    repayments,
    recordPayment 
  } = useVikobaStore()

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  const loan = loans.find(l => l.id === id && l.groupId === currentGroup.id)
  const borrower = loan ? members.find(m => m.id === loan.memberId) : null
  const schedule = repayments.filter(r => r.loanId === id).sort((a, b) => a.installmentNumber - b.installmentNumber)

  const handleMakeRepayment = () => {
    if (loan) {
      // Simplistic installment repayment simulator (takes first unpaid total installment cost)
      const nextUnpaid = schedule.find(s => s.status !== 'PAID')
      const amt = nextUnpaid ? nextUnpaid.totalDue : 500000

      recordPayment({
        memberId: loan.memberId,
        amount: amt,
        type: 'Loan Repayment',
        method: 'Mobile Money'
      })
    }
  }

  if (!loan) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-neutral-800">Loan Record Not Found</h2>
        <Link href="/app/loans" className="mt-4 inline-block px-4 py-2 bg-[#087f5b] text-white rounded-lg text-xs">
          Back to Loans
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Back button */}
      <Link href="/app/loans" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-700 transition mb-6">
        <ArrowLeft size={14} /> Back to Loans Dashboard
      </Link>

      {/* Amortization Header Card */}
      <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Loans</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Details</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2 flex items-center gap-2">
            Loan Schedule: {loan.loanProduct} 
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-extrabold">{loan.status}</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Borrower: <strong className="text-neutral-700 font-bold">{borrower?.name}</strong> · ID: <strong className="text-neutral-500 font-bold">#{loan.id}</strong>
          </p>
        </div>

        {loan.status === 'DISBURSED' && (
          <button 
            onClick={handleMakeRepayment}
            className="px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm w-full md:w-auto justify-center"
          >
            <Coins size={14} /> Record Repayment
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Requested Principal', val: fmt(loan.principal) },
          { title: 'Calculated Interest (10%)', val: fmt(loan.interest) },
          { title: 'Total Repayment Paid', val: fmt(loan.totalPaid), color: 'text-emerald-600' },
          { title: 'Outstanding Balance', val: fmt(loan.remainingBalance), color: 'text-red-500' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-4 shadow-sm">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{s.title}</span>
            <h3 className={`text-base md:text-lg font-black mt-1.5 ${s.color || 'text-neutral-800'}`}>{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Repayment Progress visual */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 mb-8 flex flex-col gap-3 shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-neutral-700">
          <span>Overall Repayment Schedule Progress</span>
          <span>{loan.progress}% Completed</span>
        </div>
        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
          <div className="bg-[#087f5b] h-full rounded-full" style={{ width: `${loan.progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-neutral-400 font-semibold mt-1">
          <span>Maturity Date: {loan.maturityDate || 'N/A'}</span>
          <span>Next installment due: {loan.nextPaymentDate || 'N/A'}</span>
        </div>
      </div>

      {/* Amortization schedule table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-extrabold text-neutral-800 text-sm">Amortization Table Installments</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Installment</th>
                <th className="p-4 font-bold">Due Date</th>
                <th className="p-4 font-bold text-right">Principal</th>
                <th className="p-4 font-bold text-right">Interest</th>
                <th className="p-4 font-bold text-right">Penalty</th>
                <th className="p-4 font-bold text-right">Total Due</th>
                <th className="p-4 font-bold text-right">Paid</th>
                <th className="p-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {schedule.map(s => (
                <tr key={s.id} className="hover:bg-neutral-50/50">
                  <td className="p-4 font-bold text-neutral-700">Installment #{s.installmentNumber}</td>
                  <td className="p-4 font-semibold text-neutral-500">{s.dueDate}</td>
                  <td className="p-4 font-medium text-neutral-800 text-right">{fmt(s.principal)}</td>
                  <td className="p-4 font-medium text-neutral-800 text-right">{fmt(s.interest)}</td>
                  <td className="p-4 font-bold text-red-500 text-right">{s.penalty > 0 ? fmt(s.penalty) : '—'}</td>
                  <td className="p-4 font-black text-neutral-800 text-right">{fmt(s.totalDue)}</td>
                  <td className="p-4 font-bold text-emerald-600 text-right">{fmt(s.paid)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                      s.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                      s.status === 'PENDING' ? 'bg-amber-50 text-amber-800' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-neutral-400">
                    No amortization schedule generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
