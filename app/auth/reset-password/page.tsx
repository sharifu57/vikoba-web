'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Lock, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.password || !form.confirmPassword) {
      setError('Please fill in both password fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    
    setError('')
    setSuccess(true)
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
  }

  return (
    <div className="auth-page min-h-screen bg-[#f7f9f7] flex items-center justify-center p-6">
      <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 md:p-10 shadow-sm max-w-md w-full flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#eaf6ef] text-[#087f5b] flex items-center justify-center">
            <Lock size={22} />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight mt-2">Reset Password</h2>
          <p className="text-xs text-neutral-400">
            Set your new strong password below to regain system access.
          </p>
        </div>

        {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg text-center font-bold">{error}</div>}
        
        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={42} className="text-[#087f5b]" />
            <span className="text-xs font-bold text-neutral-800">Password Reset Completed!</span>
            <span className="text-[10px] text-neutral-400">Redirecting you to the sign-in page...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">New Password *</label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Confirm New Password *</label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b]"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 transition"
            >
              Update Password <ArrowRight size={14} />
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
