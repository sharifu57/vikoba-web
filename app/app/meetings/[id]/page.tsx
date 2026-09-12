'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, CheckSquare, FileText, Loader2, Save, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { fineService, meetingService, memberService, type Meeting, type MeetingMinutes } from '@/lib/api/services'

type AttendanceRow = {
  memberId: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  arrivalTime?: string;
  reason?: string;
};

export default function MeetingAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [register, setRegister] = useState<AttendanceRow[]>([])
  const [attendanceTaken, setAttendanceTaken] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [canManageAttendance, setCanManageAttendance] = useState(false)
  const [canManageMinutes, setCanManageMinutes] = useState(false)
  const [fineAmounts, setFineAmounts] = useState({ absent: 0, late: 0 })
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null)
  const [minutesDraft, setMinutesDraft] = useState('')
  const [minutesApproved, setMinutesApproved] = useState(false)
  const [isSavingMinutes, setIsSavingMinutes] = useState(false)

  useEffect(() => {
    let mounted = true
    meetingService
      .getById(String(id))
      .then((raw: any) => {
        if (!mounted) return
        // normalize ApiResponse envelope if present
        const payload = raw as any
        const meetingObj = Array.isArray(payload) ? payload[0] : payload?.data ?? payload
        setMeeting(meetingObj as any)
        const groupId = (meetingObj as any)?.groupId ?? (meetingObj as any)?.group?.id
        if (groupId) {
          try {
            const memberships = JSON.parse(localStorage.getItem('v360_groups') || '[]') as Array<Record<string, unknown>>
            const membership = memberships.find((item) => {
              const group = (item.group || item) as Record<string, unknown>
              return String(group.groupId ?? group.id) === String(groupId)
            })
            const roles = Array.isArray(membership?.roles)
              ? membership.roles.map(String).map((role) => role.toUpperCase())
              : [String(membership?.role || 'MEMBER').toUpperCase()]
            const permissions = Array.isArray(membership?.permissions)
              ? membership.permissions.map(String).map((permission) => permission.toUpperCase())
              : []
            const isGroupLeader = roles.some((role) => ['GROUP_ADMIN', 'GROUP_CHAIRMAN', 'CHAIRPERSON'].includes(role))
            setCanManageAttendance(isGroupLeader || permissions.includes('MEETING_MANAGE'))
            setCanManageMinutes(roles.includes('GROUP_ADMIN') || permissions.includes('MEETING_MINUTES_MANAGE'))
          } catch {
            setCanManageAttendance(false)
            setCanManageMinutes(false)
          }

          fineService.types(String(groupId)).then((types) => {
            const absence = types.find((type) => type.code === 'MEETING_ABSENCE')?.defaultAmount ?? 0
            const late = types.find((type) => type.code === 'MEETING_LATE')?.defaultAmount ?? 0
            setFineAmounts({ absent: Number(absence), late: Number(late) })
          }).catch(() => setFineAmounts({ absent: 0, late: 0 }))

          meetingService.getMinutes(String(id)).then((savedMinutes) => {
            if (!savedMinutes || !mounted) return
            setMinutes(savedMinutes)
            setMinutesDraft(savedMinutes.content)
            setMinutesApproved(Boolean(savedMinutes.approvedAt))
          }).catch(() => { /* A meeting remains viewable when no minutes exist. */ })

          memberService
            .list(String(groupId))
            .then((listRaw: any) => {
              if (!mounted) return
              const arr = Array.isArray(listRaw) ? listRaw : listRaw?.data ?? []
              setMembers(arr as any[])
              const rows = (arr as any[]).map((mem) => ({
                memberId: mem.id,
                status: 'PRESENT' as const,
                arrivalTime: '',
                reason: '',
              }))
              setRegister(rows)

              // fetch existing attendance for this meeting
              meetingService.getAttendance(String(id)).then((attRaw: any) => {
                const attArr = Array.isArray(attRaw) ? attRaw : attRaw?.data ?? []
                if (attArr && attArr.length > 0) {
                  // map attendance to register rows
                  const updated = rows.map(r => {
                    const found = attArr.find((a: any) => String(a.groupMemberId) === String(r.memberId))
                    if (found) {
                      return {
                        memberId: r.memberId,
                        status: found.status ?? r.status,
                        arrivalTime: found.arrivalTime ? String(found.arrivalTime).split(':').slice(0, 2).join(':') : '',
                        reason: found.reason ?? '',
                      }
                    }
                    return r
                  })
                  setRegister(updated)
                  setAttendanceTaken(true)
                }
              }).catch(() => { })
            })
            .catch((err) => {
              // eslint-disable-next-line no-console
              console.error('Failed to load members', err)
            })
        }
      })
      .catch((err: any) => {
        // handle permission errors or missing auth
        // eslint-disable-next-line no-console
        console.error('Failed to load meeting', err);
        if (err?.status === 403) {
          alert('Access denied. Please login and try again.');
          router.push('/app/meetings');
        }
      })
    return () => {
      mounted = false
    }
  }, [id])

  const handleStatusChange = (memberId: string, status: AttendanceRow['status']) => {
    if (attendanceTaken || !canManageAttendance) return
    const updated = register.map((r) => r.memberId === memberId ? { ...r, status, arrivalTime: status === 'PRESENT' ? r.arrivalTime ?? '09:55' : status === 'LATE' ? r.arrivalTime ?? '10:15' : '' } : r)
    setRegister(updated)
  }

  const handleReasonChange = (memberId: string, reason: string) => {
    if (attendanceTaken || !canManageAttendance) return
    const updated = register.map((r) => r.memberId === memberId ? { ...r, reason } : r)
    setRegister(updated)
  }

  const handleMarkAllPresent = () => {
    if (attendanceTaken || !canManageAttendance) return
    setRegister((prev) => prev.map(r => ({ ...r, status: 'PRESENT', arrivalTime: r.arrivalTime ?? '09:55', reason: '' })))
  }

  const handleSave = async () => {
    if (attendanceTaken || !canManageAttendance) return
    try {
      setIsSaving(true)
      // prepare payload: ensure arrivalTime is HH:mm:ss or null
      const payload = register.map((r) => {
        let at = r.arrivalTime?.trim();
        if (!at) at = null as any;
        else if (/^\d{1,2}:\d{2}$/.test(at)) at = at + ':00';
        else if (/^\d{1,2}:\d{2}:\d{2}$/.test(at)) at = at;
        else at = null as any;

        return { groupMemberId: r.memberId, status: r.status, arrivalTime: at, reason: r.reason };
      })

      await meetingService.recordAttendance(String(id), payload)
      setAttendanceTaken(true)
      setIsSaving(false)
      toast.success('Attendance saved. Configured absence and late fines were issued automatically.')
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to save attendance', err)
      setIsSaving(false)
      alert(err?.message || 'Failed to save attendance')
    }
  }

  const handleSaveMinutes = async () => {
    if (!canManageMinutes || !minutesDraft.trim()) {
      toast.error('Add meeting minutes before saving.')
      return
    }
    try {
      setIsSavingMinutes(true)
      const saved = await meetingService.saveMinutes(String(id), { content: minutesDraft.trim(), approved: minutesApproved })
      setMinutes(saved)
      setMinutesApproved(Boolean(saved.approvedAt))
      toast.success(minutes?.id ? 'Meeting minutes updated.' : 'Meeting minutes saved for future reference.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save meeting minutes.')
    } finally {
      setIsSavingMinutes(false)
    }
  }

  if (!meeting) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-neutral-800">Meeting Not Found</h2>
        <Link href="/app/meetings" className="mt-4 inline-block px-4 py-2 bg-[#0B6B50] text-white rounded-lg text-xs">
          Back to Meetings
        </Link>
      </div>
    )
  }

  const currency = (meeting as any)?.group?.currency ?? 'TZS'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Back button */}
      <Link href="/app/meetings" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-700 transition mb-6">
        <ArrowLeft size={14} /> Back to Meetings Register
      </Link>

      {/* Header Panel */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Meetings</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Attendance</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Meeting record</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Assembly Date: <strong className="text-neutral-700 font-bold">{(meeting as any).meetingDate ?? (meeting as any).date}</strong> · Location: <strong className="text-neutral-500 font-bold">{(meeting as any).location ?? (meeting as any).venue}</strong>
          </p>
        </div>

        {canManageAttendance ? (
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleMarkAllPresent}
              disabled={attendanceTaken}
              className={`flex-1 md:flex-none px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${attendanceTaken ? 'opacity-60 cursor-not-allowed' : 'hover:bg-neutral-50'}`}
            >
              <CheckSquare size={14} /> Mark All Present
            </button>
            <button
              onClick={handleSave}
              disabled={attendanceTaken || isSaving}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${attendanceTaken || isSaving ? 'bg-neutral-300 cursor-wait text-neutral-600' : 'bg-[#0B6B50] hover:bg-[#08503C] text-white'}`}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />} {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-500"><ShieldCheck size={14} className="text-[#0B6B50]" /> Attendance is restricted</div>
        )}
      </div>

      {!canManageAttendance && <div className="mb-6 border-l-4 border-[#F2B84B] bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">Only a Group Admin, Chairperson, or member granted <span className="font-black">MEETING_MANAGE</span> can record attendance.</div>}

      {/* Register Checklist table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Member</th>
                <th className="p-4 font-bold">Arrival Time</th>
                <th className="p-4 font-bold text-center">Toggled Status</th>
                <th className="p-4 font-bold">Exempt Reason / Remarks</th>
                <th className="p-4 font-bold text-right">Auto Fine Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {register.map(item => {
                const member = members.find(m => m.id === item.memberId)
                const initials = (member?.name || member?.fullName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 3)
                const fineAmount = item.status === 'ABSENT' ? fineAmounts.absent : item.status === 'LATE' ? fineAmounts.late : 0
                return (
                  <tr key={item.memberId} className="hover:bg-neutral-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E7F2ED] text-[#0B6B50] font-bold text-xs flex items-center justify-center">
                          {initials}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-800 block text-xs">{member?.name ?? member?.fullName ?? 'Member'}</span>
                          <span className="text-[9px] text-neutral-400 block mt-0.5">{member?.memberNo ?? member?.membershipNumber ?? ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      <input
                        type="time"
                        readOnly
                        placeholder="--:--"
                        disabled={item.status === 'ABSENT' || item.status === 'EXCUSED' || attendanceTaken || !canManageAttendance}
                        value={item.arrivalTime}
                        onChange={() => { /* readOnly enforced */ }}
                        className="border border-[#E5E7EB] rounded p-1.5 text-[11px] outline-none w-24 text-neutral-600 font-semibold disabled:bg-neutral-50 disabled:text-neutral-300"
                      />
                      {!attendanceTaken && canManageAttendance && (
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date()
                            const hh = String(now.getHours()).padStart(2, '0')
                            const mm = String(now.getMinutes()).padStart(2, '0')
                            const updated = register.map(r => r.memberId === item.memberId ? { ...r, arrivalTime: `${hh}:${mm}` } : r)
                            setRegister(updated)
                          }}
                          className="px-2 py-1 text-[11px] bg-neutral-50 border border-neutral-100 rounded text-neutral-600"
                        >Now</button>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex rounded-lg border border-neutral-100 p-0.5 gap-0.5 bg-neutral-50/50">
                        {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const).map(st => {
                          const active = item.status === st
                          return (
                            <button
                              key={st}
                              type="button"
                              disabled={attendanceTaken || !canManageAttendance}
                              onClick={() => handleStatusChange(item.memberId, st)}
                              className={`px-2 py-1 rounded text-[9px] font-bold transition disabled:cursor-not-allowed ${active && st === 'PRESENT' ? 'bg-[#0B6B50] text-white' :
                                active && st === 'LATE' ? 'bg-[#D99A2B] text-white' :
                                  active && st === 'ABSENT' ? 'bg-red-600 text-white' :
                                    active && st === 'EXCUSED' ? 'bg-blue-600 text-white' :
                                      'text-neutral-400 hover:text-neutral-700'
                                }`}
                            >
                              {st}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        placeholder="e.g. Funeral excuse"
                        value={item.reason}
                        onChange={e => handleReasonChange(item.memberId, e.target.value)}
                        disabled={attendanceTaken || !canManageAttendance}
                        className="border border-[#E5E7EB] rounded p-1.5 text-[11px] outline-none w-full max-w-xs text-neutral-600 disabled:bg-neutral-50 disabled:text-neutral-400"
                      />
                    </td>
                    <td className="p-4 font-black text-right text-neutral-800">
                      {(Number(fineAmount ?? 0) > 0) ? (
                        <span className="text-red-500">+{currency} {Number(fineAmount ?? 0).toLocaleString()}</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-6 border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-neutral-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#E7F2ED] text-[#0B6B50]"><FileText size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Permanent record</p><h2 className="mt-1 text-base font-black text-neutral-900">Meeting minutes</h2><p className="mt-1 text-xs text-neutral-500">Capture decisions, follow-ups, and notes for the group&apos;s future reference.</p></div></div>
          {minutes?.approvedAt && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F2ED] px-2.5 py-1 text-[10px] font-bold text-[#0B6B50]"><Check size={12} /> Approved</span>}
        </div>

        {canManageMinutes ? (
          <div className="mt-4">
            <textarea value={minutesDraft} onChange={(event) => setMinutesDraft(event.target.value)} rows={8} placeholder="Record the discussion, resolutions, assigned actions, and any next steps..." className="w-full resize-y rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-3 text-sm text-neutral-700 outline-none transition focus:border-[#0B6B50]" />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600"><input type="checkbox" checked={minutesApproved} onChange={(event) => setMinutesApproved(event.target.checked)} className="h-4 w-4 accent-[#0B6B50]" /> Mark these minutes as approved</label><button type="button" onClick={handleSaveMinutes} disabled={isSavingMinutes || !minutesDraft.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B6B50] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#08503C] disabled:cursor-not-allowed disabled:opacity-60">{isSavingMinutes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{isSavingMinutes ? 'Saving...' : 'Save minutes'}</button></div>
          </div>
        ) : minutes?.content ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{minutes.content}</p>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">No minutes have been added yet. A user granted <span className="font-bold text-neutral-700">MEETING_MINUTES_MANAGE</span> can add them from this meeting record.</p>
        )}
      </section>
    </div>
  )
}
