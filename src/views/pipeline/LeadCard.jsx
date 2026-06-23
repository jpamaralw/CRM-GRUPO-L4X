'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'

import { segmentoFromLead, SEGMENTO_LABEL, SEGMENTOS } from '@/utils/permissions'

const PRIORIDADE_COLOR = {
  ALTA: 'error',
  MEDIA: 'warning',
  BAIXA: 'default'
}

const SEGMENTO_COLOR = SEGMENTOS.reduce((acc, s) => ({ ...acc, [s.key]: s.color }), {})

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
  const segmento = segmentoFromLead(lead)

  return (
    <Card
      className='item-draggable lead-card cursor-grab active:cursor-grabbing'
      onClick={onClick}
      sx={{ '&:hover': { boxShadow: 4 } }}
    >
      <CardContent className='flex flex-col gap-2 p-3'>
        {/* Polo ativo em destaque */}
        <div className='flex items-start justify-between gap-2'>
          <Typography variant='subtitle2' className='font-semibold line-clamp-2' title={lead.autor || lead.reu || ''}>
            {lead.autor || lead.reu || 'Sem nome'}
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

        {/* Especificidade: tribunal + tipo de ativo */}
        <div className='flex items-center gap-1.5 flex-wrap'>
          <Chip
            size='small'
            variant='tonal'
            color={SEGMENTO_COLOR[segmento] || 'default'}
            label={SEGMENTO_LABEL[segmento] || 'Outros'}
          />
          {lead.tribunal && <Chip size='small' variant='outlined' label={lead.tribunal} />}
          {valor && (
            <Typography variant='caption' className='font-semibold' color='success.main'>
              {valor}
            </Typography>
          )}
        </div>

        <Typography variant='caption' color='text.secondary' className='line-clamp-1' title={lead.numeroProcesso}>
          <i className='ri-scales-3-line text-[13px] align-middle' /> {lead.numeroProcesso}
        </Typography>

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
