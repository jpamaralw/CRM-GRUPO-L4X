'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'

const REPORT_TEMPLATES = [
  {
    id: 'semanal-sdr',
    nome: 'Relatório Semanal — SDR',
    desc: 'Carteira, contatos, qualificados, taxa',
    icon: 'ri-calendar-week-line',
    color: 'info'
  },
  {
    id: 'semanal-closer',
    nome: 'Relatório Semanal — Closer',
    desc: 'Abordagens, reuniões, propostas, fechados',
    icon: 'ri-handshake-line',
    color: 'success'
  },
  {
    id: 'mensal-gestor',
    nome: 'Relatório Mensal — Gestor',
    desc: 'KPIs do time, metas, performance comparativa',
    icon: 'ri-bar-chart-box-line',
    color: 'warning'
  },
  {
    id: 'processos-advogado',
    nome: 'Relatório de Processos — Advogado',
    desc: 'Movimentações, prazos, status CNJ',
    icon: 'ri-scales-line',
    color: 'primary'
  },
  {
    id: 'por-segmento',
    nome: 'Performance por Segmento',
    desc: 'Precatório/RPV/Tributário: leads, conversão, valor',
    icon: 'ri-pie-chart-2-line',
    color: 'secondary'
  }
]

export default function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerateReport = async () => {
    if (!selectedReport || !dataInicio || !dataFim) {
      alert('Preencha todos os campos')

      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setGenerated(true)
    }, 2000)
  }

  const handleDownload = format => {
    alert(`Baixar em ${format} — em desenvolvimento`)
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          📊 Relatórios
        </Typography>
        <Typography color='text.secondary'>Gere relatórios customizados para seu papel</Typography>
      </div>

      {/* Gerador */}
      <Card className='border-l-4' style={{ borderLeftColor: 'var(--mui-palette-primary-main)' }}>
        <CardContent className='flex flex-col gap-4'>
          <Typography variant='h6' className='font-semibold'>
            Gerar novo relatório
          </Typography>

          <div className='flex gap-4 flex-col sm:flex-row'>
            <FormControl fullWidth size='small'>
              <InputLabel id='report-label'>Tipo de relatório</InputLabel>
              <Select
                labelId='report-label'
                label='Tipo de relatório'
                value={selectedReport}
                onChange={e => setSelectedReport(e.target.value)}
              >
                {REPORT_TEMPLATES.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size='small'
              type='date'
              label='Data início'
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size='small'
              type='date'
              label='Data fim'
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Button
              variant='contained'
              onClick={handleGenerateReport}
              disabled={loading || !selectedReport}
              startIcon={<i className={loading ? 'ri-loader-4-line animate-spin' : 'ri-download-2-line'} />}
            >
              {loading ? 'Gerando...' : 'Gerar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview após gerar */}
      {generated && (
        <Card className='bg-success/5'>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center'>
                <i className='ri-check-double-line text-success text-[20px]' />
              </div>
              <div className='flex-1'>
                <Typography variant='subtitle1' className='font-semibold'>
                  Relatório gerado com sucesso
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {REPORT_TEMPLATES.find(t => t.id === selectedReport)?.nome}
                </Typography>
              </div>
            </div>

            <div className='flex gap-3'>
              <Button variant='contained' color='success' size='small' onClick={() => handleDownload('PDF')}>
                <i className='ri-file-pdf-line' /> PDF
              </Button>
              <Button variant='outlined' size='small' onClick={() => handleDownload('XLSX')}>
                <i className='ri-file-excel-line' /> Excel
              </Button>
              <Button variant='outlined' size='small' onClick={() => handleDownload('CSV')}>
                <i className='ri-file-text-line' /> CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates */}
      <div>
        <Typography variant='h6' className='font-semibold mb-4'>
          Templates disponíveis
        </Typography>
        <Grid container spacing={4}>
          {REPORT_TEMPLATES.map(report => (
            <Grid key={report.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                className='cursor-pointer hover:shadow-lg transition-shadow'
                onClick={() => {
                  setSelectedReport(report.id)
                  setGenerated(false)
                }}
                sx={{
                  border: selectedReport === report.id ? `2px solid var(--mui-palette-primary-main)` : 'none'
                }}
              >
                <CardContent className='flex flex-col gap-3'>
                  <div
                    className='w-12 h-12 rounded-lg flex items-center justify-center'
                    style={{ background: `var(--mui-palette-${report.color}-lightOpacity)` }}
                  >
                    <i
                      className={`${report.icon} text-[20px]`}
                      style={{ color: `var(--mui-palette-${report.color}-main)` }}
                    />
                  </div>
                  <Typography variant='subtitle2' className='font-semibold'>
                    {report.nome}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {report.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>

      <Alert severity='info'>
        💡 <strong>Dica:</strong> Agende relatórios automáticos no menu Configurações (em breve)
      </Alert>
    </div>

  )
}
