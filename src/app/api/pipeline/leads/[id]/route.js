import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireCurrentUser, unauthorizedResponse, forbiddenResponse } from '@/libs/serverAuth'
import {
  canEditLead,
  canViewLeadInPipeline,
  getPipelineForStatus,
  isValidTransition
} from '@/utils/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const user = await requireCurrentUser()

  if (!user) return unauthorizedResponse()

  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      movimentacoes: { orderBy: { dataMovimento: 'desc' }, take: 50 },
      activities: { orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { name: true } } } },
      processosMonitorados: {
        select: {
          id: true,
          numeroProcesso: true,
          status: true,
          statusConsulta: true,
          ultimaMovimentacaoAt: true,
          ultimaMovimentacaoTexto: true
        }
      }
    }
  })

  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

  if (!canViewLeadInPipeline(user.role, lead)) return forbiddenResponse()

  return NextResponse.json({ lead })
}

export async function PATCH(request, { params }) {
  const user = await requireCurrentUser()

  if (!user) return unauthorizedResponse()

  const { id } = await params
  const body = await request.json()

  const lead = await prisma.lead.findUnique({ where: { id } })

  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

  if (!canEditLead(user.role, lead)) return forbiddenResponse()

  const data = {}
  const activityNotes = []

  if (body.statusCrm && body.statusCrm !== lead.statusCrm) {
    if (!isValidTransition(lead.statusCrm, body.statusCrm)) {
      return NextResponse.json(
        { error: `Transição inválida: ${lead.statusCrm} -> ${body.statusCrm}` },
        { status: 400 }
      )
    }

    data.statusCrm = body.statusCrm
    data.pipeline = getPipelineForStatus(body.statusCrm)
    activityNotes.push(`Status alterado de ${lead.statusCrm} para ${body.statusCrm}`)
  }

  if (body.assignedToId !== undefined && body.assignedToId !== lead.assignedToId) {
    data.assignedToId = body.assignedToId || null
    activityNotes.push('Responsável atualizado')
  }

  if (body.prioridade !== undefined) data.prioridade = body.prioridade
  if (body.nextFollowUpAt !== undefined) data.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null
  if (body.detalhes !== undefined) data.detalhes = body.detalhes

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ lead })
  }

  const updated = await prisma.lead.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } }
    }
  })

  if (activityNotes.length) {
    await prisma.activity.create({
      data: {
        leadId: id,
        userId: user.id,
        tipo: 'ATUALIZACAO',
        descricao: activityNotes.join(' | '),
        usuario: user.email
      }
    })
  }

  return NextResponse.json({ lead: updated })
}
