import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { getCurrentUser } from '@/libs/serverAuth'
import { isMetaConfigured } from '@/libs/meta'
import { ROLES } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const ALLOWED = [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI]

export async function GET() {
  const user = await getCurrentUser()

  if (!user?.isActive || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const configured = isMetaConfigured()

  const [totalLeads, leadsHoje, recentEvents, byCampaign] = await Promise.all([
    prisma.lead.count({ where: { origem: 'META_ADS' } }),
    prisma.lead.count({
      where: {
        origem: 'META_ADS',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.metaWebhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        leadgenId: true,
        formId: true,
        campaignId: true,
        processed: true,
        error: true,
        leadId: true,
        createdAt: true
      }
    }),
    prisma.lead.groupBy({
      by: ['metaCampaignName'],
      where: { origem: 'META_ADS' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })
  ])

  return NextResponse.json({
    configured,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/webhook`,
    totalLeads,
    leadsHoje,
    recentEvents,
    byCampaign: byCampaign.map(r => ({
      campaign: r.metaCampaignName || '(sem campanha)',
      count: r._count.id
    }))
  })
}
