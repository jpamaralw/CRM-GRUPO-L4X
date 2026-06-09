const verticalMenuData = () => [
  // ── Operação principal — L4 Ativos ────
  {
    label: 'L4 Ativos',
    isSection: true,
    children: [
      {
        label: 'Dashboard',
        icon: 'ri-dashboard-3-line',
        href: '/dashboards/crm'
      },
      {
        label: 'Pipeline',
        icon: 'ri-drag-drop-line',
        href: '/pipeline'
      },
      {
        label: 'Leads',
        icon: 'ri-user-search-line',
        children: [
          { label: 'Todos os Leads', href: '/leads/pgfn' },
          { label: 'Pipeline Kanban', href: '/pipeline' }
        ]
      },
      {
        label: 'Processos',
        icon: 'ri-scales-3-line',
        href: '/pipeline'
      },
      {
        label: 'Agenda',
        icon: 'ri-calendar-event-line',
        href: '/apps/calendar'
      },
      {
        label: 'Quadro Kanban',
        icon: 'ri-drag-drop-line',
        href: '/apps/kanban'
      },
      {
        label: 'E-mail',
        icon: 'ri-mail-open-line',
        href: '/apps/email',
        exactMatch: false,
        activeUrl: '/apps/email'
      }
    ]
  },
  {
    label: 'Financeiro',
    isSection: true,
    children: [
      {
        label: 'Honorários',
        icon: 'ri-bill-line',
        children: [
          { label: 'Listar', href: '/apps/invoice/list' },
          { label: 'Nova fatura', href: '/apps/invoice/add' }
        ]
      }
    ]
  },
  {
    label: 'Equipe',
    isSection: true,
    children: [
      {
        label: 'Advogados & Equipe',
        icon: 'ri-team-line',
        children: [
          { label: 'Lista', href: '/apps/user/list' },
          { label: 'Perfil', href: '/apps/user/view' }
        ]
      },
      {
        label: 'Cargos & Permissões',
        icon: 'ri-shield-keyhole-line',
        children: [
          { label: 'Cargos', href: '/apps/roles' },
          { label: 'Permissões', href: '/apps/permissions' }
        ]
      }
    ]
  },
  {
    label: 'Indicadores',
    isSection: true,
    children: [
      {
        label: 'Estatísticas',
        icon: 'ri-line-chart-line',
        href: '/pages/widget-examples/statistics'
      },
      {
        label: 'Ranking Equipe',
        icon: 'ri-trophy-line',
        href: '/pages/widget-examples/gamification'
      },
      {
        label: 'Gráficos',
        icon: 'ri-bar-chart-box-line',
        href: '/pages/widget-examples/charts'
      },
      {
        label: 'Ações Rápidas',
        icon: 'ri-flashlight-line',
        href: '/pages/widget-examples/actions'
      }
    ]
  },
  {
    label: 'Configurações',
    isSection: true,
    children: [
      {
        label: 'Meu Perfil',
        icon: 'ri-user-line',
        href: '/pages/user-profile'
      },
      {
        label: 'Conta',
        icon: 'ri-settings-3-line',
        href: '/pages/account-settings'
      }
    ]
  }
]

export default verticalMenuData
