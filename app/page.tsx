'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight, Check, BarChart3, Users, WalletCards, HandCoins, Sparkles,
  FileText, ShieldCheck, CalendarDays, AlertCircle, Menu, X, ArrowUpRight
} from 'lucide-react'

// Features list
const features = [
  { title: 'Member Management', text: 'Manage members, membership status, roles and member profiles.', icon: Users },
  { title: 'Contributions', text: 'Track weekly, monthly and special contributions automatically.', icon: WalletCards },
  { title: 'Shares', text: 'Manage share purchases, balances, transfers and ownership.', icon: BarChart3 },
  { title: 'Loans', text: 'Manage loan applications, approvals, guarantors, repayments and schedules.', icon: HandCoins },
  { title: 'Fines', text: 'Track attendance fines, late payments and other penalties.', icon: AlertCircle },
  { title: 'Jamii Fund', text: 'Manage social/community funds and member support requests.', icon: Sparkles },
  { title: 'Meetings', text: 'Track meetings, attendance, minutes and resolutions.', icon: CalendarDays },
  { title: 'Financial Management', text: 'Monitor cash, bank, mobile money and financial transactions.', icon: WalletCards },
  { title: 'Reports', text: 'Generate powerful financial and member reports in real-time.', icon: FileText },
  { title: 'Notifications', text: 'Send reminders and important updates to members.', icon: AlertCircle }
]

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? 'text-white' : 'text-neutral-900'} font-extrabold text-2xl flex items-center gap-1`}>
      <span className="bg-[#087f5b] text-white rounded-lg w-8 h-8 flex items-center justify-center font-black">V</span>
      <span>IKOBA<strong className="text-[#087f5b]">360</strong></span>
    </div>
  )
}

export default function Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="marketing min-h-screen bg-[#f7f9f7]">
      {/* Site Header */}
      <header className="site-header sticky top-0 bg-[#f7f9f7]/90 backdrop-blur-md z-50 border-b border-[#dfe8e2] px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-600">
          <Link href="/features" className="hover:text-[#087f5b] transition">Features</Link>
          <a href="#how" className="hover:text-[#087f5b] transition">How It Works</a>
          <Link href="/about" className="hover:text-[#087f5b] transition">Solutions</Link>
          <Link href="/pricing" className="hover:text-[#087f5b] transition">Pricing</Link>
          <Link href="/about" className="hover:text-[#087f5b] transition">About</Link>
          <Link href="/contact" className="hover:text-[#087f5b] transition">Contact</Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login" className="px-5 py-2.5 text-sm font-bold text-neutral-700 hover:text-[#087f5b] transition">
            Sign In
          </Link>
          <Link href="/auth/register" className="button button-primary bg-[#087f5b] hover:bg-[#066b4c] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>

        <button
          className="md:hidden text-neutral-800 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[69px] bg-white z-40 p-6 flex flex-col gap-6 md:hidden border-t border-neutral-100">
          <Link href="/features" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Features</Link>
          <a href="#how" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <Link href="/about" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Solutions</Link>
          <Link href="/pricing" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          <Link href="/about" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          <hr className="border-neutral-100 my-2" />
          <Link href="/auth/login" className="w-full text-center py-3 font-bold border border-[#dfe8e2] rounded-lg text-neutral-700" onClick={() => setMobileMenuOpen(false)}>
            Sign In
          </Link>
          <Link href="/auth/register" className="w-full text-center py-3 bg-[#087f5b] text-white rounded-lg font-bold" onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#eaf6ef] text-[#087f5b] rounded-full text-xs font-bold tracking-wider uppercase self-start">
              <span className="w-2 h-2 rounded-full bg-[#087f5b]" />
              Digital Banking for VIKOBA
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-neutral-900 leading-tight tracking-tight">
              Manage Your VIKOBA.<br />
              <span className="text-[#087f5b]">Grow Together.</span>
            </h1>
            <p className="text-neutral-500 text-lg md:text-xl leading-relaxed max-w-lg">
              VIKOBA360 makes it simple to manage contributions, shares, loans, fines, Jamii funds, meetings and group finances—all in one secure platform.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Link href="/auth/register" className="px-7 py-4 bg-[#087f5b] hover:bg-[#066b4c] text-white rounded-lg font-bold shadow-lg shadow-[#087f5b]/15 transition flex items-center gap-2 text-base">
                Create Your VIKOBA <ArrowRight size={18} />
              </Link>
              <Link href="/auth/login" className="px-7 py-4 bg-white border border-[#dfe8e2] hover:border-[#087f5b] text-neutral-800 hover:text-[#087f5b] rounded-lg font-bold transition flex items-center gap-2 text-base">
                Explore Dashboard
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-neutral-400 mt-6 border-t border-neutral-200/60 pt-6">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#087f5b]" /> Easy to Set Up</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#087f5b]" /> Secure by Design</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#087f5b]" /> Tanzanian & East African Compliant</span>
            </div>
          </div>

          {/* Beautiful FinTech Dashboard Preview Card */}
          <div className="preview-wrap">
            <div className="preview-glow" />
            <div className="preview-card bg-white border border-[#dce9e0] rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#087f5b] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded">V</span>
                  <span className="font-extrabold text-sm text-neutral-800">Umoja VIKOBA</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#eaf6ef] text-[#087f5b] font-bold text-xs flex items-center justify-center">
                  JM
                </div>
              </div>
              <div className="pt-6">
                <span className="text-xs text-neutral-400 font-medium">Good morning, Juma 👋</span>
                <h4 className="text-xl font-bold text-neutral-900 mt-1">TZS 18,450,000</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-400">Total Group Savings</span>
                  <span className="text-emerald-600 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">+12.8%</span>
                </div>
              </div>

              {/* Fake Micro Chart */}
              <div className="mt-6 border border-neutral-100 rounded-xl p-4 bg-[#fcfdfc]">
                <div className="flex justify-between items-center text-xs pb-3">
                  <span className="font-bold text-neutral-700">Contributions Overview</span>
                  <span className="text-neutral-400">Last 6 Months</span>
                </div>
                <div className="flex items-end justify-between h-20 gap-2.5 pt-2">
                  <div className="bg-[#a7dfbc] rounded-t w-full h-8" />
                  <div className="bg-[#a7dfbc] rounded-t w-full h-12" />
                  <div className="bg-[#a7dfbc] rounded-t w-full h-10" />
                  <div className="bg-[#087f5b] rounded-t w-full h-16" />
                  <div className="bg-[#a7dfbc] rounded-t w-full h-14" />
                  <div className="bg-[#087f5b] rounded-t w-full h-20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 bg-[#f5faf6] rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 block uppercase tracking-wider font-bold">Outstanding Loans</span>
                  <span className="font-bold text-neutral-800 text-sm mt-0.5 block">TZS 9,250,000</span>
                </div>
                <div className="p-3 bg-[#f5faf6] rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 block uppercase tracking-wider font-bold">Active Members</span>
                  <span className="font-bold text-neutral-800 text-sm mt-0.5 block">52 Members</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="mt-16 md:mt-28 py-8 border-y border-[#dfe8e2] flex flex-wrap justify-around gap-8 text-center bg-white/40 rounded-xl px-4">
          <div>
            <div className="text-3xl font-black text-neutral-900">520+</div>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Groups Registered</div>
          </div>
          <div>
            <div className="text-3xl font-black text-neutral-900">TZS 1.2B+</div>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Savings Tracked</div>
          </div>
          <div>
            <div className="text-3xl font-black text-neutral-900">14,000+</div>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Active Members</div>
          </div>
          <div>
            <div className="text-3xl font-black text-neutral-900">99.9%</div>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Uptime Guarantee</div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16 flex flex-col gap-4">
            <span className="text-[#087f5b] text-xs font-bold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
              Powerful Features built for Modern Groups.
            </h2>
            <p className="text-neutral-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              From daily collections to auditing accounts and tracking loans, VIKOBA360 provides the ultimate suite to automate your savings group.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white border border-[#dfe8e2] rounded-xl p-6 hover:border-[#8bc6a7] hover:shadow-xl hover:shadow-[#164632]/5 transition group relative">
                <div className="w-12 h-12 rounded-lg bg-[#eaf6ef] text-[#087f5b] flex items-center justify-center mb-5 group-hover:scale-105 transition">
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-neutral-900 text-lg mb-2 flex items-center gap-1.5">
                  {f.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                  {f.text}
                </p>
                <div className="absolute top-6 right-6 text-neutral-300 group-hover:text-[#087f5b] transition">
                  <ArrowUpRight size={18} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how" className="py-20 bg-[#eff7f1] -mx-6 px-6 md:px-12 rounded-3xl">
          <div className="max-w-3xl mx-auto text-center mb-16 flex flex-col gap-4">
            <span className="text-[#087f5b] text-xs font-bold uppercase tracking-widest">Process Flow</span>
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight">
              How VIKOBA360 Works.
            </h2>
            <p className="text-neutral-500 text-base md:text-lg max-w-xl mx-auto">
              Get your community savings group set up and running digitally in four simple steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Create Your VIKOBA', desc: 'Set up your group settings, contribution rules, loan interest rates, and fine policies.' },
              { num: '02', title: 'Add Members', desc: 'Add member records, assign roles (Treasurer, Loan Officer), and configure contact info.' },
              { num: '03', title: 'Manage Contributions & Loans', desc: 'Record weekly payments, process loan requests with guarantors, and log repayments.' },
              { num: '04', title: 'Track Growth & Reports', desc: 'View beautiful interactive dashboards, check ledger logs, and download PDF audit statements.' }
            ].map((s, idx) => (
              <div key={idx} className="border-t border-[#b9d7c2] pt-6 flex flex-col gap-4">
                <span className="text-xs font-extrabold text-[#087f5b]">{s.num}</span>
                <h3 className="font-bold text-neutral-900 text-lg">{s.title}</h3>
                <p className="text-neutral-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16 flex flex-col gap-4">
            <span className="text-[#087f5b] text-xs font-bold uppercase tracking-widest">Tailored Solutions</span>
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight">
              Built for Every Role in the Group.
            </h2>
            <p className="text-neutral-500 text-base">
              Everyone gets a dedicated view, making management clear and transparent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                role: 'VIKOBA Administrators',
                items: ['Manage group configurations', 'Invite and manage members', 'Configure contribution rules', 'Approve financial transactions', 'Manage system roles & permissions']
              },
              {
                role: 'Treasurers',
                items: ['Record payments & bank deposits', 'Manage cash drawer and balances', 'Track contributions & shares', 'Record and catalog expenses', 'Generate real-time cash ledger reports']
              },
              {
                role: 'Loan Officers',
                items: ['Review new loan applications', 'Validate member guarantor limits', 'Approve or request changes', 'Track repayments & balances', 'Monitor overdue loan status']
              },
              {
                role: 'Members',
                items: ['View personal contribution statements', 'Track share purchases & dividends', 'Apply for loans digitally', 'Monitor due repayments & active schedules', 'Receive meeting & fine alerts']
              }
            ].map((sol, idx) => (
              <div key={idx} className="bg-white border border-[#dfe8e2] rounded-2xl p-6 flex flex-col gap-5">
                <h3 className="font-extrabold text-neutral-900 text-lg pb-3 border-b border-neutral-100">{sol.role}</h3>
                <ul className="flex flex-col gap-3 text-xs text-neutral-500 flex-1">
                  {sol.items.map((item, i_idx) => (
                    <li key={i_idx} className="flex items-start gap-2">
                      <Check size={14} className="text-[#087f5b] mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Security & Trust Section */}
        <section className="py-12">
          <div className="bg-[#123b2f] rounded-3xl p-8 md:p-16 text-white grid md:grid-cols-3 gap-12 items-center">
            <div className="md:col-span-2 flex flex-col gap-6">
              <span className="text-[#a5dec0] text-xs font-bold uppercase tracking-wider">Security & Trust</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Your VIKOBA finances deserve transparency.
              </h2>
              <p className="text-[#b3cabe] text-base leading-relaxed max-w-lg">
                Every transaction, approval, and meeting minutes is recorded with cryptographic transparency. Give your members the security they deserve.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-[#e0f2e5]">
                  <ShieldCheck size={16} className="text-[#a5dec0]" /> Secure Authentication
                </span>
                <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-[#e0f2e5]">
                  <ShieldCheck size={16} className="text-[#a5dec0]" /> Role-Based Access Control
                </span>
                <span className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-[#e0f2e5]">
                  <ShieldCheck size={16} className="text-[#a5dec0]" /> Transparent Audit Trails
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 border border-[#4e876c] rounded-full aspect-square w-48 h-48 mx-auto text-[#a7dfbc] text-center transform -rotate-12 bg-white/5">
              <ShieldCheck size={64} className="stroke-[1.2]" />
              <span className="text-xs font-bold mt-2 uppercase tracking-widest">Protected</span>
              <span className="text-[10px] opacity-75">Every transaction</span>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16 flex flex-col gap-4">
            <span className="text-[#087f5b] text-xs font-bold uppercase tracking-widest">Honest Pricing</span>
            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight">
              Start Small. Grow Freely.
            </h2>
            <p className="text-neutral-500 text-base">
              Choose the package that matches your savings group size. Modify anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                desc: 'For small VIKOBA groups.',
                price: 'TZS 25,000',
                meta: 'Up to 30 members',
                items: ['Member management', 'Contributions tracker', 'Shares ownership log', 'Basic report prints', 'Mobile Money ledger']
              },
              {
                name: 'Professional',
                desc: 'For growing groups.',
                price: 'TZS 55,000',
                meta: 'Up to 100 members',
                popular: true,
                items: ['Everything in Starter', 'Guarantor-backed Loans module', 'Jamii Social Fund support', 'Meeting Attendance register', 'Fines tracking & waivers', 'Advanced Excel/PDF exports']
              },
              {
                name: 'Enterprise',
                desc: 'For organizations managing multiple groups.',
                price: 'Custom Quote',
                meta: 'Unlimited members',
                items: ['Everything in Professional', 'Multi-VIKOBA dashboard settings', 'Custom control numbers', 'Direct bank reconciliation API', 'Priority support & onboarding']
              }
            ].map((plan, idx) => (
              <div key={idx} className={`bg-white border rounded-2xl p-8 flex flex-col relative ${plan.popular ? 'border-2 border-[#087f5b] shadow-xl' : 'border-[#dfe8e2]'}`}>
                {plan.popular && (
                  <span className="absolute top-4 right-4 bg-[#eaf6ef] text-[#087f5b] text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="font-extrabold text-neutral-900 text-xl">{plan.name}</h3>
                <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{plan.desc}</p>
                <div className="mt-6 mb-4">
                  <span className="text-3xl font-black text-neutral-900">{plan.price}</span>
                  {plan.price !== 'Custom Quote' && <span className="text-xs text-neutral-400 font-bold"> / month</span>}
                </div>
                <span className="text-xs font-bold text-[#087f5b] bg-[#eaf6ef] px-2.5 py-1 rounded-md self-start mb-6">{plan.meta}</span>

                <Link href="/auth/register" className={`w-full text-center py-3 rounded-lg font-bold text-sm transition mb-6 ${plan.popular ? 'bg-[#087f5b] text-white hover:bg-[#066b4c]' : 'bg-white border border-[#dfe8e2] text-neutral-800 hover:border-[#087f5b]'}`}>
                  Start Managing Your VIKOBA
                </Link>

                <div className="border-t border-neutral-100 pt-6 flex flex-col gap-3 text-xs text-neutral-600">
                  {plan.items.map((item, i) => (
                    <span key={i} className="flex items-center gap-2">
                      <Check size={14} className="text-[#087f5b] shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12">
          <div className="bg-[#087f5b] rounded-3xl p-8 md:p-16 text-white flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <span className="text-[#a5dec0] text-xs font-bold uppercase tracking-wider">Ready to begin?</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight max-w-md">
                Ready to take your VIKOBA to the next level?
              </h2>
              <p className="text-emerald-100 text-sm max-w-sm">
                Join thousands of members across Tanzania building clean, digital financial futures together.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <Link href="/auth/register" className="px-6 py-3.5 bg-white text-[#087f5b] hover:bg-neutral-50 rounded-lg font-extrabold transition text-sm flex items-center gap-2">
                Get Started Now <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="px-6 py-3.5 bg-[#066b4c] text-white border border-emerald-700/60 hover:bg-[#05573e] rounded-lg font-extrabold transition text-sm">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dfe8e2] bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pb-12">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Logo />
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
              VIKOBA360 is the leading digital management cooperative banking platform for community savings groups in East Africa.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs">
            <span className="font-extrabold text-neutral-800 uppercase tracking-wider mb-1">Product</span>
            <Link href="/features" className="text-neutral-400 hover:text-[#087f5b] transition">Features</Link>
            <Link href="/pricing" className="text-neutral-400 hover:text-[#087f5b] transition">Pricing</Link>
            <a href="#how" className="text-neutral-400 hover:text-[#087f5b] transition">How It Works</a>
          </div>
          <div className="flex flex-col gap-3 text-xs">
            <span className="font-extrabold text-neutral-800 uppercase tracking-wider mb-1">Company</span>
            <Link href="/about" className="text-neutral-400 hover:text-[#087f5b] transition">About Us</Link>
            <Link href="/contact" className="text-neutral-400 hover:text-[#087f5b] transition">Contact</Link>
            <Link href="/contact" className="text-neutral-400 hover:text-[#087f5b] transition">Careers</Link>
          </div>
          <div className="flex flex-col gap-3 text-xs">
            <span className="font-extrabold text-neutral-800 uppercase tracking-wider mb-1">Legal & Support</span>
            <Link href="/contact" className="text-neutral-400 hover:text-[#087f5b] transition">Privacy Policy</Link>
            <Link href="/contact" className="text-neutral-400 hover:text-[#087f5b] transition">Terms of Service</Link>
            <Link href="/contact" className="text-neutral-400 hover:text-[#087f5b] transition">Help & Documentation</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <span>© 2026 VIKOBA360. All rights reserved. Made in Tanzania.</span>
          <div className="flex gap-4">
            <span className="hover:text-[#087f5b] cursor-pointer">Twitter</span>
            <span className="hover:text-[#087f5b] cursor-pointer">LinkedIn</span>
            <span className="hover:text-[#087f5b] cursor-pointer">Instagram</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
