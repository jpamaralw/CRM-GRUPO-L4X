export const ROLES = {
  SDR: 'SDR',
  CLOSER: 'CLOSER',
  GESTOR: 'GESTOR',
  FINANCEIRO: 'FINANCEIRO',
  FINANCEIRO_SDR: 'FINANCEIRO_SDR',
  RECEPCAO: 'RECEPCAO',
  SOCIO: 'SOCIO',
  TI: 'TI',
  ADVOGADO: 'ADVOGADO',
  PAPELADA: 'PAPELADA'
}

export const PIPELINES = {
  PROSPECCAO: {
    key: 'PROSPECCAO',
    label: 'Prospecção',
    icon: 'ri-search-line',
    statuses: [
      { key: 'NOVO', label: 'Novo', color: 'info' },
      { key: 'PESQUISANDO', label: 'Pesquisando', color: 'secondary' },
      { key: 'CONTATO_INICIAL', label: 'Contato Inicial', color: 'warning' },
      { key: 'QUALIFICADO', label: 'Qualificado', color: 'success' },
      { key: 'DESCARTADO', label: 'Descartado', color: 'error' }
    ]
  },
  NEGOCIACAO: {
    key: 'NEGOCIACAO',
    label: 'Negociação',
    icon: 'ri-handshake-line',
    statuses: [
      { key: 'ABORDAGEM', label: 'Abordagem', color: 'info' },
      { key: 'REUNIAO_AGENDADA', label: 'Reunião Agendada', color: 'warning' },
      { key: 'PROPOSTA', label: 'Proposta', color: 'secondary' },
      { key: 'NEGOCIANDO', label: 'Negociando', color: 'primary' },
      { key: 'FECHADO', label: 'Fechado', color: 'success' },
      { key: 'PERDIDO', label: 'Perdido', color: 'error' }
    ]
  },
  POS_VENDA: {
    key: 'POS_VENDA',
    label: 'Pós-Venda',
    icon: 'ri-user-star-line',
    statuses: [
      { key: 'CLIENTE_ATIVO', label: 'Cliente Ativo', color: 'success' },
      { key: 'ACOMPANHAMENTO', label: 'Acompanhamento', color: 'warning' },
      { key: 'EXPANSAO', label: 'Expansão', color: 'primary' }
    ]
  }
}

// Segmentos de ativo (linha de negócio). L4 Ativos = precatórios/RPV/despejo; L4 Taxx = tributário.
export const SEGMENTOS = [
  { key: 'PRECATORIO', label: 'Precatório', icon: 'ri-scales-line', linha: 'L4 Ativos', color: 'primary' },
  { key: 'RPV', label: 'RPV', icon: 'ri-bank-card-line', linha: 'L4 Ativos', color: 'info' },
  { key: 'TRIBUTARIO', label: 'Tributário', icon: 'ri-building-2-line', linha: 'L4 Taxx', color: 'warning' },
  { key: 'DESPEJO', label: 'Despejo', icon: 'ri-home-2-line', linha: 'L4 Ativos', color: 'success' },
  { key: 'OUTROS', label: 'Outros', icon: 'ri-inbox-line', linha: '—', color: 'default' }
]

export const SEGMENTO_LABEL = SEGMENTOS.reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {})
export const SEGMENTO_ICON = SEGMENTOS.reduce((acc, s) => ({ ...acc, [s.key]: s.icon }), {})

export function segmentoFromLead(lead) {
  const g = `${lead?.segmento || lead?.grupo || lead?.fonte || ''}`.toUpperCase()

  if (g.includes('PRECATOR')) return 'PRECATORIO'
  if (g.includes('RPV')) return 'RPV'
  if (g.includes('FISCAL') || g.includes('TRIBUT')) return 'TRIBUTARIO'
  if (g.includes('DESPEJO')) return 'DESPEJO'

  return 'OUTROS'
}

const FULL_ACCESS_ROLES = [ROLES.GESTOR, ROLES.FINANCEIRO, ROLES.SOCIO, ROLES.TI, ROLES.ADVOGADO, ROLES.PAPELADA]
const ATENDIMENTO_ROLES = [ROLES.RECEPCAO, ...FULL_ACCESS_ROLES]

export function canViewPipeline(role, pipeline) {
  if (FULL_ACCESS_ROLES.includes(role)) return true
  if (role === ROLES.SDR || role === ROLES.FINANCEIRO_SDR) return pipeline === 'PROSPECCAO'
  if (role === ROLES.CLOSER) return pipeline === 'NEGOCIACAO'

  return false
}

export function canViewLeadInPipeline(role, lead) {
  if (FULL_ACCESS_ROLES.includes(role)) return true

  if (role === ROLES.SDR || role === ROLES.FINANCEIRO_SDR) {
    if (lead.pipeline === 'PROSPECCAO') return true

    return lead.pipeline === 'NEGOCIACAO' && ['FECHADO', 'PERDIDO'].includes(lead.statusCrm)
  }

  if (role === ROLES.CLOSER) return lead.pipeline === 'NEGOCIACAO'

  return false
}

export function canEditLead(role, lead) {
  if (FULL_ACCESS_ROLES.includes(role)) return true
  if (role === ROLES.SDR || role === ROLES.FINANCEIRO_SDR) return lead.pipeline === 'PROSPECCAO'
  if (role === ROLES.CLOSER) return lead.pipeline === 'NEGOCIACAO'

  return false
}

export function canAssignLead(role) {
  return FULL_ACCESS_ROLES.includes(role)
}

export function canManageTeam(role) {
  return [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI].includes(role)
}

export function canManageAutomations(role) {
  return [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI].includes(role)
}

export function canViewDashboard() {
  return true
}

export function canViewAcompanhamento(role) {
  return ATENDIMENTO_ROLES.includes(role)
}

export function canRegisterAtendimento(role) {
  return ATENDIMENTO_ROLES.includes(role)
}

export function canViewAllLeads(role) {
  return FULL_ACCESS_ROLES.includes(role) || role === ROLES.SDR
}

export function getLeadVisibilityWhere(role) {
  if (FULL_ACCESS_ROLES.includes(role)) return {}

  if (role === ROLES.SDR) {
    return {
      OR: [
        { pipeline: 'PROSPECCAO' },
        { pipeline: 'NEGOCIACAO', statusCrm: { in: ['FECHADO', 'PERDIDO'] } }
      ]
    }
  }

  if (role === ROLES.FINANCEIRO_SDR) return { pipeline: 'PROSPECCAO' }
  if (role === ROLES.CLOSER) return { pipeline: 'NEGOCIACAO' }

  return { id: '__no_access__' }
}

export function canAccessSettings(role) {
  return [ROLES.TI, ROLES.SOCIO].includes(role)
}

export function getVisiblePipelines(role) {
  return Object.keys(PIPELINES).filter(pipeline => canViewPipeline(role, pipeline))
}

export function getVisibleNavItems(role) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', href: '/dashboards/crm', roles: 'ALL' },
    {
      key: 'prospeccao',
      label: 'Prospecao',
      icon: 'ri-search-line',
      href: '/pipelines/prospeccao',
      roles: [ROLES.SDR, ROLES.FINANCEIRO_SDR, ...FULL_ACCESS_ROLES]
    },
    {
      key: 'negociacao',
      label: 'Negociacao',
      icon: 'ri-handshake-line',
      href: '/pipelines/negociacao',
      roles: [ROLES.CLOSER, ...FULL_ACCESS_ROLES]
    },
    {
      key: 'pos-venda',
      label: 'Pos-Venda',
      icon: 'ri-user-star-line',
      href: '/pipelines/pos-venda',
      roles: FULL_ACCESS_ROLES
    },
    {
      key: 'acompanhamento',
      label: 'Acompanhamento Processual',
      icon: 'ri-scales-3-line',
      href: '/acompanhamento-processual',
      roles: ATENDIMENTO_ROLES
    },
    {
      key: 'resultados',
      label: 'Resultados',
      icon: 'ri-bar-chart-grouped-line',
      href: '/resultados',
      roles: [ROLES.SDR, ROLES.FINANCEIRO_SDR, ROLES.CLOSER, ...FULL_ACCESS_ROLES]
    },
    {
      key: 'equipe',
      label: 'Equipe',
      icon: 'ri-team-line',
      href: '/equipe',
      roles: [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI]
    },
    {
      key: 'automacoes',
      label: 'Automacoes',
      icon: 'ri-robot-line',
      href: '/automacoes',
      roles: [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI]
    },
    {
      key: 'onboarding',
      label: 'Guia',
      icon: 'ri-book-open-line',
      href: '/onboarding',
      roles: 'ALL'
    },
    {
      key: 'configuracoes',
      label: 'Configuracoes',
      icon: 'ri-settings-3-line',
      href: '/configuracoes',
      roles: [ROLES.TI, ROLES.SOCIO]
    }
  ]

  return items.filter(item => item.roles === 'ALL' || item.roles.includes(role))
}

export const VALID_TRANSITIONS = {
  NOVO: ['PESQUISANDO', 'DESCARTADO'],
  PESQUISANDO: ['CONTATO_INICIAL', 'DESCARTADO'],
  CONTATO_INICIAL: ['QUALIFICADO', 'DESCARTADO', 'PESQUISANDO'],
  QUALIFICADO: ['ABORDAGEM'],
  DESCARTADO: ['NOVO'],
  ABORDAGEM: ['REUNIAO_AGENDADA', 'PERDIDO'],
  REUNIAO_AGENDADA: ['PROPOSTA', 'NEGOCIANDO', 'PERDIDO'],
  PROPOSTA: ['NEGOCIANDO', 'PERDIDO'],
  NEGOCIANDO: ['FECHADO', 'PERDIDO'],
  FECHADO: ['CLIENTE_ATIVO'],
  PERDIDO: ['ABORDAGEM'],
  CLIENTE_ATIVO: ['ACOMPANHAMENTO', 'EXPANSAO'],
  ACOMPANHAMENTO: ['CLIENTE_ATIVO', 'EXPANSAO'],
  EXPANSAO: ['CLIENTE_ATIVO']
}

export function isValidTransition(fromStatus, toStatus) {
  const valid = VALID_TRANSITIONS[fromStatus]

  return valid ? valid.includes(toStatus) : false
}

export function getPipelineForStatus(status) {
  const prospeccao = ['NOVO', 'PESQUISANDO', 'CONTATO_INICIAL', 'QUALIFICADO', 'DESCARTADO']
  const negociacao = ['ABORDAGEM', 'REUNIAO_AGENDADA', 'PROPOSTA', 'NEGOCIANDO', 'FECHADO', 'PERDIDO']
  const posVenda = ['CLIENTE_ATIVO', 'ACOMPANHAMENTO', 'EXPANSAO']

  if (prospeccao.includes(status)) return 'PROSPECCAO'
  if (negociacao.includes(status)) return 'NEGOCIACAO'
  if (posVenda.includes(status)) return 'POS_VENDA'

  return 'PROSPECCAO'
}
