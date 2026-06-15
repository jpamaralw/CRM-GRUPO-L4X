'use client'

import { useEffect, useState } from 'react'

import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

import { toast } from 'react-toastify'

import { PIPELINES, VALID_TRANSITIONS } from '@/utils/permissions'

const ALL_STATUSES = Object.values(PIPELINES)
  .flatMap(pipeline => pipeline.statuses)
  .reduce((acc, status) => {
    acc[status.key] = status

    return acc
  }, {})

const formatCurrency = value => {
  if (value === null || value === undefined) return '—'

  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDate = value => {
  if (!value) return '—'

  return new Date(value).toLocaleString('pt-BR')
}

const InfoRow = ({ label, value }) => (
  <div className='flex justify-between gap-4'>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='body2' className='text-right'>
      {value ?? '—'}
    </Typography>
  </div>
)

const LeadDrawer = ({ leadId, onClose, onUpdated }) => {
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [teamUsers, setTeamUsers] = useState(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (!leadId) {
      setLead(null)
      setNote('')

      return
    }

    setLoading(true)

    fetch(`/api/pipeline/leads/${leadId}`)
      .then(res => res.json())
      .then(data => {
        if (data.lead) setLead(data.lead)
        else toast.error(data.error || 'Erro ao carregar lead')
      })
      .catch(() => toast.error('Erro ao carregar lead'))
      .finally(() => setLoading(false))

    fetch('/api/team/users')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setTeamUsers(data?.users || []))
      .catch(() => setTeamUsers([]))
  }, [leadId])

  const handleStatusChange = async event => {
    const newStatus = event.target.value

    setUpdating(true)

    try {
      const res = await fetch(`/api/pipeline/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCrm: newStatus })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar status')

      setLead(prev => ({ ...prev, ...data.lead }))
      onUpdated?.(data.lead)
      toast.success('Status atualizado')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async event => {
    const newAssigneeId = event.target.value || null

    setUpdating(true)

    try {
      const res = await fetch(`/api/pipeline/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: newAssigneeId })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao atribuir responsável')

      setLead(prev => ({ ...prev, ...data.lead }))
      onUpdated?.(data.lead)
      toast.success('Responsável atualizado')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleAddNote = async () => {
    if (!note.trim()) return

    setSavingNote(true)

    try {
      const res = await fetch(`/api/pipeline/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: note.trim() })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao salvar nota')

      setLead(prev => ({ ...prev, activities: [data.activity, ...(prev.activities || [])] }))
      setNote('')
      toast.success('Nota adicionada')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingNote(false)
    }
  }

  const open = Boolean(leadId)
  const currentStatus = lead?.statusCrm
  const nextOptions = currentStatus ? VALID_TRANSITIONS[currentStatus] || [] : []

  return (
    <Drawer anchor='right' open={open} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 420 } } }}>
      <div className='flex items-center justify-between p-4'>
        <Typography variant='h5'>Detalhes do Lead</Typography>
        <IconButton onClick={onClose}>
          <i className='ri-close-line' />
        </IconButton>
      </div>
      <Divider />

      {loading && (
        <Box className='flex items-center justify-center p-8'>
          <CircularProgress />
        </Box>
      )}

      {!loading && lead && (
        <div className='flex flex-col gap-4 p-4 overflow-y-auto'>
          <div>
            <Typography variant='h6'>{lead.numeroProcesso}</Typography>
            <div className='flex items-center gap-2 mt-1 flex-wrap'>
              {lead.tribunal && <Chip size='small' variant='outlined' label={lead.tribunal} />}
              {lead.prioridade && <Chip size='small' label={lead.prioridade} color='warning' variant='tonal' />}
              {lead.score != null && <Chip size='small' label={`Score: ${lead.score}`} />}
            </div>
          </div>

          <FormControl size='small' fullWidth disabled={updating}>
            <InputLabel id='status-label'>Status</InputLabel>
            <Select labelId='status-label' label='Status' value={currentStatus || ''} onChange={handleStatusChange}>
              <MenuItem value={currentStatus}>
                {ALL_STATUSES[currentStatus]?.label || currentStatus} (atual)
              </MenuItem>
              {nextOptions.map(key => (
                <MenuItem key={key} value={key}>
                  {ALL_STATUSES[key]?.label || key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className='flex flex-col gap-2'>
            <Typography variant='subtitle2'>Partes</Typography>
            <InfoRow label='Autor' value={lead.autor} />
            <InfoRow label='Réu' value={lead.reu} />
            <InfoRow label='Advogado' value={lead.advogado} />
            <InfoRow label='CNPJ' value={lead.cnpj} />
            <InfoRow label='CPF' value={lead.cpf} />
          </div>

          <Divider />

          <div className='flex flex-col gap-2'>
            <Typography variant='subtitle2'>Processo</Typography>
            <InfoRow label='Valor da causa' value={formatCurrency(lead.valorCausa)} />
            <InfoRow label='Fase' value={lead.fase} />
            <InfoRow label='Ajuizamento' value={formatDate(lead.dataAjuizamento)} />
            <InfoRow label='Origem' value={lead.origem} />
            {lead.linkProcesso && (
              <a href={lead.linkProcesso} target='_blank' rel='noreferrer' className='text-primary text-sm'>
                Ver processo <i className='ri-external-link-line' />
              </a>
            )}
          </div>

          <Divider />

          <div className='flex flex-col gap-2'>
            <Typography variant='subtitle2'>Contato</Typography>
            <InfoRow label='Telefone' value={lead.telefone} />
            <InfoRow label='E-mail' value={lead.email} />
            {teamUsers?.length > 0 ? (
              <FormControl size='small' fullWidth disabled={updating}>
                <InputLabel id='assignee-label'>Responsável</InputLabel>
                <Select
                  labelId='assignee-label'
                  label='Responsável'
                  value={lead.assignedTo?.id || ''}
                  onChange={handleAssign}
                >
                  <MenuItem value=''>—</MenuItem>
                  {teamUsers.map(member => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <InfoRow label='Responsável' value={lead.assignedTo?.name || lead.assignedTo?.email} />
            )}
            <InfoRow label='Próximo follow-up' value={formatDate(lead.nextFollowUpAt)} />
            <InfoRow label='Último contato' value={formatDate(lead.lastContactAt)} />
          </div>

          {lead.processosMonitorados?.length > 0 && (
            <>
              <Divider />
              <div className='flex flex-col gap-2'>
                <Typography variant='subtitle2'>Acompanhamento Processual</Typography>
                {lead.processosMonitorados.map(processo => (
                  <div key={processo.id} className='flex flex-col gap-1 p-2 rounded bg-actionHover'>
                    <Typography variant='body2' className='font-medium'>
                      {processo.numeroProcesso}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {processo.ultimaMovimentacaoTexto || 'Sem movimentação registrada'}
                    </Typography>
                  </div>
                ))}
              </div>
            </>
          )}

          {lead.movimentacoes?.length > 0 && (
            <>
              <Divider />
              <div className='flex flex-col gap-2'>
                <Typography variant='subtitle2'>Movimentações</Typography>
                {lead.movimentacoes.map(mov => (
                  <div key={mov.id} className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(mov.dataMovimento)} {mov.tipo ? `• ${mov.tipo}` : ''}
                    </Typography>
                    <Typography variant='body2'>{mov.descricao}</Typography>
                  </div>
                ))}
              </div>
            </>
          )}

          <Divider />
          <div className='flex flex-col gap-2'>
            <Typography variant='subtitle2'>Adicionar nota</Typography>
            <TextField
              size='small'
              multiline
              minRows={2}
              fullWidth
              placeholder='Registrar contato, observação...'
              value={note}
              onChange={event => setNote(event.target.value)}
              disabled={savingNote}
            />
            <Button
              variant='contained'
              size='small'
              className='self-end'
              onClick={handleAddNote}
              disabled={savingNote || !note.trim()}
            >
              Salvar nota
            </Button>
          </div>

          {lead.activities?.length > 0 && (
            <>
              <Divider />
              <div className='flex flex-col gap-2'>
                <Typography variant='subtitle2'>Histórico de atividades</Typography>
                {lead.activities.map(activity => (
                  <div key={activity.id} className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(activity.createdAt)} • {activity.user?.name || activity.usuario || 'sistema'}
                    </Typography>
                    <Typography variant='body2'>{activity.descricao}</Typography>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Drawer>
  )
}

export default LeadDrawer
