'use client'

import { useState } from 'react'
import { useVikobaStore } from '@/lib/mockStore'
import { Landmark, LandmarkIcon, Coins, ShieldAlert, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export default function FinanceOverviewPage() {
  const { ledger, currentGroup, members, loans, expenses } = useVikobaStore()

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Filter ledger list
  const filteredLedger = ledger.filter(l => l.groupId === currentGroup.id)

  // Calculations
  const totalAssets = currentGroup.availableCash + currentGroup.bankBalance
  const activeLoans = loans.filter(l => l.groupId === currentGroup.id && l.status === 'DISBURSED')
  const totalLoanReceivables = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0)
  
  const totalSharesValue = members
    .filter(m => m.groupId === currentGroup.id)
    .reduce((sum, m) => sum + m.shares, 0) * 5000

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
          <span>Finance</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Ledger Accounts</span>
        </div>
        <h1 className="text-2xl font-black text-neutral-900 mt-2">Accounts & General Ledger</h1>
        <p className="text-xs text-neutral-400">Monitor double-entry debit/credit ledger sheets and liquid cash accounts.</p>
      </div>

      {/* Liquidity Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { name: 'Cash In Hand', val: fmt(currentGroup.availableCash), desc: 'Treasurer vault cash', icon: Coins, bg: 'bg-[#eaf6ef] text-[#087f5b]' },
          { name: 'Bank Balance', val: fmt(currentGroup.bankBalance), desc: 'NMB / CRDB corporate line', icon: Landmark, bg: 'bg-[#eaf6ef] text-[#087f5b]' },
          { name: 'Mobile Money Vault', val: fmt(6800000), desc: 'M-Pesa Business till code', icon: LandmarkIcon, bg: 'bg-[#eaf6ef] text-[#087f5b]' }, // mock till balance
          { name: 'Total Liquid Assets', val: fmt(currentGroup.availableCash + currentGroup.bankBalance + 6800000), desc: 'Aggregate reserves cash', icon: Coins, bg: 'bg-[#087f5b] text-white' }
        ].map((act, i) => {
          const Icon = act.icon
          return (
            <div key={i} className="bg-white border border-[#dfe8e2] rounded-xl p-5 flex items-start justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">{act.name}</span>
                <h3 className="text-base md:text-lg font-black text-neutral-800 mt-2">{act.val}</h3>
                <span className="text-[9px] text-neutral-400 block mt-1">{act.desc}</span>
              </div>
              <div className={`p-2 rounded-lg ${act.bg}`}>
                <Icon size={16} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Equity & Balance Matrix */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 mb-8 shadow-sm">
        <h3 className="font-extrabold text-neutral-800 text-sm mb-4">Financial Equity Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Share Capital', val: fmt(totalSharesValue) },
            { label: 'Loan Receivables', val: fmt(totalLoanReceivables) },
            { label: 'Jamii Welfare Fund', val: fmt(currentGroup.jamiiFund) },
            { label: 'Total Contributions', val: fmt(members.filter(m => m.groupId === currentGroup.id).reduce((sum, m) => sum + m.contributions, 0)) },
            { label: 'Accrued Fines due', val: fmt(currentGroup.outstandingFines) },
            { label: 'Net Profit margin', val: fmt(expenses.filter(e => e.groupId === currentGroup.id && e.status === 'APPROVED').reduce((sum, e) => sum - e.amount, 1420000)) } // mock net profit
          ].map((item, idx) => (
            <div key={idx} className="bg-neutral-50 rounded-xl p-3 text-center border border-neutral-100/50">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">{item.label}</span>
              <span className="text-xs font-black text-neutral-800 mt-1 block">{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Double Entry Ledger Table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-extrabold text-neutral-800 text-sm">General Transaction Ledger Sheets</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Transaction Date</th>
                <th className="p-4 font-bold">Reference No</th>
                <th className="p-4 font-bold">Description</th>
                <th className="p-4 font-bold">Account</th>
                <th className="p-4 font-bold text-right">Debit (Inbound)</th>
                <th className="p-4 font-bold text-right">Credit (Outbound)</th>
                <th className="p-4 font-bold text-right">Balance Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredLedger.map(l => (
                <tr key={l.id} className="hover:bg-neutral-50/50">
                  <td className="p-4 font-semibold text-neutral-600">{l.date}</td>
                  <td className="p-4 font-extrabold text-neutral-500">{l.reference}</td>
                  <td className="p-4 text-neutral-700 font-medium">{l.description}</td>
                  <td className="p-4 font-semibold text-neutral-500">{l.account}</td>
                  <td className="p-4 font-bold text-emerald-600 text-right">
                    {l.debit > 0 ? (
                      <span className="flex items-center justify-end gap-0.5">
                        <ArrowDownRight size={12} /> {fmt(l.debit)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-4 font-bold text-red-500 text-right">
                    {l.credit > 0 ? (
                      <span className="flex items-center justify-end gap-0.5">
                        <ArrowUpRight size={12} /> {fmt(l.credit)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-4 font-black text-neutral-800 text-right">{fmt(l.balance)}</td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400">No transactions recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
