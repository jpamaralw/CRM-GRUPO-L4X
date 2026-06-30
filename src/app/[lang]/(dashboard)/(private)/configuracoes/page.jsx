import { redirect } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { canAccessSettings } from '@/utils/permissions'
import { getSettings, SETTINGS_SCHEMA } from '@/libs/settings'
import ConfiguracoesForm from '@/views/configuracoes/ConfiguracoesForm'

export const dynamic = 'force-dynamic'

const Row = ({ label, value }) => (
  <div className='flex items-center justify-between gap-4 py-1'>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='body2' className='font-medium text-right'>
      {value}
    </Typography>
  </div>
)

export default async function ConfiguracoesPage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user || !canAccessSettings(user.role)) redirect(`/${params.lang}/dashboards/crm`)

  const [totalLeads, totalProcessos, totalUsuarios, settings] = await Promise.all([
    prisma.lead.count(),
    prisma.processoMonitorado.count(),
    prisma.user.count(),
    getSettings()
  ])

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          Configurações
        </Typography>
        <Typography color='text.secondary'>Informações do sistema e da operação</Typography>
      </div>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className='bs-full'>
            <CardHeader title='Sistema' />
            <CardContent>
              <Row label='Aplicação' value='L4 Ativos · CRM Jurídico' />
              <Divider className='my-2' />
              <Row label='Banco de dados' value='Neon Postgres' />
              <Divider className='my-2' />
              <Row label='Acompanhamento processual' value={<Chip size='small' label='DataJud / CNJ' color='primary' variant='tonal' />} />
              <Divider className='my-2' />
              <Row label='Consulta automática' value='Diária (09:00 UTC)' />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className='bs-full'>
            <CardHeader title='Operação' />
            <CardContent>
              <Row label='Leads na base' value={totalLeads.toLocaleString('pt-BR')} />
              <Divider className='my-2' />
              <Row label='Processos monitorados' value={totalProcessos.toLocaleString('pt-BR')} />
              <Divider className='my-2' />
              <Row label='Usuários' value={totalUsuarios.toLocaleString('pt-BR')} />
              <Divider className='my-2' />
              <Row label='Seu acesso' value={<Chip size='small' label={user.role} color='secondary' variant='tonal' />} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfiguracoesForm schema={SETTINGS_SCHEMA} initialSettings={settings} />
    </div>
  )
}
