'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'

import { segmentoFromLead, SEGMENTO_LABEL, SEGMENTO_ICON, SEGMENTOS, COMPLIANCE_STATUS } from '@/utils/permissions'

const PRIORIDADE_COLOR = {
  ALTA: 'error',
  MEDIA: 'warning',
  BAIXA: 'default'
}

const SEGMENTO_COLOR = SEGMENTOS.reduce((acc, s) => ({ ...acc, [s.key]: s.color }), {})

const PRIORIDADE_ACCENT = {
  ALTA: 'var(--mui-palette-error-main)',
  MEDIA: 'var(--mui-palette-warning-main)',
  BAIXA: 'var(--mui-palette-divider)'
}

const waLink = phone => {
  const d = String(phone || '').replace(/\D/g, '')

  if (d.length < 10) return null

  return `https://wa.me/55${d}`
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
  const segmento = segmentoFromLead(lead)
  const wa = waLink(lead.telefone)

  return (
    <Card
      className='item-draggable lead-card cursor-grab active:cursor-grabbing'
      onClick={onClick}
      sx={{
        borderInlineStart: `3px solid ${PRIORIDADE_ACCENT[lead.prioridade] || 'var(--mui-palette-divider)'}`,
        '&:hover': { boxShadow: 4 }
      }}
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
            icon={<i className={SEGMENTO_ICON[segmento] || 'ri-inbox-line'} />}
            label={SEGMENTO_LABEL[segmento] || 'Outros'}
          />
          {lead.tribunal && <Chip size='small' variant='outlined' label={lead.tribunal} />}
          {lead.complianceStatus && lead.complianceStatus !== 'NAO_AVALIADO' && (
            <Tooltip title={COMPLIANCE_STATUS[lead.complianceStatus]?.label || 'Compliance'}>
              <i
                className={`${COMPLIANCE_STATUS[lead.complianceStatus]?.icon} text-[15px]`}
                style={{ color: `var(--mui-palette-${COMPLIANCE_STATUS[lead.complianceStatus]?.color}-main)` }}
              />
            </Tooltip>
          )}
          {valor && (
            <Typography variant='caption' className='font-semibold' color='success.main'>
              {valor}
            </Typography>
          )}
        </div>

        <Typography variant='caption' color='text.secondary' className='line-clamp-1' title={lead.numeroProcesso}>
          <i className='ri-scales-3-line text-[13px] align-middle' /> {lead.numeroProcesso}
        </Typography>

        <div className='flex items-center justify-between mt-1 gap-2'>
          <div className='flex items-center gap-1.5'>
            {followUp && (
              <Chip size='small' icon={<i className='ri-calendar-line' />} label={followUp} variant='outlined' />
            )}
            {wa && (
              <Tooltip title={`WhatsApp: ${lead.telefone}`}>
                <a
                  href={wa}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={e => e.stopPropagation()}
                  className='flex items-center justify-center rounded-full'
                  style={{ width: 26, height: 26, background: 'rgba(37,211,102,0.14)', color: '#1faa55' }}
                >
                  <i className='ri-whatsapp-line text-[15px]' />
                </a>
              </Tooltip>
            )}
          </div>

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
