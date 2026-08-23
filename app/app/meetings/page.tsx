"use client"

import { useMemo, useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { PlusCircle, ClipboardList, X } from "lucide-react";
import { useGroups, useMeetings, useCreateMeeting } from "@/hooks/useVikobaApi";
import { groupService, meetingService, type Meeting } from "@/lib/api/services";

export default function MeetingsDashboard() {
  // Load user groups from backend (no localStorage)
  const groupsQuery = useGroups();
  // API may return an envelope { status, message, data: [...] } or the array directly.
  const rawGroups = groupsQuery.data as any;
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : Array.isArray(rawGroups?.data)
      ? rawGroups.data
      : [];

  // choose primary group: prefer one with settingsConfigured, otherwise first
  const primaryGroup = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    const g = groups.find((x: any) => (x as any)?.settingsConfigured) ?? groups[0];
    return (g as any)?.group ?? g;
  }, [groups]);
  // normalize primary group id (some responses use `groupId`, older code used `id`)
  const primaryGroupId = (primaryGroup as any)?.groupId ?? (primaryGroup as any)?.id ?? null;

  const meetingsQuery = useMeetings(primaryGroupId);
  const rawMeetings = meetingsQuery.data as any;
  const meetings = Array.isArray(rawMeetings)
    ? rawMeetings
    : Array.isArray(rawMeetings?.data)
      ? rawMeetings.data
      : [];

  const createMeetingMutation = useCreateMeeting();

  // Modal schedule state
  const [modalOpen, setModalOpen] = useState(false);
  // Use 24-hour `HH:mm` format for `time` so backend LocalTime parses it correctly
  const [form, setForm] = useState({ date: "", time: "10:00", location: "", agenda: "" });
  const [groupSettings, setGroupSettings] = useState<any | null>(null);
  const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for input[type=date] min

  const upcomingStatuses = ["UPCOMING", "SCHEDULED", "CONFIRMED"];
  const pastStatuses = ["COMPLETED", "PAST", "CANCELLED"];

  const upcomingMeetings = (meetings as Meeting[])
    .filter((m) => upcomingStatuses.includes(String(m.status)))
    .sort((a, b) =>
      (String(((a as any).meetingDate ?? a.date) || "")).localeCompare(String(((b as any).meetingDate ?? b.date) || "")) ||
      String(((a as any).startTime ?? "") || "").localeCompare(String(((b as any).startTime ?? "") || ""))
    );

  const pastMeetings = (meetings as Meeting[])
    .filter((m) => pastStatuses.includes(String(m.status)))
    .sort((a, b) =>
      (String(((b as any).meetingDate ?? b.date) || "")).localeCompare(String(((a as any).meetingDate ?? a.date) || "")) ||
      String(((b as any).startTime ?? "") || "").localeCompare(String(((a as any).startTime ?? "") || ""))
    );

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryGroupId) return alert("No group available — please select or create a group first.");
    if (form.date && form.agenda && createMeetingMutation.status !== 'pending') {
      createMeetingMutation.mutate({
        groupId: String(primaryGroupId),
        data: {
          // backend requires a non-null `title` field on Meeting
          title: form.agenda ? String(form.agenda).slice(0, 120) : "Assembly",
          meetingDate: form.date,
          startTime: form.time,
          location: form.location,
          agenda: form.agenda,
        },
      } as any, {
        onSuccess: () => {
          setForm({ date: "", time: "10:00", location: "", agenda: "" });
          setModalOpen(false);
        },
      });
    }
  };

  useEffect(() => {
    if (!primaryGroup?.id) return;
    let mounted = true;
    groupService
      .getWithSettings(String(primaryGroup.id))
      .then((resp) => {
        if (!mounted) return;
        // resp may be an ApiResponse envelope or the payload directly
        const payload = resp as any;
        const settings = payload?.data?.settings ?? payload?.settings ?? null;
        setGroupSettings(settings);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      mounted = false;
    };
  }, [primaryGroup]);

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
              {upcomingMeetings.map((m) => {
                const dateVal = (m as any).date ?? (m as any).meetingDate ?? null;
                const rawTime = (m as any).time ?? (m as any).startTime ?? "";
                const timeVal = rawTime ? rawTime.split(":").slice(0, 2).join(":") : "";
                const venueVal = (m as any).location ?? (m as any).venue ?? "";
                return (
                  <div key={m.id} className="border border-neutral-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#eaf6ef] text-[#087f5b] w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-black">{dateVal ? new Date(dateVal).getDate() : ""}</span>
                        <span className="text-[7px] font-extrabold uppercase">{dateVal ? new Date(dateVal).toLocaleString(undefined, { month: 'short' }).toUpperCase() : ""}</span>
                      </div>
                      <div>
                        <span className="font-bold text-neutral-800 text-xs block">{(m as any).title ?? 'Regular VIKOBA Assembly'}</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">{venueVal} · ⏰ {timeVal}</span>
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
                )
              })}
              {upcomingMeetings.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs">No upcoming sessions. Click Schedule to add one.</div>
              )}
            </div>
          </div>

          {/* Past assemblies minutes */}
          <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 shadow-sm">
            <h3 className="font-extrabold text-neutral-800 text-sm mb-4">Past Assemblies & Minutes</h3>
            <div className="flex flex-col gap-4">
              {pastMeetings.map((m) => {
                const dateVal = (m as any).date ?? (m as any).meetingDate ?? null;
                const rawTime = (m as any).time ?? (m as any).startTime ?? "";
                const timeVal = rawTime ? rawTime.split(":").slice(0, 2).join(":") : "";
                const venueVal = (m as any).location ?? (m as any).venue ?? "";
                return (
                  <div key={m.id} className="border-b border-neutral-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-neutral-700">{dateVal ? `${new Date(dateVal).toLocaleDateString()}` : "Assembly"} assembly</span>
                        <span className="text-[9px] text-[#087f5b] font-bold bg-[#eaf6ef] px-2 py-0.5 rounded ml-2">
                          Attendance: {(m as any).attendanceRate ?? "-"}%
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-400 font-semibold">{timeVal} · {venueVal}</span>
                    </div>
                    <div className="mt-3 bg-neutral-50 rounded-xl p-3 text-xs text-neutral-600 flex flex-col gap-2">
                      <p><strong>Agenda:</strong> {(m as any).agenda ?? "-"}</p>
                      {(m as any).minutes && <p><strong>Minutes notes:</strong> {(m as any).minutes}</p>}
                      {(m as any).resolution && <p><strong>Resolutions passed:</strong> {(m as any).resolution}</p>}
                    </div>
                  </div>
                )
              })}
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
            Attendance roll-call is taken within the first 15 minutes of assembly start.
            {groupSettings?.latePaymentFine && (
              <>
                {' '}
                Members arriving late will incur the group's configured late fine: <strong>{`TZS ${groupSettings.latePaymentFine.toLocaleString()}`}</strong>.
              </>
            )}
            {groupSettings?.absenceFine && (
              <>
                {' '}Absence penalties follow the group's configured policy where available; absence fine: <strong>{`TZS ${groupSettings.absenceFine.toLocaleString()}`}</strong>.
              </>
            )}
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
                    min={todayIso}
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#087f5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    required
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
                  disabled={createMeetingMutation.status === 'pending'}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white ${createMeetingMutation.status === 'pending' ? 'bg-neutral-300 cursor-wait' : 'bg-[#087f5b] hover:bg-[#066b4c]'}`}
                >
                  {createMeetingMutation.status === 'pending' ? 'Scheduling…' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
