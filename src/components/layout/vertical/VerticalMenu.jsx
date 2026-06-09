// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { lang: locale } = params
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuSection label='CRM Jurídico'>
          <MenuItem href={`/${locale}/dashboards/crm`} icon={<i className='ri-dashboard-3-line' />}>
            Dashboard
          </MenuItem>
          <SubMenu label='Leads & Pipeline' icon={<i className='ri-user-search-line' />}>
            <MenuItem href={`/${locale}/leads/pgfn`}>Todos os Leads</MenuItem>
            <MenuItem href={`/${locale}/pipeline`}>Pipeline Kanban</MenuItem>
          </SubMenu>
          <MenuItem href={`/${locale}/apps/calendar`} icon={<i className='ri-calendar-event-line' />}>
            Agenda
          </MenuItem>
          <MenuItem
            href={`/${locale}/apps/email`}
            icon={<i className='ri-mail-open-line' />}
            exactMatch={false}
            activeUrl='/apps/email'
          >
            E-mail
          </MenuItem>
          <MenuItem href={`/${locale}/apps/kanban`} icon={<i className='ri-drag-drop-line' />}>
            Quadro de Tarefas
          </MenuItem>
          <MenuItem href={`/${locale}/apps/chat`} icon={<i className='ri-wechat-line' />}>
            Chat Interno
          </MenuItem>
        </MenuSection>

        <MenuSection label='Financeiro'>
          <SubMenu label='Honorários' icon={<i className='ri-bill-line' />}>
            <MenuItem href={`/${locale}/apps/invoice/list`}>Listar</MenuItem>
            <MenuItem href={`/${locale}/apps/invoice/add`}>Nova fatura</MenuItem>
            <MenuItem
              href={`/${locale}/apps/invoice/preview/4987`}
              exactMatch={false}
              activeUrl='/apps/invoice/preview'
            >
              Visualizar
            </MenuItem>
          </SubMenu>
        </MenuSection>

        <MenuSection label='Equipe'>
          <SubMenu label='Advogados & Equipe' icon={<i className='ri-team-line' />}>
            <MenuItem href={`/${locale}/apps/user/list`}>Lista</MenuItem>
            <MenuItem href={`/${locale}/apps/user/view`}>Perfil</MenuItem>
          </SubMenu>
          <SubMenu label='Cargos & Permissões' icon={<i className='ri-shield-keyhole-line' />}>
            <MenuItem href={`/${locale}/apps/roles`}>Cargos</MenuItem>
            <MenuItem href={`/${locale}/apps/permissions`}>Permissões</MenuItem>
          </SubMenu>
        </MenuSection>

        <MenuSection label='Indicadores'>
          <MenuItem href={`/${locale}/pages/widget-examples/statistics`} icon={<i className='ri-line-chart-line' />}>
            Estatísticas
          </MenuItem>
          <MenuItem href={`/${locale}/pages/widget-examples/gamification`} icon={<i className='ri-trophy-line' />}>
            Ranking da Equipe
          </MenuItem>
          <MenuItem href={`/${locale}/pages/widget-examples/charts`} icon={<i className='ri-bar-chart-box-line' />}>
            Gráficos
          </MenuItem>
          <MenuItem href={`/${locale}/pages/widget-examples/actions`} icon={<i className='ri-flashlight-line' />}>
            Ações Rápidas
          </MenuItem>
        </MenuSection>

        <MenuSection label='Configurações'>
          <MenuItem href={`/${locale}/pages/user-profile`} icon={<i className='ri-user-line' />}>
            Meu Perfil
          </MenuItem>
          <MenuItem href={`/${locale}/pages/account-settings`} icon={<i className='ri-settings-3-line' />}>
            Conta
          </MenuItem>
        </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
