'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Avatar from '@mui/material/Avatar'

import { toast } from 'react-toastify'

import { COMPLIANCE_STATUS, segmentoFromLead, SEGMENTO_LABEL, SEGMENTO_ICON } from '@/utils/permissions'

const fmtBRL = v =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const initials = name =>
  !name ? '?' : name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')

const StatCard = ({ label, value, color, icon, active, onClick }) => (
  <Card
    className='cursor-pointer transition-all'
    onClick={onClick}
    sx={{ border: active ? `2px solid var(--mui-palette-${color}-main)` : '2px solid transparent' }}
  >
    <CardContent className='flex items-center gap-3'>
      <div
        className='flex items-center justify-center rounded-lg shrink-0'
        style={{ width: 44, height: 44, background: `var(--mui-palette-${color}-lightOpacity)` }}
      >
        <i className={`${icon} text-[22px]`} style={{ color: `var(--mui-palette-${color}-main)` }} />
      </div>
      <div>
        <Typography variant='h4' className='font-bold leading-none'>
          {value}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {label}
        </Typography>
      </div>
    </CardContent>
  </Card>
)

const ComplianceBoard = ({ stats, leads: initialLeads, canEdit }) => {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [filter, setFilter] = useState('AGUARDANDO')
  const [dialog, setDialog] = useState(null) // { lead, decisao }
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)

  const visible = useMemo(() => leads.filter(l => l.complianceStatus === filter), [leads, filter])

  const openDialog = (lead, decisao) => {
    setDialog({ lead, decisao })
    setObs(lead.complianceObs || '')
  }

  const handleDecide = async () => {
    if (!dialog) return
    setSaving(true)

    try {
      const res = await fetch(`/api/compliance/${dialog.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complianceStatus: dialog.decisao, complianceObs: obs.trim() || null })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')

      setLeads(prev => prev.map(l => (l.id === dialog.lead.id ? { ...l, ...data.lead } : l)))
      toast.success(dialog.decisao === 'APROVADO' ? 'Ativo aprovado ✅' : dialog.decisao === 'REPROVADO' ? 'Ativo reprovado' : 'Atualizado')
      setDialog(null)
      router.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          Compliance de Ativos
        </Typography>
        <Typography color='text.secondary'>
          Análise jurídica dos ativos caçados por SDRs e closers — aprovar ou reprovar a compra
        </Typography>
      </div>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label='Aguardando análise' value={stats.aguardando} color='warning' icon='ri-time-line' active={filter === 'AGUARDANDO'} onClick={() => setFilter('AGUARDANDO')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label='Aprovados' value={stats.aprovados} color='success' icon='ri-checkbox-circle-line' active={filter === 'APROVADO'} onClick={() => setFilter('APROVADO')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label='Reprovados' value={stats.reprovados} color='error' icon='ri-close-circle-line' active={filter === 'REPROVADO'} onClick={() => setFilter('REPROVADO')} />
        </Grid>
      </Grid>

      <div className='flex flex-col gap-3'>
        {visible.map(lead => {
          const seg = segmentoFromLead(lead)
          const st = COMPLIANCE_STATUS[lead.complianceStatus]

          return (
            <Card key={lead.id}>
              <CardContent className='flex items-center gap-4 flex-wrap'>
                <div className='flex-1 min-w-[200px]'>
                  <Typography variant='subtitle1' className='font-semibold line-clamp-1'>
                    {lead.autor || lead.reu || 'Sem nome'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' className='font-mono'>
                    {lead.numeroProcesso}
                    {lead.tribunal ? ` · ${lead.tribunal}` : ''}
                  </Typography>
                  <div className='flex items-center gap-1.5 flex-wrap mt-1.5'>
                    <Chip size='small' variant='tonal' icon={<i className={SEGMENTO_ICON[seg]} />} label={SEGMENTO_LABEL[seg]} />
                    <Typography variant='caption' className='font-semibold' color='success.main'>
                      {fmtBRL(lead.valorCausa)}
                    </Typography>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  {lead.assignedTo && (
                    <div className='flex items-center gap-1.5'>
                      <Avatar sx={{ width: 26, height: 26, fontSize: 12 }}>{initials(lead.assignedTo.name)}</Avatar>
                      <div className='hidden sm:block'>
                        <Typography variant='caption' color='text.secondary' className='block leading-none'>
                          Caçado por
                        </Typography>
                        <Typography variant='caption' className='font-medium'>
                          {lead.assignedTo.name || lead.assignedTo.email}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>

                {filter === 'AGUARDANDO' ? (
                  <div className='flex gap-2'>
                    <Button size='small' variant='contained' color='success' disabled={!canEdit} onClick={() => openDialog(lead, 'APROVADO')} startIcon={<i className='ri-check-line' />}>
                      Aprovar
                    </Button>
                    <Button size='small' variant='outlined' color='error' disabled={!canEdit} onClick={() => openDialog(lead, 'REPROVADO')} startIcon={<i className='ri-close-line' />}>
                      Reprovar
                    </Button>
                  </div>
                ) : (
                  <div className='flex flex-col items-end gap-1'>
                    <Chip size='small' color={st?.color} variant='tonal' icon={<i className={st?.icon} />} label={st?.label} />
                    {lead.complianceObs && (
                      <Typography variant='caption' color='text.secondary' className='max-w-[260px] text-right line-clamp-2'>
                        {lead.complianceObs}
                      </Typography>
                    )}
                    {canEdit && (
                      <Button size='small' variant='text' onClick={() => openDialog(lead, 'AGUARDANDO')}>
                        Reavaliar
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {!visible.length && (
          <Card>
            <CardContent className='text-center py-10'>
              <i className='ri-shield-check-line text-[40px] text-textDisabled' />
              <Typography color='text.secondary' className='mt-2'>
                {filter === 'AGUARDANDO'
                  ? 'Nenhum ativo aguardando análise. Quando SDRs/closers enviarem ativos, eles aparecem aqui.'
                  : 'Nada por aqui ainda.'}
              </Typography>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {dialog?.decisao === 'APROVADO' ? 'Aprovar compra do ativo' : dialog?.decisao === 'REPROVADO' ? 'Reprovar compra do ativo' : 'Reavaliar ativo'}
        </DialogTitle>
        <DialogContent>
          {dialog && (
            <div className='flex flex-col gap-3 pt-2'>
              <Typography variant='body2'>
                <strong>{dialog.lead.autor || dialog.lead.reu}</strong> — {dialog.lead.numeroProcesso}
              </Typography>
              <TextField
                label='Parecer / observação (compliance)'
                placeholder='Justificativa jurídica da aprovação ou reprovação...'
                multiline
                minRows={3}
                fullWidth
                value={obs}
                onChange={e => setObs(e.target.value)}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button
            variant='contained'
            color={dialog?.decisao === 'REPROVADO' ? 'error' : 'success'}
            onClick={handleDecide}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default ComplianceBoard
