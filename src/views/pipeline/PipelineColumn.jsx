'use client'

import { useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import LeadCard from './LeadCard'

const PipelineColumn = ({ stage, items, onMove }) => {
  const [listRef, tasksList, setTasksList] = useDragAndDrop(items, {
    group: 'pipeline',
    plugins: [animations()],
    draggable: el => el.classList.contains('item-draggable'),
    onDragend: async ({ draggedNode }) => {
      const id = draggedNode.dataset.id
      const newStage = stage

      if (id) await onMove(id, newStage)
    }
  })

  useEffect(() => {
    setTasksList(items)
  }, [items])

  return (
    <div className='flex flex-col' style={{ minWidth: 272 }}>
      <div className='flex items-center gap-2 mb-4 px-1'>
        <Typography variant='h6' fontWeight={700} noWrap>
          {stage}
        </Typography>
        <Badge badgeContent={tasksList.length} color='primary' />
      </div>
      <div ref={listRef} className='flex flex-col min-h-[80px]'>
        {tasksList.map(item => (
          <div key={item.id} data-id={item.id}>
            <LeadCard item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PipelineColumn
