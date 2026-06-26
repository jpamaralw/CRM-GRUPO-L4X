'use client'

import { useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { toast } from 'react-toastify'

const Stat = ({ label, value, color = 'primary' }) => (
  <div className='flex flex-col items-center p-3 rounded-lg bg-actionHover min-w-[96px]'>
    <Typography variant='h5' className='font-bold' style={{ color: `var(--mui-palette-${color}-main)` }}>
      {value}
    </Typography>
    <Typography variant='caption' color='text.secondary' className='text-center'>
      {label}
    </Typography>
  </div>
)

const ImportUploader = () => {
  const router = useRouter()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handlePick = e => {
    const f = e.target.files?.[0]

    if (f) {
      setFile(f)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    try {
      const fd = new FormData()

      fd.append('file', file)

      const res = await fetch('/api/leads/import-planilha', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao importar')

      setResult(data.resumo)
      toast.success(`Importação concluída: ${data.resumo.criados} novos leads`)
      router.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          Importar Leads via Planilha
        </Typography>
        <Typography color='text.secondary'>Suba um arquivo .xlsx — o sistema detecta as colunas automaticamente</Typography>
      </div>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card className='bs-full'>
            <CardContent className='flex flex-col gap-4'>
              <div
                className='flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer'
                style={{ borderColor: 'var(--mui-palette-divider)' }}
                onClick={() => inputRef.current?.click()}
              >
                <i className='ri-file-excel-2-line text-[48px]' style={{ color: 'var(--mui-palette-success-main)' }} />
                <Typography variant='subtitle1' className='font-medium'>
                  {file ? file.name : 'Clique para selecionar a planilha'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Formatos: .xlsx, .xls — várias abas suportadas
                </Typography>
                <input ref={inputRef} type='file' accept='.xlsx,.xls' hidden onChange={handlePick} />
              </div>

              <Button
                variant='contained'
                size='large'
                disabled={!file || loading}
                onClick={handleUpload}
                startIcon={loading ? <CircularProgress size={18} color='inherit' /> : <i className='ri-upload-2-line' />}
              >
                {loading ? 'Importando...' : 'Importar leads'}
              </Button>

              {result && (
                <div className='flex flex-col gap-3'>
                  <Alert severity='success'>Importação concluída!</Alert>
                  <div className='flex gap-3 flex-wrap'>
                    <Stat label='Novos leads' value={result.criados} color='success' />
                    <Stat label='Atualizados' value={result.atualizados} color='info' />
                    <Stat label='Linhas lidas' value={result.linhas} color='primary' />
                    <Stat label='Sem nº processo' value={result.semProcesso} color='warning' />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card className='bs-full'>
            <CardContent className='flex flex-col gap-3'>
              <Typography variant='h6' className='font-semibold'>
                Como funciona
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                O importador reconhece automaticamente colunas comuns. Use cabeçalhos como:
              </Typography>
              <ul className='flex flex-col gap-2 text-sm'>
                {[
                  ['Nº do Processo / Processo / CNJ', 'obrigatório (identifica o lead)'],
                  ['Parte / Autor / Cliente / Cedente', 'nome do titular'],
                  ['Valor Bruto / Valor da Causa', 'valor (R$)'],
                  ['Telefone / Celular / WhatsApp', 'contato'],
                  ['E-mail', 'contato'],
                  ['Situação / Status / Movimentação', 'observações']
                ].map(([col, desc]) => (
                  <li key={col} className='flex gap-2'>
                    <i className='ri-checkbox-circle-line text-primary mt-0.5' />
                    <span>
                      <strong>{col}</strong> — <span className='text-textSecondary'>{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Alert severity='info' className='mt-2'>
                Leads existentes (mesmo nº de processo) são <strong>atualizados</strong>, não duplicados. Novos entram em
                Prospecção → Novo.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default ImportUploader
