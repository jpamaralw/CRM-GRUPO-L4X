'use client'

import { useParams } from 'next/navigation'

import { useTheme } from '@mui/material/styles'

import { useSession } from 'next-auth/react'

import PerfectScrollbar from 'react-perfect-scrollbar'

import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import {
  canViewPipeline,
  canViewAcompanhamento,
  canManageTeam,
  canManageAutomations,
  canAccessSettings,
  canManageMetaLeads
} from '@/utils/permissions'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { lang: locale } = useParams()
  const { data: session } = useSession()
  const role = session?.user?.role

  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const showProspeccao = canViewPipeline(role, 'PROSPECCAO')
  const showNegociacao = canViewPipeline(role, 'NEGOCIACAO')
  const showPosVenda = canViewPipeline(role, 'POS_VENDA')
  const showComercial = showProspeccao || showNegociacao || showPosVenda
  const showJuridico = canViewAcompanhamento(role)
  const showEquipe = canManageTeam(role)
  const showAutomacoes = canManageAutomations(role)
  const showConfig = canAccessSettings(role)
  const showGestao = showEquipe || showAutomacoes || showConfig
  const showMeta = canManageMetaLeads(role)

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

        {showComercial && (
          <MenuSection label='Comercial'>
            <SubMenu label='Pipelines' icon={<i className='ri-git-branch-line' />} defaultOpen>
              {showProspeccao && <MenuItem href={`/${locale}/pipeline?pipeline=PROSPECCAO`}>Prospecção</MenuItem>}
              {showNegociacao && <MenuItem href={`/${locale}/pipeline?pipeline=NEGOCIACAO`}>Negociação</MenuItem>}
              {showPosVenda && <MenuItem href={`/${locale}/pipeline?pipeline=POS_VENDA`}>Pós-venda</MenuItem>}
            </SubMenu>
            <MenuItem href={`/${locale}/resultados`} icon={<i className='ri-bar-chart-grouped-line' />}>
              Resultados
            </MenuItem>
            {showMeta && (
              <MenuItem href={`/${locale}/meta-leads`} icon={<i className='ri-meta-line' />}>
                Meta Ads
              </MenuItem>
            )}
          </MenuSection>
        )}

        {showJuridico && (
          <MenuSection label='Jurídico'>
            <MenuItem href={`/${locale}/acompanhamento-processual`} icon={<i className='ri-scales-3-line' />}>
              Acompanhamento Processual
            </MenuItem>
          </MenuSection>
        )}

        {showGestao && (
          <MenuSection label='Gestão'>
            {showEquipe && (
              <MenuItem href={`/${locale}/equipe`} icon={<i className='ri-team-line' />}>
                Equipe
              </MenuItem>
            )}
            {showAutomacoes && (
              <MenuItem href={`/${locale}/automacoes`} icon={<i className='ri-robot-line' />}>
                Automações
              </MenuItem>
            )}
            {showConfig && (
              <MenuItem href={`/${locale}/configuracoes`} icon={<i className='ri-settings-3-line' />}>
                Configurações
              </MenuItem>
            )}
          </MenuSection>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
