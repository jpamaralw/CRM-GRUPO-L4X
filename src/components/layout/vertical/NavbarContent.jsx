// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import L4Notifications from '@components/layout/shared/L4Notifications'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

// Vars
const shortcuts = [
  {
    url: '/pipeline?pipeline=PROSPECCAO',
    icon: 'ri-search-line',
    title: 'Prospecção',
    subtitle: 'Pipeline de leads'
  },
  {
    url: '/pipeline?pipeline=NEGOCIACAO',
    icon: 'ri-handshake-line',
    title: 'Negociação',
    subtitle: 'Fechamentos'
  },
  {
    url: '/acompanhamento-processual',
    icon: 'ri-scales-3-line',
    title: 'Acompanhamento',
    subtitle: 'Movimentações DataJud'
  },
  {
    url: '/resultados',
    icon: 'ri-bar-chart-grouped-line',
    title: 'Resultados',
    subtitle: 'Funil e metas'
  },
  {
    url: '/equipe',
    icon: 'ri-team-line',
    title: 'Equipe',
    subtitle: 'Membros L4'
  },
  {
    url: '/dashboards/crm',
    icon: 'ri-dashboard-line',
    title: 'Dashboard',
    subtitle: 'Visão geral'
  }
]

const NavbarContent = () => {
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-[7px]'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center'>
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <L4Notifications />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
