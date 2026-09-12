"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, CalendarDays, ClipboardList, Clock3, Link2, Loader2, MapPin, PlusCircle, ShieldCheck, UsersRound, Video, X } from "lucide-react";
import { useGroups, useMeetings, useCreateMeeting } from "@/hooks/useVikobaApi";
import { groupService, type Meeting } from "@/lib/api/services";

export default function MeetingsDashboard() {
  const [currentGroupId, setCurrentGroupId] = useState("");
  const [canManageMeetings, setCanManageMeetings] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const currentGroup = JSON.parse(localStorage.getItem("v360_currentGroup") || "null") as Record<string, unknown> | null;
      const selectedGroupId = String(currentGroup?.groupId ?? currentGroup?.id ?? localStorage.getItem("v360_currentGroupId") ?? "");
      const memberships = JSON.parse(localStorage.getItem("v360_groups") || "[]") as Array<Record<string, unknown>>;
      const membership = memberships.find((item) => {
        const group = (item.group || item) as Record<string, unknown>;
        return String(group.groupId ?? group.id) === selectedGroupId;
      });
      const roles = Array.isArray(membership?.roles)
        ? membership.roles.map(String).map((role) => role.toUpperCase())
        : [String(membership?.role || "MEMBER").toUpperCase()];
      const permissions = Array.isArray(membership?.permissions)
        ? membership.permissions.map(String).map((permission) => permission.toUpperCase())
        : [];

      setCurrentGroupId(selectedGroupId);
      setCanManageMeetings(roles.includes("GROUP_ADMIN") || permissions.includes("MEETING_MANAGE"));
    } catch {
      setCurrentGroupId("");
      setCanManageMeetings(false);
    }
  }, []);

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
    const g = groups.find((item: any) => {
      const group = (item as any)?.group ?? item;
      return String(group?.groupId ?? group?.id) === currentGroupId;
    }) ?? groups.find((x: any) => (x as any)?.settingsConfigured) ?? groups[0];
    return (g as any)?.group ?? g;
  }, [currentGroupId, groups]);
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
  const [form, setForm] = useState({ title: "", date: "", time: "10:00", endTime: "", meetingMode: "PHYSICAL" as "ONLINE" | "PHYSICAL", location: "", meetingLink: "", agenda: "" });
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
    if (!canManageMeetings) {
      toast.error("You need MEETING_MANAGE permission to schedule a meeting.");
      return;
    }
    if (!primaryGroupId) {
      toast.error("Select a group before scheduling a meeting.");
      return;
    }
    if (form.date && form.agenda && (form.meetingMode === "ONLINE" ? form.meetingLink : form.location) && createMeetingMutation.status !== 'pending') {
      createMeetingMutation.mutate({
        groupId: String(primaryGroupId),
        data: {
          title: form.title.trim() || `${form.meetingMode === "ONLINE" ? "Online" : "Physical"} group meeting`,
          meetingDate: form.date,
          startTime: form.time,
          endTime: form.endTime || undefined,
          meetingMode: form.meetingMode,
          location: form.meetingMode === "PHYSICAL" ? form.location.trim() : undefined,
          meetingLink: form.meetingMode === "ONLINE" ? form.meetingLink.trim() : undefined,
          agenda: form.agenda,
        },
      }, {
        onSuccess: () => {
          setForm({ title: "", date: "", time: "10:00", endTime: "", meetingMode: "PHYSICAL", location: "", meetingLink: "", agenda: "" });
          setModalOpen(false);
          toast.success("Meeting scheduled and members have been notified.");
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to schedule the meeting."),
      });
    } else {
      toast.error("Add the date, agenda, and an online link or physical location.");
    }
  };

  useEffect(() => {
    if (!primaryGroupId) return;
    let mounted = true;
    groupService
      .getWithSettings(String(primaryGroupId))
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
  }, [primaryGroupId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>VIKOBA</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Meetings</span>
          </div>
          <h1 className="mt-2 text-3xl font-black text-neutral-900">Meetings Register</h1>
          <p className="mt-1 text-sm text-neutral-500">Plan group sessions, keep members informed, and record attendance with confidence.</p>
        </div>
        {canManageMeetings ? (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 self-stretch rounded-xl bg-[#0B6B50] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#08503C] sm:self-auto"
          >
            <PlusCircle size={15} /> Schedule meeting
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 self-stretch rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs font-bold text-neutral-500 sm:self-auto">
            <ShieldCheck size={14} className="text-[#0B6B50]" /> View-only access
          </span>
        )}
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 border-l-4 border-[#0B6B50] bg-white px-4 py-3 shadow-sm">
          <CalendarDays className="text-[#0B6B50]" size={20} />
          <div><p className="text-xl font-black text-neutral-900">{upcomingMeetings.length}</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Upcoming</p></div>
        </div>
        <div className="flex items-center gap-3 border-l-4 border-[#F2B84B] bg-white px-4 py-3 shadow-sm">
          <Video className="text-[#A66A00]" size={20} />
          <div><p className="text-xl font-black text-neutral-900">{upcomingMeetings.filter((meeting: any) => meeting.meetingMode === "ONLINE").length}</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Online sessions</p></div>
        </div>
        <div className="flex items-center gap-3 border-l-4 border-[#4B8BBE] bg-white px-4 py-3 shadow-sm">
          <UsersRound className="text-[#256A9F]" size={20} />
          <div><p className="text-xl font-black text-neutral-900">{pastMeetings.length}</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">Recorded sessions</p></div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Schedule cards lists */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Upcoming sessions */}
          <div className="border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Schedule</p><h3 className="mt-1 text-base font-black text-neutral-900">Upcoming meetings</h3></div>
              <span className="rounded-full bg-[#E7F2ED] px-2.5 py-1 text-[10px] font-bold text-[#0B6B50]">{upcomingMeetings.length} planned</span>
            </div>
            <div className="flex flex-col gap-4">
              {upcomingMeetings.map((m) => {
                const dateVal = (m as any).date ?? (m as any).meetingDate ?? null;
                const rawTime = (m as any).time ?? (m as any).startTime ?? "";
                const timeVal = rawTime ? rawTime.split(":").slice(0, 2).join(":") : "";
                const mode = String((m as any).meetingMode ?? "PHYSICAL").toUpperCase();
                const venueVal = mode === "ONLINE" ? (m as any).meetingLink ?? "Online session" : (m as any).location ?? (m as any).venue ?? "";
                return (
                  <div key={m.id} className="border border-neutral-100 bg-[#FCFDFC] p-4 transition hover:border-[#B5D7C5]">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#E7F2ED] text-[#0B6B50] w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-black">{dateVal ? new Date(dateVal).getDate() : ""}</span>
                        <span className="text-[7px] font-extrabold uppercase">{dateVal ? new Date(dateVal).toLocaleString(undefined, { month: 'short' }).toUpperCase() : ""}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-neutral-800">{(m as any).title ?? 'Regular VIKOBA Assembly'}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${mode === "ONLINE" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>{mode === "ONLINE" ? "Online" : "Physical"}</span></div>
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">{mode === "ONLINE" ? <Video size={12} /> : <MapPin size={12} />} {venueVal}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400"><Clock3 size={12} /> {timeVal || "Time to be confirmed"}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 sm:ml-16">
                      {mode === "ONLINE" && (m as any).meetingLink && <a href={(m as any).meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#B5D7C5] px-3.5 py-2 text-xs font-bold text-[#0B6B50] transition hover:bg-[#F2F7F4]"><Link2 size={13} /> Join online <ArrowUpRight size={13} /></a>}
                      <Link
                        href={`/app/meetings/${m.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B6B50] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#08503C]"
                      >
                        {canManageMeetings ? "Record attendance" : "View meeting"}
                      </Link>
                    </div>
                  </div>
                )
              })}
              {upcomingMeetings.length === 0 && (
                <div className="py-6 text-center text-xs text-neutral-400">{canManageMeetings ? "No upcoming sessions. Schedule one when the group is ready." : "No upcoming sessions have been scheduled."}</div>
              )}
            </div>
          </div>

          {/* Past assemblies minutes */}
          <div className="border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
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
                        <span className="text-[9px] text-[#0B6B50] font-bold bg-[#E7F2ED] px-2 py-0.5 rounded ml-2">
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
        <div className="h-fit border border-[#B5D7C5] bg-[#F2F7F4] p-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-[#0B6B50]" size={20} />
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
        <div className="fixed inset-0 bg-[#10241D]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto border border-[#E5E7EB] bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="schedule-meeting-title">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Meeting planner</p><h3 id="schedule-meeting-title" className="mt-1 text-lg font-black text-neutral-900">Schedule a group meeting</h3></div>
              <button type="button" title="Close meeting planner" aria-label="Close meeting planner" onClick={() => setModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSchedule} className="mt-5 flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-700">Meeting title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. September savings review" className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs text-neutral-800 outline-none transition focus:border-[#0B6B50]" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Session Date *</label>
                  <input
                    type="date"
                    required
                    min={todayIso}
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">End time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-neutral-700">Meeting format *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({ ...form, meetingMode: "PHYSICAL", meetingLink: "" })} className={`flex items-start gap-3 border p-3 text-left transition ${form.meetingMode === "PHYSICAL" ? "border-[#0B6B50] bg-[#F2F7F4]" : "border-[#E5E7EB] bg-white hover:border-[#B5D7C5]"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${form.meetingMode === "PHYSICAL" ? "bg-[#0B6B50] text-white" : "bg-neutral-100 text-neutral-500"}`}><MapPin size={17} /></span>
                    <span><span className="block text-xs font-bold text-neutral-800">Physical</span><span className="mt-1 block text-[10px] leading-4 text-neutral-500">Meet at a shared location.</span></span>
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, meetingMode: "ONLINE", location: "" })} className={`flex items-start gap-3 border p-3 text-left transition ${form.meetingMode === "ONLINE" ? "border-[#0B6B50] bg-[#F2F7F4]" : "border-[#E5E7EB] bg-white hover:border-[#B5D7C5]"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${form.meetingMode === "ONLINE" ? "bg-[#0B6B50] text-white" : "bg-neutral-100 text-neutral-500"}`}><Video size={17} /></span>
                    <span><span className="block text-xs font-bold text-neutral-800">Online</span><span className="mt-1 block text-[10px] leading-4 text-neutral-500">Share a secure meeting link.</span></span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">{form.meetingMode === "ONLINE" ? "Meeting link *" : "Location *"}</label>
                <input
                  type={form.meetingMode === "ONLINE" ? "url" : "text"}
                  required
                  placeholder={form.meetingMode === "ONLINE" ? "https://meet.google.com/..." : "e.g. Community Hall, Mikocheni"}
                  value={form.meetingMode === "ONLINE" ? form.meetingLink : form.location}
                  onChange={e => setForm({ ...form, [form.meetingMode === "ONLINE" ? "meetingLink" : "location"]: e.target.value })}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]"
                />
                <p className="mt-1.5 text-[10px] text-neutral-400">{form.meetingMode === "ONLINE" ? "Use a full link from Google Meet, Zoom, Microsoft Teams, or another trusted platform." : "Give members a clear place to meet, such as a hall, office, or street address."}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Assembly Agenda *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Weekly contributions collection, review dividend payout timelines..."
                  value={form.agenda}
                  onChange={e => setForm({ ...form, agenda: e.target.value })}
                  className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-xs font-bold text-neutral-500 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMeetingMutation.status === 'pending'}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition ${createMeetingMutation.status === 'pending' ? 'cursor-wait bg-neutral-300' : 'bg-[#0B6B50] hover:bg-[#08503C]'}`}
                >
                  {createMeetingMutation.status === 'pending' ? <><Loader2 size={14} className="animate-spin" /> Scheduling...</> : <><CalendarDays size={14} /> Schedule meeting</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
