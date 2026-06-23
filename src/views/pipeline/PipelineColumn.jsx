'use client'

import { useEffect, useRef, useMemo } from 'react'

import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import LeadCard from './LeadCard'

const COLOR_VAR = {
  info: 'var(--mui-palette-info-main)',
  success: 'var(--mui-palette-success-main)',
  warning: 'var(--mui-palette-warning-main)',
  error: 'var(--mui-palette-error-main)',
  primary: 'var(--mui-palette-primary-main)',
  secondary: 'var(--mui-palette-secondary-main)',
  default: 'var(--mui-palette-divider)'
}

const compactBRL = value =>
  value
    ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
    : null

const PipelineColumn = ({ status, leads, onStatusChange, onCardClick }) => {
  const [listRef, list, setList] = useDragAndDrop(leads, {
    group: 'pipeline-leads',
    plugins: [animations()],
    draggable: el => el.classList.contains('item-draggable')
  })

  const prevIdsRef = useRef(leads.map(lead => lead.id))

  const totalValor = useMemo(() => leads.reduce((acc, l) => acc + (l.valorCausa || 0), 0), [leads])

  useEffect(() => {
    const incomingIds = leads.map(lead => lead.id)
    const currentIds = list.map(lead => lead?.id).filter(Boolean)

    if (incomingIds.join(',') !== currentIds.join(',')) {
      setList(leads)
      prevIdsRef.current = incomingIds
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads])

  useEffect(() => {
    const currentIds = list.map(lead => lead?.id).filter(Boolean)
    const addedIds = currentIds.filter(id => !prevIdsRef.current.includes(id))

    addedIds.forEach(id => {
      const lead = list.find(item => item?.id === id)

      if (lead && lead.statusCrm !== status.key) {
        onStatusChange(id, status.key)
      }
    })

    prevIdsRef.current = currentIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list])

  const accent = COLOR_VAR[status.color] || COLOR_VAR.default

  return (
    <div className='flex flex-col is-[19rem] min-is-[19rem] shrink-0'>
      <div className='rounded-t-lg' style={{ height: 3, background: accent }} />
      <div className='flex items-center justify-between gap-2 px-2 py-2 bg-actionHover'>
        <div className='flex items-center gap-2 min-w-0'>
          <Typography variant='subtitle1' className='font-semibold truncate'>
            {status.label}
          </Typography>
          <Chip size='small' color={status.color} label={list.length} className='font-medium' />
        </div>
        {totalValor > 0 && (
          <Typography variant='caption' color='text.secondary' className='shrink-0 font-medium'>
            {compactBRL(totalValor)}
          </Typography>
        )}
      </div>
      <div ref={listRef} className='flex flex-col gap-2.5 min-h-[6rem] bg-actionHover rounded-b-lg p-2 grow'>
        {list.map(lead => lead && <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead.id)} />)}
        {!list.length && (
          <div className='flex items-center justify-center grow py-8 text-center'>
            <Typography variant='caption' color='text.disabled'>
              Arraste leads para cá
            </Typography>
          </div>
        )}
      </div>
    </div>
  )
}

export default PipelineColumn
