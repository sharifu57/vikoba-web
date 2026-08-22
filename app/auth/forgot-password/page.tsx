'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (value) {
      setSent(true)
      // Redirect to OTP verification after timeout
      setTimeout(() => {
        router.push('/auth/verify-otp?action=reset')
      }, 1500)
    }
  }

  return (
    <div className="auth-page min-h-screen bg-[#f7f9f7] flex items-center justify-center p-6">
      <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 md:p-10 shadow-sm max-w-md w-full flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#eaf6ef] text-[#087f5b] flex items-center justify-center">
            <KeyRound size={22} />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight mt-2">Forgot Password?</h2>
          <p className="text-xs text-neutral-400">
            Enter your registered phone or email, and we'll send a 4-digit verification code.
          </p>
        </div>

        {sent ? (
          <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-lg text-center font-bold">
            Verification code sent! Redirecting to OTP screen...
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone number or Email</label>
              <input 
                type="text" 
                required
                placeholder="+255 712 345 678 or juma@example.com" 
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 transition"
            >
              Send OTP Code <ArrowRight size={14} />
            </button>
          </form>
        )}

        <div className="text-center text-xs">
          <Link href="/auth/login" className="text-[#087f5b] hover:text-[#066b4c] hover:underline font-bold">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
