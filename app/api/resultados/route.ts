import { NextResponse } from 'next/server'
import { fetchLiveResults } from '@/lib/espn'

// Vercel: re-ejecutar cada 60 segundos (ISR para API routes)
export const revalidate = 60

export async function GET() {
  try {
    const data = await fetchLiveResults()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('ESPN fetch error:', error)
    // 200 con vacío → la app sigue mostrando el fixture base sin romper
    return NextResponse.json({ results: {}, knockoutResults: {} }, { status: 200 })
  }
}
