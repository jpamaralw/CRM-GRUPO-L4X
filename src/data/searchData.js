// Índice de busca do CRM L4 Ativos — apenas rotas reais da aplicação.
const data = [
  // Geral
  {
    id: '1',
    name: 'Dashboard',
    url: '/dashboards/crm',
    icon: 'ri-dashboard-line',
    section: 'Geral'
  },
  {
    id: '2',
    name: 'Notificações',
    url: '/notificacoes',
    icon: 'ri-notification-2-line',
    section: 'Geral'
  },

  // Comercial
  {
    id: '3',
    name: 'Pipeline',
    url: '/pipeline',
    icon: 'ri-git-branch-line',
    section: 'Comercial'
  },
  {
    id: '4',
    name: 'Pipeline · Prospecção',
    url: '/pipeline?pipeline=PROSPECCAO',
    icon: 'ri-git-branch-line',
    section: 'Comercial'
  },
  {
    id: '5',
    name: 'Pipeline · Negociação',
    url: '/pipeline?pipeline=NEGOCIACAO',
    icon: 'ri-git-branch-line',
    section: 'Comercial'
  },
  {
    id: '6',
    name: 'Pipeline · Pós-venda',
    url: '/pipeline?pipeline=POS_VENDA',
    icon: 'ri-git-branch-line',
    section: 'Comercial'
  },
  {
    id: '7',
    name: 'Resultados',
    url: '/resultados',
    icon: 'ri-bar-chart-grouped-line',
    section: 'Comercial'
  },
  {
    id: '8',
    name: 'Leads',
    url: '/leads',
    icon: 'ri-file-user-line',
    section: 'Comercial'
  },
  {
    id: '9',
    name: 'Ações em massa',
    url: '/acoes-massa',
    icon: 'ri-list-check-2',
    section: 'Comercial'
  },

  // Jurídico
  {
    id: '10',
    name: 'Acompanhamento Processual',
    url: '/acompanhamento-processual',
    icon: 'ri-scales-3-line',
    section: 'Jurídico'
  },
  {
    id: '11',
    name: 'Compliance',
    url: '/compliance',
    icon: 'ri-shield-check-line',
    section: 'Jurídico'
  },

  // Dados
  {
    id: '12',
    name: 'Importar',
    url: '/importar',
    icon: 'ri-upload-2-line',
    section: 'Dados'
  },
  {
    id: '13',
    name: 'Relatórios',
    url: '/relatorios',
    icon: 'ri-file-chart-line',
    section: 'Dados'
  },

  // Gestão
  {
    id: '14',
    name: 'Equipe',
    url: '/equipe',
    icon: 'ri-team-line',
    section: 'Gestão'
  },
  {
    id: '15',
    name: 'Automações',
    url: '/automacoes',
    icon: 'ri-robot-line',
    section: 'Gestão'
  },
  {
    id: '16',
    name: 'Configurações',
    url: '/configuracoes',
    icon: 'ri-settings-3-line',
    section: 'Gestão'
  },
  {
    id: '17',
    name: 'Onboarding',
    url: '/onboarding',
    icon: 'ri-guide-line',
    section: 'Gestão'
  }
]

export default data
