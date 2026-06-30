'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'

import { toast } from 'react-toastify'

const ConfiguracoesForm = ({ schema, initialSettings }) => {
  const [values, setValues] = useState(initialSettings)
  const [saving, setSaving] = useState(false)

  const handleChange = key => e => setValues(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')

      setValues(data.settings)
      toast.success('Configurações salvas')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Preferências da operação' subheader='Ajustes que a equipe de gestão pode alterar' />
      <Divider />
      <CardContent>
        <Grid container spacing={6}>
          {Object.entries(schema).map(([key, meta]) => (
            <Grid key={key} size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={meta.label}
                helperText={meta.help}
                type={meta.type === 'number' ? 'number' : 'text'}
                value={values[key] ?? ''}
                onChange={handleChange(key)}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color='inherit' /> : <i className='ri-save-line' />}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </CardActions>
    </Card>
  )
}

export default ConfiguracoesForm
