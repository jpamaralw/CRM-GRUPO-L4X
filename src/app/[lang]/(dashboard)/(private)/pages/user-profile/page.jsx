import { redirect } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Avatar from '@mui/material/Avatar'

import CustomAvatar from '@core/components/mui/Avatar'
import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'

export const dynamic = 'force-dynamic'

const ROLE_LABEL = {
  SDR: 'SDR',
  CLOSER: 'Closer',
  GESTOR: 'Gestor',
  SOCIO: 'Sócio',
  TI: 'TI',
  ADVOGADO: 'Advogado',
  RECEPCAO: 'Recepção',
  FINANCEIRO: 'Financeiro',
  FINANCEIRO_SDR: 'Financeiro/SDR',
  PAPELADA: 'Papelada'
}

const initials = name =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')

const brl = v =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const timeAgo = date => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)

  if (h < 1) return 'agora há pouco'
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)

  return `${d}d atrás`
}

const ACTIVITY_ICON = {
  CONTATO: 'ri-phone-line',
  WHATSAPP: 'ri-whatsapp-line',
  EMAIL: 'ri-mail-line',
  FOLLOWUP: 'ri-calendar-check-line',
  NOTA: 'ri-sticky-note-line',
  MUDANCA_STAGE: 'ri-git-branch-line',
  COMPLIANCE: 'ri-shield-check-line'
}

const Stat = ({ icon, color, label, value }) => (
  <Card className='bs-full'>
    <CardContent className='flex items-center gap-4'>
      <CustomAvatar color={color} skin='light' variant='rounded'>
        <i className={icon} />
      </CustomAvatar>
      <div>
        <Typography variant='h5' className='font-semibold leading-tight'>
          {value}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
      </div>
    </CardContent>
  </Card>
)

const InfoRow = ({ label, value }) => (
  <div className='flex items-center justify-between gap-4 plb-2'>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <div className='font-medium text-right'>{value}</div>
  </div>
)

export default async function ProfilePage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user) redirect(`/${params.lang}/login`)

  const now = new Date()

  const [carteira, followUps, valorAgg, atividades, recentes] = await Promise.all([
    prisma.lead.count({ where: { assignedToId: user.id } }),
    prisma.lead.count({ where: { assignedToId: user.id, nextFollowUpAt: { lte: now } } }),
    prisma.lead.aggregate({ where: { assignedToId: user.id }, _sum: { valorCausa: true } }),
    prisma.activity.count({ where: { userId: user.id } }),
    prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { lead: { select: { autor: true, reu: true, numeroProcesso: true } } }
    })
  ])

  return (
    <div className='flex flex-col gap-6'>
      {/* Cabeçalho na identidade L4 (azul/branco) */}
      <Card>
        <div className='bs-[120px] bg-primary' />
        <CardContent className='flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6 -mbs-12'>
          {user.image ? (
            <Avatar
              src={user.image}
              sx={{ width: 100, height: 100, border: '4px solid var(--mui-palette-background-paper)' }}
            />
          ) : (
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: 34,
                bgcolor: 'var(--mui-palette-primary-main)',
                border: '4px solid var(--mui-palette-background-paper)'
              }}
            >
              {initials(user.name)}
            </Avatar>
          )}
          <div className='flex flex-col items-center gap-1 sm:items-start sm:pbe-2'>
            <Typography variant='h4' className='font-semibold'>
              {user.name || '—'}
            </Typography>
            <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
              <Chip size='small' color='primary' variant='tonal' label={ROLE_LABEL[user.role] || user.role} />
              <Chip
                size='small'
                variant='outlined'
                color={user.isActive ? 'success' : 'default'}
                label={user.isActive ? 'Conta ativa' : 'Conta inativa'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores reais da carteira */}
      <Grid container spacing={6}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat icon='ri-briefcase-4-line' color='primary' label='Leads na carteira' value={carteira} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat icon='ri-calendar-check-line' color='warning' label='Follow-ups pendentes' value={followUps} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat icon='ri-money-dollar-circle-line' color='success' label='Valor em carteira' value={brl(valorAgg._sum.valorCausa)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat icon='ri-pulse-line' color='info' label='Atividades registradas' value={atividades} />
        </Grid>
      </Grid>

      <Grid container spacing={6}>
        {/* Dados da conta */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card className='bs-full'>
            <CardHeader title='Dados da conta' />
            <Divider />
            <CardContent>
              <InfoRow label='Nome' value={user.name || '—'} />
              <Divider />
              <InfoRow label='E-mail' value={user.email || '—'} />
              <Divider />
              <InfoRow label='Telefone' value={user.phone || '—'} />
              <Divider />
              <InfoRow label='Função' value={<Chip size='small' color='primary' variant='tonal' label={ROLE_LABEL[user.role] || user.role} />} />
              <Divider />
              <InfoRow
                label='Status'
                value={
                  <Chip
                    size='small'
                    variant='outlined'
                    color={user.isActive ? 'success' : 'default'}
                    label={user.isActive ? 'Ativa' : 'Inativa'}
                  />
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Atividade recente */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card className='bs-full'>
            <CardHeader title='Atividade recente' subheader='Suas últimas ações registradas no CRM' />
            <Divider />
            <CardContent className='p-0'>
              {recentes.length === 0 ? (
                <div className='flex flex-col items-center justify-center gap-2 plb-12'>
                  <i className='ri-history-line text-4xl text-textDisabled' />
                  <Typography color='text.secondary'>Nenhuma atividade registrada ainda.</Typography>
                </div>
              ) : (
                recentes.map((a, index) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 plb-4 pli-6 ${index !== recentes.length - 1 ? 'border-be' : ''}`}
                  >
                    <CustomAvatar color='primary' skin='light-static' size={34}>
                      <i className={ACTIVITY_ICON[a.tipo] || 'ri-pulse-line'} />
                    </CustomAvatar>
                    <div className='flex flex-col flex-auto'>
                      <Typography variant='body2' className='font-medium' color='text.primary'>
                        {a.descricao}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {a.lead?.autor || a.lead?.reu || a.lead?.numeroProcesso || ''}
                      </Typography>
                    </div>
                    <Typography variant='caption' color='text.disabled' className='whitespace-nowrap'>
                      {timeAgo(a.createdAt)}
                    </Typography>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}
