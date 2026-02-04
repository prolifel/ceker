import { NextRequest, NextResponse } from 'next/server'
import { createBlacklists } from '@/lib/repo/blacklist'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { domains } = body

    if (!Array.isArray(domains)) {
        return NextResponse.json({ error: 'domains array is required' }, { status: 400 })
    }

    const result = await createBlacklists(domains)
    return NextResponse.json(result)
}
