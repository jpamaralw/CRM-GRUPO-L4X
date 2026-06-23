import { redirect } from 'next/navigation'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { getLeadVisibilityWhere, getVisiblePipelines, PIPELINES } from '@/utils/permissions'

import PipelineBoard from '@/views/pipeline/PipelineBoard'

export const dynamic = 'force-dynamic'

export default async function PipelinePage(props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const user = await requireCurrentUser()

  if (!user) redirect(`/${params.lang}/login`)

  const visiblePipelines = getVisiblePipelines(user.role)

  if (!visiblePipelines.length) redirect(`/${params.lang}/dashboards/crm`)

  const activePipeline =
    searchParams?.pipeline && visiblePipelines.includes(searchParams.pipeline)
      ? searchParams.pipeline
      : visiblePipelines[0]

  const leads = await prisma.lead.findMany({
    where: {
      ...getLeadVisibilityWhere(user.role),
      pipeline: activePipeline
    },
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
      grupo: true,
      fonte: true,
      nextFollowUpAt: true,
      updatedAt: true,
      assignedTo: { select: { id: true, name: true, email: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <PipelineBoard
      pipelines={visiblePipelines.map(key => PIPELINES[key])}
      activePipeline={activePipeline}
      leads={leads}
      lang={params.lang}
    />
  )
}
