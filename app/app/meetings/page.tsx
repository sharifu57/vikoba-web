'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useVikobaStore, Meeting } from '@/lib/mockStore'
import { PlusCircle, CalendarDays, MapPin, ClipboardList, CheckCircle2, Eye, X } from 'lucide-react'

export default function MeetingsDashboard() {
  const { meetings, currentGroup, createMeeting } = useVikobaStore()

  // Modal schedule state
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    date: '',
    time: '10:00 AM',
    location: 'Community Hall, Mikocheni',
    agenda: ''
  })

  const upcomingMeetings = meetings.filter(m => m.groupId === currentGroup.id && m.status === 'UPCOMING')
  const pastMeetings = meetings.filter(m => m.groupId === currentGroup.id && m.status === 'COMPLETED')

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.date && form.agenda) {
      createMeeting({
        date: form.date,
        time: form.time,
        location: form.location,
        agenda: form.agenda
      })
      setForm({ date: '', time: '10:00 AM', location: 'Community Hall, Mikocheni', agenda: '' })
      setModalOpen(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>VIKOBA</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Meetings</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Meetings Register</h1>
          <p className="text-xs text-neutral-400">Schedule regular weekly sessions and mark attendance records.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm self-stretch sm:self-auto"
        >
          <PlusCircle size={14} /> Schedule Meeting
        </button>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Schedule cards lists */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Upcoming sessions */}
          <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm">
            <h3 className="font-extrabold text-neutral-800 text-sm mb-4">Upcoming Scheduled Assemblies</h3>
            <div className="flex flex-col gap-4">
              {upcomingMeetings.map(m => (
                <div key={m.id} className="border border-neutral-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#eaf6ef] text-[#087f5b] w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-black">{new Date(m.date).getDate()}</span>
                      <span className="text-[7px] font-extrabold uppercase">AUG</span>
                    </div>
                    <div>
                      <span className="font-bold text-neutral-800 text-xs block">Regular VIKOBA Assembly</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">{m.location} · ⏰ {m.time}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link 
                      href={`/app/meetings/${m.id}`}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-[#087f5b] hover:bg-[#066b4c] text-white font-bold rounded-lg text-xs text-center shadow-sm"
                    >
                      Record Attendance
                    </Link>
                  </div>
                </div>
              ))}
              {upcomingMeetings.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs">No upcoming sessions. Click Schedule to add one.</div>
              )}
            </div>
          </div>

          {/* Past assemblies minutes */}
          <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm">
            <h3 className="font-extrabold text-neutral-800 text-sm mb-4">Past Assemblies & Minutes</h3>
            <div className="flex flex-col gap-4">
              {pastMeetings.map(m => (
                <div key={m.id} className="border-b border-neutral-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-extrabold text-neutral-700">{m.date} assembly</span>
                      <span className="text-[9px] text-[#087f5b] font-bold bg-[#eaf6ef] px-2 py-0.5 rounded ml-2">
                        Attendance: {m.attendanceRate}%
                      </span>
                    </div>
                    <span className="text-[9px] text-neutral-400 font-semibold">{m.time} · {m.location}</span>
                  </div>
                  <div className="mt-3 bg-neutral-50 rounded-xl p-3 text-xs text-neutral-600 flex flex-col gap-2">
                    <p><strong>Agenda:</strong> {m.agenda}</p>
                    {m.minutes && <p><strong>Minutes notes:</strong> {m.minutes}</p>}
                    {m.resolution && <p><strong>Resolutions passed:</strong> {m.resolution}</p>}
                  </div>
                </div>
              ))}
              {pastMeetings.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs">No completed assemblies logged yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Checklist details */}
        <div className="bg-[#eff7f1] rounded-xl p-6 border border-[#b9d7c2] h-fit flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-[#087f5b]" size={20} />
            <h3 className="font-extrabold text-neutral-800 text-sm">Session Bylaws</h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Attendance roll-call is taken within the first 15 minutes of assembly start. Members arriving late are issued a late fine of <strong>TZS 5,000</strong>. 
            Absentees without excuses are issued an absence fine of <strong>TZS 15,000</strong>.
          </p>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Schedule Group Assembly</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSchedule} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Session Date *</label>
                  <input 
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Start Time *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Location *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Community Hall, Mikocheni"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Assembly Agenda *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Weekly contributions collection, review dividend payout timelines..."
                  value={form.agenda}
                  onChange={e => setForm({ ...form, agenda: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b] resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#dfe8e2] rounded-lg text-xs font-bold text-neutral-500 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg text-xs font-bold"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
