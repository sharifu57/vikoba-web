'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef } from 'react'
import { ArrowRight, ShieldAlert } from 'lucide-react'

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  
  const [otp, setOtp] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const handleChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return
    const newOtp = [...otp]
    newOtp[index] = val.substring(val.length - 1)
    setOtp(newOtp)
    
    // Focus next input
    if (val && index < 3) {
      refs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 4) {
      setError('Please enter the full 4-digit code.')
      return
    }
    
    setLoading(true)
    setError('')
    
    setTimeout(() => {
      setLoading(false)
      // Standard demo verification
      if (code === '1234' || code.startsWith('1')) {
        if (action === 'reset') {
          router.push('/auth/reset-password')
        } else {
          router.push('/app/dashboard')
        }
      } else {
        setError('Invalid OTP code. Try entering 1234.')
      }
    }, 1000)
  }

  return (
    <div className="auth-page min-h-screen bg-[#f7f9f7] flex items-center justify-center p-6">
      <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 md:p-10 shadow-sm max-w-md w-full flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#eaf6ef] text-[#087f5b] flex items-center justify-center">
            <ShieldAlert size={22} />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight mt-2">Verify Phone</h2>
          <p className="text-xs text-neutral-400">
            We've sent a 4-digit SMS OTP code to your device. Enter it below to proceed (Demo code: <strong>1234</strong>).
          </p>
        </div>

        {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg text-center font-bold">{error}</div>}

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex justify-center gap-3">
            {otp.map((digit, idx) => (
              <input 
                key={idx}
                ref={refs[idx]}
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={1}
                required
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="w-14 h-14 border border-[#dfe8e2] rounded-xl text-center font-extrabold text-xl outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b] bg-[#fcfdfc]"
              />
            ))}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center text-xs flex flex-col gap-2 text-neutral-400">
          <span>Didn't receive the SMS? <button className="text-[#087f5b] font-bold hover:underline">Resend OTP</button></span>
          <Link href="/auth/login" className="text-[#087f5b] hover:text-[#066b4c] hover:underline font-bold mt-2">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
