'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useVikobaStore } from '@/lib/mockStore'
import { reportService, type DashboardSummary } from '@/lib/api/services'
import {
  Users, WalletCards, BarChart3, HandCoins, Landmark, CircleDollarSign,
  AlertCircle, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2,
  UserRound, CalendarRange, TrendingUp
} from 'lucide-react'

const formatCurrency = (value: number, currency: string) => `${currency} ${value.toLocaleString()}`

const formatDate = (value?: string) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const {
    isHydrated,
    currentGroup,
    members,
    payments,
    loans,
    fines,
    meetings,
  } = useVikobaStore()

  const [currentUser, setCurrentUser] = useState({
    name: 'User',
    email: '',
    phone: '',
    role: 'Administrator',
  })

  const [serverStats, setServerStats] = useState<DashboardSummary | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userJson = window.localStorage.getItem('v360_user')
    const sessionJson = window.localStorage.getItem('v360_session')

    const sessionUser = sessionJson ? JSON.parse(sessionJson)?.user : null
    const storedUser = userJson ? JSON.parse(userJson) : null
    const selectedUser = sessionUser || storedUser

    if (selectedUser) {
      setCurrentUser({
        name: selectedUser.name || selectedUser.username || 'User',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        role: selectedUser.role || 'Administrator',
      })
    }
  }, [])

  useEffect(() => {
    // Resolve numeric group id: try v360_currentGroup JSON, fallback to v360_currentGroupId, then currentGroup.id
    if (typeof window === 'undefined') return

    const currentGroupRaw = window.localStorage.getItem('v360_currentGroup')
    const fallbackGroupId = window.localStorage.getItem('v360_currentGroupId')

    let resolvedId: number | null = null

    if (currentGroupRaw) {
      try {
        const parsed = JSON.parse(currentGroupRaw)
        const candidate = parsed?.id ?? parsed?.groupId ?? parsed?.id
        if (candidate !== undefined && candidate !== null) {
          const asNum = Number(candidate)
          if (!Number.isNaN(asNum)) resolvedId = asNum
        }
      } catch {
        // ignore
      }
    }

    if (resolvedId === null && fallbackGroupId) {
      const asNum = Number(fallbackGroupId)
      if (!Number.isNaN(asNum)) resolvedId = asNum
    }

    if (resolvedId === null && currentGroup?.id !== undefined && currentGroup?.id !== null) {
      const asNum = Number(currentGroup.id)
      if (!Number.isNaN(asNum)) resolvedId = asNum
    }

    if (resolvedId === null) {
      console.log('No numeric group id available; skipping server stats fetch.')
      return
    }

    console.log('Fetching ======>>>> numeric group ID:', resolvedId)
    setLoadingStats(true)
    reportService
      .getSummary(String(resolvedId))
      .then((res) => {
        const payload = (res as any)
        const data = payload?.data ?? res

        const normalized: DashboardSummary = {
          totalMembers: (data?.totalGroupMembers ?? data?.totalMembers ?? 0) as number,
          totalSaved: (data?.totalGroupContributionAmount ?? data?.totalSaved ?? 0) as number,
          totalOutstanding: (data?.totalGroupOutStandingLoan ?? data?.totalOutstanding ?? 0) as number,
          // backend may return totalShares (count) or not; fall back to outstanding loan amount
          totalLoans: (data?.totalShares ?? data?.totalLoans ?? data?.totalGroupOutStandingLoan ?? 0) as number,
        }

        setServerStats(normalized)
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats', err)
        setServerStats(null)
      })
      .finally(() => setLoadingStats(false))
  }, [currentGroup?.id])

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-[#dfe8e2] bg-white px-5 py-4 text-sm font-semibold text-neutral-500 shadow-sm">
          Loading dashboard data...
        </div>
      </div>
    )
  }

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const totalMembers = serverStats?.totalMembers ?? members.filter(m => m.groupId === currentGroup.id).length
  const groupContributions = serverStats?.totalSaved ?? members
    .filter(m => m.groupId === currentGroup.id)
    .reduce((sum, m) => sum + m.contributions, 0)
  const groupSharesVal = serverStats?.totalSaved ? serverStats.totalSaved : (members
    .filter(m => m.groupId === currentGroup.id)
    .reduce((sum, m) => sum + m.shares, 0) * 5000)

  const activeLoans = loans.filter(l => l.groupId === currentGroup.id && l.status === 'DISBURSED')
  const totalOutstandingLoans = serverStats?.totalOutstanding ?? activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0)

  const unpaidFines = fines.filter(f => f.groupId === currentGroup.id && f.status === 'UNPAID')
  const totalOutstandingFines = unpaidFines.reduce((sum, f) => sum + (f.outstanding ?? 0), 0)

  const upcomingMeeting = meetings.find(m => m.groupId === currentGroup.id && m.status === 'UPCOMING')
  const pendingLoans = loans.filter(l => l.groupId === currentGroup.id && l.status === 'PENDING').length
  const overdueContributionsCount = members.filter(m => m.groupId === currentGroup.id && m.fines > 0).length
  const outstandingFinesCount = unpaidFines.length
  const groupPayments = payments.filter(p => p.groupId === currentGroup.id).slice(0, 5)

  const chartBars = [74, 58, 82, 66, 90, 77]
  const groupStart = currentGroup.startDate || '2024-01-15'
  const groupEnd = currentGroup.endDate || '2030-01-15'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 rounded-3xl border border-[#dfe8e2] bg-gradient-to-r from-[#0b7c5a] via-[#0b8d67] to-[#0f6a52] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
              <span>Overview</span>
              <span className="text-emerald-200">/</span>
              <span>Dashboard</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Good morning, {currentUser.name}
            </h1>
            <p className="mt-2 text-sm text-emerald-50">
              {currentGroup.name} is active today • {todayStr}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm min-w-[220px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">Current VIKOBA group</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-black text-[#0b7c5a]">
                {currentGroup.name.substring(0, 1)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{currentGroup.name}</p>
                <p className="text-[10px] text-emerald-100">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
              <CalendarRange size={12} />
              Started
            </div>
            <p className="mt-2 text-base font-black text-white">{formatDate(groupStart)}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
              <CalendarDays size={12} />
              End date
            </div>
            <p className="mt-2 text-base font-black text-white">{formatDate(groupEnd)}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
              <UserRound size={12} />
              Active member
            </div>
            <p className="mt-2 text-base font-black text-white">{currentUser.name}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Total Members', value: totalMembers, meta: 'Active members', icon: Users, href: '/app/members' },
          { title: 'Contributions', value: formatCurrency(groupContributions, currentGroup.currency), meta: 'Live ledger', icon: WalletCards, href: '/app/contributions' },
          { title: 'Shares', value: formatCurrency(groupSharesVal, currentGroup.currency), meta: 'Capital value', icon: BarChart3, href: '/app/shares' },
          { title: 'Outstanding Loans', value: formatCurrency(totalOutstandingLoans, currentGroup.currency), meta: `${activeLoans.length} active`, icon: HandCoins, href: '/app/loans' },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-2xl border border-[#dfe8e2] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{item.title}</p>
                <div className="rounded-xl bg-[#eaf6ef] p-2 text-[#087f5b]">
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-4 text-xl font-black text-neutral-900">{item.value}</p>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2 text-[10px] text-neutral-500">
                <span>{item.meta}</span>
                <Link href={item.href} className="inline-flex items-center gap-1 font-bold text-[#087f5b]">
                  View <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-2xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-neutral-800">Contribution trend</h2>
              <p className="text-[10px] text-neutral-400">Monthly collection performance</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#eaf6ef] px-2 py-1 text-[9px] font-bold text-[#087f5b]">
              <TrendingUp size={10} /> 12.4% growth
            </div>
          </div>

          <div className="mt-6 flex h-40 items-end gap-3">
            {chartBars.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-[#0b7c5a] to-[#7ec5a5]"
                    style={{ height: `${value}%` }}
                  />
                </div>
                <span className="text-[9px] font-semibold text-neutral-400">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h2 className="text-sm font-black text-neutral-800">Next meeting</h2>
                <p className="text-[10px] text-neutral-400">Weekly assembly</p>
              </div>
              <CalendarDays className="text-[#087f5b]" size={18} />
            </div>

            {upcomingMeeting ? (
              <div className="mt-3 rounded-2xl bg-[#f5faf6] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white text-[#087f5b] shadow-sm">
                    <span className="text-lg font-black">{new Date(upcomingMeeting.date).getDate()}</span>
                    <span className="text-[8px] font-black uppercase">{new Date(upcomingMeeting.date).toLocaleString('en-GB', { month: 'short' })}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-800">{upcomingMeeting.agenda}</p>
                    <p className="text-[10px] text-neutral-500">{upcomingMeeting.location}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-2.5 py-2 text-[10px] text-neutral-600">
                  <span>⏰ {upcomingMeeting.time}</span>
                  <span>{upcomingMeeting.status}</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-[#dfe8e2] p-4 text-center text-xs text-neutral-400">
                No upcoming meeting scheduled.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h2 className="text-sm font-black text-neutral-800">Group finance</h2>
                <p className="text-[10px] text-neutral-400">Quick summary</p>
              </div>
              <Landmark className="text-[#087f5b]" size={18} />
            </div>

            <div className="space-y-3">
              {[
                { label: 'Available cash', value: formatCurrency(currentGroup.availableCash, currentGroup.currency), icon: Landmark },
                { label: 'Bank balance', value: formatCurrency(currentGroup.bankBalance, currentGroup.currency), icon: Landmark },
                { label: 'Jamii fund', value: formatCurrency(currentGroup.jamiiFund, currentGroup.currency), icon: CircleDollarSign },
                { label: 'Unpaid fines', value: formatCurrency(totalOutstandingFines, currentGroup.currency), icon: AlertCircle },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <div className="rounded-lg bg-white p-1.5 text-[#087f5b]">
                        <Icon size={12} />
                      </div>
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-neutral-800">{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-sm font-black text-neutral-800">Recent activity</h2>
              <p className="text-[10px] text-neutral-400">Latest payment records</p>
            </div>
            <Link href="/app/payments" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#087f5b]">
              View ledger <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-bold">Date</th>
                  <th className="px-3 py-2 font-bold">Member</th>
                  <th className="px-3 py-2 font-bold">Type</th>
                  <th className="px-3 py-2 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {groupPayments.map((payment, index) => {
                  const memberName = members.find(m => m.id === payment.memberId)?.name || 'Unknown'
                  return (
                    <tr key={`${payment.reference}-${index}`} className="border-t border-neutral-100">
                      <td className="px-3 py-2 text-neutral-600">{payment.date}</td>
                      <td className="px-3 py-2 font-semibold text-neutral-800">{memberName}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">{payment.type}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-black text-neutral-800">{formatCurrency(payment.amount, currentGroup.currency)}</td>
                    </tr>
                  )
                })}
                {groupPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-5 text-center text-neutral-400">No payments logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dfe8e2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-sm font-black text-neutral-800">Actions needed</h2>
              <p className="text-[10px] text-neutral-400">Priority notices</p>
            </div>
            <CheckCircle2 className="text-[#087f5b]" size={18} />
          </div>

          <div className="space-y-3">
            <Link href="/app/loans/applications" className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
              <span className="text-[10px] font-semibold text-neutral-700">Loan applications</span>
              <span className="rounded-full bg-orange-100 px-2 py-1 text-[9px] font-black text-orange-700">{pendingLoans}</span>
            </Link>
            <Link href="/app/contributions" className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
              <span className="text-[10px] font-semibold text-neutral-700">Arrears members</span>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-700">{overdueContributionsCount}</span>
            </Link>
            <Link href="/app/fines" className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
              <span className="text-[10px] font-semibold text-neutral-700">Unpaid fines</span>
              <span className="rounded-full bg-red-100 px-2 py-1 text-[9px] font-black text-red-700">{outstandingFinesCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
