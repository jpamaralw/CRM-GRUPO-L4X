import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireCurrentUser, unauthorizedResponse, forbiddenResponse } from '@/libs/serverAuth'
import { canEditLead, canViewLeadInPipeline, getPipelineForStatus } from '@/utils/permissions'

const STATUS_LABELS = {
  NOVO: 'Novo',
  PESQUISANDO: 'Pesquisando',
  CONTATO_INICIAL: 'Contato Inicial',
  QUALIFICADO: 'Qualificado',
  DESCARTADO: 'Descartado',
  ABORDAGEM: 'Abordagem',
  REUNIAO_AGENDADA: 'Reunião Agendada',
  PROPOSTA: 'Proposta',
  NEGOCIANDO: 'Negociando',
  FECHADO: 'Fechado',
  PERDIDO: 'Perdido',
  CLIENTE_ATIVO: 'Cliente Ativo',
  ACOMPANHAMENTO: 'Acompanhamento',
  EXPANSAO: 'Expansão'
}

const label = status => STATUS_LABELS[status] || status

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

  // Qualquer movimentação é permitida — apenas registramos quem fez e o quê.
  if (body.statusCrm && body.statusCrm !== lead.statusCrm) {
    data.statusCrm = body.statusCrm
    data.pipeline = getPipelineForStatus(body.statusCrm)
    activityNotes.push(`Status: ${label(lead.statusCrm)} → ${label(body.statusCrm)}`)

    if (data.pipeline !== lead.pipeline) {
      activityNotes.push(`Pipeline: ${lead.pipeline} → ${data.pipeline}`)
    }
  }

  if (body.assignedToId !== undefined && body.assignedToId !== lead.assignedToId) {
    data.assignedToId = body.assignedToId || null

    let nome = 'ninguém'

    if (body.assignedToId) {
      const resp = await prisma.user.findUnique({ where: { id: body.assignedToId }, select: { name: true, email: true } })

      nome = resp?.name || resp?.email || body.assignedToId
    }

    activityNotes.push(`Responsável atribuído: ${nome}`)
  }

  if (body.prioridade !== undefined && body.prioridade !== lead.prioridade) {
    data.prioridade = body.prioridade
    activityNotes.push(`Prioridade: ${lead.prioridade || '—'} → ${body.prioridade || '—'}`)
  }

  if (body.nextFollowUpAt !== undefined) {
    data.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null
    activityNotes.push(
      body.nextFollowUpAt
        ? `Follow-up agendado para ${new Date(body.nextFollowUpAt).toLocaleDateString('pt-BR')}`
        : 'Follow-up removido'
    )
  }

  if (body.telefone !== undefined && body.telefone !== lead.telefone) {
    data.telefone = body.telefone || null
    activityNotes.push('Telefone atualizado')
  }

  if (body.email !== undefined && body.email !== lead.email) {
    data.email = body.email || null
    activityNotes.push('E-mail atualizado')
  }

  if (body.detalhes !== undefined && body.detalhes !== lead.detalhes) {
    data.detalhes = body.detalhes
    activityNotes.push('Observações atualizadas')
  }

  // Registra contato (liga/whatsapp/e-mail) sem alterar campos do lead
  if (body.lastContactAt !== undefined) {
    data.lastContactAt = body.lastContactAt ? new Date(body.lastContactAt) : new Date()
    activityNotes.push('Contato registrado')
  }

  // SDR/closer envia o ativo para análise de compliance dos Drs (ou cancela o envio).
  // A aprovação/reprovação em si é feita pelos Drs em /api/compliance.
  if (body.complianceStatus !== undefined && ['AGUARDANDO', 'NAO_AVALIADO'].includes(body.complianceStatus)) {
    data.complianceStatus = body.complianceStatus
    activityNotes.push(body.complianceStatus === 'AGUARDANDO' ? 'Enviado para compliance' : 'Removido do compliance')
  }

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
