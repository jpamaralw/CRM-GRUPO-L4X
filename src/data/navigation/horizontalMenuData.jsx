const horizontalMenuData = dictionary => [
  {
    label: 'Dashboard',
    icon: 'ri-dashboard-line',
    href: '/dashboards/crm'
  },
  {
    label: 'CRM L4 Ativos',
    icon: 'ri-briefcase-line',
    children: [
      {
        label: 'Prospecção',
        icon: 'ri-search-line',
        href: '/pipelines/prospeccao',
        suffix: {
          label: 'SDR',
          color: 'info'
        }
      },
      {
        label: 'Negociação',
        icon: 'ri-handshake-line',
        href: '/pipelines/negociacao',
        suffix: {
          label: 'Closer',
          color: 'warning'
        }
      },
      {
        label: 'Pós-Venda',
        icon: 'ri-user-star-line',
        href: '/pipelines/pos-venda',
        suffix: {
          label: 'Gestão',
          color: 'success'
        }
      },
      {
        label: 'Todos os Leads',
        icon: 'ri-group-line',
        href: '/leads'
      }
    ]
  },
  {
    label: 'Gestão',
    icon: 'ri-bar-chart-grouped-line',
    children: [
      {
        label: 'Resultados',
        icon: 'ri-bar-chart-grouped-line',
        href: '/resultados'
      },
      {
        label: 'Equipe',
        icon: 'ri-team-line',
        href: '/equipe'
      },
      {
        label: 'Automações',
        icon: 'ri-robot-line',
        href: '/automacoes'
      },
      {
        label: 'Importar Leads',
        icon: 'ri-upload-cloud-line',
        href: '/importar'
      }
    ]
  },
  {
    label: 'Sistema',
    icon: 'ri-settings-3-line',
    children: [
      {
        label: 'Calendário',
        icon: 'ri-calendar-line',
        href: '/apps/calendar'
      },
      {
        label: 'Configurações',
        icon: 'ri-settings-3-line',
        href: '/configuracoes'
      }
    ]
  }
]

export default horizontalMenuData
