import { redirect } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableContainer from '@mui/material/TableContainer'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'

import prisma from '@/libs/prisma'
import { requireCurrentUser } from '@/libs/serverAuth'
import { canManageTeam } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const ROLE_LABEL = {
  SDR: 'SDR',
  CLOSER: 'Closer',
  GESTOR: 'Gestor',
  SOCIO: 'Sócio',
  TI: 'TI',
  ADVOGADO: 'Advogado',
  RECEPCAO: 'Recepção',
  FINANCEIRO: 'Financeiro',
  FINANCEIRO_SDR: 'Financeiro/SDR',
  PAPELADA: 'Papelada'
}

const ROLE_COLOR = {
  SDR: 'info',
  CLOSER: 'warning',
  GESTOR: 'primary',
  SOCIO: 'secondary',
  TI: 'error',
  ADVOGADO: 'success'
}

const initials = name =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')

export default async function EquipePage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  if (!user || !canManageTeam(user.role)) redirect(`/${params.lang}/dashboards/crm`)

  const usuarios = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      _count: { select: { leadsAssigned: true } }
    }
  })

  const ativos = usuarios.filter(u => u.isActive).length

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          Equipe
        </Typography>
        <Typography color='text.secondary'>
          {usuarios.length} membros · {ativos} ativos
        </Typography>
      </div>

      <Card>
        <CardContent>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Membro</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell align='right'>Leads atribuídos</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map(u => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>{initials(u.name)}</Avatar>
                        <span className='font-medium'>{u.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip size='small' label={ROLE_LABEL[u.role] || u.role} color={ROLE_COLOR[u.role] || 'default'} variant='tonal' />
                    </TableCell>
                    <TableCell align='right'>{u._count.leadsAssigned}</TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={u.isActive ? 'Ativo' : 'Inativo'}
                        color={u.isActive ? 'success' : 'default'}
                        variant='outlined'
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  )
}
