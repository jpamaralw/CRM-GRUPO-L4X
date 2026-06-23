import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { canViewAcompanhamento } from '@/utils/permissions'

const fmtDate = v => (v ? new Date(v).toLocaleDateString('pt-BR') : '-')

const MovimentacoesRecentes = async () => {
  const user = await requireCurrentUser()

  if (!user || !canViewAcompanhamento(user.role)) return null

  const movs = await prisma.movimentacaoMonitorada.findMany({
    orderBy: { dataMovimento: 'desc' },
    take: 8,
    include: { processoMonitorado: { select: { numeroProcesso: true, cliente: true, tribunal: true } } }
  })

  return (
    <Card className='bs-full'>
      <CardHeader
        title='Movimentações recentes'
        subheader='Atualizações processuais via DataJud (CNJ)'
        action={<Chip size='small' color='primary' variant='tonal' label='DataJud' />}
      />
      <CardContent className='flex flex-col gap-4'>
        {movs.map(m => (
          <div key={m.id} className='flex items-start gap-3'>
            <span
              className='flex items-center justify-center rounded-lg shrink-0 mt-0.5'
              style={{ width: 34, height: 34, background: 'var(--mui-palette-primary-lightOpacity)' }}
            >
              <i className='ri-scales-3-line text-[18px]' style={{ color: 'var(--mui-palette-primary-main)' }} />
            </span>
            <div className='min-w-0 flex-1'>
              <Typography variant='body2' className='font-medium line-clamp-1'>
                {m.descricao}
              </Typography>
              <Typography variant='caption' color='text.secondary' className='line-clamp-1'>
                {m.processoMonitorado?.cliente || m.processoMonitorado?.numeroProcesso}
                {m.processoMonitorado?.tribunal ? ` · ${m.processoMonitorado.tribunal}` : ''} · {fmtDate(m.dataMovimento)}
              </Typography>
            </div>
            {m.nova && <Chip size='small' color='success' variant='tonal' label='Nova' className='shrink-0' />}
          </div>
        ))}
        {!movs.length && (
          <Typography color='text.secondary' className='text-center py-4'>
            Nenhuma movimentação registrada ainda. Rode a consulta no Acompanhamento Processual.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default MovimentacoesRecentes
