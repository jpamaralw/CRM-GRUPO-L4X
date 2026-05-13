'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

const TIPO_COLOR = { PRECATORIO: 'primary', RPV: 'info', SENTENCA: 'warning' }

const LeadCard = ({ item }) => {
  return (
    <Card
      className='item-draggable cursor-grab active:cursor-grabbing mb-3'
      sx={{ minWidth: 240, maxWidth: 280 }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        <Typography variant='subtitle2' fontWeight={700} noWrap title={item.lead?.nome}>
          {item.lead?.nome ?? 'Lead sem nome'}
        </Typography>
        <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
          {item.lead?.cnpj}
        </Typography>

        <div className='flex flex-wrap gap-1 mt-2'>
          {item.tipo && (
            <Chip label={item.tipo} size='small' color={TIPO_COLOR[item.tipo] ?? 'default'} variant='tonal' />
          )}
          {item.tribunal && (
            <Chip label={item.tribunal} size='small' variant='outlined' />
          )}
        </div>

        {item.valorCausa && (
          <Typography variant='body2' fontWeight={700} color='success.main' mt={1}>
            {item.valorCausa}
          </Typography>
        )}

        {item.fase && (
          <Typography variant='caption' color='text.secondary' display='block' mt={0.5} noWrap>
            {item.fase}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default LeadCard
