const verticalMenuData = dictionary => [
  {
    label: 'Dashboard',
    icon: 'ri-dashboard-line',
    href: '/dashboards/crm'
  },
  {
    label: 'CRM L4 Ativos',
    isSection: true,
    children: [
      {
        label: 'Prospecção',
        icon: 'ri-search-line',
        href: '/pipeline?pipeline=PROSPECCAO',
        suffix: {
          label: 'SDR',
          color: 'info'
        }
      },
      {
        label: 'Negociação',
        icon: 'ri-handshake-line',
        href: '/pipeline?pipeline=NEGOCIACAO',
        suffix: {
          label: 'Closer',
          color: 'warning'
        }
      },
      {
        label: 'Pós-Venda',
        icon: 'ri-user-star-line',
        href: '/pipeline?pipeline=POS_VENDA',
        suffix: {
          label: 'Gestão',
          color: 'success'
        }
      }
    ]
  },
  {
    label: 'Gestão',
    isSection: true,
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
    isSection: true,
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

export default verticalMenuData
