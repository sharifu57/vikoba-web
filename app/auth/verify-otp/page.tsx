'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, Suspense } from 'react'
import { ArrowRight, ShieldCheck, TimerReset } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { clearVikobaLocalState } from '@/lib/api/client'
import { authService } from '@/lib/api/services'
import { ThemeToggle, VikobaLogo } from '@/components/brand'

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F7F2] p-6 dark:bg-[#10241D]"><div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 text-center text-sm font-semibold text-neutral-500 shadow-[0_20px_50px_rgba(16,36,29,0.1)] dark:border-[#285043] dark:bg-[#17372B] dark:text-[#CBD5E1]">Loading...</div></div>}>
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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, refs.length)

    if (!digits) return

    e.preventDefault()
    setOtp(Array.from({ length: refs.length }, (_, index) => digits[index] ?? ''))
    refs[Math.min(digits.length, refs.length) - 1]?.current?.focus()
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

      const setupComplete = typeof window !== 'undefined' && (localStorage.getItem('v360_group_setup_complete') === 'true' || localStorage.getItem('v360_group_setup_done') === 'true')

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

  const verificationTitle = action === 'register'
    ? 'Confirm your number'
    : action === 'reset'
      ? 'Verify your reset code'
      : 'Verify your sign in'

  return (
    <div className="min-h-screen bg-[#F7F7F2] p-4 dark:bg-[#10241D] sm:p-6 lg:p-8">
      <main className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(16,36,29,0.1)] dark:border-[#285043] dark:bg-[#17372B] lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#10241D] p-10 text-white lg:flex">
          <div className="relative flex items-center justify-between">
            <Link href="/" aria-label="Vikoba 360 home">
              <VikobaLogo light />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85">
              <ShieldCheck size={14} /> Secure access
            </span>
          </div>

          <div className="relative max-w-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D99A2B]">Account verification</p>
            <h1 className="mt-4 text-4xl font-black leading-tight">One quick check, then you are in.</h1>
            <p className="mt-4 text-sm leading-6 text-white/70">Your six-digit code confirms that this number belongs to you.</p>
          </div>

          <div className="relative border-t border-white/15 pt-6">
            <div className="flex items-center gap-3 text-sm font-semibold text-white/80">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D99A2B] text-xs font-black text-[#10241D]">1</span>
              Code delivered
            </div>
            <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-xs font-black">2</span>
              Confirm your identity
            </div>
          </div>
          <ShieldCheck aria-hidden="true" className="pointer-events-none absolute -bottom-14 -right-14 text-white/5" size={260} strokeWidth={1} />
        </aside>

        <section className="flex min-h-full flex-col bg-white p-6 dark:bg-[#17372B] sm:p-10 lg:p-12">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Vikoba 360 home">
              <VikobaLogo compact />
            </Link>
            <ThemeToggle />
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 items-center py-10 lg:py-0">
            <div className="w-full">
              <div className="mb-7">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-[#E7F2ED] text-[#0B6B50]">
                  <ShieldCheck size={27} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B6B50]">Secure verification</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-neutral-900 dark:text-white">{verificationTitle}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-[#CBD5E1]">Enter the six-digit code sent to <span className="font-bold text-neutral-800 break-all dark:text-white">{phone}</span>.</p>
              </div>

              {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-center text-xs font-semibold text-red-600">{error}</div>}

              <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-between gap-1.5 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <Input
                      key={idx}
                      ref={refs[idx]}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Verification code digit ${idx + 1}`}
                      maxLength={1}
                      value={digit}
                      onChange={e => handleChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="h-14 w-10 rounded-lg border-[#E5E7EB] bg-[#F7F7F2] px-0 text-center text-xl font-black text-neutral-900 shadow-none focus:border-[#0B6B50] focus:ring-2 focus:ring-[#0B6B50]/20 dark:border-[#285043] dark:bg-[#10241D] dark:text-white sm:w-12"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-primary text-primary-foreground hover:bg-[#08503C]"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                  <ArrowRight size={15} />
                </Button>
              </form>

              <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#E9EFEB] pt-5 text-xs text-neutral-500 dark:border-[#285043] dark:text-[#CBD5E1]">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#0B6B50] hover:text-[#08503C] disabled:opacity-50"
                >
                  <TimerReset size={14} /> {resending ? 'Sending...' : 'Resend code'}
                </button>
                <Link href="/auth/login" className="font-semibold text-neutral-600 hover:text-neutral-900 dark:text-[#CBD5E1] dark:hover:text-white">
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
