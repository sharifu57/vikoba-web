"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileDown, Landmark, WalletCards, AlertCircle, CalendarDays, Users } from "lucide-react"
import { memberService, Member360Response } from "@/lib/api/services"

type Tab = "overview" | "contributions" | "loans" | "fines" | "socialFund" | "attendance"
const EMPTY = "—"

function formatAmount(value: number | undefined, currency: string) {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0))
}
function formatDate(value?: string) {
  if (!value) return EMPTY
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(parsed)
}
function Status({ value }: { value?: string }) {
  const status = value || "UNKNOWN"
  const good = ["ACTIVE", "PAID", "PRESENT", "APPROVED", "DISBURSED", "COMPLETED"].includes(status)
  const warning = ["PENDING", "PARTIALLY_PAID", "PARTIALLY PAID", "LATE"].includes(status)
  return <span className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${good ? "bg-emerald-50 text-emerald-700" : warning ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-600"}`}>{status.replaceAll("_", " ")}</span>
}
function EmptyState({ message }: { message: string }) { return <div className="py-10 text-center text-sm text-neutral-400">{message}</div> }

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [data, setData] = useState<Member360Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    memberService.get360(id).then(response => {
      if (!active) return
      // A successful 360 response can still contain a missing member object.
      // Keep its other sections (fines, attendance, etc.) visible to the user.
      if (response.status && response.data) setData(response.data)
      else setError(response.message || "We could not find this member.")
    }).catch((requestError: Error) => active && setError(requestError.message || "Unable to load member details.")).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const group = useMemo(() => {
    if (typeof window === "undefined") return { name: "this group", currency: "TZS" }
    try { return JSON.parse(localStorage.getItem("v360_currentGroup") || "{}") } catch { return {} }
  }, [])
  const currency = group.currency || "TZS"
  const member = data?.member ?? { id, fullName: "Member information unavailable" }
  const contributions = data?.contributions || []
  const loans = data?.loans || []
  const fines = data?.fines || []
  const attendance = data?.meetingAttendance || []
  const socialFund = data?.socialFundContributions || []
  const totalContributions = contributions.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
  const totalDisbursedLoans = loans.filter(item => item.status === "DISBURSED").reduce((sum, item) => sum + Number(item.totalAmount || item.principalAmount || 0), 0)
  const unpaidFines = fines.filter(item => item.status !== "PAID").reduce((sum, item) => sum + Number(item.balance ?? item.amount ?? 0), 0)
  const attendanceRate = attendance.length ? Math.round((attendance.filter(item => ["PRESENT", "LATE"].includes(item.attendanceStatus || "")).length / attendance.length) * 100) : 0
  const fullName = member?.fullName || [member?.firstName, member?.middleName, member?.lastName].filter(Boolean).join(" ") || "Member"

  function downloadStatement() {
    const rows = [["Date", "Category", "Description", "Amount", "Reference"], ...contributions.map(item => [item.paidAt || "", "Contribution", item.status || "", String(item.paidAmount || 0), String(item.contributionPeriodId || "")]), ...socialFund.map(item => [item.contributionDate || "", "Social fund", `Fund type ${item.fundTypeId || EMPTY}`, String(item.amount || 0), item.reference || ""])]
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `${fullName.replaceAll(/\s+/g, "_")}_statement.csv`; link.click(); URL.revokeObjectURL(link.href)
  }

  if (loading) return <div className="mx-auto max-w-7xl px-6 py-16 text-center text-sm text-neutral-500">Loading member details…</div>
  if (error) return <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-16 text-center"><h1 className="text-xl font-black text-neutral-900">Member details unavailable</h1><p className="text-sm text-neutral-500">{error}</p><Link href="/app/members" className="rounded-lg bg-[#087f5b] px-4 py-2 text-xs font-bold text-white">Back to members</Link></div>

  const tabs: { id: Tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "contributions", label: "Contributions" }, { id: "loans", label: "Loans" }, { id: "fines", label: "Fines" }, { id: "socialFund", label: "Social Fund" }, { id: "attendance", label: "Attendance" }]
  const profileFields = [["Membership number", member.membershipNumber || member.memberNo], ["Membership ID", member.id], ["Member ID", member.memberId], ["Group ID", member.groupId], ["Membership type", member.membershipType], ["Role", member.role], ["Status", member.membershipStatus || member.status], ["Phone", member.phone], ["Email", member.email], ["National ID", member.nationalId], ["Occupation", member.occupation], ["Address", member.address], ["Joined", formatDate(member.joinedDate)], ["Record created", formatDate(member.createdAt)]]
  const metrics = [["Total contributions", formatAmount(totalContributions, currency), WalletCards, "text-neutral-800"], ["Total disbursed loans", formatAmount(totalDisbursedLoans, currency), Landmark, totalDisbursedLoans ? "text-red-600" : "text-neutral-800"], ["Outstanding fines", formatAmount(unpaidFines, currency), AlertCircle, unpaidFines ? "text-red-600" : "text-neutral-800"], ["Attendance rate", `${attendanceRate}%`, Users, "text-[#087f5b]"]]

  return <main className="mx-auto max-w-7xl px-6 py-8">
    <Link href="/app/members" className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-700"><ArrowLeft size={14} /> Back to Members Register</Link>
    <section className="mb-6 flex flex-col justify-between gap-5 rounded-2xl border border-[#dfe8e2] bg-white p-6 shadow-sm md:flex-row md:items-center"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf6ef] text-xl font-black text-[#087f5b]">{fullName.split(" ").map(name => name[0]).join("").slice(0, 2)}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black text-neutral-900">{fullName}</h1><Status value={member.membershipStatus || member.status} /></div><p className="mt-1 text-xs text-neutral-500">{member.membershipNumber || member.memberNo || "No membership number"} · {member.role || "MEMBER"}</p></div></div><button onClick={downloadStatement} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#dfe8e2] px-4 py-2.5 text-xs font-bold hover:bg-neutral-50"><FileDown size={14} /> Download statement</button></section>
    <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{metrics.map(([label, value, Icon, color]) => { const MetricIcon = Icon as typeof WalletCards; return <div key={label as string} className="rounded-xl border border-[#dfe8e2] bg-white p-5"><div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400"><span>{label as string}</span><MetricIcon size={15} /></div><p className={`mt-2 text-lg font-black ${color as string}`}>{value as string}</p></div> })}</section>
    <nav className="mb-6 flex gap-6 overflow-x-auto border-b border-[#dfe8e2] text-xs font-bold text-neutral-400">{tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 border-b-2 pb-3 ${activeTab === tab.id ? "border-[#087f5b] text-[#087f5b]" : "border-transparent hover:text-neutral-700"}`}>{tab.label}</button>)}</nav>
    <section className="rounded-xl border border-[#dfe8e2] bg-white p-6 shadow-sm">
      {activeTab === "overview" && <div className="grid gap-8 lg:grid-cols-2"><div><h2 className="mb-4 border-b pb-2 text-sm font-extrabold">Personal & membership details</h2><dl className="grid gap-3 text-xs sm:grid-cols-2">{profileFields.map(([label, value]) => <div key={label} className="border-b border-neutral-100 pb-2"><dt className="text-neutral-400">{label}</dt><dd className="mt-1 break-words font-bold text-neutral-800">{value || EMPTY}</dd></div>)}</dl></div><div><h2 className="mb-4 border-b pb-2 text-sm font-extrabold">Next of kin</h2><dl className="grid gap-3 text-xs">{[["Name", member.nextOfKinName], ["Phone", member.nextOfKinPhone], ["Relationship", member.nextOfKinRelationship]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-neutral-100 py-2"><dt className="text-neutral-400">{label}</dt><dd className="font-bold">{value || EMPTY}</dd></div>)}</dl></div></div>}
      {activeTab === "contributions" && <Table headers={["Paid date", "Period ID", "Expected", "Paid", "Balance", "Status"]} rows={contributions.map(item => [formatDate(item.paidAt), item.contributionPeriodId || EMPTY, formatAmount(item.expectedAmount, currency), formatAmount(item.paidAmount, currency), formatAmount(item.balance, currency), <Status key="status" value={item.status} />])} empty="No contribution records for this member." />}
      {activeTab === "loans" && <Table headers={["Loan", "Purpose", "Principal", "Interest", "Total", "Term", "Applied", "Approved", "Disbursed", "Maturity", "Status", "Rejection reason"]} rows={loans.map(item => [item.loanNumber || `Loan #${item.id}`, item.purpose || EMPTY, formatAmount(item.principalAmount, currency), formatAmount(item.interestAmount, currency), formatAmount(item.totalAmount, currency), item.durationMonths ? `${item.durationMonths} months` : EMPTY, formatDate(item.applicationDate), formatDate(item.approvalDate), formatDate(item.disbursementDate), formatDate(item.maturityDate), <Status key="status" value={item.status} />, item.rejectionReason || EMPTY])} empty="No loan records for this member." />}
      {activeTab === "fines" && <Table headers={["Fine date", "Reason", "Amount", "Paid", "Balance", "Due date", "Status"]} rows={fines.map(item => [formatDate(item.fineDate), item.reason || EMPTY, formatAmount(item.amount, currency), formatAmount(item.paidAmount, currency), formatAmount(item.balance ?? item.amount, currency), formatDate(item.dueDate), <Status key="status" value={item.status} />])} empty="No fine records for this member." />}
      {activeTab === "socialFund" && <Table headers={["Date", "Fund type ID", "Amount", "Reference"]} rows={socialFund.map(item => [formatDate(item.contributionDate), item.fundTypeId || EMPTY, formatAmount(item.amount, currency), item.reference || EMPTY])} empty="No social fund contributions for this member." />}
      {activeTab === "attendance" && <><div className="mb-5 flex items-center gap-2 text-sm font-bold text-neutral-700"><CalendarDays size={16} className="text-[#087f5b]" /> Attendance rate: {attendanceRate}%</div><Table headers={["Meeting", "Date", "Location", "Time", "Meeting status", "Arrival", "Attendance", "Reason"]} rows={attendance.map(item => [item.meetingTitle || `Meeting #${item.meetingId || EMPTY}`, formatDate(item.meetingDate), item.location || EMPTY, [item.startTime, item.endTime].filter(Boolean).join(" – ") || EMPTY, item.meetingStatus || EMPTY, item.arrivalTime || EMPTY, <Status key="status" value={item.attendanceStatus} />, item.reason || EMPTY])} empty="No attendance records for this member." /></>}
    </section>
  </main>
}

function Table({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{headers.map(header => <th key={header} className="whitespace-nowrap px-2 py-3 first:pl-0">{header}</th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-2 py-3 font-medium text-neutral-700 first:pl-0">{cell}</td>)}</tr>)}{!rows.length && <tr><td colSpan={headers.length}><EmptyState message={empty} /></td></tr>}</tbody></table></div>
}
