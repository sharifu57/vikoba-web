'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, User, Phone, Mail, Lock, PlusCircle, Users } from 'lucide-react'

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="logo text-neutral-900 font-extrabold text-2xl flex items-center gap-1">
      <span className="bg-[#087f5b] text-white rounded-lg w-8 h-8 flex items-center justify-center font-black">V</span>
      <span>IKOBA<strong className="text-[#087f5b]">360</strong></span>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // Step 1: User Profile, Step 2: Group Config
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
    groupAction: 'create', // 'create' | 'join'
    groupName: '',
    inviteCode: ''
  })
  const [error, setError] = useState('')

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.phone || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!form.agree) {
      setError('You must agree to the Terms and Privacy Policy.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.groupAction === 'create' && !form.groupName) {
      setError('Please enter your new VIKOBA group name.')
      return
    }
    if (form.groupAction === 'join' && !form.inviteCode) {
      setError('Please enter the invite code provided by your administrator.')
      return
    }
    
    // Simulate user creation
    if (typeof window !== 'undefined') {
      localStorage.setItem('v360_user', JSON.stringify({
        name: `${form.firstName} ${form.lastName}`,
        role: form.groupAction === 'create' ? 'Administrator' : 'Member',
        phone: form.phone,
        email: form.email,
        groupName: form.groupAction === 'create' ? form.groupName : 'Mshikamano VIKOBA'
      }))
    }
    router.push('/auth/verify-otp')
  }

  return (
    <div className="auth-page min-h-screen bg-[#f7f9f7] flex items-center justify-center p-6">
      <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 md:p-10 shadow-sm max-w-lg w-full flex flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo />
          </Link>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {step === 1 ? 'Create Your Account' : 'Setup Your VIKOBA Group'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {step === 1 ? 'Start building a clearer financial future for your group.' : 'Choose to launch a new savings group or link to an existing one.'}
          </p>
        </div>

        {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg font-medium">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleNext} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">First Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    placeholder="Juma" 
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] pl-9"
                  />
                  <User className="absolute left-3 top-3.5 text-neutral-400" size={14} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Last Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    placeholder="Majid" 
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] pl-9"
                  />
                  <User className="absolute left-3 top-3.5 text-neutral-400" size={14} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone Number *</label>
              <div className="relative">
                <input 
                  type="tel" 
                  required
                  placeholder="+255 712 345 678" 
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] pl-9"
                />
                <Phone className="absolute left-3 top-3.5 text-neutral-400" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="juma@example.com" 
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] pl-9"
                />
                <Mail className="absolute left-3 top-3.5 text-neutral-400" size={14} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Password *</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] pl-9"
                  />
                  <Lock className="absolute left-3 top-3.5 text-neutral-400" size={14} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b] pl-9"
                  />
                  <Lock className="absolute left-3 top-3.5 text-neutral-400" size={14} />
                </div>
              </div>
            </div>

            <label className="checkbox flex items-start gap-2 cursor-pointer mt-1 text-neutral-500 text-xs leading-normal select-none">
              <input 
                type="checkbox" 
                checked={form.agree}
                onChange={e => setForm({ ...form, agree: e.target.checked })}
                className="accent-[#087f5b] rounded mt-0.5" 
              />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>

            <button 
              type="submit"
              className="w-full py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs mt-2 flex items-center justify-center gap-2 transition"
            >
              Continue to Group Setup <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setForm({ ...form, groupAction: 'create' })}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition ${form.groupAction === 'create' ? 'border-[#087f5b] bg-[#eaf6ef]/30 font-bold' : 'border-[#dfe8e2] text-neutral-400'}`}
              >
                <PlusCircle size={20} className={form.groupAction === 'create' ? 'text-[#087f5b]' : ''} />
                <span className="text-xs text-neutral-800">Create a Group</span>
              </button>
              <button 
                type="button"
                onClick={() => setForm({ ...form, groupAction: 'join' })}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition ${form.groupAction === 'join' ? 'border-[#087f5b] bg-[#eaf6ef]/30 font-bold' : 'border-[#dfe8e2] text-neutral-400'}`}
              >
                <Users size={20} className={form.groupAction === 'join' ? 'text-[#087f5b]' : ''} />
                <span className="text-xs text-neutral-800">Join Existing Group</span>
              </button>
            </div>

            {form.groupAction === 'create' ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">New VIKOBA Group Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Umoja VIKOBA" 
                  value={form.groupName}
                  onChange={e => setForm({ ...form, groupName: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b]"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">Default currency will be set to TZS.</span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Group Invitation Code *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. V360-XYZ99" 
                  value={form.inviteCode}
                  onChange={e => setForm({ ...form, inviteCode: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-3 text-xs outline-none focus:border-[#087f5b]"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">Obtain the registration code from your group treasurer.</span>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 border border-[#dfe8e2] text-neutral-600 font-bold rounded-lg text-xs hover:bg-neutral-50 transition"
              >
                Back
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-[#087f5b] hover:bg-[#066b4c] text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-2 transition"
              >
                Register & Verify <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs text-neutral-500 mt-1">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#087f5b] hover:text-[#066b4c] hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
