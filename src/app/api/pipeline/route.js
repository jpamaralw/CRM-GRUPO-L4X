import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function GET() {
  try {
    const items = await prisma.pipelineAtivo.findMany({
      orderBy: { criadoEm: 'desc' }
    })

    const leadIds = [...new Set(items.map(i => i.leadId).filter(Boolean))]
    const userIds = [...new Set(items.map(i => i.responsavelId).filter(Boolean))]

    const [leads, users] = await Promise.all([
      prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, nome: true, cnpj: true, telefone: true, email: true }
      }),
      userIds.length
        ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
        : Promise.resolve([])
    ])

    const leadsMap = Object.fromEntries(leads.map(l => [l.id, l]))
    const usersMap = Object.fromEntries(users.map(u => [u.id, u]))

    return NextResponse.json(
      items.map(item => ({
        ...item,
        lead: leadsMap[item.leadId] ?? null,
        responsavel: item.responsavelId ? usersMap[item.responsavelId] ?? null : null
      }))
    )
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
