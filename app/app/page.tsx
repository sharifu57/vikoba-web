'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('v360_access_token')
    const setupComplete = localStorage.getItem('v360_group_setup_complete') === 'true'

    if (token && !setupComplete) {
      router.replace('/app/settings')
      return
    }

    router.replace('/app/dashboard')
  }, [router])

  return null
}
