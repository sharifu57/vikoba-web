"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memberService, Member360Response } from '@/lib/api/services'
import {
  ArrowLeft, FileDown, Landmark, WalletCards, BarChart3, AlertCircle,
  Clock, CheckCircle, HelpCircle, Eye
} from 'lucide-react'

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'shares' | 'loans' | 'fines' | 'payments' | 'attendance'>('overview')
  const [data, setData] = useState<Member360Response | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    memberService.get360(id)
      .then((res: any) => {
        if (!mounted) return
        if (res?.status) {
          setData(res.data ?? null)
        } else {
          console.error(res?.message)
          router.back()
        }
      })
      .catch((e) => {
        console.error(e)
        router.back()
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [id])

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-12 text-center">Loading member details...</div>
  }

  const member = (data?.member as any) ?? null
  const currentGroup = (typeof window !== 'undefined' && localStorage.getItem('v360_currentGroup'))
    ? JSON.parse(localStorage.getItem('v360_currentGroup') as string)
    : { id: null, name: 'Group', currency: 'TZS' }

  if (!member) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-neutral-800">Member Not Found</h2>
        <p className="text-neutral-400 text-xs">The member record you are looking for does not exist in {currentGroup.name}.</p>
        <Link href="/app/members" className="px-4 py-2 bg-[#087f5b] text-white font-bold rounded-lg text-xs">
          Back to Members List
        </Link>
      </div>
    )
  }

  // Format currency helper
  const fmt = (val: number) => `${currentGroup.currency} ${val.toLocaleString()}`


  // Live arrays from API
  const memberContributions = (data?.contributions as any[]) ?? []
  const memberShares = ((data?.member as any)?.shares ? [{ sharesCount: (data?.member as any).shares, value: ((data?.member as any).shares * ((data?.member as any).sharePrice ?? 0)) }] : []) as any[]
  const memberLoans = (data?.loans as any[]) ?? []
  const memberFines = (data?.fines as any[]) ?? []
  const memberPayments = (data?.socialFundContributions as any[]) ?? []
  const memberAttendance = (data?.meetingAttendance as any[]) ?? []

  // Calculate stats
  const paidConts = memberContributions.reduce((sum, c) => sum + (c.paid ?? c.amount ?? 0), 0)
  const sharesVal = ((member as any)?.shares ?? 0) * ((member as any)?.sharePrice ?? 0)
  const outstandingLoansVal = memberLoans.filter(l => l.status === 'DISBURSED').reduce((sum, l) => sum + (l.remainingBalance ?? 0), 0)
  const outstandingFinesVal = memberFines.filter(f => f.status === 'UNPAID' || f.status === 'UNPAID').reduce((sum, f) => sum + (f.outstanding ?? f.amount ?? 0), 0)

  // Normalize member fields from API (backend may return fullName/firstName/lastName)
  const displayName = (member && (member.name || member.fullName || `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim())) || 'Member'
  const normalizedMember = {
    name: displayName,
    status: member?.membershipStatus ?? member?.status ?? 'ACTIVE',
    memberNo: member?.memberNo ?? member?.memberNumber ?? member?.membershipNumber ?? member?.memberId ?? '',
    role: member?.role ?? 'MEMBER',
    contributions: paidConts,
    shares: member?.shares ?? 0,
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    joinDate: member?.joinDate ?? member?.joinedDate ?? member?.createdAt ?? '',
  } as any

  // Statement download simulator
  const handleDownloadStatement = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Date,Type,Amount,Status,Ref\n"
      + memberPayments.map(p => `"${p.date}","${p.type}",${p.amount},"${p.status}","${p.reference}"`).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${(normalizedMember.name || 'Member').replace(/\s+/g, '_')}_Statement.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Back button */}
      <Link href="/app/members" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-700 transition mb-6">
        <ArrowLeft size={14} /> Back to Members Register
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#eaf6ef] text-[#087f5b] font-extrabold text-xl flex items-center justify-center">
            {(normalizedMember.name || 'Member').split(' ').map((n: string) => (n || '?')[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-neutral-900">{normalizedMember.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${normalizedMember.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {normalizedMember.status}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Member No: <strong className="text-neutral-600 font-bold">{normalizedMember.memberNo}</strong> · Role: <strong className="text-[#087f5b] font-bold">{normalizedMember.role}</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleDownloadStatement}
            className="flex-1 md:flex-none px-4 py-2.5 border border-[#dfe8e2] hover:bg-neutral-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <FileDown size={14} /> Download Statement
          </button>
          <Link
            href="/app/payments"
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            Record Payment
          </Link>
        </div>
      </div>

      {/* Profile Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Contributions', val: fmt(normalizedMember.contributions), icon: WalletCards, color: 'text-neutral-800' },
          { title: 'Total Shares Capital', val: fmt(sharesVal), sub: `${normalizedMember.shares} total shares`, icon: BarChart3, color: 'text-[#d99521]' },
          { title: 'Outstanding Loan Balance', val: fmt(outstandingLoansVal), icon: Landmark, color: outstandingLoansVal > 0 ? 'text-red-600' : 'text-neutral-800' },
          { title: 'Outstanding Fines', val: fmt(outstandingFinesVal), icon: AlertCircle, color: outstandingFinesVal > 0 ? 'text-red-600' : 'text-neutral-800' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 hover:shadow-sm transition">
            <div className="flex items-center justify-between pb-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <span>{s.title}</span>
              <s.icon size={15} />
            </div>
            <h3 className={`text-base md:text-lg font-black ${s.color}`}>{s.val}</h3>
            {s.sub && <span className="text-[10px] text-neutral-400 mt-1 block font-semibold">{s.sub}</span>}
          </div>
        ))}
      </div>

      {/* Tabs list */}
      <div className="border-b border-[#dfe8e2] flex overflow-x-auto gap-6 mb-6 text-xs font-bold text-neutral-400 pb-0.5">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'contributions', label: 'Contributions' },
          { id: 'shares', label: 'Shares (Hisa)' },
          { id: 'loans', label: 'Loans' },
          { id: 'fines', label: 'Fines' },
          { id: 'payments', label: 'Ledger Payments' },
          { id: 'attendance', label: 'Attendance' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 hover:text-neutral-700 transition relative shrink-0 ${activeTab === t.id ? 'text-[#087f5b] border-b-2 border-[#087f5b]' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels content */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Profile Details</h3>
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-semibold">Full Name</span>
                  <span className="text-neutral-800 font-bold">{normalizedMember.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-semibold">Phone Number</span>
                  <span className="text-neutral-800 font-bold">{normalizedMember.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-semibold">Email Address</span>
                  <span className="text-neutral-800 font-bold">{normalizedMember.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-semibold">Join Date</span>
                  <span className="text-neutral-800 font-bold">{normalizedMember.joinDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-extrabold text-neutral-800 text-sm pb-2 border-b border-neutral-100">Membership Summary</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {normalizedMember.name} joined Umoja VIKOBA on {normalizedMember.joinDate}. Currently possesses a contribution rate of 100%, holding {normalizedMember.shares} share tokens.
                {outstandingLoansVal > 0 ? ` Outstanding loan balances currently stand at ${fmt(outstandingLoansVal)}.` : " No active loan liabilities outstanding."}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-100 pb-2">
                  <th className="py-2.5">Period</th>
                  <th className="py-2.5 text-right">Expected</th>
                  <th className="py-2.5 text-right">Paid</th>
                  <th className="py-2.5 text-right">Outstanding</th>
                  <th className="py-2.5">Last Payment Date</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {memberContributions.map(c => (
                  <tr key={c.id}>
                    <td className="py-3 font-semibold text-neutral-700">{c.period}</td>
                    <td className="py-3 font-bold text-neutral-800 text-right">{fmt(c.expected)}</td>
                    <td className="py-3 font-bold text-neutral-800 text-right">{fmt(c.paid)}</td>
                    <td className="py-3 font-bold text-red-500 text-right">{fmt(c.balance)}</td>
                    <td className="py-3 text-neutral-500 font-semibold">{c.lastPaymentDate || '—'}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${c.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        c.status === 'PARTIALLY PAID' ? 'bg-amber-50 text-amber-800' :
                          'bg-red-50 text-red-600'
                        }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {memberContributions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-neutral-400">No contribution logs.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'shares' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-100 pb-2">
                  <th className="py-2.5">Transaction Date</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5 text-right">Shares Count</th>
                  <th className="py-2.5 text-right">Value Amount</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {memberShares.map(s => (
                  <tr key={s.id}>
                    <td className="py-3 text-neutral-600 font-medium">{s.date}</td>
                    <td className="py-3 font-bold text-neutral-700">{s.type}</td>
                    <td className="py-3 font-bold text-neutral-800 text-right">{s.sharesCount} shares</td>
                    <td className="py-3 font-black text-neutral-800 text-right">{fmt(s.value)}</td>
                    <td className="py-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-extrabold">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {memberShares.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-neutral-400">No share transactions recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="flex flex-col gap-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-100 pb-2">
                    <th className="py-2.5">Loan Product</th>
                    <th className="py-2.5 text-right">Requested</th>
                    <th className="py-2.5 text-right">Principal</th>
                    <th className="py-2.5 text-right">Outstanding</th>
                    <th className="py-2.5">Maturity Date</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {memberLoans.map(l => (
                    <tr key={l.id}>
                      <td className="py-3">
                        <span className="font-semibold text-neutral-800 block">{l.loanProduct}</span>
                        <span className="text-[9px] text-neutral-400 mt-0.5 block">Requested: {l.requestedDate}</span>
                      </td>
                      <td className="py-3 font-bold text-neutral-800 text-right">{fmt(l.amount)}</td>
                      <td className="py-3 font-bold text-neutral-800 text-right">{fmt(l.principal)}</td>
                      <td className="py-3 font-black text-red-500 text-right">{l.status === 'DISBURSED' ? fmt(l.remainingBalance) : '—'}</td>
                      <td className="py-3 text-neutral-500 font-semibold">{l.maturityDate || '—'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${l.status === 'DISBURSED' ? 'bg-blue-50 text-blue-700' :
                          l.status === 'PENDING' ? 'bg-amber-50 text-amber-800' :
                            l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                              'bg-neutral-50 text-neutral-500'
                          }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {l.status === 'DISBURSED' && (
                          <Link href={`/app/loans/${l.id}`} className="px-2 py-1 border border-[#dfe8e2] hover:border-[#087f5b] hover:text-[#087f5b] rounded text-[10px] font-bold">
                            Amortization
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                  {memberLoans.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-neutral-400">No loan records.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fines' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-100 pb-2">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Fine Type</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-right">Outstanding</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {memberFines.map(f => (
                  <tr key={f.id}>
                    <td className="py-3 text-neutral-500 font-medium">{f.date}</td>
                    <td className="py-3 font-semibold text-neutral-700">{f.fineType}</td>
                    <td className="py-3 font-bold text-neutral-800 text-right">{fmt(f.amount)}</td>
                    <td className="py-3 font-black text-red-500 text-right">{fmt(f.outstanding ?? 0)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${f.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        f.status === 'UNPAID' ? 'bg-red-50 text-red-600' :
                          'bg-neutral-50 text-neutral-500'
                        }`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {memberFines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-neutral-400">No penalties logged for this member.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-400 font-bold uppercase text-[9px] border-b border-neutral-100 pb-2">
                  <th className="py-2.5">Date / Ref</th>
                  <th className="py-2.5">Transaction Type</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {memberPayments.map((p, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <span className="font-semibold text-neutral-800 block">{p.date}</span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">{p.reference}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-neutral-700">{p.type}</span>
                    </td>
                    <td className="py-3 text-neutral-500 font-medium">{p.method}</td>
                    <td className="py-3 font-black text-neutral-800 text-right">{fmt(p.amount)}</td>
                    <td className="py-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-extrabold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {memberPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-neutral-400">No ledger transactions.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#fcfdfc] border border-neutral-100 rounded-xl p-4 text-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Attendance Rate</span>
              <span className="text-2xl font-black text-neutral-800 mt-2 block">
                {memberAttendance.length > 0
                  ? `${Math.round((memberAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length / memberAttendance.length) * 100)}%`
                  : '100%'}
              </span>
            </div>

            <div className="bg-[#fcfdfc] border border-neutral-100 rounded-xl p-4 text-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Excused Absences</span>
              <span className="text-2xl font-black text-neutral-800 mt-2 block">
                {memberAttendance.filter(a => a.status === 'EXCUSED').length} meetings
              </span>
            </div>

            <div className="bg-[#fcfdfc] border border-neutral-100 rounded-xl p-4 text-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Arrears/Late Penalties</span>
              <span className="text-2xl font-black text-red-600 mt-2 block">
                {memberAttendance.filter(a => a.status === 'ABSENT' || a.status === 'LATE').length} counts
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
