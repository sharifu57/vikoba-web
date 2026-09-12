'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  Eye,
  X,
  Filter,
  Loader2,
  Upload,
  PencilLine,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  UserCheck,
  UserX,
} from 'lucide-react'
import { memberService, type MemberRoleOption } from '@/lib/api/services'

const formatRoleLabel = (value?: string) => {
  if (!value) return 'Member'

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('255')) return digits
  if (digits.startsWith('0')) return `255${digits.slice(1)}`
  return `255${digits}`
}

const toRoleEnumValue = (value?: string) => {
  if (!value) return 'MEMBER'
  const clean = value.trim()
  if (clean.includes(' ')) {
    return clean.toUpperCase().replace(/\s+/g, '_')
  }
  return clean.toUpperCase()
}

const unwrapApiData = <T,>(payload: T | { data?: T } | null | undefined): T | null => {
  if (!payload) return null
  if (typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return (payload as { data: T }).data
  }
  return payload as T
}

type SingleMemberForm = {
  firstName: string
  lastName: string
  phone: string
  email: string
  role: string
}

type BulkMemberRow = {
  firstName: string
  lastName: string
  phone: string
  email: string
  role: string
  valid: boolean
  error?: string
}

type ManagedMember = {
  id: string
  groupId: string
  name: string
  memberNo: string
  phone: string
  email: string
  joinedDate: string
  role: string
  status: string
  firstName: string
  middleName: string
  lastName: string
  nationalId: string
  address: string
  occupation: string
  nextOfKinName: string
  nextOfKinPhone: string
  nextOfKinRelationship: string
}

type MemberEditForm = Omit<ManagedMember, 'id' | 'groupId' | 'name' | 'memberNo' | 'joinedDate' | 'role' | 'status'>

export default function MembersPage() {
  const queryClient = useQueryClient()
  const [groupId, setGroupId] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  // const [importMode, setImportMode] = useState<'single' | 'bulk'>('single')
  const [memberAddMode, setMemberAddMode] = useState<'single' | 'bulk' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bulkRows, setBulkRows] = useState<BulkMemberRow[]>([])
  const [bulkFileName, setBulkFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [canManageMembers, setCanManageMembers] = useState(false)
  const [editingMember, setEditingMember] = useState<ManagedMember | null>(null)
  const [editForm, setEditForm] = useState<MemberEditForm | null>(null)
  const [statusMember, setStatusMember] = useState<ManagedMember | null>(null)
  const [statusSubmitting, setStatusSubmitting] = useState(false)

  const [newMem, setNewMem] = useState<SingleMemberForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: 'MEMBER',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const currentGroup = localStorage.getItem('v360_currentGroup')
    const fallbackGroupId = localStorage.getItem('v360_currentGroupId')

    if (currentGroup) {
      try {
        const parsed = JSON.parse(currentGroup)
        if (parsed?.id || parsed?.groupId) {
          setGroupId(String(parsed.id ?? parsed.groupId))
          return
        }
      } catch {
        // no-op
      }
    }

    if (fallbackGroupId) {
      setGroupId(fallbackGroupId)
    }
  }, [])

  useEffect(() => {
    if (!groupId || typeof window === 'undefined') return

    try {
      const memberships = JSON.parse(localStorage.getItem('v360_groups') || '[]') as Array<Record<string, unknown>>
      const membership = memberships.find((item) => {
        const group = (item.group || item) as Record<string, unknown>
        return String(group.groupId ?? group.id) === groupId
      })
      const roles = Array.isArray(membership?.roles)
        ? membership.roles.map(String).map((role) => role.toUpperCase())
        : [String(membership?.role || 'MEMBER').toUpperCase()]
      const permissions = Array.isArray(membership?.permissions)
        ? membership.permissions.map(String).map((permission) => permission.toUpperCase())
        : []

      setCanManageMembers(
        roles.some((role) => ['GROUP_ADMIN', 'GROUP_CHAIRMAN', 'CHAIRPERSON'].includes(role)) ||
        permissions.includes('MEMBER_MANAGE'),
      )
    } catch {
      setCanManageMembers(false)
    }
  }, [groupId])

  const { data: roleData, isLoading: loadingRoles } = useQuery({
    queryKey: ['member-roles'],
    queryFn: () => memberService.getRoles(),
    enabled: canManageMembers,
    staleTime: 30_000,
  })

  const roleOptions = (unwrapApiData<MemberRoleOption[]>(roleData) ?? []) as MemberRoleOption[]

  const { data: memberData, isLoading: loadingMembers } = useQuery({
    queryKey: ['members', groupId],
    queryFn: () => memberService.list(groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  })

  const members = useMemo(() => {
    const list = unwrapApiData<Array<Record<string, unknown>>>(memberData)
    if (!list) return []
    return list.map((member): ManagedMember => {
      const fullName =
        String(member.fullName ?? member.name ?? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()) ||
        `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()

      return {
        id: String(member.id ?? member.memberId ?? member.membershipNumber ?? crypto.randomUUID()),
        groupId: String(member.groupId ?? groupId),
        name: fullName,
        memberNo: String(member.memberNumber ?? member.membershipNumber ?? '—'),
        phone: String(member.phone ?? ''),
        email: String(member.email ?? ''),
        joinedDate: String(member.joinedDate ?? '—'),
        role: formatRoleLabel(String(member.role ?? 'MEMBER')),
        status: String(member.membershipStatus ?? member.status ?? 'ACTIVE').toUpperCase(),
        firstName: String(member.firstName ?? ''),
        middleName: String(member.middleName ?? ''),
        lastName: String(member.lastName ?? ''),
        nationalId: String(member.nationalId ?? ''),
        address: String(member.address ?? ''),
        occupation: String(member.occupation ?? ''),
        nextOfKinName: String(member.nextOfKinName ?? ''),
        nextOfKinPhone: String(member.nextOfKinPhone ?? ''),
        nextOfKinRelationship: String(member.nextOfKinRelationship ?? ''),
      }
    })
  }, [groupId, memberData])

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase().trim()

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.memberNo.toLowerCase().includes(query) ||
        member.phone.toLowerCase().includes(query)

      const matchesRole = roleFilter === 'ALL' || member.role === roleFilter
      const matchesStatus = statusFilter === 'ALL' || member.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [members, roleFilter, search, statusFilter])

  const roleFilterOptions = useMemo(() => {
    const fromApi = roleOptions.map((role) => formatRoleLabel(role.value))
    return ['ALL', ...new Set(fromApi)]
  }, [roleOptions])

  const buildBulkRow = (row: Record<string, string | undefined>): BulkMemberRow => {
    const firstName = (row.firstName ?? row.firstname ?? row.FirstName ?? '').toString().trim()
    const lastName = (row.lastName ?? row.lastname ?? row.LastName ?? '').toString().trim()
    const phone = normalizePhone((row.phone ?? row.Phone ?? row.mobile ?? row.Mobile ?? '').toString())
    const email = (row.email ?? row.Email ?? '').toString().trim()
    const role = toRoleEnumValue(row.role ?? row.Role ?? 'MEMBER')

    if (!firstName || !lastName) {
      return { firstName, lastName, phone, email, role, valid: false, error: 'First name and last name are required.' }
    }

    if (!phone || phone.length !== 12) {
      return { firstName, lastName, phone, email, role, valid: false, error: 'Phone number must be a valid Tanzanian number.' }
    }

    return { firstName, lastName, phone, email, role, valid: true }
  }

  const handleSingleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!groupId) {
      toast.error('No Kikoba group is selected yet. Please create or select a group first.')
      return
    }

    const normalizedPhone = normalizePhone(newMem.phone)
    if (!newMem.firstName.trim() || !newMem.lastName.trim() || !normalizedPhone || normalizedPhone.length !== 12) {
      toast.error('Please enter a valid first name, last name and phone number.')
      return
    }

    setIsSubmitting(true)

    try {
      await memberService.create({
        groupId: Number(groupId),
        firstName: newMem.firstName.trim(),
        lastName: newMem.lastName.trim(),
        phone: normalizedPhone,
        email: newMem.email.trim() || undefined,
        role: toRoleEnumValue(newMem.role),
        membershipType: 'ORDINARY',
        joinedDate: new Date().toISOString().slice(0, 10),
      })

      setNewMem({ firstName: '', lastName: '', phone: '', email: '', role: 'MEMBER' })
      setModalOpen(false)
      toast.success('Member added successfully.')
      queryClient.invalidateQueries({ queryKey: ['members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['member-roles'] })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add member.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBulkFileName(file.name)

    try {
      let rows: string[] = []

      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text()
        rows = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      } else {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, string | undefined>>(firstSheet, {
          defval: '',
          raw: false,
        })

        rows = jsonRows.map((row) => {
          const values = Object.values(row)
          return values.map((value) => String(value).trim()).join(',')
        })

        if (!rows.length) {
          toast.error('The spreadsheet is empty or missing a header row.')
          return
        }

        const headers = Object.keys(jsonRows[0] ?? {})
        if (!headers.length) {
          toast.error('No valid columns were found in the uploaded spreadsheet.')
          return
        }

        const normalized = jsonRows.map((row) => {
          const data: Record<string, string | undefined> = {}
          headers.forEach((header) => {
            data[header] = String(row[header] ?? '').trim()
          })
          return buildBulkRow(data)
        })

        setBulkRows(normalized)
        const validCount = normalized.filter((row) => row.valid).length
        toast.success(`${validCount} valid rows detected for bulk upload.`)
        return
      }

      if (rows.length < 2) {
        toast.error('CSV file must include a header row and at least one member row.')
        return
      }

      const headers = rows[0].split(',').map((header) => header.trim().replace(/^"|"$/g, ''))
      const bodyRows = rows.slice(1)

      const formattedRows = bodyRows.map((rowLine) => {
        const values = rowLine.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
        const data: Record<string, string | undefined> = {}

        headers.forEach((header, idx) => {
          data[header] = values[idx]
        })

        return buildBulkRow(data)
      })

      setBulkRows(formattedRows)
      const validCount = formattedRows.filter((row) => row.valid).length
      toast.success(`${validCount} valid rows detected for bulk upload.`)
    } catch (error) {
      console.error(error)
      toast.error('Unable to read the uploaded file. Please use a CSV or Excel file with firstName,lastName,phone,email,role columns.')
    }
  }

  const handleBulkUpload = async () => {
    if (!groupId) {
      toast.error('No Kikoba group is selected yet. Please create or select a group first.')
      return
    }

    const validRows = bulkRows.filter((row) => row.valid)
    if (!validRows.length) {
      toast.error('No valid member rows found to upload.')
      return
    }

    setIsSubmitting(true)

    try {
      let createdCount = 0

      for (const row of validRows) {
        await memberService.create({
          groupId: Number(groupId),
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          email: row.email || undefined,
          role: row.role,
          membershipType: 'ORDINARY',
          joinedDate: new Date().toISOString().slice(0, 10),
        })
        createdCount += 1
      }

      setBulkRows([])
      setBulkFileName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success(`Successfully added ${createdCount} members.`)
      queryClient.invalidateQueries({ queryKey: ['members', groupId] })
      setModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk upload failed.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditMember = (member: ManagedMember) => {
    setEditingMember(member)
    setEditForm({
      firstName: member.firstName,
      middleName: member.middleName,
      lastName: member.lastName,
      phone: member.phone,
      email: member.email,
      nationalId: member.nationalId,
      address: member.address,
      occupation: member.occupation,
      nextOfKinName: member.nextOfKinName,
      nextOfKinPhone: member.nextOfKinPhone,
      nextOfKinRelationship: member.nextOfKinRelationship,
    })
  }

  const handleEditMember = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingMember || !editForm) return

    const phone = normalizePhone(editForm.phone)
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !phone || phone.length !== 12) {
      toast.error('Please enter a valid first name, last name, and phone number.')
      return
    }

    setIsSubmitting(true)
    try {
      await memberService.updateProfile(groupId, editingMember.id, {
        ...editForm,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        middleName: editForm.middleName.trim() || undefined,
        phone,
        email: editForm.email.trim() || undefined,
      })
      toast.success('Member details updated.')
      setEditingMember(null)
      setEditForm(null)
      queryClient.invalidateQueries({ queryKey: ['members', groupId] })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update member details.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmStatusChange = async () => {
    if (!statusMember) return
    const nextStatus = statusMember.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'

    setStatusSubmitting(true)
    try {
      await memberService.updateMembershipStatus(groupId, statusMember.id, nextStatus)
      toast.success(nextStatus === 'ACTIVE' ? 'Member reactivated.' : 'Member deactivated and removed from group access.')
      setStatusMember(null)
      queryClient.invalidateQueries({ queryKey: ['members', groupId] })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update membership status.'
      toast.error(message)
    } finally {
      setStatusSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            <span>VIKOBA</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Members</span>
          </div>
          <h1 className="mt-2 text-3xl font-black text-neutral-900">Members Register</h1>
          <p className="mt-1 text-sm text-neutral-500">Add one member at a time or upload a bulk spreadsheet in seconds.</p>
        </div>

        {canManageMembers && <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setMemberAddMode(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B6B50] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#08503C]"
          >
            <UserPlus size={14} />
            Add Members
          </button>
        </div>}
      </div>

      <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or member number"
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] py-2.5 pl-10 pr-3 text-xs text-neutral-700 placeholder:text-neutral-400 outline-none transition focus:border-[#0B6B50]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              <Filter size={12} />
              <span>Filters</span>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2 text-xs text-neutral-700 outline-none"
            >
              {roleFilterOptions.map((role) => (
                <option key={role} value={role}>
                  {role === 'ALL' ? 'All Roles' : role}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2 text-xs text-neutral-700 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXITED">Exited</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-neutral-50 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Member No</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loadingMembers ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length ? (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F2ED] text-xs font-black text-[#0B6B50]">
                          {member.name
                            .split(' ')
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-800">{member.name}</p>
                          <p className="text-[10px] text-neutral-400">{member.email || 'No email added'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-600">{member.memberNo}</td>
                    <td className="px-4 py-3 text-neutral-600">{member.phone || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{member.joinedDate || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#F2F7F4] px-2.5 py-1 text-[10px] font-bold text-[#0B6B50]">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${member.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                          }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/app/members/${member.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-[10px] font-bold text-neutral-700 transition hover:border-[#0B6B50] hover:text-[#0B6B50]"
                        >
                          <Eye size={12} /> View
                        </Link>
                        {canManageMembers && (
                          <details className="w-7 [&>summary::-webkit-details-marker]:hidden">
                            <summary
                              title="Member actions"
                              aria-label={`Actions for ${member.name}`}
                              className="grid h-7 w-7 cursor-pointer list-none place-items-center rounded-lg border border-[#E5E7EB] text-neutral-600 transition hover:border-[#0B6B50] hover:text-[#0B6B50]"
                            >
                              <MoreHorizontal size={15} />
                            </summary>
                            <div className="mt-1 w-40 rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-lg">
                              <button type="button" onClick={() => openEditMember(member)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] font-semibold text-neutral-700 hover:bg-[#F2F7F4] hover:text-[#0B6B50]">
                                <PencilLine size={13} /> Edit member
                              </button>
                              <button type="button" onClick={() => setStatusMember(member)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] font-semibold ${member.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-[#0B6B50] hover:bg-[#F2F7F4]'}`}>
                                {member.status === 'ACTIVE' ? <UserX size={13} /> : <UserCheck size={13} />}
                                {member.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          </details>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    {groupId ? 'No members match your search and filters yet.' : 'Select a group to start managing members.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241D]/35 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Member Management</p>
                {/* <h3 className="mt-1 text-lg font-black text-neutral-800">
                  {importMode === 'single' ? 'Add Single Member' : 'Upload Members in Bulk'}
                </h3> */}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setMemberAddMode(null)
                      setModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0B6B50] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#08503C]"
                  >
                    <UserPlus size={14} />
                    Add Members
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            {memberAddMode === null ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-neutral-800">
                    How would you like to add members?
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Choose how you want to add members to this VIKOBA group.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Single Member */}
                  <button
                    type="button"
                    onClick={() => setMemberAddMode('single')}
                    className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#0B6B50] hover:bg-[#F7F7F2] hover:shadow-sm"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F2ED] text-[#0B6B50] transition group-hover:bg-[#0B6B50] group-hover:text-white">
                      <UserPlus size={22} />
                    </div>

                    <h4 className="text-sm font-black text-neutral-800">
                      Add Single Member
                    </h4>

                    <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                      Add one member manually by entering their personal details,
                      phone number, email and role.
                    </p>

                    <span className="mt-4 inline-flex items-center text-[11px] font-bold text-[#0B6B50]">
                      Add member →
                    </span>
                  </button>

                  {/* Bulk Import */}
                  <button
                    type="button"
                    onClick={() => setMemberAddMode('bulk')}
                    className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#0B6B50] hover:bg-[#F7F7F2] hover:shadow-sm"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F2ED] text-[#0B6B50] transition group-hover:bg-[#0B6B50] group-hover:text-white">
                      <FileSpreadsheet size={22} />
                    </div>

                    <h4 className="text-sm font-black text-neutral-800">
                      Import Multiple Members
                    </h4>

                    <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                      Upload a CSV or Excel spreadsheet when you need to add
                      many members at once.
                    </p>

                    <span className="mt-4 inline-flex items-center text-[11px] font-bold text-[#0B6B50]">
                      Upload spreadsheet →
                    </span>
                  </button>
                </div>

                <div className="flex justify-end border-t border-neutral-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : memberAddMode === 'single' ? (


              <form onSubmit={handleSingleMemberSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">First Name *</label>
                    <input
                      value={newMem.firstName}
                      onChange={(e) => setNewMem((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="e.g. Juma"
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">Last Name *</label>
                    <input
                      value={newMem.lastName}
                      onChange={(e) => setNewMem((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="e.g. Majid"
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">Phone Number *</label>
                    <input
                      value={newMem.phone}
                      onChange={(e) => setNewMem((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="255712345678"
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">Role</label>
                    <select
                      value={newMem.role}
                      onChange={(e) => setNewMem((prev) => ({ ...prev, role: e.target.value }))}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]"
                    >
                      {roleOptions.length ? (
                        roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="MEMBER">Member</option>
                          <option value="TREASURER">Treasurer</option>
                          <option value="LOAN_OFFICER">Loan Officer</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Email Address</label>
                  <input
                    value={newMem.email}
                    onChange={(e) => setNewMem((prev) => ({ ...prev, email: e.target.value }))}
                    type="email"
                    placeholder="juma@example.com"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]"
                  />
                </div>

                <div className="flex justify-between gap-3 border-t border-neutral-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setMemberAddMode(null)}
                    className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50"
                  >
                    ← Back
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false)
                        setMemberAddMode(null)
                      }}
                      className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0B6B50] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#08503C] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Save Member
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-dashed border-[#B5D7C5] bg-[#F7F7F2] p-4">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#B5D7C5] bg-white px-4 py-5 text-center">
                    <Upload className="h-7 w-7 text-[#0B6B50]" />
                    <div>
                      <p className="text-sm font-bold text-neutral-700">Upload CSV or Excel file</p>
                      <p className="mt-1 text-[11px] text-neutral-500">Supported columns: firstName, lastName, phone, email, role</p>
                      <a
                        href="/members-bulk-upload-template.csv"
                        download
                        onClick={(event) => event.stopPropagation()}
                        className="mt-2 inline-block text-[11px] font-bold text-[#0B6B50] underline underline-offset-2 hover:text-[#08503C]"
                      >
                        Download sample CSV
                      </a>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkFile} className="hidden" />
                  </label>
                </div>

                {bulkFileName && (
                  <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2 text-xs text-neutral-600">
                    <span className="inline-flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-[#0B6B50]" />
                      {bulkFileName}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                      {bulkRows.filter((row) => row.valid).length} valid rows
                    </span>
                  </div>
                )}

                {bulkRows.length > 0 && (
                  <div className="max-h-80 overflow-auto rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-3">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-neutral-400">
                        <tr>
                          <th className="pb-2 font-bold">Name</th>
                          <th className="pb-2 font-bold">Phone</th>
                          <th className="pb-2 font-bold">Role</th>
                          <th className="pb-2 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, index) => (
                          <tr key={`${row.phone}-${index}`} className="border-t border-neutral-100">
                            <td className="py-2 pr-2 font-medium text-neutral-700">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="py-2 pr-2 text-neutral-600">{row.phone || '—'}</td>
                            <td className="py-2 pr-2 text-neutral-600">{formatRoleLabel(row.role)}</td>
                            <td className="py-2">
                              {row.valid ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" /> Valid
                                </span>
                              ) : (
                                <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                                  {row.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between gap-3 border-t border-neutral-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setMemberAddMode(null)}
                    className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50"
                  >
                    ← Back
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={
                        () => {
                          setModalOpen(false)
                          setMemberAddMode(null)
                        }

                      }
                      className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkUpload}
                      disabled={isSubmitting || !bulkRows.filter((row) => row.valid).length}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0B6B50] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#08503C] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      Upload Members
                    </button>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      )}

      {editingMember && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241D]/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="edit-member-title">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Member management</p>
                <h2 id="edit-member-title" className="mt-1 text-lg font-black text-neutral-900">Edit {editingMember.name}</h2>
                <p className="mt-1 text-xs text-neutral-500">Member number: {editingMember.memberNo}</p>
              </div>
              <button
                type="button"
                title="Close edit member form"
                aria-label="Close edit member form"
                onClick={() => { setEditingMember(null); setEditForm(null) }}
                className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditMember} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">First name *</label>
                  <input value={editForm.firstName} onChange={(event) => setEditForm((current) => current ? { ...current, firstName: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Middle name</label>
                  <input value={editForm.middleName} onChange={(event) => setEditForm((current) => current ? { ...current, middleName: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Last name *</label>
                  <input value={editForm.lastName} onChange={(event) => setEditForm((current) => current ? { ...current, lastName: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Phone number *</label>
                  <input value={editForm.phone} onChange={(event) => setEditForm((current) => current ? { ...current, phone: event.target.value } : current)} inputMode="tel" placeholder="255712345678" className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Email address</label>
                  <input value={editForm.email} onChange={(event) => setEditForm((current) => current ? { ...current, email: event.target.value } : current)} type="email" className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">National ID</label>
                  <input value={editForm.nationalId} onChange={(event) => setEditForm((current) => current ? { ...current, nationalId: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-700">Occupation</label>
                  <input value={editForm.occupation} onChange={(event) => setEditForm((current) => current ? { ...current, occupation: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-700">Address</label>
                <input value={editForm.address} onChange={(event) => setEditForm((current) => current ? { ...current, address: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Next of kin</p>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">Full name</label>
                    <input value={editForm.nextOfKinName} onChange={(event) => setEditForm((current) => current ? { ...current, nextOfKinName: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">Phone number</label>
                    <input value={editForm.nextOfKinPhone} onChange={(event) => setEditForm((current) => current ? { ...current, nextOfKinPhone: event.target.value } : current)} inputMode="tel" className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-neutral-700">Relationship</label>
                    <input value={editForm.nextOfKinRelationship} onChange={(event) => setEditForm((current) => current ? { ...current, nextOfKinRelationship: event.target.value } : current)} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] px-3 py-2.5 text-xs text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
                <button type="button" onClick={() => { setEditingMember(null); setEditForm(null) }} className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-[#0B6B50] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#08503C] disabled:cursor-not-allowed disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PencilLine size={14} />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241D]/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="member-status-title">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-2xl">
            <div className={`mb-4 grid h-11 w-11 place-items-center rounded-full ${statusMember.status === 'ACTIVE' ? 'bg-red-50 text-red-600' : 'bg-[#E7F2ED] text-[#0B6B50]'}`}>
              {statusMember.status === 'ACTIVE' ? <UserX size={21} /> : <UserCheck size={21} />}
            </div>
            <h2 id="member-status-title" className="text-lg font-black text-neutral-900">
              {statusMember.status === 'ACTIVE' ? 'Deactivate member?' : 'Reactivate member?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {statusMember.status === 'ACTIVE'
                ? `${statusMember.name} will no longer be able to select this group at sign-in or access its information. Their member records will be kept.`
                : `${statusMember.name} will regain access to this group using their existing account.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setStatusMember(null)} disabled={statusSubmitting} className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-70">Cancel</button>
              <button type="button" onClick={confirmStatusChange} disabled={statusSubmitting} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${statusMember.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0B6B50] hover:bg-[#08503C]'}`}>
                {statusSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : statusMember.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
                {statusMember.status === 'ACTIVE' ? 'Deactivate member' : 'Reactivate member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
