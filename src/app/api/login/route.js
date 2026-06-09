// Next Imports
import { NextResponse } from 'next/server'

// Third-party Imports
import { compare } from 'bcryptjs'

import prisma from '@/libs/prisma'

// Validates credentials against the team registered in the database.
export async function POST(req) {
  const { email, password } = await req.json()

  const user = email
    ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
    : null

  const ok = user && user.password && user.isActive !== false && (await compare(String(password ?? ''), user.password))

  if (!ok) {
    return NextResponse.json(
      { message: ['Email ou senha inválidos'] },
      { status: 401, statusText: 'Unauthorized Access' }
    )
  }

  // Strip the password hash before returning
  const { password: _pw, ...safeUser } = user

  return NextResponse.json(safeUser)
}
