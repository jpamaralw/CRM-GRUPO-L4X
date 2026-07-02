import { redirect } from 'next/navigation'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { canManageMetaLeads } from '@/utils/permissions'
import { isMetaConfigured as checkEnv } from '@/libs/meta'
import MetaLeadsView from '@/views/meta-leads/MetaLeadsView'

export const dynamic = 'force-dynamic'

export default async function MetaLeadsPage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user || !canManageMetaLeads(user.role)) redirect(`/${params.lang}/dashboards/crm`)

  const configured = checkEnv()
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/webhook`

  const [totalLeads, leadsHoje, recentLeads, recentEvents, byCampaign] = await Promise.all([
    prisma.lead.count({ where: { origem: 'META_ADS' } }),
    prisma.lead.count({
      where: {
        origem: 'META_ADS',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.lead.findMany({
      where: { origem: 'META_ADS' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        autor: true,
        telefone: true,
        email: true,
        pipeline: true,
        statusCrm: true,
        metaCampaignName: true,
        metaFormName: true,
        metaLeadId: true,
        createdAt: true,
        assignedTo: { select: { name: true } }
      }
    }),
    prisma.metaWebhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        leadgenId: true,
        formId: true,
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

  return (
    <MetaLeadsView
      configured={configured}
      webhookUrl={webhookUrl}
      totalLeads={totalLeads}
      leadsHoje={leadsHoje}
      recentLeads={recentLeads}
      recentEvents={recentEvents}
      byCampaign={byCampaign.map(r => ({
        campaign: r.metaCampaignName || '(sem campanha)',
        count: r._count.id
      }))}
    />
  )
}
