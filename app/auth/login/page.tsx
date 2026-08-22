'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Lock, Phone } from 'lucide-react'

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo ${light ? 'text-white' : 'text-neutral-900'} font-extrabold text-2xl flex items-center gap-1`}>
      <span className="bg-[#087f5b] text-white rounded-lg w-8 h-8 flex items-center justify-center font-black">V</span>
      <span>IKOBA<strong className={light ? 'text-[#a5dec0]' : 'text-[#087f5b]'}>360</strong></span>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.username && form.password) {
      // Simulate login session setup
      if (typeof window !== 'undefined') {
        localStorage.setItem('v360_user', JSON.stringify({ name: 'Juma Majid', role: 'Administrator', phone: '+255 712 345 678' }))
      }
      router.push('/app/dashboard')
    } else {
      setError('Please enter your phone number/email and password.')
    }
  }

  return (
    <div className="auth-page min-h-screen bg-white">
      {/* Left side: Branding & Quote */}
      <div className="auth-aside bg-[#123b2f] text-white p-12 flex flex-col justify-between hidden md:flex">
        <Link href="/" className="auth-logo inline-block">
          <Logo light />
        </Link>
        
        <div className="auth-quote my-auto flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#087f5b]/45 text-[#a5dec0] rounded-full text-[10px] font-extrabold uppercase self-start tracking-wider">
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
            <span className="text-[#087f5b] text-[10px] font-black uppercase tracking-widest">Sign In</span>
            <h2 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">Welcome Back.</h2>
            <p className="form-intro text-xs text-neutral-400">
              Sign in to manage your VIKOBA deposits, loans and accounts.
            </p>
          </div>

          {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg font-medium">{error}</div>}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone Number or Email</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="+255 712 345 678" 
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b] pl-9"
                />
                <Phone className="absolute left-3 top-3.5 text-neutral-400" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex justify-between">
                <span>Password</span>
                <Link href="/auth/forgot-password" className="text-[#087f5b] hover:text-[#066b4c] hover:underline font-bold">
                  Forgot Password?
                </Link>
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] focus:ring-1 focus:ring-[#087f5b] pl-9"
                />
                <Lock className="absolute left-3 top-3.5 text-neutral-400" size={14} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
              <label className="checkbox flex items-center gap-1.5 cursor-pointer text-neutral-600 font-medium select-none">
                <input type="checkbox" className="accent-[#087f5b] rounded w-3.5 h-3.5" />
                <span>Remember me</span>
              </label>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 shadow-md transition"
            >
              Sign In <ArrowRight size={14} />
            </button>
          </form>

          <div className="form-switch text-center text-xs text-neutral-500 mt-2">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-[#087f5b] hover:text-[#066b4c] hover:underline font-bold">
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
