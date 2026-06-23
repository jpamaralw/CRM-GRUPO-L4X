import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

import CardStatVertical from '@components/card-statistics/Vertical'
import FollowUpsDue from '@views/dashboards/crm/FollowUpsDue'
import L4Overview from '@views/dashboards/crm/L4Overview'
import MovimentacoesRecentes from '@views/dashboards/crm/MovimentacoesRecentes'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { getLeadVisibilityWhere, canViewAcompanhamento } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const fmt = n => Number(n || 0).toLocaleString('pt-BR')

const ROLE_SUBTITLE = {
  SDR: 'Foque na prospecção: qualifique e avance seus leads para a negociação.',
  FINANCEIRO_SDR: 'Foque na prospecção: qualifique e avance seus leads para a negociação.',
  CLOSER: 'Suas negociações em andamento. Agende reuniões e feche mais contratos.',
  GESTOR: 'Visão geral da operação. Acompanhe o time e os resultados.',
  SOCIO: 'Visão executiva do Grupo L4. Resultados e operação em tempo real.',
  TI: 'Painel completo da operação L4 Ativos.',
  ADVOGADO: 'Acompanhe as movimentações processuais dos ativos da L4.',
  RECEPCAO: 'Atendimento e acompanhamento dos processos da L4.'
}

const hoje = () =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const DashboardCRM = async props => {
  const params = await props.params
  const user = await requireCurrentUser()

  const where = user ? getLeadVisibilityWhere(user.role) : { id: '__none__' }
  const verAcompanhamento = user ? canViewAcompanhamento(user.role) : false

  const [totalLeads, comTelefone, comEmail, prospeccao, negociacao, novosHoje, procMonitorados, procNovidade] =
    await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, telefone: { not: null } } }),
      prisma.lead.count({ where: { ...where, email: { not: null } } }),
      prisma.lead.count({ where: { ...where, pipeline: 'PROSPECCAO' } }),
      prisma.lead.count({ where: { ...where, pipeline: 'NEGOCIACAO' } }),
      prisma.lead.count({
        where: { ...where, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      }),
      verAcompanhamento ? prisma.processoMonitorado.count() : Promise.resolve(0),
      verAcompanhamento
        ? prisma.processoMonitorado.count({ where: { statusConsulta: 'NOVA_MOVIMENTACAO' } })
        : Promise.resolve(0)
    ])

  return (
    <div className='flex flex-col gap-6'>
      <div
        className='relative overflow-hidden rounded-2xl p-6 sm:p-8'
        style={{
          background:
            'radial-gradient(900px 400px at 90% -30%, #0a5bc4 0%, transparent 55%), linear-gradient(120deg, #002a66 0%, #004499 60%, #00367d 100%)'
        }}
      >
        <div
          aria-hidden
          className='absolute -right-16 -bottom-20 opacity-10'
          style={{ width: 320, height: 320, border: '32px solid #fff', transform: 'rotate(45deg)', borderRadius: 20 }}
        />
        <div className='relative flex flex-col gap-1'>
          <Typography className='text-white/70 text-sm capitalize'>{hoje()}</Typography>
          <Typography variant='h4' className='text-white font-bold'>
            Olá{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </Typography>
          <Typography className='text-white/85 max-is-[640px]'>
            {ROLE_SUBTITLE[user?.role] || 'Visão geral da operação L4 Ativos.'}
          </Typography>
        </div>
      </div>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <CardStatVertical
            stats={fmt(totalLeads)}
            title='Leads na carteira'
            trendNumber={`${fmt(novosHoje)} hoje`}
            chipText='Total'
            avatarColor='primary'
            avatarIcon='ri-user-search-line'
            avatarSkin='light'
            chipColor='primary'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <CardStatVertical
            stats={fmt(comTelefone)}
            title='Com telefone'
            trendNumber={totalLeads ? `${Math.round((comTelefone / totalLeads) * 100)}%` : '0%'}
            chipText='Contatáveis'
            avatarColor='success'
            avatarIcon='ri-phone-line'
            avatarSkin='light'
            chipColor='success'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <CardStatVertical
            stats={fmt(prospeccao)}
            title='Em Prospecção'
            trendNumber='Ativos'
            chipText='Pipeline'
            avatarColor='info'
            avatarIcon='ri-search-line'
            avatarSkin='light'
            chipColor='info'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <CardStatVertical
            stats={fmt(negociacao)}
            title='Em Negociação'
            trendNumber='Ativos'
            chipText='Pipeline'
            avatarColor='warning'
            avatarIcon='ri-handshake-line'
            avatarSkin='light'
            chipColor='warning'
          />
        </Grid>

        {verAcompanhamento && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <CardStatVertical
                stats={fmt(procMonitorados)}
                title='Processos monitorados'
                trendNumber='DataJud'
                chipText='Acompanhamento'
                avatarColor='secondary'
                avatarIcon='ri-scales-3-line'
                avatarSkin='light'
                chipColor='secondary'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <CardStatVertical
                stats={fmt(procNovidade)}
                title='Com nova movimentação'
                trendNumber='Atenção'
                chipText='Novidade'
                avatarColor='error'
                avatarIcon='ri-notification-badge-line'
                avatarSkin='light'
                chipColor='error'
              />
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <L4Overview />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FollowUpsDue lang={params.lang} />
        </Grid>
        {verAcompanhamento && (
          <Grid size={{ xs: 12 }}>
            <MovimentacoesRecentes />
          </Grid>
        )}
      </Grid>
    </div>
  )
}

export default DashboardCRM
