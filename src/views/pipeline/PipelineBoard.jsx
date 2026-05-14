'use client'

import { useEffect, useState, useCallback } from 'react'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import PipelineColumn from './PipelineColumn'

const STAGES = ['PROSPECÇÃO', 'QUALIFICAÇÃO', 'PROPOSTA', 'DUE DILIGENCE', 'FECHADO', 'PERDIDO']

const PipelineBoard = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/pipeline')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setItems(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleMove = useCallback(async (id, newStage) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, stage: newStage } : item))

    try {
      await fetch(`/api/pipeline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      })
    } catch {
      // revert on failure
      setItems(prev => prev.map(item => item.id === id ? { ...item } : item))
    }
  }, [])

  if (loading) return <div className='flex justify-center p-10'><CircularProgress /></div>
  if (error) return <Alert severity='error'>{error}</Alert>

  return (
    <div>
      <Typography variant='h4' fontWeight={700} color='primary' mb={1}>
        Pipeline — Ativos Judiciais
      </Typography>
      <Typography variant='body2' color='text.secondary' mb={4}>
        Precatórios · RPVs · Sentenças | L4 Ativos
      </Typography>

      <div className='flex gap-5 overflow-x-auto pb-6'>
        {STAGES.map(stage => (
          <PipelineColumn
            key={stage}
            stage={stage}
            items={items.filter(i => i.stage === stage)}
            onMove={handleMove}
          />
        ))}
      </div>
    </div>
  )
}

export default PipelineBoard
