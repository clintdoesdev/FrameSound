import { NextRequest, NextResponse } from 'next/server'

const ALLOWED = ['i.scdn.co', 'mosaic.scdn.co', 'seed-mix-image.spotifycdn.com']

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  let parsed: URL
  try { parsed = new URL(url) } catch { return new NextResponse('Invalid url', { status: 400 }) }

  if (!ALLOWED.includes(parsed.hostname)) return new NextResponse('Disallowed', { status: 403 })

  const res = await fetch(url)
  if (!res.ok) return new NextResponse('Upstream error', { status: res.status })

  const blob = await res.blob()
  return new NextResponse(blob, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
