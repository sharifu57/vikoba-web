'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/lib/api/services'

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? 'text-white' : 'text-neutral-900'} font-extrabold text-2xl flex items-center gap-1`}>
      <span className="bg-primary text-primary-foreground rounded-lg w-8 h-8 flex items-center justify-center font-black">V</span>
      <span>
        IKOBA<strong className={light ? 'text-[#a5dec0]' : 'text-primary'}>360</strong>
      </span>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '255',
    agree: false,
  })
  const [error, setError] = useState('')

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12)
    const normalized = digits.startsWith('255') ? digits : `255${digits.replace(/^255/, '')}`
    return normalized.slice(0, 12)
  }

  const registerMutation = useMutation({
    mutationFn: async (payload: { fullName: string; email: string; phone: string }) => {
      const result = await authService.register(payload)
      return result
    },
    onSuccess: (result, payload) => {
      const status = result?.status
      const message = result?.message || 'Registration successful. Please verify your OTP.'

      if (status !== true) {
        const fallback = result?.message || 'Registration could not be completed.'
        setError(fallback)
        toast.error(fallback)
        return
      }

      authService.saveSession(result)
      toast.success(message)

      if (typeof window !== 'undefined') {
        localStorage.setItem('v360_user', JSON.stringify({
          name: payload.fullName,
          role: 'Administrator',
          phone: payload.phone,
          email: payload.email,
        }))
      }

      router.push(`/auth/verify-otp?action=register&phone=${encodeURIComponent(payload.phone)}`)
    },
    onError: (err: Error) => {
      const message = err.message || 'Unable to create account.'
      setError(message)
      toast.error(message)
    },
  })

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    const phone = form.phone.trim()
    const fullName = form.fullName.trim()
    const email = form.email.trim()

    if (!fullName) {
      setError('Please enter your full name.')
      return
    }

    if (!email) {
      setError('Please enter your email address.')
      return
    }

    if (!/^255\d{9}$/.test(phone)) {
      setError('Please enter a valid phone number starting with 255 and with 9 digits after the prefix.')
      return
    }

    if (!form.agree) {
      setError('Please accept the terms and privacy policy to continue.')
      return
    }

    setError('')
    registerMutation.mutate({ fullName, email, phone })
  }

  return (
    <div className="auth-page min-h-screen">
      <div className="auth-aside bg-secondary text-white p-12 flex flex-col justify-between hidden md:flex">
        <Link href="/" className="auth-logo inline-block">
          <Logo light />
        </Link>

        <div className="auth-quote my-auto flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/45 text-[#a5dec0] rounded-full text-[10px] font-extrabold uppercase self-start tracking-wider">
            Built for Togetherness
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
            When everyone sees the picture, <em className="text-[#b7e7ca] font-normal italic">everyone grows.</em>
          </h1>
          <p className="text-[#b3cabe] text-sm leading-relaxed max-w-xs">
            One simple place for the cooperative work that keeps your VIKOBA strong and trusted.
          </p>
        </div>

        <div className="auth-aside-foot text-xs text-[#a5dec0] flex justify-between">
          <span>VIKOBA360 Platform</span>
          <span className="text-[#779889]">Secure · Simple · Together</span>
        </div>
      </div>

      <div className="auth-form-wrap p-8 md:p-20 flex flex-col justify-between flex-1">
        <Link href="/" className="auth-back text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition self-end">
          ← Back to Home
        </Link>

        <div className="auth-form max-w-md w-full mx-auto my-auto flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-primary text-[10px] font-black uppercase tracking-widest">Create account</span>
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">Welcome aboard.</h2>
            <p className="form-intro text-xs text-neutral-400">
              Start your VIKOBA journey by creating your profile.
            </p>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-danger rounded-lg font-medium">{error}</div>}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Full Name</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Juma Majid"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="pl-9 h-11 text-sm placeholder:text-slate-500 placeholder:font-medium"
                />
                {/* <UserRound className="pointer-events-none absolute left-3 top-3.5 text-neutral-400" size={14} /> */}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="juma@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="pl-9 h-11 text-sm placeholder:text-slate-500 placeholder:font-medium"
                />
                {/* <Mail className="pointer-events-none absolute left-3 top-3.5 text-neutral-400" size={14} /> */}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="Example: 255712345678"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  className="pl-9 h-11 text-sm placeholder:text-slate-500 placeholder:font-medium"
                />
                {/* <Phone className="pointer-events-none absolute left-3 top-3.5 text-neutral-400" size={14} /> */}
              </div>
            </div>

            <label className="cursor-pointer mt-2 flex items-start gap-2 text-xs leading-normal text-neutral-500">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={e => setForm({ ...form, agree: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[#087f5b]"
              />
              <span>I agree to the Terms and Privacy Policy.</span>
            </label>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-[#066b4c]"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create account'}
              <ArrowRight size={14} />
            </Button>
          </form>

          <div className="text-center text-xs text-neutral-500 mt-2">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:text-[#066b4c] hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </div>

        <span className="text-[10px] text-neutral-400 text-center block">
          © 2026 VIKOBA360 · Tanzanian digital cooperative tools
        </span>
      </div>
    </div>
  )
}
