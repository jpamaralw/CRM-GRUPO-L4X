import { redirect } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { getLeadVisibilityWhere, PIPELINES } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const fmt = n => Number(n || 0).toLocaleString('pt-BR')

const STATUS_LABEL = Object.values(PIPELINES)
  .flatMap(p => p.statuses)
  .reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {})

export default async function ResultadosPage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user) redirect(`/${params.lang}/login`)

  const where = getLeadVisibilityWhere(user.role)

  const [porPipeline, porStatus, porResp, fechados, perdidos, porRespFechado] = await Promise.all([
    prisma.lead.groupBy({ by: ['pipeline'], where, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['statusCrm'], where, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ['assignedToId'], where: { ...where, assignedToId: { not: null } }, _count: { _all: true } }),
    prisma.lead.count({ where: { ...where, statusCrm: 'FECHADO' } }),
    prisma.lead.count({ where: { ...where, statusCrm: 'PERDIDO' } }),
    prisma.lead.groupBy({
      by: ['assignedToId'],
      where: { ...where, assignedToId: { not: null }, statusCrm: 'FECHADO' },
      _count: { _all: true },
      _sum: { valorCausa: true }
    })
  ])

  const usuarios = await prisma.user.findMany({
    where: { id: { in: porResp.map(r => r.assignedToId).filter(Boolean) } },
    select: { id: true, name: true, email: true }
  })

  const userMap = Object.fromEntries(usuarios.map(u => [u.id, u.name || u.email]))

  const pipelineCount = key => porPipeline.find(p => p.pipeline === key)?._count._all || 0
  const totalFechamentos = fechados + perdidos
  const taxaConversao = totalFechamentos ? Math.round((fechados / totalFechamentos) * 100) : 0

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          Resultados
        </Typography>
        <Typography color='text.secondary'>Funil comercial e desempenho da equipe</Typography>
      </div>

      <Grid container spacing={6}>
        {Object.values(PIPELINES).map(p => (
          <Grid key={p.key} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color='text.secondary'>{p.label}</Typography>
                <Typography variant='h3' className='font-semibold'>
                  {fmt(pipelineCount(p.key))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color='text.secondary'>Taxa de conversão</Typography>
              <Typography variant='h3' className='font-semibold' color='success.main'>
                {taxaConversao}%
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {fmt(fechados)} fechados · {fmt(perdidos)} perdidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className='bs-full'>
            <CardHeader title='Leads por etapa' />
            <CardContent>
              <Table size='small'>
                <TableBody>
                  {porStatus
                    .sort((a, b) => b._count._all - a._count._all)
                    .map(s => (
                      <TableRow key={s.statusCrm}>
                        <TableCell>{STATUS_LABEL[s.statusCrm] || s.statusCrm}</TableCell>
                        <TableCell align='right' className='font-medium'>
                          {fmt(s._count._all)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className='bs-full'>
            <CardHeader title='Performance por responsável' />
            <CardContent>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Responsável</TableCell>
                    <TableCell align='right'>Carteira</TableCell>
                    <TableCell align='right'>Fechados</TableCell>
                    <TableCell align='right'>Taxa</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {porResp
                    .sort((a, b) => b._count._all - a._count._all)
                    .map(r => {
                      const fechado = porRespFechado.find(f => f.assignedToId === r.assignedToId)
                      const taxa = r._count._all > 0 ? Math.round(((fechado?._count._all || 0) / r._count._all) * 100) : 0

                      return (
                        <TableRow key={r.assignedToId}>
                          <TableCell>{userMap[r.assignedToId] || '—'}</TableCell>
                          <TableCell align='right'>{fmt(r._count._all)}</TableCell>
                          <TableCell align='right' className='font-medium'>
                            {fmt(fechado?._count._all || 0)}
                          </TableCell>
                          <TableCell align='right'>
                            <Chip
                              size='small'
                              label={`${taxa}%`}
                              color={taxa >= 30 ? 'success' : taxa >= 15 ? 'warning' : 'default'}
                              variant='tonal'
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  {!porResp.length && (
                    <TableRow>
                      <TableCell colSpan={4} align='center'>
                        <Chip size='small' label='Nenhum lead atribuído ainda' variant='outlined' />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}
