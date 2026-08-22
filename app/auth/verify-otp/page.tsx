'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, Suspense } from 'react'
import { ArrowRight, ShieldCheck, TimerReset } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/lib/api/services'

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="auth-page min-h-screen bg-[#f7f9f7] flex items-center justify-center p-6"><div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 md:p-10 shadow-sm max-w-md w-full text-center text-sm font-semibold text-neutral-500">Loading...</div></div>}>
      <VerifyOtpContent />
    </Suspense>
  )
}

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const phone = searchParams.get('phone') || 'your phone'

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    if (!digit) {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      return
    }

    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (index < refs.length - 1) {
      refs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')

    if (code.length < 6) {
      setError('Please enter the full 6-digit code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await authService.verifyOtp({
        phone,
        code,
        purpose: action === 'register' ? 'phone_verification' : action === 'login' ? 'login' : 'verify',
      })

      authService.saveSession(result)

      if (result?.status !== true) {
        const fallback = result?.message || 'OTP verification failed.'
        setError(fallback)
        toast.error(fallback)
        setLoading(false)
        return
      }

      toast.success(result?.message || 'OTP verified successfully.')

      const setupComplete = typeof window !== 'undefined' && localStorage.getItem('v360_group_setup_complete') === 'true'

      if (action === 'register') {
        router.push(setupComplete ? '/app/dashboard' : '/app/settings')
        return
      }

      if (action === 'reset') {
        router.push('/auth/reset-password')
        return
      }

      router.push(setupComplete ? '/app/dashboard' : '/app/settings')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to verify OTP.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResending(true)
    setError('')

    try {
      const result = await authService.resendOtp({
        phone,
        purpose: action === 'register' ? 'phone_verification' : action === 'login' ? 'login' : 'verify',
      })

      if (result?.status !== true) {
        const fallback = result?.message || 'Unable to resend OTP.'
        setError(fallback)
        toast.error(fallback)
        return
      }

      toast.success(result?.message || 'A new OTP has been sent.')
      setOtp(['', '', '', '', '', ''])
      refs[0]?.current?.focus()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to resend OTP.'
      setError(message)
      toast.error(message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page min-h-screen w-full bg-[radial-gradient(circle_at_top,_#f3faf6_0%,_#f7f9f7_55%,_#eef2ef_100%)] flex items-center justify-center p-6">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#dfe8e2] bg-white p-6 shadow-[0_30px_80px_rgba(8,127,91,0.12)] md:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf6ef] text-[#087f5b] ring-8 ring-[#f1faf5] shadow-inner">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#087f5b]">Secure verification</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-900">Verify OTP</h2>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-[#dfe8e2] bg-[#f8faf8] px-4 py-3 text-center">
          <p className="text-xs font-medium text-neutral-500">Code sent to</p>
          <p className="mt-1 text-sm font-bold text-neutral-900">{phone}</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">{error}</div>}

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <Input
                key={idx}
                ref={refs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="h-14 w-12 rounded-xl border-[#dfe8e2] bg-[#fcfdfc] text-center text-xl font-black text-neutral-900 shadow-none focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/20 sm:w-14"
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-[#066b4c]"
          >
            {loading ? 'Verifying...' : 'Verify code'}
            <ArrowRight size={14} />
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf1ee] pt-4 text-xs text-neutral-500">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending}
            className="inline-flex items-center gap-1 font-semibold text-[#087f5b] hover:text-[#066b4c] disabled:opacity-50"
          >
            <TimerReset size={14} /> {resending ? 'Sending...' : 'Resend OTP'}
          </button>
          <Link href="/auth/login" className="font-semibold text-neutral-600 hover:text-neutral-900">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
