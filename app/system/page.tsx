'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Users, ShieldCheck, Activity, ArrowLeft, LogOut, Search, RefreshCw, AlertTriangle, Crown, ChevronLeft, ChevronRight } from 'lucide-react'
import { VikobaLogo } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { clearVikobaLocalState, getAccessToken, refreshSessionIfNeeded, SESSION_EXPIRED_EVENT, SESSION_IDLE_TIMEOUT_MS } from '@/lib/api/client'
import { systemAdmin, type SystemOverview, type SystemGroup, type SystemPerson, type SystemAudit, type SystemPage } from '@/lib/api/system-admin'
import { toast } from 'sonner'

type Tab = 'groups' | 'members' | 'audit'
const empty = <T,>(): SystemPage<T> => ({ content: [], totalElements: 0, totalPages: 0, number: 0 })
const message = (error: unknown) => error instanceof Error ? error.message : 'Unable to load system data. Please try again.'
const healthyChair = (group: SystemGroup) => group.chairs.length === 1 && group.chairs[0].eligibleForChair

export default function SystemPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [tab, setTab] = useState<Tab>('groups')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<SystemGroup | null>(null)
  const [groups, setGroups] = useState(empty<SystemGroup>)
  const [members, setMembers] = useState(empty<SystemPerson>)
  const [audit, setAudit] = useState(empty<SystemAudit>)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [changing, setChanging] = useState<SystemGroup | null>(null)

  useEffect(() => {
    if (!getAccessToken()) { router.replace('/auth/login'); return }
    let active = true
    systemAdmin.access().then(result => {
      if (active) { setAllowed(result.data.superAdmin); setError('') }
    }).catch(err => { if (active) setError(message(err)) })
    return () => { active = false }
  }, [router, revision])

  useEffect(() => {
    if (!allowed) return
    let active = true
    systemAdmin.overview().then(result => { if (active) setOverview(result.data) })
      .catch(err => { if (active) setError(message(err)) })
    return () => { active = false }
  }, [allowed, revision])

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(search); setPage(0) }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!allowed) return
    let active = true
    setLoading(true); setError('')
    const load = async () => {
      try {
        if (tab === 'groups') { const result = await systemAdmin.groups(query, page); if (active) setGroups(result.data) }
        else if (tab === 'members') { const result = await systemAdmin.members(query, page, filter?.id); if (active) setMembers(result.data) }
        else { const result = await systemAdmin.audit(page); if (active) setAudit(result.data) }
      } catch (err) { if (active) setError(message(err)) }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [allowed, tab, query, page, filter, revision])

  useEffect(() => {
    if (!allowed) return
    const signOut = () => { clearVikobaLocalState(); router.replace('/auth/login?reason=session-expired') }
    let last = Date.now()
    const activity = () => {
      if (!getAccessToken() || Date.now() - last >= SESSION_IDLE_TIMEOUT_MS) signOut()
      else { last = Date.now(); localStorage.setItem('v360_last_activity', String(last)) }
    }
    const interval = window.setInterval(() => {
      if (Date.now() - last >= SESSION_IDLE_TIMEOUT_MS) signOut()
      else void refreshSessionIfNeeded().catch(signOut)
    }, 30_000)
    const events = ['pointerdown', 'keydown', 'scroll']
    events.forEach(event => window.addEventListener(event, activity, { passive: true }))
    window.addEventListener(SESSION_EXPIRED_EVENT, signOut)
    return () => { window.clearInterval(interval); events.forEach(event => window.removeEventListener(event, activity)); window.removeEventListener(SESSION_EXPIRED_EVENT, signOut) }
  }, [allowed, router])

  const selectTab = (next: Tab) => { setTab(next); setPage(0); setSearch(''); setQuery(''); setFilter(null) }
  const directory = (group: SystemGroup) => { setTab('members'); setFilter(group); setPage(0); setSearch(''); setQuery('') }
  const result = tab === 'groups' ? groups : tab === 'members' ? members : audit
  const signOut = () => { clearVikobaLocalState(); router.replace('/auth/login') }

  if (allowed !== true) return <main className="min-h-screen bg-[#f5f7f4] grid place-items-center p-6"><div className="max-w-md rounded-2xl bg-white border p-8 text-center space-y-4"><ShieldCheck className="mx-auto text-emerald-700" size={40} /><h1 className="text-xl font-bold">{allowed === false ? 'System administrator access required' : 'Checking system access'}</h1><p className="text-sm text-neutral-600">{error || (allowed === false ? 'Your account can continue using its assigned groups. System-wide access is reserved for super administrators.' : 'Verifying your account permissions…')}</p>{error && <Button onClick={() => setRevision(v => v + 1)}>Try again</Button>}<Link className="block text-sm text-emerald-700 underline" href="/app/dashboard">Return to my group</Link></div></main>

  return <div className="min-h-screen bg-[#f5f7f4] text-neutral-900">
    <header className="bg-white border-b px-5 md:px-10 py-4 flex flex-wrap items-center justify-between gap-4"><Link href="/"><VikobaLogo compact /></Link><div className="flex items-center gap-4"><span className="rounded-full bg-emerald-50 text-emerald-800 px-3 py-1.5 text-xs font-semibold flex items-center gap-2"><ShieldCheck size={14} /> Super administrator</span><Button variant="ghost" onClick={signOut}><LogOut size={16} /> Sign out</Button></div></header>
    <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-8">
      <div className="rounded-2xl bg-[#103e32] text-white p-6 md:p-8 flex flex-wrap justify-between gap-5 items-center mb-7"><div><p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-2">All organizations · All groups</p><h1 className="text-3xl font-bold tracking-tight">System 360</h1><p className="text-emerald-100/80 text-sm mt-2 max-w-xl">See your community across every group. Keep leadership accountable and every membership in view.</p></div><div className="flex gap-2"><Button variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white" onClick={() => setRevision(v => v + 1)}><RefreshCw size={16} /> Refresh</Button><Link href="/app/dashboard" className="text-sm flex items-center gap-2 px-3"><ArrowLeft size={16} /> My group</Link></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{[
        { label: 'Groups', value: overview?.groups, detail: `${overview?.activeGroups ?? '—'} active groups`, icon: Building2 },
        { label: 'Members', value: overview?.members, detail: `${overview?.memberships ?? '—'} group memberships`, icon: Users },
        { label: 'Organizations', value: overview?.organizations, detail: `${overview?.users ?? '—'} registered accounts`, icon: Activity },
        { label: 'Leadership attention', value: overview?.leadershipIssues, detail: 'Groups needing one active chair', icon: Crown },
      ].map(stat => <div key={stat.label} className="bg-white border border-neutral-200 rounded-xl p-5"><div className="flex items-center justify-between text-neutral-500 text-xs font-medium"><span>{stat.label}</span><stat.icon size={18} /></div><p className="text-3xl font-bold mt-3">{stat.value?.toLocaleString() ?? '—'}</p><p className="text-xs text-neutral-500 mt-2">{stat.detail}</p></div>)}</div>
      {!!overview?.leadershipIssues && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-amber-900"><AlertTriangle size={20} className="shrink-0" /><p className="text-sm"><strong>{overview.leadershipIssues} groups need leadership attention.</strong> Appoint one active chairperson to resolve missing, duplicate, or inactive chairs.</p></div>}
      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b flex flex-wrap justify-between gap-4 items-center"><nav className="flex gap-1" aria-label="System sections">{(['groups', 'members', 'audit'] as Tab[]).map(item => <button key={item} onClick={() => selectTab(item)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === item ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-500 hover:bg-neutral-50'}`} aria-current={tab === item ? 'page' : undefined}>{item === 'groups' ? 'Groups & leadership' : item === 'members' ? 'Member directory' : 'Audit history'}</button>)}</nav>{tab !== 'audit' && <div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-3 text-neutral-400" /><Input aria-label="Search directory" placeholder={tab === 'groups' ? 'Search group name or code' : 'Search name, phone, group…'} className="pl-9" value={search} onChange={event => setSearch(event.target.value)} /></div>}</div>
        {filter && <div className="px-5 py-3 bg-emerald-50 text-sm flex justify-between items-center"><span>Members of <strong>{filter.name}</strong></span><button className="underline text-emerald-800" onClick={() => { setFilter(null); setPage(0) }}>Show all groups</button></div>}
        {error && <div role="alert" className="p-5 text-red-700 bg-red-50">{error} <button className="underline ml-2" onClick={() => setRevision(v => v + 1)}>Retry</button></div>}
        {loading ? <div className="p-16 text-center text-neutral-500" role="status">Loading {tab}…</div> : !error && <>
          <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr>{(tab === 'groups' ? ['Group', 'Organization', 'Members', 'Chairperson', 'Actions'] : tab === 'members' ? ['Member', 'Group', 'Contact', 'Status', 'Roles'] : ['When', 'Actor', 'Group', 'Action', 'Details']).map(label => <th className="px-5 py-3 font-semibold" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y">
            {tab === 'groups' && groups.content.map(group => <tr key={group.id} className="hover:bg-neutral-50/70"><td className="px-5 py-4"><strong className="block">{group.name}</strong><span className="text-xs text-neutral-500">{group.code} · {group.status} · {group.currency}</span></td><td className="px-5 py-4 text-neutral-600">{group.organization}</td><td className="px-5 py-4"><button className="text-emerald-700 underline" onClick={() => directory(group)}>{group.members} members</button><span className="block text-xs text-neutral-500 mt-1">{group.activeMembers} active</span></td><td className="px-5 py-4"><span className={healthyChair(group) ? 'text-neutral-800' : 'text-amber-700 font-medium'}>{group.chairs.length ? group.chairs.map(chair => chair.name).join(', ') : 'Not assigned'}</span>{!healthyChair(group) && <span className="block text-xs text-amber-700 mt-1">Needs appointment</span>}</td><td className="px-5 py-4"><Button variant="outline" size="sm" onClick={() => setChanging(group)}><Crown size={14} /> {healthyChair(group) ? 'Change chair' : 'Appoint chair'}</Button></td></tr>)}
            {tab === 'members' && members.content.map(member => <tr key={member.membershipId}><td className="px-5 py-4"><strong className="block">{member.name}</strong><span className="text-xs text-neutral-500">{member.membershipNumber}</span></td><td className="px-5 py-4">{member.groupName}</td><td className="px-5 py-4"><span className="block">{member.phone || '—'}</span><span className="text-xs text-neutral-500">{member.email || '—'}</span></td><td className="px-5 py-4"><span className={`text-xs rounded-full px-2 py-1 ${member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>{member.status}</span></td><td className="px-5 py-4 text-xs">{member.roles.map(role => role.replaceAll('_', ' ')).join(', ') || 'Member'}</td></tr>)}
            {tab === 'audit' && audit.content.map(item => <tr key={item.id}><td className="px-5 py-4 whitespace-nowrap text-xs">{new Date(item.createdAt).toLocaleString()}</td><td className="px-5 py-4">{item.actor}</td><td className="px-5 py-4">{item.group}</td><td className="px-5 py-4 text-xs">{item.action}</td><td className="px-5 py-4 min-w-64 max-w-xl break-words text-neutral-600">{item.description}</td></tr>)}
          </tbody></table></div>
          {result.content.length === 0 && <div className="p-16 text-center"><Search className="mx-auto text-neutral-300 mb-3" size={32} /><p className="font-semibold">No {tab === 'audit' ? 'audit records' : tab} found</p><p className="text-sm text-neutral-500 mt-1">{query ? 'Try another search or clear the filter.' : 'Records will appear here when they are created.'}</p></div>}
        </>}
        <div className="px-5 py-4 border-t flex items-center justify-between text-xs text-neutral-500"><span>{result.totalElements.toLocaleString()} {tab === 'members' ? 'memberships' : 'records'} · Page {page + 1} of {Math.max(result.totalPages, 1)}</span><div className="flex gap-2"><Button aria-label="Previous page" size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage(v => v - 1)}><ChevronLeft size={16} /></Button><Button aria-label="Next page" size="sm" variant="outline" disabled={page + 1 >= result.totalPages || loading} onClick={() => setPage(v => v + 1)}><ChevronRight size={16} /></Button></div></div>
      </section>
      <p className="text-xs text-neutral-500 mt-5">Membership counts include members who belong to more than one group. Chairperson changes are recorded in audit history.</p>
    </div>
    {changing && <ChairDialog group={changing} close={() => setChanging(null)} saved={() => { setChanging(null); setRevision(v => v + 1) }} />}
  </div>
}

function ChairDialog({ group, close, saved }: { group: SystemGroup; close: () => void; saved: () => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [candidates, setCandidates] = useState(empty<SystemPerson>)
  const [selected, setSelected] = useState<SystemPerson | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      systemAdmin.members(search, page, group.id).then(result => { if (active) { setCandidates(result.data); setError('') } })
        .catch(err => { if (active) setError(message(err)) }).finally(() => { if (active) setLoading(false) })
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [search, page, group.id])
  const submit = async () => {
    if (!selected) return
    setSaving(true); setError('')
    try {
      await systemAdmin.chair(group.id, selected.membershipId, group.chairs.length === 1 ? group.chairs[0].membershipId : null, reason.trim())
      toast.success(`${selected.name} is now chairperson of ${group.name}`); saved()
    } catch (err) { setError(message(err)) }
    finally { setSaving(false) }
  }
  return <Dialog open onOpenChange={open => { if (!open && !saving) close() }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Appoint chairperson</DialogTitle><DialogDescription>Choose one active member of {group.name}. The current chair role will end; other roles and memberships remain.</DialogDescription></DialogHeader><div className="space-y-4">
    <div className="rounded-lg bg-neutral-50 p-3 text-sm"><span className="text-neutral-500">Current chair: </span><strong>{group.chairs.map(chair => chair.name).join(', ') || 'Not assigned'}</strong></div>
    <div><label htmlFor="chair-search" className="block text-sm font-medium mb-2">Find a member</label><Input id="chair-search" placeholder="Search by name or phone" value={search} onChange={event => { setSearch(event.target.value); setPage(0) }} disabled={saving} /></div>
    <div className="max-h-48 overflow-y-auto border rounded-lg" aria-label="Chairperson candidates">{loading ? <p className="p-4 text-sm text-neutral-500">Loading members…</p> : candidates.content.map(person => <label key={person.membershipId} className={`flex gap-3 p-3 border-b last:border-0 ${selected?.membershipId === person.membershipId ? 'bg-emerald-50' : ''} ${!person.eligibleForChair ? 'opacity-50' : 'cursor-pointer'}`}><input type="radio" name="new-chair" disabled={saving || !person.eligibleForChair || (group.chairs.length === 1 && group.chairs[0].membershipId === person.membershipId)} checked={selected?.membershipId === person.membershipId} onChange={() => setSelected(person)} /><span className="text-sm"><strong>{person.name}</strong><span className="block text-xs text-neutral-500">{person.phone} · {person.status}</span></span></label>)}{!loading && !candidates.content.length && <p className="p-4 text-sm text-neutral-500">No members match this search.</p>}</div>
    <div className="flex justify-between items-center text-xs text-neutral-500"><span>{candidates.totalElements} members</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!page || loading || saving} onClick={() => setPage(v => v - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page + 1 >= candidates.totalPages || loading || saving} onClick={() => setPage(v => v + 1)}>Next</Button></div></div>
    {selected && <p className="text-sm text-emerald-800">New chair: <strong>{selected.name}</strong></p>}
    <div><label htmlFor="chair-reason" className="block text-sm font-medium mb-2">Reason for appointment</label><Textarea id="chair-reason" maxLength={500} placeholder="For example, the group elected a new chairperson." value={reason} onChange={event => setReason(event.target.value)} disabled={saving} /></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div><DialogFooter><Button variant="outline" disabled={saving} onClick={close}>Cancel</Button><Button className="bg-emerald-700 hover:bg-emerald-800" disabled={saving || !selected || reason.trim().length < 5} onClick={submit}>{saving ? 'Saving appointment…' : 'Confirm appointment'}</Button></DialogFooter></DialogContent></Dialog>
}
