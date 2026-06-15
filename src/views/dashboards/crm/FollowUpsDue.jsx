import Link from 'next/link'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { getLeadVisibilityWhere } from '@/utils/permissions'

const formatDate = value => new Date(value).toLocaleDateString('pt-BR')

const FollowUpsDue = async ({ lang }) => {
  const user = await requireCurrentUser()

  if (!user) return null

  const now = new Date()
  const endOfToday = new Date(now)

  endOfToday.setHours(23, 59, 59, 999)

  const leads = await prisma.lead.findMany({
    where: {
      ...getLeadVisibilityWhere(user.role),
      nextFollowUpAt: { lte: endOfToday }
    },
    select: {
      id: true,
      numeroProcesso: true,
      autor: true,
      reu: true,
      pipeline: true,
      statusCrm: true,
      nextFollowUpAt: true
    },
    orderBy: { nextFollowUpAt: 'asc' },
    take: 8
  })

  return (
    <Card>
      <CardHeader title='Follow-ups Pendentes' subheader='Leads com retorno agendado para hoje ou atrasados' />
      <CardContent className='flex flex-col gap-3'>
        {leads.length === 0 && (
          <Typography variant='body2' color='text.secondary'>
            Nenhum follow-up pendente. 🎉
          </Typography>
        )}

        {leads.map((lead, index) => {
          const overdue = new Date(lead.nextFollowUpAt) < now

          return (
            <div key={lead.id}>
              {index > 0 && <Divider className='mb-3' />}
              <Link href={`/${lang}/pipeline?pipeline=${lead.pipeline}`} className='flex items-center justify-between gap-2 no-underline'>
                <div className='flex flex-col'>
                  <Typography variant='body2' className='font-medium' color='text.primary'>
                    {lead.autor || lead.reu || lead.numeroProcesso}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {lead.numeroProcesso}
                  </Typography>
                </div>
                <Chip
                  size='small'
                  label={formatDate(lead.nextFollowUpAt)}
                  color={overdue ? 'error' : 'warning'}
                  variant='tonal'
                />
              </Link>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default FollowUpsDue
