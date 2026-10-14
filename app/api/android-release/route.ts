import { stat } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const file = await stat(path.join(process.cwd(), 'public', 'downloads', 'vikoba360.apk'))
    if (!file.isFile() || file.size === 0) throw new Error('Unavailable')
    return NextResponse.json({ available: true, url: '/downloads/vikoba360.apk', sizeBytes: file.size }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ available: false }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
