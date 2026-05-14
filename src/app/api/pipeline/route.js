import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function GET() {
  try {
    const items = await prisma.pipelineAtivo.findMany({
      orderBy: { criadoEm: 'desc' }
    })

    const leads = await prisma.lead.findMany({
      where: { id: { in: items.map(i => i.leadId) } },
      select: { id: true, nome: true, cnpj: true }
    })

    const leadsMap = Object.fromEntries(leads.map(l => [l.id, l]))

    return NextResponse.json(items.map(item => ({ ...item, lead: leadsMap[item.leadId] ?? null })))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
