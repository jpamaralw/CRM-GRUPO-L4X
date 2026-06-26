import { redirect } from 'next/navigation'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { canDoCompliance } from '@/utils/permissions'
import ComplianceBoard from '@/views/compliance/ComplianceBoard'

export const dynamic = 'force-dynamic'

export default async function CompliancePage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user || !canDoCompliance(user.role)) redirect(`/${params.lang}/dashboards/crm`)

  const [aguardando, aprovados, reprovados, leads] = await Promise.all([
    prisma.lead.count({ where: { complianceStatus: 'AGUARDANDO' } }),
    prisma.lead.count({ where: { complianceStatus: 'APROVADO' } }),
    prisma.lead.count({ where: { complianceStatus: 'REPROVADO' } }),
    prisma.lead.findMany({
      where: { complianceStatus: { in: ['AGUARDANDO', 'APROVADO', 'REPROVADO'] } },
      orderBy: [{ complianceStatus: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        numeroProcesso: true,
        autor: true,
        reu: true,
        tribunal: true,
        valorCausa: true,
        grupo: true,
        fonte: true,
        prioridade: true,
        complianceStatus: true,
        complianceObs: true,
        complianceAt: true,
        assignedTo: { select: { name: true, email: true } }
      }
    })
  ])

  return (
    <ComplianceBoard
      stats={{ aguardando, aprovados, reprovados }}
      leads={leads}
      canEdit={canDoCompliance(user.role)}
    />
  )
}
