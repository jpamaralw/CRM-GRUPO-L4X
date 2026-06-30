import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/libs/serverAuth'
import { getNotificationsForUser } from '@/libs/notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()

  const notifications = await getNotificationsForUser(user)

  return NextResponse.json({ notifications })
}
