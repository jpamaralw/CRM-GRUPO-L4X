'use client'

import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Grid2 from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'

import { toast } from 'react-toastify'

const EMPTY_FORM = {
  numeroProcesso: '',
  tribunal: '',
  autor: '',
  reu: '',
  valorCausa: '',
  fase: '',
  prioridade: '',
  telefone: '',
  email: ''
}

const NewLeadDialog = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const handleChange = field => event => {
    setForm(prev => ({ ...prev, [field]: event.target.value }))
  }

  const handleClose = () => {
    if (saving) return
    setForm(EMPTY_FORM)
    onClose()
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      const res = await fetch('/api/pipeline/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao criar lead')

      toast.success('Lead criado')
      onCreated?.(data.lead)
      setForm(EMPTY_FORM)
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Novo Lead</DialogTitle>
      <DialogContent>
        <Grid2 container spacing={4} className='mt-1'>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label='Número do Processo'
              placeholder='0000000-00.0000.0.00.0000'
              value={form.numeroProcesso}
              onChange={handleChange('numeroProcesso')}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth required label='Tribunal' value={form.tribunal} onChange={handleChange('tribunal')} />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='Autor' value={form.autor} onChange={handleChange('autor')} />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='Réu' value={form.reu} onChange={handleChange('reu')} />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type='number'
              label='Valor da Causa'
              value={form.valorCausa}
              onChange={handleChange('valorCausa')}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='Fase' value={form.fase} onChange={handleChange('fase')} />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              select
              label='Prioridade'
              value={form.prioridade}
              onChange={handleChange('prioridade')}
            >
              <MenuItem value=''>—</MenuItem>
              <MenuItem value='ALTA'>Alta</MenuItem>
              <MenuItem value='MEDIA'>Média</MenuItem>
              <MenuItem value='BAIXA'>Baixa</MenuItem>
            </TextField>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='Telefone' value={form.telefone} onChange={handleChange('telefone')} />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='E-mail' value={form.email} onChange={handleChange('email')} />
          </Grid2>
        </Grid2>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving} color='secondary'>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={saving || !form.numeroProcesso.trim() || !form.tribunal.trim()}
        >
          Criar Lead
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewLeadDialog
