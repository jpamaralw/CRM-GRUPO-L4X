'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Card from '@mui/material/Card'

import PipelineColumn from './PipelineColumn'
import { STAGES, parseValor, formatBRLCompact } from './utils'

const KpiCard = ({ label, value, icon, color }) => (
  <Card className='flex items-center gap-3 plb-3 pli-4 flex-1' sx={{ minWidth: 160, boxShadow: 2 }}>
    <span
      className='flex items-center justify-center rounded'
      style={{ width: 40, height: 40, backgroundColor: `${color}1A`, color }}
    >
      <i className={`${icon} text-xl`} />
    </span>
    <div className='min-is-0'>
      <Typography variant='h6' fontWeight={800} noWrap>
        {value}
      </Typography>
      <Typography variant='caption' color='text.secondary' noWrap>
        {label}
      </Typography>
    </div>
  </Card>
)

const AtivosBoard = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/pipeline')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setItems(Array.isArray(data) ? data : [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleMove = useCallback(async (id, newStage) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, stage: newStage } : item)))

    try {
      await fetch(`/api/pipeline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      })
    } catch {
      load()
    }
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return items

    return items.filter(i =>
      [i.lead?.nome, i.lead?.cnpj, i.tribunal, i.tipo, i.responsavel?.name, i.fase]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    )
  }, [items, search])

  const kpis = useMemo(() => {
    const totalValue = filtered.reduce((s, i) => s + parseValor(i.valorCausa), 0)

    const fechadoValue = filtered
      .filter(i => i.stage === 'FECHADO')
      .reduce((s, i) => s + parseValor(i.valorCausa), 0)

    return { count: filtered.length, totalValue, fechadoValue }
  }, [filtered])

  if (loading) return <div className='flex justify-center plb-12'><CircularProgress /></div>
  if (error) return <Alert severity='error'>{error}</Alert>

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-wrap items-stretch gap-3'>
        <KpiCard label='Ativos no pipeline' value={kpis.count} icon='ri-stack-line' color='#0B3DA0' />
        <KpiCard label='Valor total em causa' value={formatBRLCompact(kpis.totalValue)} icon='ri-money-dollar-circle-line' color='#28C76F' />
        <KpiCard label='Valor fechado' value={formatBRLCompact(kpis.fechadoValue)} icon='ri-trophy-line' color='#FDB528' />
        <div className='flex items-center flex-1' style={{ minWidth: 220 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Buscar por nome, CNPJ, tribunal, responsável...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                )
              }
            }}
          />
        </div>
      </div>

      <div className='flex gap-4 overflow-x-auto pbe-4'>
        {STAGES.map(({ key, color }) => (
          <PipelineColumn
            key={key}
            stage={key}
            color={color}
            items={filtered.filter(i => i.stage === key)}
            onMove={handleMove}
          />
        ))}
      </div>
    </div>
  )
}

export default AtivosBoard
