'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'

import { toast } from 'react-toastify'

const MarcarVistoButton = ({ processoId }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/acompanhamento/${processoId}/visto`, { method: 'POST' })

      if (!res.ok) throw new Error('Falha ao marcar como visto')
      toast.success('Movimentações marcadas como vistas')
      router.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size='small' variant='outlined' disabled={loading} onClick={handle} startIcon={<i className='ri-check-double-line' />}>
      Marcar como visto
    </Button>
  )
}

export default MarcarVistoButton
