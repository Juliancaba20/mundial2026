import { NextResponse } from 'next/server'
import { fetchLiveResults } from '@/lib/espn'

// Vercel: re-ejecutar cada 60 segundos (ISR para API routes)
export const revalidate = 60

export async function GET() {
  try {
    const results = await fetchLiveResults()
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('ESPN fetch error:', error)
    return NextResponse.json({}, { status: 200 }) // 200 con vacío → app muestra fixture base
  }
}
