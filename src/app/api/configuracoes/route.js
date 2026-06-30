import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/libs/serverAuth'
import { canAccessSettings } from '@/utils/permissions'
import { getSettings, saveSettings, SETTINGS_SCHEMA } from '@/libs/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()

  if (!user?.isActive || !canAccessSettings(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ settings: await getSettings(), schema: SETTINGS_SCHEMA })
}

export async function POST(request) {
  const user = await getCurrentUser()

  if (!user?.isActive || !canAccessSettings(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  await saveSettings(body?.settings || {}, user.id)

  return NextResponse.json({ ok: true, settings: await getSettings() })
}
