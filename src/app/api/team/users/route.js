import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireCurrentUser, unauthorizedResponse, forbiddenResponse } from '@/libs/serverAuth'
import { canAssignLead } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await requireCurrentUser()

  if (!user) return unauthorizedResponse()
  if (!canAssignLead(user.role)) return forbiddenResponse()

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json({ users })
}
