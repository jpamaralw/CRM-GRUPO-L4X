'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'

import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

const STATUS_COLOR = {
  PENDENTE: '#FDB528',
  CONSULTADO: '#28C76F',
  PROCESSANDO: '#20AFEC',
  ERRO: '#FF4D49',
  SEM_MOVIMENTO: '#6D788D'
}

const colorFor = status => STATUS_COLOR[status] ?? '#0B3DA0'

const fmtDate = d => {
  if (!d) return null

  try {
    return new Date(d).toLocaleDateString('pt-BR')
  } catch {
    return null
  }
}

const ProcessoCard = ({ p, accent }) => (
  <Card className='mbe-3' sx={{ borderInlineStart: `3px solid ${accent}`, boxShadow: 2 }}>
    <div className='flex flex-col gap-1 plb-3 pli-3'>
      <Typography variant='subtitle2' fontWeight={700} sx={{ fontFamily: 'monospace' }} noWrap title={p.numeroProcesso}>
        {p.numeroProcesso}
      </Typography>
      <div className='flex flex-wrap gap-1'>
        {p.tribunal && <Chip label={p.tribunal} size='small' variant='outlined' />}
        {p.status && <Chip label={p.status} size='small' variant='tonal' color='secondary' />}
      </div>
      {p.cliente && (
        <Typography variant='caption' color='text.secondary' noWrap title={p.cliente}>
          <i className='ri-user-line align-middle' /> {p.cliente}
        </Typography>
      )}
      {p.ultimaMovimentacaoTexto && (
        <Typography variant='caption' color='text.secondary' className='leading-tight' title={p.ultimaMovimentacaoTexto}>
          {p.ultimaMovimentacaoTexto.length > 90
            ? `${p.ultimaMovimentacaoTexto.slice(0, 90)}…`
            : p.ultimaMovimentacaoTexto}
        </Typography>
      )}
      {fmtDate(p.ultimaMovimentacaoAt) && (
        <Typography variant='caption' color='text.disabled'>
          Últ. mov.: {fmtDate(p.ultimaMovimentacaoAt)}
        </Typography>
      )}
    </div>
  </Card>
)

const ProcessosBoard = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/processos')
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return items

    return items.filter(p =>
      [p.numeroProcesso, p.tribunal, p.cliente, p.responsavelNome]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    )
  }, [items, search])

  const columns = useMemo(() => {
    const groups = {}

    for (const p of filtered) {
      const key = p.statusConsulta || 'PENDENTE'

      ;(groups[key] ??= []).push(p)
    }

    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  if (loading) return <div className='flex justify-center plb-12'><CircularProgress /></div>
  if (error) return <Alert severity='error'>{error}</Alert>

  if (items.length === 0) {
    return (
      <Alert severity='info'>
        Nenhum processo monitorado ainda. Importe processos para acompanhar movimentações aqui.
      </Alert>
    )
  }

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-wrap items-center gap-3'>
        <Typography variant='body2' color='text.secondary' className='flex-1' style={{ minWidth: 180 }}>
          {filtered.length} processo(s) em monitoramento
        </Typography>
        <div style={{ minWidth: 240 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Buscar nº processo, tribunal, cliente...'
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
        {columns.map(([status, list]) => {
          const color = colorFor(status)

          return (
            <div key={status} className='flex flex-col rounded-lg bg-actionHover' style={{ minWidth: 300, width: 300 }}>
              <div className='flex items-center justify-between gap-2 plb-3 pli-3' style={{ borderBlockEnd: `2px solid ${color}` }}>
                <div className='flex items-center gap-2'>
                  <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
                  <Typography variant='subtitle2' fontWeight={700}>{status}</Typography>
                </div>
                <Chip label={list.length} size='small' sx={{ bgcolor: color, color: '#fff', fontWeight: 700, height: 22 }} />
              </div>
              <div className='flex flex-col plb-3 pli-3 overflow-y-auto' style={{ maxHeight: 'calc(100dvh - 320px)' }}>
                {list.map(p => (
                  <ProcessoCard key={p.id} p={p} accent={color} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProcessosBoard
