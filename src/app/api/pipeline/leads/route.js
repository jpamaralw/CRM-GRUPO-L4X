import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireCurrentUser, unauthorizedResponse } from '@/libs/serverAuth'
import { canViewPipeline, getLeadVisibilityWhere } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const user = await requireCurrentUser()

  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const pipeline = searchParams.get('pipeline')

  if (pipeline && !canViewPipeline(user.role, pipeline)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const where = {
    ...getLeadVisibilityWhere(user.role),
    ...(pipeline ? { pipeline } : {})
  }

  const leads = await prisma.lead.findMany({
    where,
    select: {
      id: true,
      numeroProcesso: true,
      tribunal: true,
      autor: true,
      reu: true,
      valorCausa: true,
      fase: true,
      score: true,
      prioridade: true,
      pipeline: true,
      statusCrm: true,
      telefone: true,
      email: true,
      origem: true,
      lastContactAt: true,
      nextFollowUpAt: true,
      updatedAt: true,
      assignedTo: { select: { id: true, name: true, email: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return NextResponse.json({ leads })
}

export async function POST(request) {
  const user = await requireCurrentUser()

  if (!user) return unauthorizedResponse()

  if (!canViewPipeline(user.role, 'PROSPECCAO')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  if (!body.numeroProcesso?.trim()) {
    return NextResponse.json({ error: 'Número do processo é obrigatório' }, { status: 400 })
  }

  if (!body.tribunal?.trim()) {
    return NextResponse.json({ error: 'Tribunal é obrigatório' }, { status: 400 })
  }

  const existing = await prisma.lead.findUnique({ where: { numeroProcesso: body.numeroProcesso.trim() } })

  if (existing) {
    return NextResponse.json({ error: 'Já existe um lead com esse número de processo' }, { status: 409 })
  }

  const lead = await prisma.lead.create({
    data: {
      numeroProcesso: body.numeroProcesso.trim(),
      tribunal: body.tribunal.trim(),
      autor: body.autor || null,
      reu: body.reu || null,
      valorCausa: body.valorCausa ? Number(body.valorCausa) : null,
      fase: body.fase || null,
      prioridade: body.prioridade || null,
      telefone: body.telefone || null,
      email: body.email || null,
      origem: body.origem || 'MANUAL',
      pipeline: 'PROSPECCAO',
      statusCrm: 'NOVO'
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } }
  })

  await prisma.activity.create({
    data: { leadId: lead.id, userId: user.id, tipo: 'CRIACAO', descricao: 'Lead criado manualmente', usuario: user.email }
  })

  return NextResponse.json({ lead }, { status: 201 })
}
