'use client'

import { useState } from 'react'

import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import AtivosBoard from './AtivosBoard'
import ProcessosBoard from './ProcessosBoard'

const PipelineBoard = () => {
  const [tab, setTab] = useState('ativos')

  return (
    <div className='flex flex-col gap-5'>
      <div>
        <Typography variant='h4' fontWeight={800} color='primary'>
          Pipeline
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Precatórios · RPVs · Sentenças · Monitoramento processual — L4 Ativos
        </Typography>
      </div>

      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant='scrollable'
        scrollButtons='auto'
      >
        <Tab value='ativos' label='Pipeline de Ativos' icon={<i className='ri-stack-line' />} iconPosition='start' />
        <Tab value='processos' label='Processos Monitorados' icon={<i className='ri-scales-3-line' />} iconPosition='start' />
      </Tabs>

      {tab === 'ativos' ? <AtivosBoard /> : <ProcessosBoard />}
    </div>
  )
}

export default PipelineBoard
