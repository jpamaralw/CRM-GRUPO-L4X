import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email

  if (!email) return null

  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true
    }
  })
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()

  if (!user?.isActive) return null

  return user
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
