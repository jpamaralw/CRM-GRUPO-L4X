'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { toast } from 'react-toastify'

const ACTIONS = [
  {
    id: 'assign',
    nome: 'Atribuir leads',
    desc: 'Atribuir múltiplos leads a um responsável',
    icon: 'ri-user-add-line',
    color: 'primary',
    requires: ['filter', 'assignee']
  },
  {
    id: 'status',
    nome: 'Alterar status',
    desc: 'Mover múltiplos leads para novo status',
    icon: 'ri-arrow-right-line',
    color: 'warning',
    requires: ['filter', 'status']
  },
  {
    id: 'follow-up',
    nome: 'Agendar follow-up em lote',
    desc: 'Agendar follow-up para múltiplos leads',
    icon: 'ri-calendar-check-line',
    color: 'success',
    requires: ['filter', 'date']
  },
  {
    id: 'priority',
    nome: 'Alterar prioridade',
    desc: 'Mudar prioridade de múltiplos leads',
    icon: 'ri-alert-line',
    color: 'error',
    requires: ['filter', 'priority']
  },
  {
    id: 'contact-export',
    nome: 'Exportar contatos',
    desc: 'Baixar lista de telefones/e-mails em CSV',
    icon: 'ri-download-2-line',
    color: 'secondary',
    requires: ['filter']
  },
  {
    id: 'note-bulk',
    nome: 'Adicionar nota em lote',
    desc: 'Registrar mesma anotação para múltiplos leads',
    icon: 'ri-sticky-note-add-line',
    color: 'info',
    requires: ['filter', 'note']
  }
]

export default function AcoesMassaPage() {
  const [selectedAction, setSelectedAction] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('responsavel')
  const [filterValue, setFilterValue] = useState('')
  const [actionData, setActionData] = useState({})
  const [estimatedLeads, setEstimatedLeads] = useState(0)

  const action = ACTIONS.find(a => a.id === selectedAction)

  const handleOpenDialog = actionId => {
    setSelectedAction(actionId)
    setDialogOpen(true)
  }

  const handleExecute = async () => {
    if (!filterValue) {
      toast.error('Selecione um filtro válido')

      return
    }

    toast.loading('Processando ação em lote...')

    setTimeout(() => {
      toast.dismiss()
      toast.success(`✅ ${estimatedLeads} leads atualizados com sucesso!`)
      setDialogOpen(false)
      setSelectedAction('')
      setFilterValue('')
      setActionData({})
    }, 1500)
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          ⚡ Ações em Massa
        </Typography>
        <Typography color='text.secondary'>Operações rápidas em múltiplos leads (apenas gestores)</Typography>
      </div>

      <Alert severity='warning'>
        ⚠️ <strong>Cuidado:</strong> Ações em massa afetam muitos leads. Tenha certeza antes de confirmar.
      </Alert>

      {/* Grid de ações */}
      <Grid container spacing={4}>
        {ACTIONS.map(a => (
          <Grid key={a.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              className='cursor-pointer hover:shadow-lg hover:scale-105 transition-all'
              onClick={() => handleOpenDialog(a.id)}
            >
              <CardContent className='flex flex-col gap-3'>
                <div
                  className='w-12 h-12 rounded-lg flex items-center justify-center'
                  style={{ background: `var(--mui-palette-${a.color}-lightOpacity)` }}
                >
                  <i
                    className={`${a.icon} text-[20px]`}
                    style={{ color: `var(--mui-palette-${a.color}-main)` }}
                  />
                </div>
                <div>
                  <Typography variant='subtitle2' className='font-semibold'>
                    {a.nome}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {a.desc}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          <div className='flex items-center gap-2'>
            {action && <i className={action.icon} />}
            {action?.nome}
          </div>
        </DialogTitle>

        <DialogContent className='pt-4'>
          {action && (
            <div className='flex flex-col gap-4'>
              {/* Filtro */}
              <div>
                <Typography variant='subtitle2' className='font-semibold mb-2'>
                  1. Selecione os leads
                </Typography>
                <FormControl fullWidth size='small'>
                  <InputLabel id='filter-label'>Filtrar por</InputLabel>
                  <Select
                    labelId='filter-label'
                    label='Filtrar por'
                    value={selectedFilter}
                    onChange={e => setSelectedFilter(e.target.value)}
                  >
                    <MenuItem value='responsavel'>Responsável</MenuItem>
                    <MenuItem value='pipeline'>Pipeline</MenuItem>
                    <MenuItem value='prioridade'>Prioridade</MenuItem>
                    <MenuItem value='segmento'>Segmento</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size='small' sx={{ mt: 1 }}>
                  <InputLabel id='value-label'>Valor</InputLabel>
                  <Select labelId='value-label' label='Valor' value={filterValue} onChange={e => setFilterValue(e.target.value)}>
                    <MenuItem value='sdr1'>João (SDR) — 12 leads</MenuItem>
                    <MenuItem value='sdr2'>Maria (SDR) — 8 leads</MenuItem>
                    <MenuItem value='closer1'>Pedro (Closer) — 15 leads</MenuItem>
                    <MenuItem value='closer2'>Ana (Closer) — 10 leads</MenuItem>
                  </Select>
                </FormControl>
              </div>

              {/* Ação específica */}
              <div>
                <Typography variant='subtitle2' className='font-semibold mb-2'>
                  2. Configure a ação
                </Typography>

                {action.id === 'assign' && (
                  <FormControl fullWidth size='small'>
                    <InputLabel>Atribuir para</InputLabel>
                    <Select label='Atribuir para' value={actionData.assignee || ''} onChange={e => setActionData({ ...actionData, assignee: e.target.value })}>
                      <MenuItem value='user1'>João Silva (SDR)</MenuItem>
                      <MenuItem value='user2'>Maria Santos (SDR)</MenuItem>
                      <MenuItem value='user3'>Pedro Costa (Closer)</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {action.id === 'status' && (
                  <FormControl fullWidth size='small'>
                    <InputLabel>Novo status</InputLabel>
                    <Select label='Novo status' value={actionData.status || ''} onChange={e => setActionData({ ...actionData, status: e.target.value })}>
                      <MenuItem value='CONTATO_INICIAL'>Contato Inicial</MenuItem>
                      <MenuItem value='QUALIFICADO'>Qualificado</MenuItem>
                      <MenuItem value='ABORDAGEM'>Abordagem</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {action.id === 'follow-up' && (
                  <input
                    type='date'
                    value={actionData.date || ''}
                    onChange={e => setActionData({ ...actionData, date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                )}

                {action.id === 'priority' && (
                  <FormControl fullWidth size='small'>
                    <InputLabel>Nova prioridade</InputLabel>
                    <Select label='Nova prioridade' value={actionData.priority || ''} onChange={e => setActionData({ ...actionData, priority: e.target.value })}>
                      <MenuItem value='ALTA'>🔴 Alta</MenuItem>
                      <MenuItem value='MEDIA'>🟡 Média</MenuItem>
                      <MenuItem value='BAIXA'>⚪ Baixa</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {action.id === 'note-bulk' && (
                  <textarea
                    placeholder='Anotação que será adicionada a todos os leads...'
                    value={actionData.note || ''}
                    onChange={e => setActionData({ ...actionData, note: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'monospace' }}
                  />
                )}
              </div>

              {/* Preview */}
              {filterValue && (
                <Alert severity='info'>
                  ✓ Serão afetados ~{filterValue.match(/\d+/)?.[0] || 0} leads
                </Alert>
              )}
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleExecute} variant='contained'>
            Executar
          </Button>
        </DialogActions>
      </Dialog>
    </div>

  )
}
