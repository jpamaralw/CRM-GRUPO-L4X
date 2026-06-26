'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Chip from '@mui/material/Chip'

import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import { toast } from 'react-toastify'

import PipelineColumn from './PipelineColumn'
import LeadDrawer from './LeadDrawer'
import NewLeadDialog from './NewLeadDialog'
import { segmentoFromLead, SEGMENTO_LABEL } from '@/utils/permissions'

const PipelineBoard = ({ pipelines, activePipeline, leads, lang }) => {
  const router = useRouter()

  const [leadsState, setLeadsState] = useState(leads)
  const [drawerLeadId, setDrawerLeadId] = useState(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [segmento, setSegmento] = useState('TODOS')
  const [prioridade, setPrioridade] = useState('TODAS')
  const [responsavel, setResponsavel] = useState('TODOS')
  const [valorMin, setValorMin] = useState('')

  const pipelineDef = pipelines.find(pipeline => pipeline.key === activePipeline)

  // Segmentos presentes nos leads desta pipeline (Precatório / RPV / Tributário / Despejo...)
  const segmentosDisponiveis = useMemo(() => {
    const counts = {}

    leadsState.forEach(lead => {
      const seg = segmentoFromLead(lead)

      counts[seg] = (counts[seg] || 0) + 1
    })

    return Object.entries(counts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
  }, [leadsState])

  // Extrair usuários únicos para filtro responsável
  const usuariosDisponiveis = useMemo(() => {
    const users = new Map()

    leadsState.forEach(lead => {
      if (lead.assignedTo) {
        users.set(lead.assignedTo.id, lead.assignedTo)
      }
    })

    return Array.from(users.values()).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
  }, [leadsState])

  const visibleLeads = useMemo(() => {
    const term = search.trim().toLowerCase()

    return leadsState.filter(lead => {
      if (segmento !== 'TODOS' && segmentoFromLead(lead) !== segmento) return false
      if (prioridade !== 'TODAS' && lead.prioridade !== prioridade) return false
      if (responsavel !== 'TODOS' && lead.assignedTo?.id !== responsavel) return false
      if (valorMin && (lead.valorCausa || 0) < Number(valorMin)) return false

      if (!term) return true

      return [lead.numeroProcesso, lead.autor, lead.reu, lead.telefone, lead.email]
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(term))
    })
  }, [leadsState, search, segmento, prioridade, responsavel, valorMin])

  const columns = useMemo(() => {
    const grouped = {}

    pipelineDef?.statuses.forEach(status => {
      grouped[status.key] = []
    })

    visibleLeads.forEach(lead => {
      if (grouped[lead.statusCrm]) grouped[lead.statusCrm].push(lead)
    })

    return grouped
  }, [visibleLeads, pipelineDef])

  const handleTabChange = (event, value) => {
    router.push(`/${lang}/pipeline?pipeline=${value}`)
  }

  const handleStatusChange = async (leadId, newStatus) => {
    const previous = leadsState

    setLeadsState(prev => prev.map(lead => (lead.id === leadId ? { ...lead, statusCrm: newStatus } : lead)))

    try {
      const res = await fetch(`/api/pipeline/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCrm: newStatus })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar status')

      setLeadsState(prev => {
        if (data.lead.pipeline !== activePipeline) {
          return prev.filter(lead => lead.id !== leadId)
        }

        return prev.map(lead => (lead.id === leadId ? { ...lead, ...data.lead } : lead))
      })

      toast.success('Lead atualizado')
    } catch (err) {
      setLeadsState(previous)
      toast.error(err.message)
    }
  }

  const handleLeadUpdated = updatedLead => {
    setLeadsState(prev => {
      if (updatedLead.pipeline !== activePipeline) {
        return prev.filter(lead => lead.id !== updatedLead.id)
      }

      return prev.map(lead => (lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead))
    })
  }

  if (!pipelineDef) return null

  const handleLeadCreated = lead => {
    if (lead.pipeline === activePipeline) {
      setLeadsState(prev => [lead, ...prev])
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <Typography variant='h4'>{pipelineDef.label}</Typography>
        <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={() => setNewLeadOpen(true)}>
          Novo Lead
        </Button>
      </div>

      {pipelines.length > 1 && (
        <Tabs value={activePipeline} onChange={handleTabChange}>
          {pipelines.map(pipeline => (
            <Tab key={pipeline.key} value={pipeline.key} label={pipeline.label} icon={<i className={pipeline.icon} />} iconPosition='start' />
          ))}
        </Tabs>
      )}

      <div className='flex gap-3 flex-wrap items-end'>
        <TextField
          size='small'
          placeholder='Buscar por processo, autor, réu, telefone ou e-mail...'
          value={search}
          onChange={event => setSearch(event.target.value)}
          className='flex-1 min-w-[240px]'
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

        <FormControl size='small' className='min-w-[140px]'>
          <InputLabel id='priority-label'>Prioridade</InputLabel>
          <Select labelId='priority-label' label='Prioridade' value={prioridade} onChange={e => setPrioridade(e.target.value)}>
            <MenuItem value='TODAS'>Todas</MenuItem>
            <MenuItem value='ALTA'>Alta</MenuItem>
            <MenuItem value='MEDIA'>Média</MenuItem>
            <MenuItem value='BAIXA'>Baixa</MenuItem>
          </Select>
        </FormControl>

        {usuariosDisponiveis.length > 0 && (
          <FormControl size='small' className='min-w-[140px]'>
            <InputLabel id='assignee-label'>Responsável</InputLabel>
            <Select labelId='assignee-label' label='Responsável' value={responsavel} onChange={e => setResponsavel(e.target.value)}>
              <MenuItem value='TODOS'>Todos</MenuItem>
              {usuariosDisponiveis.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          size='small'
          type='number'
          placeholder='Valor mín. (R$)'
          value={valorMin}
          onChange={e => setValorMin(e.target.value)}
          className='min-w-[120px]'
          slotProps={{
            input: {
              startAdornment: <InputAdornment position='start'>R$</InputAdornment>
            }
          }}
        />

        {(search || segmento !== 'TODOS' || prioridade !== 'TODAS' || responsavel !== 'TODOS' || valorMin) && (
          <Button
            size='small'
            variant='text'
            onClick={() => {
              setSearch('')
              setSegmento('TODOS')
              setPrioridade('TODAS')
              setResponsavel('TODOS')
              setValorMin('')
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {segmentosDisponiveis.length > 1 && (
        <div className='flex items-center gap-2 flex-wrap'>
          <Typography variant='body2' color='text.secondary' className='mie-1'>
            Ativo:
          </Typography>
          <Chip
            label={`Todos (${leadsState.length})`}
            size='small'
            color={segmento === 'TODOS' ? 'primary' : 'default'}
            variant={segmento === 'TODOS' ? 'filled' : 'outlined'}
            onClick={() => setSegmento('TODOS')}
          />
          {segmentosDisponiveis.map(({ key, count }) => (
            <Chip
              key={key}
              label={`${SEGMENTO_LABEL[key] || key} (${count})`}
              size='small'
              color={segmento === key ? 'primary' : 'default'}
              variant={segmento === key ? 'filled' : 'outlined'}
              onClick={() => setSegmento(key)}
            />
          ))}
        </div>
      )}

      <div className='flex gap-4 overflow-x-auto pb-4'>
        {pipelineDef.statuses.map(status => (
          <PipelineColumn
            key={status.key}
            status={status}
            leads={columns[status.key] || []}
            onStatusChange={handleStatusChange}
            onCardClick={setDrawerLeadId}
          />
        ))}
      </div>

      <LeadDrawer leadId={drawerLeadId} onClose={() => setDrawerLeadId(null)} onUpdated={handleLeadUpdated} />
      <NewLeadDialog open={newLeadOpen} onClose={() => setNewLeadOpen(false)} onCreated={handleLeadCreated} />
    </div>
  )
}

export default PipelineBoard
