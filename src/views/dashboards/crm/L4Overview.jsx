import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { getLeadVisibilityWhere } from '@/utils/permissions'

const fmt = n => Number(n || 0).toLocaleString('pt-BR')

const fmtBRL = n =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const GRUPO_LABEL = {
  RPV_TJGO: 'RPV / Precatórios (TJGO)',
  DESPEJO_TJGO: 'Despejo (TJGO)',
  EXEC_FISCAL_TRF1: 'Execução Fiscal (TRF1)'
}

const GRUPO_COLOR = {
  RPV_TJGO: 'var(--mui-palette-primary-main)',
  DESPEJO_TJGO: 'var(--mui-palette-success-main)',
  EXEC_FISCAL_TRF1: 'var(--mui-palette-warning-main)'
}

const L4Overview = async () => {
  const user = await requireCurrentUser()

  if (!user) return null

  const where = getLeadVisibilityWhere(user.role)

  const [porGrupo, valorAgg] = await Promise.all([
    prisma.lead.groupBy({ by: ['grupo'], where, _count: { _all: true }, _sum: { valorCausa: true } }),
    prisma.lead.aggregate({ where, _sum: { valorCausa: true } })
  ])

  const total = porGrupo.reduce((acc, g) => acc + g._count._all, 0)
  const ordered = [...porGrupo].sort((a, b) => b._count._all - a._count._all)

  return (
    <Card className='bs-full'>
      <CardHeader
        title='Carteira de Leads por Segmento'
        subheader={`${fmt(total)} leads · ${fmtBRL(valorAgg._sum.valorCausa)} em causas`}
      />
      <CardContent className='flex flex-col gap-5'>
        {ordered.map(g => {
          const pct = total ? Math.round((g._count._all / total) * 100) : 0
          const key = g.grupo || 'OUTROS'

          return (
            <div key={key} className='flex flex-col gap-1'>
              <div className='flex items-center justify-between'>
                <Typography variant='body2' className='font-medium'>
                  {GRUPO_LABEL[key] || key}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {fmt(g._count._all)} · {fmtBRL(g._sum.valorCausa)}
                </Typography>
              </div>
              <Box className='flex items-center gap-2'>
                <LinearProgress
                  variant='determinate'
                  value={pct}
                  className='is-full'
                  sx={{
                    height: 8,
                    borderRadius: 8,
                    '& .MuiLinearProgress-bar': { backgroundColor: GRUPO_COLOR[key] || 'var(--mui-palette-secondary-main)' }
                  }}
                />
                <Typography variant='caption' color='text.secondary' className='min-is-[34px] text-right'>
                  {pct}%
                </Typography>
              </Box>
            </div>
          )
        })}
        {!ordered.length && (
          <Typography color='text.secondary' className='text-center'>
            Nenhum lead na sua carteira ainda.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default L4Overview
