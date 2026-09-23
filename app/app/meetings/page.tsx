"use client"

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, BellRing, CalendarDays, ClipboardList, Clock3, Link2, Loader2, MapPin, PlusCircle, ShieldCheck, Sparkles, UsersRound, Video, X } from "lucide-react";
import { useGroups, useMeetings, useCreateMeeting } from "@/hooks/useVikobaApi";
import { groupService, type Meeting } from "@/lib/api/services";
import { resolveActiveGroupId } from "@/lib/api/active-group";

export default function MeetingsDashboard() {
  const [currentGroupId, setCurrentGroupId] = useState("");
  const [canManageMeetings, setCanManageMeetings] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const selectedGroupId = resolveActiveGroupId(localStorage) || "";
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
  const activeGroupId = currentGroupId || (primaryGroupId == null ? "" : String(primaryGroupId));

  const meetingsQuery = useMeetings(activeGroupId || undefined);
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
  const nextMeeting = upcomingMeetings[0] as Meeting | undefined;

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMeetings) {
      toast.error("You need MEETING_MANAGE permission to schedule a meeting.");
      return;
    }
    if (!activeGroupId) {
      toast.error("Your current group could not be identified. Sign in again and retry.");
      return;
    }
    if (form.date && form.agenda && (form.meetingMode === "ONLINE" ? form.meetingLink : form.location) && createMeetingMutation.status !== 'pending') {
      createMeetingMutation.mutate({
        groupId: activeGroupId,
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
    if (!activeGroupId) return;
    let mounted = true;
    groupService
      .getWithSettings(activeGroupId)
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
  }, [activeGroupId]);

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header and Actions */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073D2E] via-[#0B6B50] to-[#11805F] px-6 py-7 text-white shadow-[0_24px_70px_rgba(11,107,80,0.22)] sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#F2B84B]/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-4 gap-1.5 bg-white/15 text-white ring-1 ring-white/20"><Sparkles size={12} /> Group calendar</Badge>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Meetings that keep everyone aligned</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Schedule sessions, notify every member by SMS, record attendance, and keep decisions together in one clear register.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold ring-1 ring-white/15"><BellRing size={15} /> Members notified automatically</div>
            {canManageMeetings ? <Button onClick={() => setModalOpen(true)} className="h-11 gap-2 rounded-xl border-2 border-[#FFD978] bg-[#F2B84B] px-5 text-xs font-black text-[#2F2100] shadow-[0_10px_24px_rgba(242,184,75,0.35)] ring-2 ring-white/20 hover:border-white hover:bg-[#FFD166] hover:text-[#241900] focus-visible:ring-4 focus-visible:ring-[#FFD978]/50"><PlusCircle size={16} strokeWidth={3} /> Schedule meeting</Button> : <span className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-xs font-bold ring-1 ring-white/30"><ShieldCheck size={15} /> View-only access</span>}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[{ label: 'Upcoming', value: upcomingMeetings.length, icon: CalendarDays, tone: 'bg-emerald-50 text-[#0B6B50]' }, { label: 'Online sessions', value: upcomingMeetings.filter((meeting: any) => meeting.meetingMode === 'ONLINE').length, icon: Video, tone: 'bg-amber-50 text-amber-700' }, { label: 'Recorded sessions', value: pastMeetings.length, icon: UsersRound, tone: 'bg-sky-50 text-sky-700' }].map(({ label, value, icon: Icon, tone }) => <Card key={label} className="rounded-2xl border-neutral-200/80"><CardContent className="flex items-center gap-4 p-5"><div className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></div><div><p className="text-2xl font-black text-foreground">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p></div></CardContent></Card>)}
      </div>

      {nextMeeting && <Card className="overflow-hidden rounded-3xl border-emerald-200 bg-gradient-to-r from-emerald-50 to-white"><CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center"><div><Badge variant="secondary" className="mb-3">Next meeting</Badge><h2 className="text-xl font-black text-foreground">{(nextMeeting as any).title || 'Group meeting'}</h2><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{String((nextMeeting as any).meetingDate || (nextMeeting as any).date || '')}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{String((nextMeeting as any).startTime || '')}</span><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{String((nextMeeting as any).location || (nextMeeting as any).meetingLink || 'Venue to be confirmed')}</span></div></div><ButtonLink href={`/app/meetings/${nextMeeting.id}`} className="h-11 gap-2 rounded-xl bg-[#0B6B50] px-5 font-black text-white shadow-lg ring-2 ring-[#0B6B50]/15 hover:bg-[#064A37]">Open meeting <ArrowRight size={16} /></ButtonLink></CardContent></Card>}

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Schedule cards lists */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Upcoming sessions */}
          <Card className="rounded-3xl border-neutral-200/80">
            <CardHeader className="flex-row items-center justify-between p-5 pb-2 sm:p-6 sm:pb-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Schedule</p><CardTitle className="mt-1 text-lg font-black">Upcoming meetings</CardTitle></div><Badge variant="secondary">{upcomingMeetings.length} planned</Badge></CardHeader>
            <CardContent className="p-5 pt-3 sm:p-6 sm:pt-3">
            <div className="flex flex-col gap-4">
              {upcomingMeetings.map((m) => {
                const dateVal = (m as any).date ?? (m as any).meetingDate ?? null;
                const rawTime = (m as any).time ?? (m as any).startTime ?? "";
                const timeVal = rawTime ? rawTime.split(":").slice(0, 2).join(":") : "";
                const mode = String((m as any).meetingMode ?? "PHYSICAL").toUpperCase();
                const venueVal = mode === "ONLINE" ? (m as any).meetingLink ?? "Online session" : (m as any).location ?? (m as any).venue ?? "";
                return (
                  <div key={m.id} className="group rounded-2xl border border-neutral-200/80 bg-gradient-to-r from-white to-neutral-50/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#E7F2ED] text-[#0B6B50] w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-black">{dateVal ? new Date(dateVal).getDate() : ""}</span>
                        <span className="text-[7px] font-extrabold uppercase">{dateVal ? new Date(dateVal).toLocaleString(undefined, { month: 'short' }).toUpperCase() : ""}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-neutral-800">{(m as any).title ?? 'Regular VIKOBA Assembly'}</span><Badge variant="outline" className={mode === "ONLINE" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-sky-200 bg-sky-50 text-sky-700"}>{mode === "ONLINE" ? "Online" : "Physical"}</Badge></div>
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">{mode === "ONLINE" ? <Video size={12} /> : <MapPin size={12} />} {venueVal}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400"><Clock3 size={12} /> {timeVal || "Time to be confirmed"}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 sm:ml-16">
                      {mode === "ONLINE" && (m as any).meetingLink && <a href={(m as any).meetingLink} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border-2 border-[#0B6B50] bg-white px-4 text-xs font-black text-[#0B6B50] shadow-sm transition hover:bg-emerald-50"><Link2 size={14} /> Join online <ArrowUpRight size={14} /></a>}
                      <ButtonLink
                        href={`/app/meetings/${m.id}`}
                        className="h-10 gap-2 rounded-xl bg-[#0B6B50] px-4 text-xs font-black text-white shadow-md hover:bg-[#064A37]"
                      >
                        {canManageMeetings ? "Record attendance" : "View meeting"}
                        <ArrowRight size={14} />
                      </ButtonLink>
                    </div>
                  </div>
                )
              })}
              {upcomingMeetings.length === 0 && (
                <div className="py-6 text-center text-xs text-neutral-400">{canManageMeetings ? "No upcoming sessions. Schedule one when the group is ready." : "No upcoming sessions have been scheduled."}</div>
              )}
            </div></CardContent>
          </Card>

          {/* Past assemblies minutes */}
          <Card className="rounded-3xl border-neutral-200/80"><CardHeader className="p-5 pb-2 sm:p-6 sm:pb-2"><CardTitle className="text-lg font-black">Past assemblies &amp; minutes</CardTitle></CardHeader><CardContent className="p-5 pt-3 sm:p-6 sm:pt-3">
            <div className="flex flex-col gap-4">
              {pastMeetings.map((m) => {
                const dateVal = (m as any).date ?? (m as any).meetingDate ?? null;
                const rawTime = (m as any).time ?? (m as any).startTime ?? "";
                const timeVal = rawTime ? rawTime.split(":").slice(0, 2).join(":") : "";
                const venueVal = (m as any).location ?? (m as any).venue ?? "";
                return (
                  <Link href={`/app/meetings/${m.id}`} key={m.id} className="block rounded-2xl border border-transparent p-3 transition hover:border-neutral-200 hover:bg-neutral-50">
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
                  </Link>
                )
              })}
              {pastMeetings.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs">No completed assemblies logged yet.</div>
              )}
            </div></CardContent></Card>
        </div>

        {/* Right 1 Col: Checklist details */}
        <Card className="h-fit rounded-3xl border-emerald-200 bg-gradient-to-b from-emerald-50 to-white">
          <CardContent className="p-6">
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
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/80 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Good practice</p><ul className="mt-3 space-y-2 text-xs text-neutral-600"><li>• Share a clear agenda before the session.</li><li>• Record attendance once everyone has arrived.</li><li>• Save decisions in meeting minutes.</li></ul></div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Meeting Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#10241D]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="schedule-meeting-title">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Meeting planner</p><h3 id="schedule-meeting-title" className="mt-1 text-lg font-black text-neutral-900">Schedule a group meeting</h3></div>
              <Button type="button" variant="outline" size="icon" title="Close meeting planner" aria-label="Close meeting planner" onClick={() => setModalOpen(false)} className="rounded-xl border-neutral-300 bg-white text-neutral-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                <X size={18} />
              </Button>
            </div>

            <form onSubmit={handleSchedule} className="mt-5 flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-700">Meeting title</label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. September savings review" className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs text-neutral-800 outline-none transition focus:border-[#0B6B50]" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Session Date *</label>
                  <Input
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
                  <Input
                    type="time"
                    required
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">End time</label>
                  <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-neutral-700">Meeting format *</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" onClick={() => setForm({ ...form, meetingMode: "PHYSICAL", meetingLink: "" })} className={`h-auto justify-start rounded-2xl border-2 p-3 text-left shadow-sm transition ${form.meetingMode === "PHYSICAL" ? "border-[#0B6B50] bg-emerald-50 ring-2 ring-[#0B6B50]/10" : "border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${form.meetingMode === "PHYSICAL" ? "bg-[#0B6B50] text-white" : "bg-neutral-100 text-neutral-500"}`}><MapPin size={17} /></span>
                    <span><span className="block text-xs font-bold text-neutral-800">Physical</span><span className="mt-1 block text-[10px] leading-4 text-neutral-500">Meet at a shared location.</span></span>
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setForm({ ...form, meetingMode: "ONLINE", location: "" })} className={`h-auto justify-start rounded-2xl border-2 p-3 text-left shadow-sm transition ${form.meetingMode === "ONLINE" ? "border-[#0B6B50] bg-emerald-50 ring-2 ring-[#0B6B50]/10" : "border-neutral-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${form.meetingMode === "ONLINE" ? "bg-[#0B6B50] text-white" : "bg-neutral-100 text-neutral-500"}`}><Video size={17} /></span>
                    <span><span className="block text-xs font-bold text-neutral-800">Online</span><span className="mt-1 block text-[10px] leading-4 text-neutral-500">Share a secure meeting link.</span></span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">{form.meetingMode === "ONLINE" ? "Meeting link *" : "Location *"}</label>
                <Input
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
                <Textarea
                  required
                  rows={3}
                  placeholder="Weekly contributions collection, review dividend payout timelines..."
                  value={form.agenda}
                  onChange={e => setForm({ ...form, agenda: e.target.value })}
                  className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F7F7F2] p-2.5 text-xs outline-none focus:border-[#0B6B50]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="h-11 rounded-xl border-2 border-neutral-300 bg-white px-5 text-xs font-black text-neutral-700 shadow-sm hover:border-neutral-400 hover:bg-neutral-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMeetingMutation.status === 'pending'}
                  className="h-11 gap-2 rounded-xl bg-[#0B6B50] px-5 text-xs font-black text-white shadow-lg ring-2 ring-[#0B6B50]/15 hover:bg-[#064A37] disabled:bg-neutral-300 disabled:text-neutral-600 disabled:shadow-none disabled:ring-0"
                >
                  {createMeetingMutation.status === 'pending' ? <><Loader2 size={14} className="animate-spin" /> Scheduling...</> : <><CalendarDays size={14} /> Schedule meeting</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
