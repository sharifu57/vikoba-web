'use client'

import { useState } from 'react'
import { useVikobaStore } from '@/lib/mockStore'
import { FileText, Download, Printer, Filter, Calendar, Users, Briefcase } from 'lucide-react'

export default function ReportsPage() {
  const { currentGroup, members, loans, payments, fines, expenses } = useVikobaStore()

  // Filters state
  const [filterMember, setFilterMember] = useState('ALL')
  const [reportType, setReportType] = useState('contribution') // 'contribution' | 'loans' | 'income' | 'fines'
  const [dateRange, setDateRange] = useState({ start: '2026-08-01', end: '2026-08-31' })

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Pre-generate report views from store data
  const reportPayments = payments.filter(p => {
    if (p.groupId !== currentGroup.id) return false

    // date filter
    if (p.date < dateRange.start || p.date > dateRange.end) return false

    // member filter
    if (filterMember !== 'ALL' && p.memberId !== filterMember) return false

    return true
  })

  // Trigger browser print
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Reports</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Center</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Reports Center</h1>
          <p className="text-xs text-neutral-400">Generate, review and print monthly statements and audited group reports.</p>
        </div>
      </div>

      {/* Grid: Left Filters Form, Right Report Preview */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Report categories selector & Filters */}
        <div className="flex flex-col gap-6">
          {/* Report types config */}
          <div className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <h3 className="font-extrabold text-neutral-800 text-sm mb-4">Report Template</h3>
            <div className="flex flex-col gap-1">
              {[
                { id: 'contribution', label: 'Contributions Statement', desc: 'Weekly/monthly paid columns' },
                { id: 'loans', label: 'Loan Portfolio Risk', desc: 'Active outstanding and repayments' },
                { id: 'income', label: 'Income & Expense Statement', desc: 'Financial earnings and net margins' },
                { id: 'fines', label: 'Penalties & Fines summary', desc: 'Arrears and waivers lists' }
              ].map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setReportType(rep.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex flex-col gap-1 transition ${reportType === rep.id ? 'bg-[#eaf6ef] text-[#087f5b]' : 'text-neutral-600 hover:bg-neutral-50'}`}
                >
                  <span>{rep.label}</span>
                  <span className="text-[9px] opacity-75 font-normal">{rep.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters Form */}
          <div className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <Filter size={15} className="text-[#087f5b]" />
              <h3 className="font-extrabold text-neutral-800 text-sm">Statement Filters</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
                <Users size={12} /> Filter Member
              </label>
              <select
                value={filterMember}
                onChange={e => setFilterMember(e.target.value)}
                className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] text-neutral-600 font-semibold"
              >
                <option value="ALL">All Active Members</option>
                {members.filter(m => m.groupId === currentGroup.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
                <Calendar size={12} /> Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2 text-xs outline-none text-neutral-600 font-semibold"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2 text-xs outline-none text-neutral-600 font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Report Preview Container */}
        <div className="lg:col-span-2 bg-white border border-[#dfe8e2] rounded-xl p-8 shadow-sm flex flex-col gap-6 print:border-0 print:shadow-none print:p-0">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 print:hidden">
            <span className="text-xs font-bold text-[#087f5b] bg-[#eaf6ef] px-2 py-1 rounded">Statement Sheet View</span>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 border border-[#dfe8e2] hover:bg-neutral-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Printer size={13} /> Print
              </button>
              <button className="px-3 py-1.5 bg-[#087f5b] text-white hover:bg-[#066b4c] rounded-lg text-xs font-bold transition flex items-center gap-1">
                <Download size={13} /> Export PDF
              </button>
            </div>
          </div>

          {/* Printable sheet container */}
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="text-center flex flex-col gap-1 pb-4 border-b border-dashed border-neutral-200">
              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase">{currentGroup.name}</h2>
              <span className="text-xs text-neutral-400 font-bold tracking-widest uppercase">Official Financial Statement</span>
              <span className="text-[10px] text-neutral-500 font-semibold mt-1">
                Period: {dateRange.start} to {dateRange.end}
              </span>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
              <div>
                <span className="text-[9px] text-neutral-400 font-bold uppercase block">Generated Date</span>
                <span className="text-xs font-black text-neutral-800 block mt-1">21 Aug 2026</span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-400 font-bold uppercase block">Group Currency</span>
                <span className="text-xs font-black text-[#087f5b] block mt-1">{currentGroup.currency}</span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-400 font-bold uppercase block">Transactions Count</span>
                <span className="text-xs font-black text-neutral-800 block mt-1">{reportPayments.length} records</span>
              </div>
            </div>

            {/* Live Rendered Content base on reportType */}
            {reportType === 'contribution' && (
              <div>
                <h4 className="font-extrabold text-neutral-800 text-xs mb-3">Collected Contributions List</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-200 pb-2">
                      <th className="py-2">Date</th>
                      <th className="py">Member</th>
                      <th className="py">Method</th>
                      <th className="py text-right">Amount</th>
                      <th className="py text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {reportPayments.filter(p => p.type === 'Contribution').map((p, i) => (
                      <tr key={i}>
                        <td className="py-3 text-neutral-500 font-semibold">{p.date}</td>
                        <td className="py-3 font-bold text-neutral-800">{members.find(m => m.id === p.memberId)?.name}</td>
                        <td className="py-3 text-neutral-500 font-semibold">{p.method}</td>
                        <td className="py-3 font-black text-neutral-800 text-right">{fmt(p.amount)}</td>
                        <td className="py-3 text-center">
                          <span className="text-[9px] font-extrabold text-emerald-800 uppercase">{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    {reportPayments.filter(p => p.type === 'Contribution').length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-neutral-400">No contribution logs during this period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'loans' && (
              <div>
                <h4 className="font-extrabold text-neutral-800 text-xs mb-3">Active Repayments & Outstanding Credits</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-200 pb-2">
                      <th className="py-2">Loan Product</th>
                      <th className="py">Borrower</th>
                      <th className="py text-right">Principal</th>
                      <th className="py text-right">Remaining Balance</th>
                      <th className="py text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {loans.filter(l => l.groupId === currentGroup.id && l.status === 'DISBURSED').map((l, i) => (
                      <tr key={i}>
                        <td className="py-3 font-semibold text-neutral-800">{l.loanProduct}</td>
                        <td className="py-3 font-bold text-neutral-800">{members.find(m => m.id === l.memberId)?.name}</td>
                        <td className="py-3 font-bold text-neutral-800 text-right">{fmt(l.principal)}</td>
                        <td className="py-3 font-black text-red-500 text-right">{fmt(l.remainingBalance)}</td>
                        <td className="py-3 text-center">
                          <span className="text-[9px] font-extrabold text-blue-700 uppercase">{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'income' && (
              <div className="flex flex-col gap-4 text-xs">
                <h4 className="font-extrabold text-neutral-800 text-xs mb-1">Income & Expense Balance Sheets</h4>
                <div className="border border-neutral-150 rounded-xl overflow-hidden">
                  <div className="bg-neutral-50 px-4 py-2 font-bold text-neutral-800 border-b border-neutral-150">Revenues</div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-semibold">Total Contributions collected</span>
                      <span className="font-bold text-neutral-800">{fmt(members.filter(m => m.groupId === currentGroup.id).reduce((sum, m) => sum + m.contributions, 0))}</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-50 pt-2">
                      <span className="text-neutral-500 font-semibold">Interest earned from loans</span>
                      <span className="font-bold text-neutral-800">{fmt(loans.filter(l => l.groupId === currentGroup.id && l.status === 'DISBURSED').reduce((sum, l) => sum + l.interest, 0))}</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-50 pt-2">
                      <span className="text-neutral-500 font-semibold">Fines collected</span>
                      <span className="font-bold text-[#087f5b]">{fmt(fines.filter(f => f.groupId === currentGroup.id && f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0))}</span>
                    </div>
                  </div>

                  <div className="bg-neutral-50 px-4 py-2 font-bold text-neutral-800 border-t border-b border-neutral-150">Outbound Expenditures</div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-semibold">Approved stationary & office costs</span>
                      <span className="font-bold text-red-500">-{fmt(expenses.filter(e => e.groupId === currentGroup.id && e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'fines' && (
              <div>
                <h4 className="font-extrabold text-neutral-800 text-xs mb-3">Group Fines & Penalties Sheet</h4>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-200 pb-2">
                      <th className="py-2">Member</th>
                      <th className="py">Fine Type</th>
                      <th className="py text-right">Amount</th>
                      <th className="py text-right">Outstanding</th>
                      <th className="py text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {fines.filter(f => f.groupId === currentGroup.id).map((f, i) => (
                      <tr key={i}>
                        <td className="py-3 font-bold text-neutral-800">{members.find(m => m.id === f.memberId)?.name}</td>
                        <td className="py-3 font-semibold text-neutral-600">{f.fineType}</td>
                        <td className="py-3 font-bold text-neutral-800 text-right">{fmt(f.amount)}</td>
                        <td className="py-3 font-black text-red-500 text-right">{fmt(f.outstanding ?? 0)}</td>
                        <td className="py-3 text-center">
                          <span className={`text-[9px] font-extrabold uppercase ${f.status === 'PAID' ? 'text-emerald-700' : 'text-red-600'}`}>{f.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 pt-12 border-t border-dashed border-neutral-200 mt-12 text-xs">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-40 border-b border-neutral-300 h-6" />
                <span className="font-bold text-neutral-700">Group Treasurer Signature</span>
                <span className="text-[9px] text-neutral-400">Date Signed</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-40 border-b border-neutral-300 h-6" />
                <span className="font-bold text-neutral-700">Group Administrator Signature</span>
                <span className="text-[9px] text-neutral-400">Date Signed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
