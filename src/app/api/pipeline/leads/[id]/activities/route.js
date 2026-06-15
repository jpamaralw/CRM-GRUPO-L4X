import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireCurrentUser, unauthorizedResponse, forbiddenResponse } from '@/libs/serverAuth'
import { canViewLeadInPipeline } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const user = await requireCurrentUser()

  if (!user) return unauthorizedResponse()

  const { id } = await params
  const body = await request.json()

  if (!body.descricao?.trim()) {
    return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
  }

  const lead = await prisma.lead.findUnique({ where: { id } })

  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  if (!canViewLeadInPipeline(user.role, lead)) return forbiddenResponse()

  const activity = await prisma.activity.create({
    data: { leadId: id, userId: user.id, tipo: 'NOTA', descricao: body.descricao.trim(), usuario: user.email },
    include: { user: { select: { name: true } } }
  })

  await prisma.lead.update({ where: { id }, data: { lastContactAt: new Date() } })

  return NextResponse.json({ activity }, { status: 201 })
}
