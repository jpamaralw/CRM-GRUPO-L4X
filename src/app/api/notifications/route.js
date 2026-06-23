import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { getCurrentUser } from '@/libs/serverAuth'
import { getLeadVisibilityWhere, canViewAcompanhamento } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const timeAgo = date => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)

  if (h < 1) return 'agora há pouco'
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)

  return `${d}d atrás`
}

export async function GET() {
  const user = await getCurrentUser()

  if (!user?.isActive) return NextResponse.json({ notifications: [] })

  const notifications = []

  // Follow-ups vencidos / de hoje na carteira do usuário
  const endOfToday = new Date()

  endOfToday.setHours(23, 59, 59, 999)

  const followUps = await prisma.lead.findMany({
    where: { ...getLeadVisibilityWhere(user.role), nextFollowUpAt: { lte: endOfToday } },
    select: { autor: true, reu: true, nextFollowUpAt: true },
    orderBy: { nextFollowUpAt: 'asc' },
    take: 5
  })

  followUps.forEach(lead => {
    notifications.push({
      avatarIcon: 'ri-calendar-check-line',
      avatarColor: 'warning',
      title: 'Follow-up pendente',
      subtitle: lead.autor || lead.reu || 'Lead',
      time: timeAgo(lead.nextFollowUpAt),
      read: false
    })
  })

  // Processos com nova movimentação (apenas para quem vê acompanhamento)
  if (canViewAcompanhamento(user.role)) {
    const processos = await prisma.processoMonitorado.findMany({
      where: { statusConsulta: 'NOVA_MOVIMENTACAO' },
      select: { numeroProcesso: true, cliente: true, ultimaMovimentacaoTexto: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 6
    })

    processos.forEach(p => {
      notifications.push({
        avatarIcon: 'ri-scales-3-line',
        avatarColor: 'primary',
        title: `Nova movimentação · ${p.cliente || p.numeroProcesso}`,
        subtitle: p.ultimaMovimentacaoTexto || 'Atualização no processo',
        time: timeAgo(p.updatedAt),
        read: false
      })
    })
  }

  return NextResponse.json({ notifications })
}
