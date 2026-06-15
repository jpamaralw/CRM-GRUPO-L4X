'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

import { toast } from 'react-toastify'

import PipelineColumn from './PipelineColumn'
import LeadDrawer from './LeadDrawer'
import NewLeadDialog from './NewLeadDialog'

const PipelineBoard = ({ pipelines, activePipeline, leads, lang }) => {
  const router = useRouter()

  const [leadsState, setLeadsState] = useState(leads)
  const [drawerLeadId, setDrawerLeadId] = useState(null)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [search, setSearch] = useState('')

  const pipelineDef = pipelines.find(pipeline => pipeline.key === activePipeline)

  const visibleLeads = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return leadsState

    return leadsState.filter(lead =>
      [lead.numeroProcesso, lead.autor, lead.reu, lead.telefone, lead.email]
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(term))
    )
  }, [leadsState, search])

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

      <TextField
        size='small'
        placeholder='Buscar por processo, autor, réu, telefone ou e-mail...'
        value={search}
        onChange={event => setSearch(event.target.value)}
        className='max-w-[28rem]'
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
