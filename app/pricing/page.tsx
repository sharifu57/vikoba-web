'use client'

import Link from 'next/link'
import { Check, ArrowRight, HelpCircle } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    desc: 'For small VIKOBA groups.',
    price: 'TZS 25,000',
    meta: 'Up to 30 members',
    items: ['Member profile logs', 'Contributions tracking', 'Shares balances ledger', 'Basic printable reports', 'Self-service member portal']
  },
  {
    name: 'Professional',
    desc: 'For growing groups.',
    price: 'TZS 55,000',
    meta: 'Up to 100 members',
    popular: true,
    items: ['Everything in Starter', 'Guarantor-backed Loans module', 'Jamii / Social Fund claims', 'Meeting Attendance register', 'Fines tracking & waivers', 'Advanced Excel & PDF exports', 'Email & SMS alerts']
  },
  {
    name: 'Enterprise',
    desc: 'For organization networks.',
    price: 'Custom Quote',
    meta: 'Unlimited members',
    items: ['Everything in Professional', 'Multi-VIKOBA parent admin', 'Dedicated database instance', 'API integration support', 'Custom mobile money control numbers', 'Direct phone/on-site training']
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9f7] flex flex-col justify-between">
      {/* Navbar */}
      <header className="sticky top-0 bg-[#f7f9f7]/95 border-b border-[#dfe8e2] px-6 py-4 flex items-center justify-between z-40">
        <Link href="/" className="font-extrabold text-2xl flex items-center gap-1">
          <span className="bg-[#087f5b] text-white rounded-lg w-8 h-8 flex items-center justify-center font-black">V</span>
          <span>IKOBA<strong className="text-[#087f5b]">360</strong></span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-bold text-neutral-500">
          <Link href="/features" className="hover:text-[#087f5b]">Features</Link>
          <Link href="/pricing" className="text-[#087f5b]">Pricing</Link>
          <Link href="/about" className="hover:text-[#087f5b]">About</Link>
          <Link href="/contact" className="hover:text-[#087f5b]">Contact</Link>
        </nav>
        <Link href="/auth/login" className="px-4 py-2 border border-[#dfe8e2] hover:border-[#087f5b] rounded-lg font-bold text-sm text-neutral-700 hover:text-[#087f5b] transition">
          Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
          <span className="text-[#087f5b] text-xs font-bold uppercase tracking-widest">SaaS Plans</span>
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
            Simple, honest <span className="text-[#087f5b]">cooperative pricing</span>
          </h1>
          <p className="text-neutral-500">
            No hidden setup fees. Choose a package appropriate for your group size.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, idx) => (
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

        {/* FAQs */}
        <section className="max-w-4xl mx-auto border-t border-neutral-200/60 pt-16">
          <h2 className="text-2xl md:text-3xl font-black text-neutral-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-neutral-800 text-sm mb-2 flex items-center gap-2">
                <HelpCircle size={16} className="text-[#087f5b]" /> Can we change plans later?
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed pl-6">
                Yes, you can upgrade or downgrade your plan as your member registration grows or shrinks. Changes take effect on the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-neutral-800 text-sm mb-2 flex items-center gap-2">
                <HelpCircle size={16} className="text-[#087f5b]" /> Is there a free trial?
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed pl-6">
                We offer a 30-day free trial on the Starter and Professional plans. No credit card is required to register and test the UI features.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-neutral-800 text-sm mb-2 flex items-center gap-2">
                <HelpCircle size={16} className="text-[#087f5b]" /> What payment methods do you accept?
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed pl-6">
                We support mobile money (M-Pesa, Tigo Pesa, Airtel Money) as well as bank transfers for all Tanzanian cooperative accounts.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-neutral-800 text-sm mb-2 flex items-center gap-2">
                <HelpCircle size={16} className="text-[#087f5b]" /> Is our financial data safe?
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed pl-6">
                Absolutely. We host our databases in bank-grade secure servers, perform daily backups, and encrypt all stored credentials.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dfe8e2] bg-white py-8 text-center text-xs text-neutral-400">
        © 2026 VIKOBA360. All rights reserved. Made in Dar es Salaam, Tanzania.
      </footer>
    </div>
  )
}
