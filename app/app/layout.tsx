'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { VikobaStoreProvider, useVikobaStore } from '@/lib/mockStore'
import { useLanguage, type Locale } from '@/lib/i18n'
import {
  LayoutDashboard, Users, CalendarDays, WalletCards, BarChart3,
  CreditCard, HandCoins, BookOpen, CircleDollarSign, AlertCircle,
  FileText, ShieldCheck, Settings, LogOut, Search, Bell, ChevronDown, Menu, X, MoreHorizontal,
  TriangleAlert
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { clearVikobaLocalState } from '@/lib/api/client'

// Main Layout component wrapped inside Provider
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <VikobaStoreProvider>
      <AppShellInner>{children}</AppShellInner>
    </VikobaStoreProvider>
  )
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, setLocale, t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [user, setUser] = useState({
    id: null,
    name: 'User',
    username: 'User',
    email: '',
    phone: '',
    role: 'Administrator',
    status: 'ACTIVE'
  })

  const {
    groups,
    currentGroupId,
    setCurrentGroupId,
    currentGroup,
    notifications,
    markAllNotificationsRead
  } = useVikobaStore()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionStorage = localStorage.getItem('v360_session')
      const userStorage = localStorage.getItem('v360_user')

      const parsedSession = sessionStorage ? JSON.parse(sessionStorage) : null
      const parsedUser = userStorage ? JSON.parse(userStorage) : null
      const currentUser = parsedSession?.user || parsedUser || null

      if (currentUser) {
        setUser({
          id: currentUser.id ?? null,
          name: currentUser.name || currentUser.username || 'User',
          username: currentUser.username || currentUser.name || 'User',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          role: currentUser.role || 'Administrator',
          status: currentUser.status || 'ACTIVE'
        })
      }

      const storedGroup = localStorage.getItem('v360_currentGroup')
      if (storedGroup) {
        try {
          const parsedGroup = JSON.parse(storedGroup)
          const groupId = String(parsedGroup?.id ?? parsedGroup?.groupId ?? currentGroupId)
          const groupName = parsedGroup?.groupName || parsedGroup?.name || 'My Group'

          if (groupId) {
            setCurrentGroupId(groupId)
            localStorage.setItem('v360_currentGroupId', String(groupId))
          }

          if (groupName && currentGroup?.name !== groupName) {
            localStorage.setItem('v360_currentGroup', JSON.stringify({
              ...parsedGroup,
              id: groupId,
              name: groupName,
              groupName,
              currency: parsedGroup?.currency || 'TZS',
            }))
          }
        } catch {
          // ignore malformed stored group data
        }
      }
    }
  }, [currentGroupId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const protectedRoutes = ['/app/dashboard', '/app/members', '/app/meetings', '/app/contributions', '/app/shares', '/app/payments', '/app/expenses', '/app/finance', '/app/loans', '/app/loans/applications', '/app/social-fund', '/app/fines', '/app/reports', '/app/users', '/app/roles', '/app/settings']
    const token = localStorage.getItem('v360_access_token')
    const setupComplete = localStorage.getItem('v360_group_setup_complete') === 'true' || localStorage.getItem('v360_group_setup_done') === 'true'
    const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route))

    // If user has token but hasn't completed setup, force them to settings (except settings page)
    if (token && !setupComplete && isProtectedRoute && pathname !== '/app/settings') {
      router.replace('/app/settings')
      return
    }

    // Auth guard: if route is protected and no token, redirect to login with return URL
    if (isProtectedRoute && !token) {
      // don't redirect if already on an auth route
      if (!pathname.startsWith('/auth')) {
        const returnUrl = encodeURIComponent(pathname || '/app/dashboard')
        router.replace(`/auth/login?returnUrl=${returnUrl}`)
      }
    }
  }, [pathname, router])

  const handleGroupSelect = (id: string) => {
    setCurrentGroupId(id)
    setGroupDropdownOpen(false)
  }

  const handleSignOut = () => {
    if (typeof window === 'undefined') return

    clearVikobaLocalState()

    setShowSignOutDialog(false)
    router.push('/')
  }

  const unreadNotifications = notifications.filter(n => !n.read)

  // Navigation schema
  const navItems = [
    { label: 'Overview', isHeader: true },
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },

    { label: 'VIKOBA Group', isHeader: true },
    { label: 'Members', path: '/app/members', icon: Users },
    { label: 'Meetings', path: '/app/meetings', icon: CalendarDays },

    { label: 'Finance Management', isHeader: true },
    { label: 'Contributions', path: '/app/contributions', icon: WalletCards },
    { label: 'Shares (Hisa)', path: '/app/shares', icon: BarChart3 },
    { label: 'Payments Received', path: '/app/payments', icon: CreditCard },
    { label: 'Expenses logged', path: '/app/expenses', icon: CreditCard },
    { label: 'Ledger Accounts', path: '/app/finance', icon: WalletCards },

    { label: 'Loans & Repayments', isHeader: true },
    { label: 'Loan Dashboard', path: '/app/loans', icon: HandCoins },
    { label: 'Applications', path: '/app/loans/applications', icon: BookOpen, badge: 'applications' },

    { label: 'Community & Penalties', isHeader: true },
    { label: 'Jamii Fund', path: '/app/social-fund', icon: CircleDollarSign },
    { label: 'Fines Tracker', path: '/app/fines', icon: AlertCircle },

    { label: 'Reports & Audits', isHeader: true },
    { label: 'Reports Center', path: '/app/reports', icon: FileText },
    { label: 'Audit Logs', path: '/app/audit-logs', icon: ShieldCheck }
  ]

  const adminItems = [
    { label: 'Administration', isHeader: true },
    { label: 'System Users', path: '/app/users', icon: Users },
    { label: 'Roles & Permissions', path: '/app/roles', icon: ShieldCheck },
    { label: 'Group Settings', path: '/app/settings', icon: Settings }
  ]

  const checkActive = (path: string) => {
    if (path === '/app/dashboard' && pathname === '/app') return true
    return pathname.startsWith(path)
  }

  // Count pending items for badges
  const pendingLoanApps = useVikobaStore().loans.filter(l => l.status === 'PENDING').length

  return (
    <div className="app-shell flex min-h-screen bg-[#f7f9f7]">
      {/* Sidebar container */}
      <aside className={`sidebar fixed md:sticky top-0 z-50 h-screen w-[260px] bg-white border-r border-[#dfe8e2] px-4 py-5 flex flex-col justify-between shrink-0 transition-all duration-200 ${mobileOpen ? 'left-0 shadow-2xl shadow-emerald-950/20' : '-left-[260px] md:left-0'}`}>
        <div>
          {/* Brand header */}
          <div className="side-brand flex items-center justify-between pb-5 border-b border-[#dfe8e2]/60 px-2">
            <Link href="/" className="font-black text-lg flex items-center gap-1">
              <span className="bg-[#087f5b] text-white rounded-lg w-7 h-7 flex items-center justify-center font-black">V</span>
              <span>IKOBA<strong className="text-[#087f5b]">360</strong></span>
            </Link>
            <button className="md:hidden text-neutral-500 hover:text-neutral-900" onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Group Switcher dropdown */}
          <div className="relative mt-4 px-1">
            <button
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="group-switch w-full flex items-center justify-between bg-[#f2f8f3] border border-[#dfece1] hover:border-[#8bc6a7] rounded-xl p-3 text-left transition select-none cursor-pointer"
            >
              <div className="group-mark w-7 h-7 rounded-lg bg-[#087f5b] text-white font-extrabold flex items-center justify-center text-xs">
                {currentGroup?.name.substring(0, 1)}
              </div>
              <div className="flex-1 min-width-0 px-2.5">
                <span className="text-[9px] text-[#789087] font-semibold uppercase block">Active Group</span>
                <span className="text-xs font-bold text-neutral-800 block truncate">{currentGroup?.name}</span>
              </div>
              <ChevronDown size={14} className="text-neutral-500" />
            </button>

            {groupDropdownOpen && (
              <div className="absolute left-1 right-1 top-[56px] bg-white border border-[#dfe8e2] rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleGroupSelect(g.id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-[#f3f8f4] ${g.id === currentGroupId ? 'bg-[#eaf6ef] text-[#087f5b]' : 'text-neutral-600'}`}
                  >
                    <span>{g.name}</span>
                    <span className="text-[10px] opacity-75 font-normal">{g.currency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation link sets */}
          <div className="nav-list overflow-y-auto max-h-[calc(100vh-210px)] mt-4 pr-1 flex flex-col gap-0.5">
            {navItems.map((item, idx) => {
              if (item.isHeader) {
                return (
                  <div key={idx} className="nav-group text-[9px] font-black text-neutral-400 uppercase tracking-widest px-3 pt-4 pb-1">
                    {item.label}
                  </div>
                )
              }
              const active = item.path ? checkActive(item.path) : false
              const ItemIcon = item.icon!

              return (
                <Link
                  key={idx}
                  href={item.path!}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition font-semibold ${active ? 'bg-[#e6f5eb] text-[#087f5b]' : 'text-[#697a71] hover:bg-[#f3f8f4]'}`}
                >
                  <ItemIcon size={16} className={active ? 'text-[#087f5b]' : 'text-[#8ba093]'} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge === 'applications' && pendingLoanApps > 0 && (
                    <span className="bg-[#e7833c] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingLoanApps}</span>
                  )}
                </Link>
              )
            })}

            {/* Admin sub-menu if Admin */}
            {user.role === 'Administrator' && (
              <>
                {adminItems.map((item, idx) => {
                  if (item.isHeader) {
                    return (
                      <div key={idx} className="nav-group text-[9px] font-black text-neutral-400 uppercase tracking-widest px-3 pt-4 pb-1">
                        {item.label}
                      </div>
                    )
                  }
                  const active = item.path ? checkActive(item.path) : false
                  const ItemIcon = item.icon!

                  return (
                    <Link
                      key={idx}
                      href={item.path!}
                      onClick={() => setMobileOpen(false)}
                      className={`nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition font-semibold ${active ? 'bg-[#e6f5eb] text-[#087f5b]' : 'text-[#697a71] hover:bg-[#f3f8f4]'}`}
                    >
                      <ItemIcon size={16} className={active ? 'text-[#087f5b]' : 'text-[#8ba093]'} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Sidebar Footer settings / logout */}
        <div className="side-footer pt-3 border-t border-[#dfe8e2]/60 flex flex-col gap-1">
          <Link
            href="/app/settings"
            onClick={() => setMobileOpen(false)}
            className={`nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${pathname === '/app/settings' ? 'bg-[#e6f5eb] text-[#087f5b]' : 'text-[#697a71] hover:bg-[#f3f8f4]'}`}
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowSignOutDialog(true)}
            className="nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 text-left w-full transition"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
            <DialogContent>
              <DialogHeader className="space-y-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <TriangleAlert size={20} />
                </div>
                <DialogTitle className="text-center text-xl font-black text-neutral-900">Sign out?</DialogTitle>
                <DialogDescription className="text-center text-sm text-neutral-500">
                  You will be signed out of VIKOBA360. Your saved session and group setup state will remain protected until you sign in again.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6 sm:justify-between">
                <Button variant="outline" type="button" onClick={() => setShowSignOutDialog(false)} className="flex-1 sm:flex-none">Cancel</Button>
                <Button type="button" onClick={handleSignOut} className="flex-1 bg-red-600 text-white hover:bg-red-700 sm:flex-none">Sign out</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="app-header bg-white border-b border-[#dfe8e2] h-[68px] px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-[#607169] p-1 hover:bg-[#eaf6ef] rounded" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="search-box hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[#dfe8e2] rounded-lg bg-[#fcfdfc] w-64">
              <Search size={14} className="text-neutral-400" />
              <input
                type="text"
                placeholder="Search code, member, transaction..."
                className="bg-transparent border-0 outline-none text-xs w-full text-neutral-700"
              />
            </div>
          </div>

          <div className="header-right flex items-center gap-5 relative">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-[#dfe8e2] bg-[#fcfdfc] px-2 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{t('common.language')}</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-transparent text-xs font-semibold text-neutral-700 outline-none cursor-pointer"
                aria-label="Language switcher"
              >
                <option value="sw">{t('common.swahili')}</option>
                <option value="en">{t('common.english')}</option>
              </select>
            </div>

            {/* Notifications Hub */}
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen)
                if (!notificationsOpen && unreadNotifications.length > 0) {
                  markAllNotificationsRead()
                }
              }}
              className="notification-button p-2 text-[#607169] hover:bg-[#f3f8f4] rounded-lg transition relative cursor-pointer select-none"
            >
              <Bell size={18} />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e7833c] border border-white" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="notification-pop absolute right-16 top-11 w-72 bg-white border border-[#dfe8e2] shadow-xl rounded-xl p-4 z-50 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <span className="text-xs font-black text-neutral-800">Notifications</span>
                    <span className="text-[10px] text-neutral-400 font-bold">{notifications.length} Total</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto flex flex-col divide-y divide-neutral-50/80">
                    {notifications.map(n => (
                      <div key={n.id} className="py-2.5 first:pt-1 last:pb-1">
                        <p className={`text-[11px] leading-relaxed ${!n.read ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}`}>
                          {n.message}
                        </p>
                        <span className="text-[8px] text-neutral-400 block mt-1">{n.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Profile widget */}
            <div className="profile flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutDialog(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#dfe8e2] bg-[#f8faf8] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-neutral-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={14} />
                Logout
              </button>
              <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                <DialogContent>
                  <DialogHeader className="space-y-3">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <TriangleAlert size={20} />
                    </div>
                    <DialogTitle className="text-center text-xl font-black text-neutral-900">Sign out?</DialogTitle>
                    <DialogDescription className="text-center text-sm text-neutral-500">
                      This will end your current VIKOBA360 session. You can sign back in any time.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-6 sm:justify-between">
                    <Button variant="outline" type="button" onClick={() => setShowSignOutDialog(false)} className="flex-1 sm:flex-none">Cancel</Button>
                    <Button type="button" onClick={handleSignOut} className="flex-1 bg-red-600 text-white hover:bg-red-700 sm:flex-none">Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="profile-avatar w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="font-bold text-neutral-800 text-xs">{user.name}</span>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase">{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard inner routes viewport */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-6">
          {children}
        </main>

        {/* Responsive Mobile Bottom Navigation */}
        <nav className="bottom-nav fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#dfe8e2] md:hidden flex justify-around items-center z-30">
          <Link href="/app/dashboard" className={`flex flex-col items-center justify-center gap-1 text-[9px] font-bold ${pathname === '/app/dashboard' ? 'text-[#087f5b]' : 'text-neutral-400'}`}>
            <LayoutDashboard size={18} />
            <span>Home</span>
          </Link>
          <Link href="/app/members" className={`flex flex-col items-center justify-center gap-1 text-[9px] font-bold ${pathname.startsWith('/app/members') ? 'text-[#087f5b]' : 'text-neutral-400'}`}>
            <Users size={18} />
            <span>Members</span>
          </Link>
          <Link href="/app/contributions" className={`flex flex-col items-center justify-center gap-1 text-[9px] font-bold ${pathname.startsWith('/app/contributions') ? 'text-[#087f5b]' : 'text-neutral-400'}`}>
            <WalletCards size={18} />
            <span>Finance</span>
          </Link>
          <Link href="/app/loans" className={`flex flex-col items-center justify-center gap-1 text-[9px] font-bold ${pathname.startsWith('/app/loans') ? 'text-[#087f5b]' : 'text-neutral-400'}`}>
            <HandCoins size={18} />
            <span>Loans</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-[9px] font-bold text-neutral-400"
          >
            <MoreHorizontal size={18} />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
