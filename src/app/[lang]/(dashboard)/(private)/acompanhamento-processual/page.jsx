import { redirect } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { canViewAcompanhamento } from '@/utils/permissions'
import ConsultarButton from '@/views/acompanhamento/ConsultarButton'
import MarcarVistoButton from '@/views/acompanhamento/MarcarVistoButton'

export const dynamic = 'force-dynamic'

const number = value => Number(value || 0).toLocaleString('pt-BR')

const formatDate = value => {
  if (!value) return '-'

  return new Date(value).toLocaleString('pt-BR')
}

const statusColor = {
  PENDENTE: 'warning',
  SEM_NOVIDADE: 'default',
  NOVA_MOVIMENTACAO: 'success',
  ERRO_CONSULTA: 'error'
}

async function getData() {
  const [total, novas, pendentes, erros, novidades, processos, runs] = await Promise.all([
    prisma.processoMonitorado.count(),
    prisma.processoMonitorado.count({ where: { statusConsulta: 'NOVA_MOVIMENTACAO' } }),
    prisma.processoMonitorado.count({ where: { statusConsulta: 'PENDENTE' } }),
    prisma.processoMonitorado.count({ where: { statusConsulta: 'ERRO_CONSULTA' } }),
    prisma.processoMonitorado.findMany({
      where: { statusConsulta: 'NOVA_MOVIMENTACAO' },
      orderBy: { ultimaMovimentacaoAt: 'desc' },
      take: 30,
      include: {
        movimentacoes: {
          where: { nova: true },
          orderBy: { dataMovimento: 'desc' },
          take: 8
        },
        lead: { select: { autor: true, reu: true } }
      }
    }),
    prisma.processoMonitorado.findMany({
      orderBy: [{ statusConsulta: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
      include: {
        movimentacoes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        lead: {
          select: {
            autor: true,
            reu: true,
            valorCausa: true,
            pipeline: true,
            statusCrm: true
          }
        }
      }
    }),
    prisma.consultaProcessualRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5
    })
  ])

  return { total, novas, pendentes, erros, novidades, processos, runs }
}

export default async function AcompanhamentoProcessualPage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user || !canViewAcompanhamento(user.role)) {
    redirect(`/${params.lang}/pages/misc/401-not-authorized`)
  }

  const data = await getData()

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <Typography variant='h4' className='font-semibold'>
            Acompanhamento Processual
          </Typography>
          <Typography color='text.secondary'>
            Processos em posse da L4 — consulta automática de movimentações via DataJud (CNJ).
          </Typography>
        </div>
        <ConsultarButton />
      </div>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color='text.secondary'>Monitorados</Typography>
              <Typography variant='h3' className='font-semibold'>
                {number(data.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color='text.secondary'>Com novidade</Typography>
              <Typography variant='h3' className='font-semibold'>
                {number(data.novas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color='text.secondary'>Pendentes</Typography>
              <Typography variant='h3' className='font-semibold'>
                {number(data.pendentes)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color='text.secondary'>Erros de consulta</Typography>
              <Typography variant='h3' className='font-semibold'>
                {number(data.erros)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {data.novidades.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderInlineStart: '4px solid var(--mui-palette-success-main)' }}>
              <CardContent className='flex flex-col gap-4'>
                <Typography variant='h5' className='font-semibold'>
                  🔔 Novidades — {data.novidades.length} processo(s) com nova movimentação
                </Typography>
                <Typography variant='body2' color='text.secondary' className='-mt-2'>
                  Movimentações novas detectadas pelo DataJud. Revise e marque como visto.
                </Typography>

                {data.novidades.map(processo => (
                  <div key={processo.id} className='rounded border p-3 flex flex-col gap-2'>
                    <div className='flex items-start justify-between gap-3 flex-wrap'>
                      <div>
                        <Typography className='font-semibold'>
                          {processo.cliente || processo.lead?.autor || processo.numeroProcesso}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {processo.tribunal || '-'} · {processo.numeroProcesso}
                        </Typography>
                      </div>
                      <MarcarVistoButton processoId={processo.id} />
                    </div>
                    <div className='flex flex-col gap-1'>
                      {processo.movimentacoes.map(mov => (
                        <div key={mov.id} className='flex items-start gap-2'>
                          <Chip size='small' color='success' variant='tonal' label='novo' />
                          <Typography variant='body2'>
                            <span className='font-medium'>{formatDate(mov.dataMovimento)}</span> — {mov.descricao}
                          </Typography>
                        </div>
                      ))}
                      {!processo.movimentacoes.length && (
                        <Typography variant='body2' color='text.secondary'>
                          {processo.ultimaMovimentacaoTexto || 'Movimentação registrada'}
                        </Typography>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant='h5' className='font-semibold mbe-4'>
                Processos
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Processo</TableCell>
                      <TableCell>Tribunal</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Ultima consulta</TableCell>
                      <TableCell>Ultima movimentacao</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.processos.map(processo => (
                      <TableRow key={processo.id} hover>
                        <TableCell className='font-medium'>{processo.numeroProcesso}</TableCell>
                        <TableCell>{processo.tribunal || '-'}</TableCell>
                        <TableCell>{processo.cliente || processo.lead?.autor || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={processo.statusConsulta}
                            color={statusColor[processo.statusConsulta] || 'default'}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell>{formatDate(processo.ultimaConsultaAt)}</TableCell>
                        <TableCell>
                          {processo.movimentacoes[0]?.descricao || processo.ultimaMovimentacaoTexto || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data.processos.length && (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          Nenhum processo monitorado importado ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant='h5' className='font-semibold mbe-4'>
                Ultimas rotinas
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Inicio</TableCell>
                      <TableCell>Fim</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align='right'>Consultados</TableCell>
                      <TableCell align='right'>Novas movimentacoes</TableCell>
                      <TableCell align='right'>Erros</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.runs.map(run => (
                      <TableRow key={run.id}>
                        <TableCell>{formatDate(run.startedAt)}</TableCell>
                        <TableCell>{formatDate(run.finishedAt)}</TableCell>
                        <TableCell>{run.status}</TableCell>
                        <TableCell align='right'>{number(run.consultados)}</TableCell>
                        <TableCell align='right'>{number(run.novasMovimentacoes)}</TableCell>
                        <TableCell align='right'>{number(run.erros)}</TableCell>
                      </TableRow>
                    ))}
                    {!data.runs.length && (
                      <TableRow>
                        <TableCell colSpan={6} align='center'>
                          Nenhuma rotina executada ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}
