'use client'

import Link from 'next/link'
import { Sparkles, Users, ShieldCheck, Heart } from 'lucide-react'

export default function AboutPage() {
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
          <Link href="/pricing" className="hover:text-[#087f5b]">Pricing</Link>
          <Link href="/about" className="text-[#087f5b]">About</Link>
          <Link href="/contact" className="hover:text-[#087f5b]">Contact</Link>
        </nav>
        <Link href="/auth/login" className="px-4 py-2 border border-[#dfe8e2] hover:border-[#087f5b] rounded-lg font-bold text-sm text-neutral-700 hover:text-[#087f5b] transition">
          Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col gap-16">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
          <span className="text-[#087f5b] text-xs font-bold uppercase tracking-widest">Our Mission</span>
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
            "Manage Your VIKOBA.<br />
            <span className="text-[#087f5b]">Grow Together.</span>"
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed mt-2">
            Empowering community savings groups across Tanzania and East Africa through transparency, digitalization, and secure financial management.
          </p>
        </div>

        {/* Content Section */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-5">
            <h3 className="font-extrabold text-neutral-800 text-lg">Why We Started VIKOBA360</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">
              VIKOBA groups represent the financial foundation for millions of East Africans. However, reliance on paper notebooks leads to calculation errors, misplaced receipts, lack of audit trails, and general administration friction.
            </p>
            <p className="text-neutral-500 text-xs leading-relaxed">
              VIKOBA360 replaces spreadsheet grids and handwritten registers with a sleek, cloud-backed FinTech tool designed specifically for cooperative dynamics: sharing, loan approvals, emergency support, and accountability.
            </p>
          </div>
          <div className="bg-[#eff7f1] rounded-2xl p-6 border border-[#b9d7c2] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#087f5b] text-white p-2 rounded-lg"><Sparkles size={18} /></span>
              <h4 className="font-bold text-neutral-800 text-sm">Transparency & Trust</h4>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Every single payment transaction ref, loan guarantor signature, and fine waiver has a timestamped audit log. Every member has real-time visibility.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="border-t border-neutral-200/60 pt-12">
          <h2 className="text-2xl font-black text-neutral-900 text-center mb-10">Our Core Pillars</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-white border border-[#dfe8e2] rounded-xl">
              <Users className="text-[#087f5b] mb-4" size={24} />
              <h4 className="font-bold text-neutral-800 text-sm mb-2">Community First</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Designed to adapt to standard VIKOBA constitution bylaws, Jamii funds, and meeting traditions.
              </p>
            </div>
            <div className="p-5 bg-white border border-[#dfe8e2] rounded-xl">
              <ShieldCheck className="text-[#087f5b] mb-4" size={24} />
              <h4 className="font-bold text-neutral-800 text-sm mb-2">Bank-Grade Security</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Role-based access permissions ensure treasurers and admins have matching authorization lines.
              </p>
            </div>
            <div className="p-5 bg-white border border-[#dfe8e2] rounded-xl">
              <Heart className="text-[#087f5b] mb-4" size={24} />
              <h4 className="font-bold text-neutral-800 text-sm mb-2">Simplicity</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Clean interfaces readable on low-end mobile devices and easily understood by all group members.
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
