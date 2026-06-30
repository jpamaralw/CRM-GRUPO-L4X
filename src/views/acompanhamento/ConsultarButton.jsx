'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import { toast } from 'react-toastify'

const ConsultarButton = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleConsultar = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/acompanhamento/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Falha na consulta')

      const resumo = `${data.consultados} processos, ${data.novasMovimentacoes} novas movimentações${
        data.erros ? `, ${data.erros} erros` : ''
      }`

      if (data.parcial) {
        toast.info(`Execução parcial (limite de tempo): ${resumo}. O restante entra na próxima execução.`)
      } else {
        toast.success(`Consulta concluída: ${resumo}`)
      }

      router.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant='contained'
      onClick={handleConsultar}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={18} color='inherit' /> : <i className='ri-refresh-line' />}
    >
      {loading ? 'Consultando DataJud...' : 'Consultar movimentações agora'}
    </Button>
  )
}

export default ConsultarButton
