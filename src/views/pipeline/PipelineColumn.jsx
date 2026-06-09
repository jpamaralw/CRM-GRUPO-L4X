'use client'

import { useEffect } from 'react'

import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import LeadCard from './LeadCard'
import { parseValor, formatBRLCompact } from './utils'

const PipelineColumn = ({ stage, color, items, onMove }) => {
  const [listRef, cards, setCards] = useDragAndDrop(items, {
    group: 'pipeline',
    plugins: [animations()],
    draggable: el => el.classList.contains('item-draggable'),
    onDragend: async ({ draggedNode }) => {
      const id = draggedNode.dataset.id

      if (id) await onMove(id, stage)
    }
  })

  useEffect(() => {
    setCards(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const total = cards.reduce((sum, i) => sum + parseValor(i.valorCausa), 0)

  return (
    <div className='flex flex-col rounded-lg bg-actionHover' style={{ minWidth: 286, width: 286 }}>
      <div className='flex flex-col gap-1 plb-3 pli-3 rounded-t-lg' style={{ borderBlockEnd: `2px solid ${color}` }}>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2 min-is-0'>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, flexShrink: 0 }} />
            <Typography variant='subtitle2' fontWeight={700} noWrap title={stage}>
              {stage}
            </Typography>
          </div>
          <Chip label={cards.length} size='small' sx={{ bgcolor: color, color: '#fff', fontWeight: 700, height: 22 }} />
        </div>
        {total > 0 && (
          <Typography variant='caption' color='text.secondary'>
            {formatBRLCompact(total)}
          </Typography>
        )}
      </div>

      <div
        ref={listRef}
        className='flex flex-col plb-3 pli-3 overflow-y-auto'
        style={{ minHeight: 80, maxHeight: 'calc(100dvh - 320px)' }}
      >
        {cards.map(item => (
          <div key={item.id} data-id={item.id}>
            <LeadCard item={item} accent={color} />
          </div>
        ))}
        {cards.length === 0 && (
          <Typography variant='caption' color='text.disabled' className='text-center plb-6'>
            Arraste cards para cá
          </Typography>
        )}
      </div>
    </div>
  )
}

export default PipelineColumn
