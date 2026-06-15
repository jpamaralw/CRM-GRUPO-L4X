'use client'

import { useEffect, useRef } from 'react'

import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import LeadCard from './LeadCard'

const PipelineColumn = ({ status, leads, onStatusChange, onCardClick }) => {
  const [listRef, list, setList] = useDragAndDrop(leads, {
    group: 'pipeline-leads',
    plugins: [animations()],
    draggable: el => el.classList.contains('item-draggable')
  })

  const prevIdsRef = useRef(leads.map(lead => lead.id))

  // Sync when leads change from outside (status update confirmed, drawer edit, etc.)
  useEffect(() => {
    const incomingIds = leads.map(lead => lead.id)
    const currentIds = list.map(lead => lead?.id).filter(Boolean)

    if (incomingIds.join(',') !== currentIds.join(',')) {
      setList(leads)
      prevIdsRef.current = incomingIds
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads])

  // Detect cards dropped into this column and notify parent
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

  return (
    <div className='flex flex-col is-[18rem] min-is-[18rem] shrink-0'>
      <div className='flex items-center justify-between mbe-3'>
        <Typography variant='h6'>{status.label}</Typography>
        <Chip size='small' color={status.color} label={list.length} />
      </div>
      <div ref={listRef} className='flex flex-col gap-3 min-h-[6rem] bg-actionHover rounded p-2 grow'>
        {list.map(
          lead => lead && <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead.id)} />
        )}
      </div>
    </div>
  )
}

export default PipelineColumn
