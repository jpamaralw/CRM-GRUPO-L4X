'use client'

import { useParams } from 'next/navigation'

import { useTheme } from '@mui/material/styles'

import PerfectScrollbar from 'react-perfect-scrollbar'

import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { lang: locale } = useParams()

  const { isBreakpointReached, transitionDuration } = verticalNavOptions
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
        <MenuItem href={`/${locale}/dashboards/crm`} icon={<i className='ri-dashboard-line' />}>
          Dashboard
        </MenuItem>

        <MenuSection label='Comercial'>
          <SubMenu label='Pipelines' icon={<i className='ri-git-branch-line' />}>
            <MenuItem href={`/${locale}/pipelines/prospeccao`}>Prospecao</MenuItem>
            <MenuItem href={`/${locale}/pipelines/negociacao`}>Negociacao</MenuItem>
            <MenuItem href={`/${locale}/pipelines/pos-venda`}>Pos-venda</MenuItem>
          </SubMenu>
          <MenuItem href={`/${locale}/leads`} icon={<i className='ri-group-line' />}>
            Leads
          </MenuItem>
        </MenuSection>

        <MenuSection label='Juridico'>
          <MenuItem href={`/${locale}/acompanhamento-processual`} icon={<i className='ri-scales-3-line' />}>
            Acompanhamento Processual
          </MenuItem>
        </MenuSection>

        <MenuSection label='Gestao'>
          <MenuItem href={`/${locale}/equipe`} icon={<i className='ri-team-line' />}>
            Equipe
          </MenuItem>
          <MenuItem href={`/${locale}/automacoes`} icon={<i className='ri-robot-line' />}>
            Automacoes
          </MenuItem>
          <MenuItem href={`/${locale}/configuracoes`} icon={<i className='ri-settings-3-line' />}>
            Configuracoes
          </MenuItem>
        </MenuSection>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
