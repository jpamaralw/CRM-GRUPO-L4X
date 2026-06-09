'use client'

import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { parseValor, formatBRL, initials } from './utils'

const tipoColor = tipo => {
  const t = (tipo || '').toLowerCase()

  if (t.includes('alto valor')) return 'error'
  if (t.includes('maturado')) return 'warning'
  if (t.includes('execução') || t.includes('execucao')) return 'primary'
  if (t.includes('sentença') || t.includes('sentenca')) return 'info'

  return 'secondary'
}

const LeadCard = ({ item, accent }) => {
  const valor = parseValor(item.valorCausa)

  return (
    <Card
      className='item-draggable cursor-grab active:cursor-grabbing mbe-3'
      sx={{
        borderInlineStart: `3px solid ${accent}`,
        boxShadow: 2,
        transition: 'box-shadow .2s ease, transform .2s ease',
        '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
      }}
    >
      <div className='flex flex-col gap-2 plb-3 pli-3'>
        <div className='flex items-start justify-between gap-2'>
          <Typography variant='subtitle2' fontWeight={700} className='leading-tight' title={item.lead?.nome}>
            {item.lead?.nome ?? 'Lead sem nome'}
          </Typography>
          {item.linkProcesso && (
            <Tooltip title='Abrir processo'>
              <a
                href={item.linkProcesso}
                target='_blank'
                rel='noopener noreferrer'
                onClick={e => e.stopPropagation()}
                className='text-textSecondary hover:text-primary'
              >
                <i className='ri-external-link-line text-base' />
              </a>
            </Tooltip>
          )}
        </div>

        {item.lead?.cnpj && (
          <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
            {item.lead.cnpj}
          </Typography>
        )}

        <div className='flex flex-wrap gap-1'>
          {item.tipo && <Chip label={item.tipo} size='small' color={tipoColor(item.tipo)} variant='tonal' />}
          {item.tribunal && <Chip label={item.tribunal} size='small' variant='outlined' />}
        </div>

        {valor > 0 && (
          <Typography variant='body2' fontWeight={700} sx={{ color: 'success.main' }}>
            {formatBRL(valor)}
          </Typography>
        )}

        {item.fase && (
          <Typography variant='caption' color='text.secondary' className='block leading-tight' title={item.fase}>
            {item.fase}
          </Typography>
        )}

        <div className='flex items-center gap-2 mbs-1'>
          {item.responsavel?.name ? (
            <>
              <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: accent }}>
                {initials(item.responsavel.name)}
              </Avatar>
              <Typography variant='caption' color='text.secondary' noWrap>
                {item.responsavel.name}
              </Typography>
            </>
          ) : (
            <Typography variant='caption' color='text.disabled'>
              Não atribuído
            </Typography>
          )}
        </div>
      </div>
    </Card>
  )
}

export default LeadCard
