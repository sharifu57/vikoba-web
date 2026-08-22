'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', groupName: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name && form.phone && form.message) {
      setSubmitted(true)
      setForm({ name: '', email: '', phone: '', groupName: '', message: '' })
    }
  }

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
          <Link href="/about" className="hover:text-[#087f5b]">About</Link>
          <Link href="/contact" className="text-[#087f5b]">Contact</Link>
        </nav>
        <Link href="/auth/login" className="px-4 py-2 border border-[#dfe8e2] hover:border-[#087f5b] rounded-lg font-bold text-sm text-neutral-700 hover:text-[#087f5b] transition">
          Sign In
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full grid md:grid-cols-2 gap-12 items-start mt-4">
        {/* Info panel */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-[#087f5b] text-xs font-bold uppercase tracking-widest">Get In Touch</span>
            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
              We'd love to hear <span className="text-[#087f5b]">from you</span>
            </h1>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
              Questions about onboarding, training sessions, custom plans, or technical integrations? Our Tanzanian team is ready to assist.
            </p>
          </div>

          <div className="flex flex-col gap-5 text-sm text-neutral-600">
            <div className="flex items-center gap-3">
              <span className="bg-[#eaf6ef] text-[#087f5b] p-2.5 rounded-lg"><Phone size={16} /></span>
              <div>
                <span className="font-bold text-neutral-800 block text-xs">Call Us</span>
                <span className="text-xs">+255 788 123 456</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-[#eaf6ef] text-[#087f5b] p-2.5 rounded-lg"><Mail size={16} /></span>
              <div>
                <span className="font-bold text-neutral-800 block text-xs">Email</span>
                <span className="text-xs">support@vikoba360.com</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-[#eaf6ef] text-[#087f5b] p-2.5 rounded-lg"><MapPin size={16} /></span>
              <div>
                <span className="font-bold text-neutral-800 block text-xs">Office Address</span>
                <span className="text-xs">3rd Floor, Millennium Towers, Kijitonyama, Dar es Salaam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 md:p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <CheckCircle2 size={54} className="text-[#087f5b]" />
              <h3 className="text-xl font-bold text-neutral-800">Message Sent Successfully!</h3>
              <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                Thank you for contacting VIKOBA360. One of our support managers will reach out to you within 24 hours.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-4 px-5 py-2.5 bg-[#087f5b] text-white font-bold rounded-lg text-xs"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-bold text-neutral-800 text-lg mb-2">Send Us a Message</h3>
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Juma Majid" 
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+255 7XX XXX XXX" 
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="juma@example.com" 
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">VIKOBA Group Name (If any)</label>
                <input 
                  type="text" 
                  placeholder="Umoja VIKOBA" 
                  value={form.groupName}
                  onChange={e => setForm({ ...form, groupName: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Your Message *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="How can we help your savings group?" 
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b] resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-bold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 transition"
              >
                Send Message <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dfe8e2] bg-white py-8 text-center text-xs text-neutral-400 mt-12">
        © 2026 VIKOBA360. All rights reserved. Made in Dar es Salaam, Tanzania.
      </footer>
    </div>
  )
}
