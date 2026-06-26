import { redirect } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { canManageAutomations } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const formatDate = v => (v ? new Date(v).toLocaleString('pt-BR') : '—')

export default async function AutomacoesPage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user || !canManageAutomations(user.role)) redirect(`/${params.lang}/dashboards/crm`)

  const ultimaConsulta = await prisma.consultaProcessualRun.findFirst({ orderBy: { startedAt: 'desc' } })

  const emailAtivo = Boolean(process.env.RESEND_API_KEY)

  const rotinas = [
    {
      nome: 'Acompanhamento processual (DataJud)',
      descricao: 'Consulta diária automática de movimentações dos processos monitorados na API pública do CNJ.',
      icon: 'ri-scales-3-line',
      color: 'primary',
      status: 'Ativa',
      detalhe: `Última execução: ${formatDate(ultimaConsulta?.startedAt)}${
        ultimaConsulta ? ` · ${ultimaConsulta.novasMovimentacoes ?? 0} novas movimentações` : ''
      }`
    },
    {
      nome: 'Relatório diário por e-mail aos Drs',
      descricao:
        'Após a consulta diária, um relatório com as novas movimentações é enviado automaticamente para os Drs (Fábio/Natane), com gestores em cópia.',
      icon: 'ri-mail-send-line',
      color: 'info',
      status: emailAtivo ? 'Ativa' : 'Aguardando chave',
      detalhe: emailAtivo ? 'Enviado junto da consulta diária (09:00)' : 'Configure RESEND_API_KEY para ativar o envio'
    },
    {
      nome: 'Compliance de ativos',
      descricao:
        'Ativos caçados por SDRs/closers vão para análise dos Drs, que aprovam ou reprovam a compra. Tudo fica registrado no histórico do lead.',
      icon: 'ri-shield-check-line',
      color: 'secondary',
      status: 'Ativa',
      detalhe: 'Fluxo: enviar → aprovar/reprovar → registro'
    },
    {
      nome: 'Lembrete de follow-up',
      descricao: 'Leads com follow-up vencido aparecem no painel "Follow-ups" do dashboard de cada responsável.',
      icon: 'ri-calendar-check-line',
      color: 'warning',
      status: 'Ativa',
      detalhe: 'Atualização em tempo real'
    },
    {
      nome: 'Score e priorização de leads',
      descricao: 'Leads importados recebem score e prioridade (ALTA/MÉDIA/BAIXA) com base em valor, contato e perfil.',
      icon: 'ri-bar-chart-box-line',
      color: 'success',
      status: 'Ativa',
      detalhe: 'Aplicado na importação'
    }
  ]

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          Automações
        </Typography>
        <Typography color='text.secondary'>Rotinas que reduzem trabalho manual da equipe</Typography>
      </div>

      <Grid container spacing={6}>
        {rotinas.map(r => (
          <Grid key={r.nome} size={{ xs: 12, md: 4 }}>
            <Card className='bs-full'>
              <CardContent className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Avatar variant='rounded' className={`bg-${r.color}`} sx={{ bgcolor: `var(--mui-palette-${r.color}-main)` }}>
                    <i className={r.icon} />
                  </Avatar>
                  <Chip size='small' label={r.status} color={r.status === 'Ativa' ? 'success' : 'warning'} variant='tonal' />
                </div>
                <Typography variant='h6'>{r.nome}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {r.descricao}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {r.detalhe}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  )
}
