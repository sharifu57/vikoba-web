'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, CheckSquare } from 'lucide-react'
import { meetingService, memberService, type Meeting } from '@/lib/api/services'

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
    if (attendanceTaken) return
    const updated = register.map((r) => r.memberId === memberId ? { ...r, status, arrivalTime: status === 'PRESENT' ? r.arrivalTime ?? '09:55' : status === 'LATE' ? r.arrivalTime ?? '10:15' : '' } : r)
    setRegister(updated)
  }

  const handleReasonChange = (memberId: string, reason: string) => {
    const updated = register.map((r) => r.memberId === memberId ? { ...r, reason } : r)
    setRegister(updated)
  }

  const handleMarkAllPresent = () => {
    if (attendanceTaken) return
    setRegister((prev) => prev.map(r => ({ ...r, status: 'PRESENT', arrivalTime: r.arrivalTime ?? '09:55', reason: '' })))
  }

  const handleSave = async () => {
    if (attendanceTaken) return
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
      router.push('/app/meetings')
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to save attendance', err)
      setIsSaving(false)
      alert(err?.message || 'Failed to save attendance')
    }
  }

  if (!meeting) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-neutral-800">Meeting Not Found</h2>
        <Link href="/app/meetings" className="mt-4 inline-block px-4 py-2 bg-[#087f5b] text-white rounded-lg text-xs">
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
      <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Meetings</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Attendance</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Take Attendance Register</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Assembly Date: <strong className="text-neutral-700 font-bold">{(meeting as any).meetingDate ?? (meeting as any).date}</strong> · Location: <strong className="text-neutral-500 font-bold">{(meeting as any).location ?? (meeting as any).venue}</strong>
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleMarkAllPresent}
            disabled={attendanceTaken}
            className={`flex-1 md:flex-none px-4 py-2.5 border border-[#dfe8e2] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${attendanceTaken ? 'opacity-60 cursor-not-allowed' : 'hover:bg-neutral-50'}`}
          >
            <CheckSquare size={14} /> Mark All Present
          </button>
          <button
            onClick={handleSave}
            disabled={attendanceTaken || isSaving}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${attendanceTaken || isSaving ? 'bg-neutral-300 cursor-wait text-neutral-600' : 'bg-[#087f5b] hover:bg-[#066b4c] text-white'}`}
          >
            <Check size={14} strokeWidth={3} /> {isSaving ? 'Saving…' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Register Checklist table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
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
                const fineAmount = item.status === 'ABSENT' ? ((meeting as any)?.absenceFine ?? 15000) : item.status === 'LATE' ? ((meeting as any)?.lateFine ?? 5000) : 0
                return (
                  <tr key={item.memberId} className="hover:bg-neutral-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
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
                        disabled={item.status === 'ABSENT' || item.status === 'EXCUSED' || attendanceTaken}
                        value={item.arrivalTime}
                        onChange={() => { /* readOnly enforced */ }}
                        className="border border-[#dfe8e2] rounded p-1.5 text-[11px] outline-none w-24 text-neutral-600 font-semibold disabled:bg-neutral-50 disabled:text-neutral-300"
                      />
                      {!attendanceTaken && (
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
                              onClick={() => handleStatusChange(item.memberId, st)}
                              className={`px-2 py-1 rounded text-[9px] font-bold transition ${active && st === 'PRESENT' ? 'bg-[#087f5b] text-white' :
                                active && st === 'LATE' ? 'bg-[#d99521] text-white' :
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
                        className="border border-[#dfe8e2] rounded p-1.5 text-[11px] outline-none w-full max-w-xs text-neutral-600"
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
    </div>
  )
}
