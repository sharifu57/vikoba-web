'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useVikobaStore } from '@/lib/mockStore'
import {
  Users, WalletCards, BarChart3, HandCoins, Landmark, CircleDollarSign,
  AlertCircle, ArrowRight, ArrowUpRight, CalendarDays, MoreHorizontal, CheckCircle2
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const {
    currentGroup,
    members,
    payments,
    loans,
    fines,
    meetings,
    setCurrentGroupId
  } = useVikobaStore()

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Current Date display
  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Get active group stats directly from store updates
  const totalMembers = members.filter(m => m.groupId === currentGroup.id).length
  
  // Calculate aggregate metrics from live arrays
  const groupContributions = members
    .filter(m => m.groupId === currentGroup.id)
    .reduce((sum, m) => sum + m.contributions, 0)
    
  const groupSharesVal = members
    .filter(m => m.groupId === currentGroup.id)
    .reduce((sum, m) => sum + m.shares, 0) * 5000

  const activeLoans = loans.filter(l => l.groupId === currentGroup.id && l.status === 'DISBURSED')
  const totalOutstandingLoans = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0)

  const unpaidFines = fines.filter(f => f.groupId === currentGroup.id && f.status === 'UNPAID')
  const totalOutstandingFines = unpaidFines.reduce((sum, f) => sum + f.outstanding, 0)

  // Get next upcoming meeting
  const upcomingMeeting = meetings.find(m => m.groupId === currentGroup.id && m.status === 'UPCOMING')

  // Get administrative action counts
  const pendingLoans = loans.filter(l => l.groupId === currentGroup.id && l.status === 'PENDING').length
  const overdueContributionsCount = members.filter(m => m.groupId === currentGroup.id && m.fines > 0).length // proxy logic
  const outstandingFinesCount = unpaidFines.length

  // Filter payments for this group
  const groupPayments = payments.filter(p => p.groupId === currentGroup.id).slice(0, 5)

  return (
    <div className="dashboard-content max-w-7xl mx-auto px-6 py-8">
      {/* Welcome Heading */}
      <div className="dash-heading flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Overview</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Dashboard</span>
          </div>
          <h1 className="text-3xl font-black text-neutral-900 mt-2 flex items-center gap-1.5">
            Good morning, Juma Majid <span className="text-amber-500 text-lg">👋</span>
          </h1>
          <p className="text-neutral-400 text-xs mt-1">
            Here's what's happening with <strong className="text-neutral-700">{currentGroup.name}</strong> today ({todayStr}).
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/app/reports" className="px-4 py-2 border border-[#dfe8e2] hover:border-[#087f5b] hover:text-[#087f5b] bg-white rounded-lg text-xs font-bold transition flex items-center gap-1.5">
            View Reports <ArrowUpRight size={14} />
          </Link>
          <Link href="/app/payments" className="px-4 py-2 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5">
            Record Payment <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Row 1 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { title: 'Total Members', val: totalMembers, sub: '+4 this month', icon: Users, link: '/app/members' },
          { title: 'Total Contributions', val: fmt(groupContributions), sub: 'Live ledger tracking', icon: WalletCards, link: '/app/contributions' },
          { title: 'Total Shares Capital', val: fmt(groupSharesVal), sub: 'Value: TZS 5,000 / share', icon: BarChart3, link: '/app/shares' },
          { title: 'Outstanding Loans', val: fmt(totalOutstandingLoans), sub: `${activeLoans.length} active disbursements`, icon: HandCoins, link: '/app/loans' }
        ].map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className="bg-white border border-[#dfe8e2] rounded-xl p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{k.title}</span>
                <span className="bg-[#eaf6ef] text-[#087f5b] p-1.5 rounded-lg"><Icon size={16} /></span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-neutral-900">{k.val}</h3>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400 font-semibold">
                <span>{k.sub}</span>
                <Link href={k.link} className="text-[#087f5b] hover:underline flex items-center gap-0.5">
                  View <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Row 2 Additional FinTech KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Available Cash', val: fmt(currentGroup.availableCash), icon: Landmark, type: 'cash' },
          { title: 'Bank Account Balance', val: fmt(currentGroup.bankBalance), icon: Landmark, type: 'bank' },
          { title: 'Jamii / Social Fund', val: fmt(currentGroup.jamiiFund), icon: CircleDollarSign, type: 'jamii' },
          { title: 'Unpaid Group Fines', val: fmt(totalOutstandingFines), icon: AlertCircle, type: 'fines' }
        ].map((k, i) => (
          <div key={i} className="bg-[#fcfdfc] border border-[#dfe8e2]/70 rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1 min-width-0">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">{k.title}</span>
              <span className="text-sm font-extrabold text-neutral-800 mt-1 block truncate">{k.val}</span>
            </div>
            <div className={`p-2 rounded-lg ${k.type === 'fines' ? 'bg-red-50 text-red-600' : 'bg-neutral-50 text-neutral-600'}`}>
              <k.icon size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Table Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Contributions Trend & Payments Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Chart Panel */}
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6">
            <div className="flex items-center justify-between pb-6">
              <div>
                <h3 className="font-extrabold text-neutral-800 text-sm">Contributions Overview</h3>
                <p className="text-[10px] text-neutral-400">Monthly collection trend (Last 6 Months)</p>
              </div>
              <span className="text-[10px] font-bold text-[#087f5b] bg-[#eaf6ef] px-2 py-1 rounded">
                Active Year: 2026
              </span>
            </div>
            
            {/* SVG Line Chart */}
            <div className="h-48 w-full relative flex items-end">
              <svg viewBox="0 0 500 150" className="w-full h-full text-[#087f5b] overflow-visible">
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#eef3ef" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#eef3ef" strokeWidth="1" strokeDasharray="3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#eef3ef" strokeWidth="1" />
                
                {/* Gradient Fill */}
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#087f5b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#087f5b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,120 C80,105 150,90 220,50 S380,20 500,10 V150 H0 Z" 
                  fill="url(#chart-grad)"
                  className="transition-all duration-300"
                />
                
                {/* Chart Line Path */}
                <path 
                  d="M0,120 C80,105 150,90 220,50 S380,20 500,10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3.5" 
                  className="transition-all duration-300"
                />
                
                {/* Dot markers */}
                <circle cx="220" cy="50" r="5" fill="#087f5b" stroke="#fff" strokeWidth="1.5" />
                <circle cx="500" cy="10" r="5" fill="#087f5b" stroke="#fff" strokeWidth="1.5" />
              </svg>
              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-neutral-400 font-bold pt-2 px-1">
                <span>Mar 26</span>
                <span>Apr 26</span>
                <span>May 26</span>
                <span>Jun 26</span>
                <span>Jul 26</span>
                <span>Aug 26</span>
              </div>
            </div>
          </div>

          {/* Recent Ledger Payments Table */}
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="font-extrabold text-neutral-800 text-sm">Recent Activity</h3>
                <p className="text-[10px] text-neutral-400">Latest transactions registered in {currentGroup.name}</p>
              </div>
              <Link href="/app/payments" className="text-xs font-bold text-[#087f5b] hover:underline flex items-center gap-0.5">
                View Ledger <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100 pb-2">
                    <th className="py-2.5 font-bold">Date / Ref</th>
                    <th className="py-2.5 font-bold">Member</th>
                    <th className="py-2.5 font-bold">Type</th>
                    <th className="py-2.5 font-bold">Method</th>
                    <th className="py-2.5 font-bold text-right">Amount</th>
                    <th className="py-2.5 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {groupPayments.map((p, idx) => {
                    const memberName = members.find(m => m.id === p.memberId)?.name || 'Unknown'
                    return (
                      <tr key={idx} className="hover:bg-neutral-50/50">
                        <td className="py-3">
                          <span className="font-semibold text-neutral-800 block">{p.date}</span>
                          <span className="text-[9px] text-neutral-400 block mt-0.5">{p.reference}</span>
                        </td>
                        <td className="py-3 font-semibold text-neutral-700">{memberName}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.type === 'Contribution' ? 'bg-emerald-50 text-emerald-700' :
                            p.type === 'Loan Repayment' ? 'bg-blue-50 text-blue-700' :
                            p.type === 'Share Purchase' ? 'bg-amber-50 text-amber-800' :
                            'bg-neutral-50 text-neutral-600'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-500 font-medium">{p.method}</td>
                        <td className="py-3 font-black text-neutral-800 text-right">{fmt(p.amount)}</td>
                        <td className="py-3 text-center">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-extrabold">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {groupPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-neutral-400 text-xs">No transactions logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Meeting & Actions Queue */}
        <div className="flex flex-col gap-6">
          {/* Meeting Card */}
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <div>
                <h3 className="font-extrabold text-neutral-800 text-sm">Upcoming Meeting</h3>
                <p className="text-[10px] text-neutral-400">Regular weekly assembly</p>
              </div>
              <CalendarDays className="text-[#087f5b]" size={20} />
            </div>

            {upcomingMeeting ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#eaf6ef] text-[#087f5b] px-3 py-2 rounded-xl flex flex-col items-center">
                    <span className="text-xl font-black">{new Date(upcomingMeeting.date).getDate()}</span>
                    <span className="text-[8px] font-extrabold uppercase">Aug</span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-800 text-xs block">Weekly VIKOBA Meeting</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">{upcomingMeeting.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-semibold bg-neutral-50 rounded-lg p-2.5">
                  <span>⏰ {upcomingMeeting.time}</span>
                  <span>Agenda: Share Round</span>
                </div>
                <Link href={`/app/meetings`} className="w-full text-center py-2.5 border border-[#dfe8e2] hover:border-[#087f5b] hover:text-[#087f5b] font-bold rounded-lg text-xs transition">
                  View Meeting Panel
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 flex flex-col items-center gap-2">
                <CheckCircle2 className="text-[#087f5b]" size={28} />
                <span className="text-xs text-neutral-400">No upcoming meetings scheduled.</span>
              </div>
            )}
          </div>

          {/* Action Items List */}
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-neutral-800 text-sm">Outstanding Actions</h3>
              <p className="text-[10px] text-neutral-400">Group issues requiring manager attention</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Link 
                href="/app/loans/applications" 
                className="w-full flex items-center justify-between p-3 border border-neutral-100 hover:border-[#dfe8e2] rounded-xl hover:bg-neutral-50/50 transition text-left"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e7833c]" />
                  <span>Loan applications pending review</span>
                </div>
                <span className="text-xs font-black text-neutral-800">{pendingLoans}</span>
              </Link>

              <Link 
                href="/app/contributions" 
                className="w-full flex items-center justify-between p-3 border border-neutral-100 hover:border-[#dfe8e2] rounded-xl hover:bg-neutral-50/50 transition text-left"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d99521]" />
                  <span>Members with arrears fines</span>
                </div>
                <span className="text-xs font-black text-neutral-800">{overdueContributionsCount}</span>
              </Link>

              <Link 
                href="/app/fines" 
                className="w-full flex items-center justify-between p-3 border border-neutral-100 hover:border-[#dfe8e2] rounded-xl hover:bg-neutral-50/50 transition text-left"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d95d5d]" />
                  <span>Unpaid member penalties</span>
                </div>
                <span className="text-xs font-black text-neutral-800">{outstandingFinesCount}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
