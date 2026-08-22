'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api/endpoints'

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? 'text-white' : 'text-neutral-900'} font-extrabold text-2xl flex items-center gap-1`}>
      <span className="bg-primary text-primary-foreground rounded-lg w-8 h-8 flex items-center justify-center font-black">V</span>
      <span>IKOBA<strong className={light ? 'text-[#a5dec0]' : 'text-primary'}>360</strong></span>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ phone: '' })
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.auth.login), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result?.message || 'Unable to continue login.')
      }

      return result
    },
    onSuccess: (result) => {
      console.log('====>>>Login result:', result)
      const status = result?.data?.status || result?.status

      // if (status === 'NEW') {
      //   router.push(`/auth/verify-otp?action=register&phone=${encodeURIComponent(form.phone)}`)
      //   return
      // }

      // if (typeof window !== 'undefined') {
      //   localStorage.setItem('v360_user', JSON.stringify({
      //     name: 'Juma Majid',
      //     role: 'Administrator',
      //     phone: form.phone,
      //   }))
      // }

      // router.push(`/auth/verify-otp?action=login&phone=${encodeURIComponent(form.phone)}`)
    },
    onError: (err: Error) => {
      setError(err.message || 'Unable to continue login.')
    },
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    const phone = form.phone.trim()
    if (!phone) {
      setError('Please enter your phone number.')
      return
    }

    setError('')
    loginMutation.mutate(phone)
  }

  return (
    <div className="auth-page min-h-screen bg-white">
      {/* Left side: Branding & Quote */}
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

      {/* Right side: Login form */}
      <div className="auth-form-wrap p-8 md:p-20 flex flex-col justify-between flex-1">
        <Link href="/" className="auth-back text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition self-end">
          ← Back to Home
        </Link>

        <div className="auth-form max-w-sm w-full mx-auto my-auto flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-primary text-[10px] font-black uppercase tracking-widest">Sign In</span>
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">Welcome Back.</h2>
            <p className="form-intro text-xs text-neutral-400">
              Sign in to manage your VIKOBA deposits, loans and accounts.
            </p>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-danger rounded-lg font-medium">{error}</div>}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Input
                  type="tel"
                  required
                  placeholder="+255 712 345 678"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="pl-9 h-11 text-sm"
                />
                {/* <Phone className="absolute left-3 top-3.5 text-neutral-400" size={14} /> */}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-[#066b4c]"
            >
              {loginMutation.isPending ? 'Checking phone...' : 'Sign In'}
              <ArrowRight size={14} />
            </Button>
          </form>

          <div className="form-switch text-center text-xs text-neutral-500 mt-2">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:text-[#066b4c] hover:underline font-bold">
              Create One
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
