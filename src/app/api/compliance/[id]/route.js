import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { getCurrentUser } from '@/libs/serverAuth'
import { canDoCompliance } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const VALID = ['AGUARDANDO', 'APROVADO', 'REPROVADO', 'NAO_AVALIADO']

export async function PATCH(request, { params }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user?.isActive || !canDoCompliance(user.role)) {
    return NextResponse.json({ error: 'Sem permissão para compliance' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const status = body?.complianceStatus

  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      complianceStatus: status,
      complianceObs: body?.complianceObs ?? null,
      complianceById: user.id,
      complianceAt: new Date()
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } }
  })

  // Registra no histórico de atividades
  const labelMap = { APROVADO: 'APROVOU', REPROVADO: 'REPROVOU', AGUARDANDO: 'enviou para', NAO_AVALIADO: 'redefiniu' }

  await prisma.activity
    .create({
      data: {
        leadId: id,
        userId: user.id,
        tipo: 'COMPLIANCE',
        usuario: user.name || user.email,
        descricao: `${user.name || 'Dr(a)'} ${labelMap[status] || 'atualizou'} compliance${body?.complianceObs ? `: ${body.complianceObs}` : ''}`
      }
    })
    .catch(() => {})

  return NextResponse.json({ ok: true, lead })
}
