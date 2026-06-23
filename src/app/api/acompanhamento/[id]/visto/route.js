import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { getCurrentUser } from '@/libs/serverAuth'
import { canViewAcompanhamento } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const user = await getCurrentUser()

  if (!user?.isActive || !canViewAcompanhamento(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await prisma.movimentacaoMonitorada.updateMany({
    where: { processoMonitoradoId: id, nova: true },
    data: { nova: false, visualizada: true }
  })

  await prisma.processoMonitorado.update({
    where: { id },
    data: { statusConsulta: 'SEM_NOVIDADE' }
  })

  return NextResponse.json({ ok: true })
}
