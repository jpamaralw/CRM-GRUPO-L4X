'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'

const PRIORIDADE_COLOR = {
  ALTA: 'error',
  MEDIA: 'warning',
  BAIXA: 'default'
}

const formatCurrency = value => {
  if (value === null || value === undefined) return null

  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDate = value => {
  if (!value) return null

  return new Date(value).toLocaleDateString('pt-BR')
}

const initials = name => {
  if (!name) return '?'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

const LeadCard = ({ lead, onClick }) => {
  const valor = formatCurrency(lead.valorCausa)
  const followUp = formatDate(lead.nextFollowUpAt)

  return (
    <Card
      className='item-draggable lead-card cursor-grab active:cursor-grabbing'
      onClick={onClick}
      sx={{ '&:hover': { boxShadow: 4 } }}
    >
      <CardContent className='flex flex-col gap-2 p-3'>
        <div className='flex items-center justify-between gap-2'>
          <Typography variant='body2' className='font-medium' noWrap title={lead.numeroProcesso}>
            {lead.numeroProcesso}
          </Typography>
          {lead.prioridade && (
            <Chip
              size='small'
              label={lead.prioridade}
              color={PRIORIDADE_COLOR[lead.prioridade] || 'default'}
              variant='tonal'
            />
          )}
        </div>

        <Typography variant='body2' color='text.secondary' className='line-clamp-2'>
          {lead.autor || lead.reu || '—'}
        </Typography>

        <div className='flex items-center gap-2 flex-wrap'>
          {lead.tribunal && <Chip size='small' variant='outlined' label={lead.tribunal} />}
          {valor && (
            <Typography variant='caption' className='font-semibold' color='success.main'>
              {valor}
            </Typography>
          )}
        </div>

        {lead.fase && (
          <Typography variant='caption' color='text.secondary' className='line-clamp-1'>
            {lead.fase}
          </Typography>
        )}

        <div className='flex items-center justify-between mt-1'>
          {followUp ? (
            <Chip size='small' icon={<i className='ri-calendar-line' />} label={followUp} variant='outlined' />
          ) : (
            <span />
          )}

          {lead.assignedTo && (
            <Tooltip title={lead.assignedTo.name || lead.assignedTo.email}>
              <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{initials(lead.assignedTo.name)}</Avatar>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default LeadCard
