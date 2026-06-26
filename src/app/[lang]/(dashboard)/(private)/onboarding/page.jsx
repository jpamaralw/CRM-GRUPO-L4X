'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

const GUIDES = {
  SDR: {
    icon: 'ri-search-2-line',
    color: 'info',
    title: 'SDR — Prospecção',
    objetivo: 'Qualificar leads e avançá-los para negociação',
    fluxo: [
      { passo: 'Dashboard', acao: 'Veja follow-ups vencidos (prioritário)', icon: 'ri-dashboard-line' },
      { passo: 'Pipeline', acao: 'Seus leads estão em PROSPECCAO', icon: 'ri-arrow-right-line' },
      { passo: 'Contato', acao: 'WhatsApp/Ligar/E-mail do card', icon: 'ri-phone-line' },
      { passo: 'Registro', acao: 'Clique "Registrar contato agora"', icon: 'ri-check-double-line' },
      { passo: 'Follow-up', acao: 'Agende a próxima ação', icon: 'ri-calendar-line' }
    ],
    metricas: [
      { label: 'Carteira', desc: 'Quantos leads você tem' },
      { label: 'Taxa de contato', desc: '% com telefone' },
      { label: 'Follow-ups em dia', desc: 'Nenhum vencido!' }
    ],
    dicas: [
      'Pesquisando = ainda buscando CNPJ/telefone',
      'Contato Inicial = já liguei, aguardo resposta',
      'Qualificado = quer agendar com closer'
    ]
  },
  CLOSER: {
    icon: 'ri-handshake-line',
    color: 'success',
    title: 'CLOSER — Negociação',
    objetivo: 'Fechar contratos e mover para Pós-Venda',
    fluxo: [
      { passo: 'Dashboard', acao: 'Veja carteira de negociações', icon: 'ri-dashboard-line' },
      { passo: 'Pipeline', acao: 'Seus leads estão em NEGOCIACAO', icon: 'ri-arrow-right-line' },
      { passo: 'Abordagem', acao: 'Ainda sem reunião agendada', icon: 'ri-phone-line' },
      { passo: 'Reunião', acao: 'Agende no follow-up', icon: 'ri-calendar-check-line' },
      { passo: 'Proposta', acao: 'Enviou, aguarda retorno', icon: 'ri-file-text-line' },
      { passo: 'Fechado', acao: 'Contrato assinado → Pós-Venda', icon: 'ri-check-line' }
    ],
    metricas: [
      { label: 'Taxa de conversão', desc: '% que você fecha (meta: 20%+)' },
      { label: 'Ciclo de venda', desc: 'Abordagem até Fechado' },
      { label: 'Valor médio', desc: 'Soma dos contratos' }
    ],
    dicas: [
      'Use WhatsApp para confirmação de reunião',
      'Registre TODAS as reuniões (mude status)',
      'Follow-up agendado = próxima ação automática'
    ]
  },
  GESTOR: {
    icon: 'ri-bar-chart-2-line',
    color: 'warning',
    title: 'GESTOR — Gestão',
    objetivo: 'Acompanhar equipe, garantir metas e otimizar',
    fluxo: [
      { passo: 'Dashboard', acao: 'KPIs gerais e movimentações', icon: 'ri-dashboard-line' },
      { passo: 'Resultados', acao: 'Performance de cada SDR/closer', icon: 'ri-bar-chart-box-line' },
      { passo: 'Equipe', acao: 'Papéis e atividades do time', icon: 'ri-team-line' },
      { passo: 'Acompanhamento', acao: 'Processos monitorados (DataJud)', icon: 'ri-scales-3-line' },
      { passo: 'Configurações', acao: 'Ajustes de operação', icon: 'ri-settings-3-line' }
    ],
    metricas: [
      { label: 'Taxa geral', desc: 'Meta = 20% ou mais' },
      { label: 'Distribuição', desc: 'Carteira equilibrada?' },
      { label: 'Follow-ups vencidos', desc: 'Sinalize pro time' },
      { label: 'Novos movimentos', desc: 'Processos com atividade' }
    ],
    dicas: [
      'Atribuir leads no pipeline',
      'Revisar Resultados semanalmente',
      'Monitorar metas e KPIs',
      'DataJud roda automaticamente diariamente'
    ]
  },
  ADVOGADO: {
    icon: 'ri-scales-line',
    color: 'primary',
    title: 'ADVOGADO — Acompanhamento Processual',
    objetivo: 'Monitorar movimentações judiciais',
    fluxo: [
      { passo: 'Dashboard', acao: 'Painel "Movimentações Recentes"', icon: 'ri-dashboard-line' },
      { passo: 'Movimentos', acao: 'Últimas 8 movidas (filtro "Nova")', icon: 'ri-arrow-right-line' },
      { passo: 'Processo', acao: 'Número único de cada ação', icon: 'ri-scales-3-line' },
      { passo: 'CNJ/DataJud', acao: 'Atualiza automaticamente', icon: 'ri-refresh-line' }
    ],
    metricas: [
      { label: 'Novos movimentos', desc: 'Quantos vieram hoje' },
      { label: 'Status processual', desc: 'CNJ atualizado' },
      { label: 'Prazos', desc: 'Anote ações urgentes' }
    ],
    dicas: [
      'Verificar Movimentações toda manhã',
      'Badge "Nova" = movimento do dia',
      'Contato direto se houver urgência'
    ]
  },
  RECEPCAO: {
    icon: 'ri-phone-2-line',
    color: 'secondary',
    title: 'RECEPCAO — Atendimento',
    objetivo: 'Registrar contatos e acompanhar status',
    fluxo: [
      { passo: 'Dashboard', acao: 'Visão geral da operação', icon: 'ri-dashboard-line' },
      { passo: 'Acompanhamento', acao: 'Dúvidas de clientes sobre processos', icon: 'ri-scales-3-line' },
      { passo: 'Pipeline', acao: 'Ver status de leads (leitura)', icon: 'ri-eye-line' },
      { passo: 'Encaminhar', acao: 'Urgências para time apropriado', icon: 'ri-send-plane-line' }
    ],
    metricas: [
      { label: 'Chamadas recebidas', desc: 'Registre no histórico' },
      { label: 'Status processual', desc: 'Consulte em Movimentações' },
      { label: 'Escalações', desc: 'Encaminhe para TI se erro' }
    ],
    dicas: [
      'Receber ligações/e-mails de clientes',
      'Registrar atividade (contato + resumo)',
      'Consultar Movimentações para status do processo'
    ]
  }
}

const SHORTCUTS = [
  { acao: 'Chamar cliente', como: 'Clique em "Ligar" no card', icon: 'ri-phone-line' },
  { acao: 'Enviar WhatsApp', como: 'Clique em "WhatsApp" no card', icon: 'ri-whatsapp-line' },
  { acao: 'Enviar e-mail', como: 'Clique em "E-mail" no drawer', icon: 'ri-mail-line' },
  { acao: 'Agendar follow-up', como: 'Date picker no drawer + "Agendar"', icon: 'ri-calendar-check-line' },
  { acao: 'Histórico de contatos', como: 'Scroll no drawer → "Histórico"', icon: 'ri-history-line' },
  { acao: 'Buscar processo', como: 'Cole nº na busca do pipeline', icon: 'ri-search-line' }
]

export default function OnboardingPage() {
  const [expandedGuide, setExpandedGuide] = useState(Object.keys(GUIDES)[0])

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          🎓 Guia de Onboarding
        </Typography>
        <Typography color='text.secondary'>Aprenda a usar o CRM conforme seu papel na L4</Typography>
      </div>

      {/* Guias por papel */}
      <div className='flex flex-col gap-4'>
        {Object.entries(GUIDES).map(([key, guide]) => (
          <Accordion
            key={key}
            expanded={expandedGuide === key}
            onChange={() => setExpandedGuide(expandedGuide === key ? null : key)}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-3 flex-1 min-w-0'>
                <div
                  className='flex items-center justify-center rounded-lg shrink-0'
                  style={{ width: 40, height: 40, background: `var(--mui-palette-${guide.color}-lightOpacity)` }}
                >
                  <i className={`${guide.icon} text-[20px]`} style={{ color: `var(--mui-palette-${guide.color}-main)` }} />
                </div>
                <div className='min-w-0 flex-1'>
                  <Typography variant='subtitle1' className='font-semibold'>
                    {guide.title}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' className='line-clamp-1'>
                    {guide.objetivo}
                  </Typography>
                </div>
              </div>
            </AccordionSummary>

            <AccordionDetails>
              <div className='flex flex-col gap-6 pt-2'>
                {/* Fluxo */}
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-3'>
                    📋 Seu fluxo diário
                  </Typography>
                  <div className='flex flex-col gap-2'>
                    {guide.fluxo.map((item, i) => (
                      <div key={i} className='flex items-start gap-3'>
                        <div
                          className='flex items-center justify-center rounded-lg shrink-0 mt-0.5'
                          style={{ width: 32, height: 32, background: 'var(--mui-palette-primary-lightOpacity)' }}
                        >
                          <i className={item.icon} style={{ color: 'var(--mui-palette-primary-main)' }} />
                        </div>
                        <div>
                          <Typography variant='body2' className='font-medium'>
                            {item.passo}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {item.acao}
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Métricas */}
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-3'>
                    📊 Métricas que importam
                  </Typography>
                  <div className='flex flex-col gap-2'>
                    {guide.metricas.map((m, i) => (
                      <div key={i} className='flex justify-between gap-4 p-2 rounded bg-actionHover'>
                        <Typography variant='body2' className='font-medium'>
                          {m.label}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' className='text-right'>
                          {m.desc}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dicas */}
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-3'>
                    💡 Dicas práticas
                  </Typography>
                  <ul className='flex flex-col gap-2'>
                    {guide.dicas.map((dica, i) => (
                      <li key={i} className='flex gap-2 items-start'>
                        <span className='text-primary font-bold mt-0.5'>•</span>
                        <Typography variant='body2'>{dica}</Typography>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>

      {/* Atalhos */}
      <Card>
        <div className='bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4'>
          <Typography variant='h6' className='font-semibold'>
            🚀 Atalhos de ouro
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Ações mais rápidas do CRM
          </Typography>
        </div>
        <div className='overflow-x-auto'>
          <Table size='small'>
            <TableBody>
              {SHORTCUTS.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className='w-12'>
                    <i className={s.icon} style={{ color: 'var(--mui-palette-primary-main)' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' className='font-medium'>
                      {s.acao}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='caption' color='text.secondary'>
                      {s.como}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* CTA */}
      <div className='flex gap-3 flex-wrap'>
        <Button variant='contained' startIcon={<i className='ri-book-line' />}>
          Baixar Guia (PDF)
        </Button>
        <Button variant='outlined' startIcon={<i className='ri-question-line' />}>
          FAQ
        </Button>
        <Button variant='outlined' startIcon={<i className='ri-mail-line' />}>
          Feedback
        </Button>
      </div>

      <Typography variant='caption' color='text.secondary' className='mt-4 text-center'>
        Versão 1.0 · Junho 2026 · L4 Ativos | CRM Jurídico
      </Typography>
    </div>
  )
}
