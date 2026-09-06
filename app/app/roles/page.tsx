'use client'

import { FormEvent, useEffect, useState } from 'react'
import { CheckCircle2, GitBranch, Loader2, Plus, ShieldCheck, Users } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api/client'
import { useVikobaStore } from '@/lib/mockStore'

type GroupMembership = { group?: { groupId?: number | string; groupName?: string }; role?: string; roles?: string[]; permissions?: string[] }
type WorkflowNode = { id: number; groupId: number; actionKey: string; label: string; requiredRole?: string; requiredPermission: string; stepOrder: number; active: boolean }
type Envelope<T> = { data?: T; message?: string }

const roles = [
    ['GROUP_ADMIN', 'Group Admin', 'Full access across the group, including role and workflow configuration.'],
    ['GROUP_CHAIRMAN', 'Mwenyekiti / Group Chairman', 'Leads governance and can be assigned approvals through workflows.'],
    ['ACCOUNTANT', 'Accountant', 'Owns finance operations and payment verification.'],
    ['TREASURER', 'Treasurer', 'Handles cash collection, contributions, and approvals assigned by workflow.'],
    ['SECRETARY', 'Secretary', 'Manages records, meetings, and member administration.'],
    ['MEMBER', 'Member', 'Limited self-service access and proof submission.'],
]

export default function RolesMatrixPage() {
    const { currentGroupId } = useVikobaStore()
    const [groupId, setGroupId] = useState('')
    const [memberships, setMemberships] = useState<GroupMembership[]>([])
    const [nodes, setNodes] = useState<WorkflowNode[]>([])
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ actionKey: 'SHARE_PURCHASE_PROOF', label: 'Review manual share purchase proof', requiredRole: 'ACCOUNTANT', requiredPermission: 'SHARE_PURCHASE_APPROVE', stepOrder: '1' })

    useEffect(() => {
        const selected = currentGroupId || localStorage.getItem('v360_currentGroupId') || ''
        setGroupId(String(selected))
        try { setMemberships(JSON.parse(localStorage.getItem('v360_groups') || '[]')) } catch { setMemberships([]) }
    }, [currentGroupId])

    const loadNodes = async () => {
        if (!groupId) return
        setLoading(true)
        try {
            const response = await apiGet<Envelope<WorkflowNode[]>>(`/api/workflows/group/${groupId}`, undefined, { auth: true })
            setNodes(response.data || [])
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load workflow nodes.') }
        finally { setLoading(false) }
    }

    useEffect(() => { loadNodes() }, [groupId])

    const addNode = async (event: FormEvent) => {
        event.preventDefault()
        if (!groupId) return
        setLoading(true)
        try {
            const response = await apiPost<Envelope<WorkflowNode>>(`/api/workflows/group/${groupId}/nodes`, { ...form, stepOrder: Number(form.stepOrder) }, { auth: true })
            if (response.data) setNodes((current) => [...current, response.data!])
            setMessage('Workflow node saved. The next review will use this rule.')
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save workflow node.') }
        finally { setLoading(false) }
    }

    const selected = memberships.find((item) => String(item.group?.groupId) === groupId)
    const canManageWorkflows = selected?.roles?.includes('GROUP_ADMIN') || selected?.role === 'GROUP_ADMIN' || selected?.permissions?.includes('WORKFLOW_MANAGE')

    return <main className="mx-auto max-w-7xl space-y-7 px-6 py-8">
        <header>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Administration / RBAC</p>
            <h1 className="mt-2 text-3xl font-black text-neutral-900">Roles, permissions & workflows</h1>
            <p className="mt-2 max-w-3xl text-sm text-neutral-500">Permissions decide what a person can do. Workflow nodes decide who reviews each group action.</p>
        </header>

        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</div>}

        <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#0b6b50] p-5 text-white shadow-sm md:col-span-2">
                <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Selected group</p><h2 className="mt-2 text-2xl font-black">{selected?.group?.groupName || 'Current group'}</h2></div><ShieldCheck className="text-amber-300" /></div>
                <p className="mt-5 text-sm text-emerald-50">Your group roles: <strong>{selected?.roles?.join(', ') || selected?.role || 'MEMBER'}</strong></p>
                <p className="mt-1 text-xs text-emerald-100">{selected?.permissions?.length || 0} permissions in this group session</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><Users className="text-emerald-700" /><p className="mt-4 text-xs font-bold uppercase tracking-widest text-neutral-400">RBAC principle</p><p className="mt-2 text-sm font-bold text-neutral-800">Roles bundle permissions. Workflows assign those permissions to group actions.</p></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-6 py-5"><h2 className="font-black text-neutral-900">Role bundles</h2><p className="mt-1 text-xs text-neutral-500">These are the standard group roles returned by OTP for each membership.</p></div>
            <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">{roles.map(([key, label, description]) => <div key={key} className="rounded-xl bg-neutral-50 p-4"><div className="flex items-center justify-between"><p className="font-black text-neutral-900">{label}</p><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">{key}</span></div><p className="mt-2 text-xs leading-5 text-neutral-500">{description}</p></div>)}</div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"><div className="border-b border-neutral-100 px-6 py-5"><div className="flex items-center gap-2"><GitBranch size={18} className="text-emerald-700" /><h2 className="font-black text-neutral-900">Configured workflow nodes</h2></div><p className="mt-1 text-xs text-neutral-500">Every node connects a group action to a permission and optional role.</p></div><div className="divide-y divide-neutral-100">{nodes.length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">No nodes configured for this group.</p> : nodes.map((node) => <div key={node.id} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="font-black text-neutral-900">{node.label}</p><p className="mt-1 text-xs text-neutral-500">{node.actionKey} · step {node.stepOrder}</p></div><div className="text-right"><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">{node.requiredPermission}</span><p className="mt-2 text-[10px] font-bold text-neutral-400">{node.requiredRole || 'Any permitted role'}</p></div></div>)}</div></div>
            <form onSubmit={addNode} className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Plus size={18} className="text-emerald-700" /><h2 className="font-black text-neutral-900">Add workflow node</h2></div><p className="mt-1 text-xs text-neutral-500">Use a permission as the source of truth for a group action.</p>{!canManageWorkflows && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">You need WORKFLOW_MANAGE permission to change this group&apos;s workflow.</p>}<div className="mt-5 space-y-3">{[['actionKey', 'Action key'], ['label', 'Label'], ['requiredPermission', 'Required permission'], ['stepOrder', 'Step order']].map(([key, label]) => <label key={key} className="block text-xs font-bold text-neutral-600">{label}<input disabled={!canManageWorkflows} value={(form as any)[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 disabled:bg-neutral-100" /></label>)}<label className="block text-xs font-bold text-neutral-600">Required role<select disabled={!canManageWorkflows} value={form.requiredRole} onChange={(event) => setForm({ ...form, requiredRole: event.target.value })} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm disabled:bg-neutral-100"><option>GROUP_ADMIN</option><option>GROUP_CHAIRMAN</option><option>ACCOUNTANT</option><option>TREASURER</option><option>MEMBER</option></select></label><button disabled={loading || !groupId || !canManageWorkflows} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{loading && <Loader2 size={16} className="animate-spin" />} Save workflow node</button></div></form>
        </section>
    </main>
}
