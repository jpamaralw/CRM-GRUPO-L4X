import { redirect } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import CustomAvatar from '@core/components/mui/Avatar'
import { requireCurrentUser } from '@/libs/serverAuth'
import { getNotificationsForUser } from '@/libs/notifications'

export const dynamic = 'force-dynamic'

export default async function NotificacoesPage({ params }) {
  const { lang: locale } = await params
  const user = await requireCurrentUser()

  if (!user) redirect(`/${locale}/login`)

  const notifications = await getNotificationsForUser(user, { followUpLimit: 50, processoLimit: 50 })

  return (
    <Card>
      <CardHeader
        title='Notificações'
        subheader='Follow-ups pendentes e novas movimentações processuais da sua carteira'
        action={
          notifications.length > 0 ? (
            <Chip variant='tonal' size='small' color='primary' label={`${notifications.length} no total`} />
          ) : null
        }
      />
      <Divider />
      <CardContent className='p-0'>
        {notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 plb-12'>
            <i className='ri-notification-off-line text-4xl text-textDisabled' />
            <Typography color='text.secondary'>Nenhuma notificação no momento.</Typography>
          </div>
        ) : (
          notifications.map((n, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 plb-4 pli-6 ${
                index !== notifications.length - 1 ? 'border-be' : ''
              }`}
            >
              <CustomAvatar color={n.avatarColor || 'primary'} skin='light-static'>
                <i className={n.avatarIcon || 'ri-notification-2-line'} />
              </CustomAvatar>
              <div className='flex flex-col flex-auto'>
                <Typography variant='body2' className='font-medium' color='text.primary'>
                  {n.title}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {n.subtitle}
                </Typography>
              </div>
              <Typography variant='caption' color='text.disabled' className='whitespace-nowrap'>
                {n.time}
              </Typography>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
