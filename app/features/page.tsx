'use client'

import Link from 'next/link'
import {
  ArrowRight, Users, WalletCards, BarChart3, HandCoins, AlertCircle,
  Sparkles, CalendarDays, FileText, Check, ShieldCheck
} from 'lucide-react'
import { VikobaLogo } from '@/components/brand'

const features = [
  { title: 'Member Management', text: 'Manage members, membership status, roles (Admin, Treasurer, Loan Officer) and detailed member profile cards.', icon: Users },
  { title: 'Contributions Tracker', text: 'Record weekly, monthly and special contributions. Automatically calculates deficits and period collection rates.', icon: WalletCards },
  { title: 'Shares (Hisa)', text: 'Manage share purchases, share prices, buybacks, transfers, and ownership ledgers cleanly.', icon: BarChart3 },
  { title: 'Guarantor-backed Loans', text: 'Log applications, assign guarantors from current members, track approvals, and build repayment amortization schedules.', icon: HandCoins },
  { title: 'Attendance & Late Fines', text: 'Issue penalties for late meeting arrivals, absences, or late loan payments automatically.', icon: AlertCircle },
  { title: 'Jamii / Social Fund', text: 'Manage social support emergency allowances for weddings, hospital stays, accidents, or death claims.', icon: Sparkles },
  { title: 'Meetings & Minutes', text: 'Schedule upcoming group gatherings, record agendas, document meeting minutes, and log passed resolutions.', icon: CalendarDays },
  { title: 'Financial Management', text: 'Monitor cash positions, mobile money account balances, and banking lines.', icon: WalletCards },
  { title: 'Audit Logs & Ledgers', text: 'Real-time transparency with full audit records detailing who approved what loan or recorded what payment.', icon: ShieldCheck },
  { title: 'Reports Center', text: 'Generate Income Statements, Member statements, Loan registers, and Contribution grids. Export in PDF/Excel.', icon: FileText }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col justify-between">
      {/* Navbar */}
      <header className="sticky top-0 bg-[#F7F7F2]/95 border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between z-40">
        <Link href="/"><VikobaLogo /></Link>
        <nav className="flex items-center gap-6 text-sm font-bold text-neutral-500">
          <Link href="/features" className="text-[#0B6B50]">Features</Link>
          <Link href="/pricing" className="hover:text-[#0B6B50]">Pricing</Link>
          <Link href="/about" className="hover:text-[#0B6B50]">About</Link>
          <Link href="/contact" className="hover:text-[#0B6B50]">Contact</Link>
        </nav>
        <Link href="/auth/login" className="px-4 py-2 border border-[#E5E7EB] hover:border-[#0B6B50] rounded-lg font-bold text-sm text-neutral-700 hover:text-[#0B6B50] transition">
          Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
            Designed for <span className="text-[#0B6B50]">cooperative savings</span>
          </h1>
          <p className="text-neutral-500">
            A comprehensive suite of banking utilities structured for Tanzania VIKOBA community groups.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-lg bg-[#E7F2ED] text-[#0B6B50] flex items-center justify-center mb-5">
                <f.icon size={20} />
              </div>
              <h3 className="font-extrabold text-neutral-900 text-lg mb-2">{f.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Feature Focus CTA */}
        <section className="bg-[#0B6B50] text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Ready to streamline your records?</h2>
            <p className="text-emerald-100 text-sm">Create your group account today and invite members to start tracking savings.</p>
          </div>
          <Link href="/auth/register" className="px-6 py-3.5 bg-white text-[#0B6B50] font-bold rounded-lg flex items-center gap-2 hover:bg-neutral-50 shrink-0 text-sm">
            Get Started Now <ArrowRight size={16} />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-8 text-center text-xs text-neutral-400">
        © 2026 VIKOBA360. All rights reserved. Made in Dar es Salaam, Tanzania.
      </footer>
    </div>
  )
}
