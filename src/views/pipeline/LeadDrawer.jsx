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

import { PIPELINES } from '@/utils/permissions'

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

const onlyDigits = v => String(v || '').replace(/\D/g, '')

const waLink = phone => {
  const d = onlyDigits(phone)

  return d.length >= 10 ? `https://wa.me/55${d}` : null
}

// yyyy-mm-dd para o input date
const toDateInput = value => {
  if (!value) return ''
  const d = new Date(value)

  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
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
  const [followUp, setFollowUp] = useState('')

  useEffect(() => {
    setFollowUp(toDateInput(lead?.nextFollowUpAt))
  }, [lead?.nextFollowUpAt])

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

  const quickPatch = async (body, successMsg) => {
    setUpdating(true)

    try {
      const res = await fetch(`/api/pipeline/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar')

      setLead(prev => ({ ...prev, ...data.lead }))
      onUpdated?.(data.lead)
      toast.success(successMsg)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleRegistrarContato = () => quickPatch({ lastContactAt: new Date().toISOString() }, 'Contato registrado')

  const handleAgendarFollowUp = () =>
    quickPatch({ nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null }, 'Follow-up agendado')

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

  // Qualquer movimentação é permitida — oferecemos todos os status (registrado no histórico).
  const nextOptions = Object.keys(ALL_STATUSES).filter(key => key !== currentStatus)

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
            <Typography variant='h6'>{lead.autor || lead.reu || 'Lead'}</Typography>
            <Typography variant='caption' color='text.secondary'>
              <i className='ri-scales-3-line align-middle' /> {lead.numeroProcesso}
            </Typography>
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

            {(lead.telefone || lead.email) && (
              <div className='flex gap-2 flex-wrap'>
                {waLink(lead.telefone) && (
                  <Button
                    size='small'
                    variant='contained'
                    color='success'
                    component='a'
                    href={waLink(lead.telefone)}
                    target='_blank'
                    rel='noreferrer'
                    startIcon={<i className='ri-whatsapp-line' />}
                  >
                    WhatsApp
                  </Button>
                )}
                {lead.telefone && (
                  <Button
                    size='small'
                    variant='outlined'
                    component='a'
                    href={`tel:${onlyDigits(lead.telefone)}`}
                    startIcon={<i className='ri-phone-line' />}
                  >
                    Ligar
                  </Button>
                )}
                {lead.email && (
                  <Button
                    size='small'
                    variant='outlined'
                    component='a'
                    href={`mailto:${lead.email}`}
                    startIcon={<i className='ri-mail-line' />}
                  >
                    E-mail
                  </Button>
                )}
              </div>
            )}

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
            <InfoRow label='Último contato' value={formatDate(lead.lastContactAt)} />

            <div className='flex items-end gap-2 mt-1'>
              <TextField
                size='small'
                type='date'
                label='Próximo follow-up'
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                disabled={updating}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button size='small' variant='outlined' onClick={handleAgendarFollowUp} disabled={updating}>
                Agendar
              </Button>
            </div>

            <Button
              size='small'
              variant='tonal'
              color='primary'
              onClick={handleRegistrarContato}
              disabled={updating}
              startIcon={<i className='ri-check-double-line' />}
              className='self-start'
            >
              Registrar contato agora
            </Button>
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
