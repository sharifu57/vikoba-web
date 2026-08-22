'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useVikobaStore, Attendance } from '@/lib/mockStore'
import { ArrowLeft, Check, CheckSquare } from 'lucide-react'

export default function MeetingAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const {
    meetings,
    members,
    currentGroup,
    saveAttendance
  } = useVikobaStore()

  const meeting = meetings.find(m => m.id === id && m.groupId === currentGroup.id)

  // State to hold temporary register list
  const [register, setRegister] = useState<Omit<Attendance, 'id'>[]>([])

  useEffect(() => {
    if (meeting && members) {
      const activeMembers = members.filter(m => m.groupId === currentGroup.id)
      const list = activeMembers.map(m => ({
        meetingId: id,
        memberId: m.id,
        status: 'PRESENT' as const,
        arrivalTime: '09:55 AM',
        fineAmount: 0,
        reason: ''
      }))
      setRegister(list)
    }
  }, [meeting, members])

  const handleStatusChange = (memberId: string, status: Attendance['status']) => {
    let fineAmt = 0
    if (status === 'ABSENT') fineAmt = 15000
    if (status === 'LATE') fineAmt = 5000

    const updated = register.map(item => {
      if (item.memberId === memberId) {
        return {
          ...item,
          status,
          fineAmount: fineAmt,
          arrivalTime: status === 'PRESENT' ? '09:55 AM' : status === 'LATE' ? '10:15 AM' : ''
        }
      }
      return item
    })
    setRegister(updated)
  }

  const handleReasonChange = (memberId: string, reason: string) => {
    const updated = register.map(item => {
      if (item.memberId === memberId) {
        return { ...item, reason }
      }
      return item
    })
    setRegister(updated)
  }

  const handleMarkAllPresent = () => {
    const updated = register.map(item => ({
      ...item,
      status: 'PRESENT' as const,
      arrivalTime: '09:55 AM',
      fineAmount: 0,
      reason: ''
    }))
    setRegister(updated)
  }

  const handleSave = () => {
    saveAttendance(id, register)
    router.push('/app/meetings')
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
            Assembly Date: <strong className="text-neutral-700 font-bold">{meeting.date}</strong> · Location: <strong className="text-neutral-500 font-bold">{meeting.location}</strong>
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleMarkAllPresent}
            className="flex-1 md:flex-none px-4 py-2.5 border border-[#dfe8e2] hover:bg-neutral-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <CheckSquare size={14} /> Mark All Present
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check size={14} strokeWidth={3} /> Save Attendance
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
                return (
                  <tr key={item.memberId} className="hover:bg-neutral-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                          {member?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-800 block text-xs">{member?.name}</span>
                          <span className="text-[9px] text-neutral-400 block mt-0.5">{member?.memberNo}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        placeholder="e.g. 09:55 AM"
                        disabled={item.status === 'ABSENT' || item.status === 'EXCUSED'}
                        value={item.arrivalTime}
                        onChange={e => {
                          const updated = register.map(r => r.memberId === item.memberId ? { ...r, arrivalTime: e.target.value } : r)
                          setRegister(updated)
                        }}
                        className="border border-[#dfe8e2] rounded p-1.5 text-[11px] outline-none w-24 text-neutral-600 font-semibold disabled:bg-neutral-50 disabled:text-neutral-300"
                      />
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
                      {(Number(item.fineAmount ?? 0) > 0) ? (
                        <span className="text-red-500">+{currentGroup.currency} {Number(item.fineAmount ?? 0).toLocaleString()}</span>
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
