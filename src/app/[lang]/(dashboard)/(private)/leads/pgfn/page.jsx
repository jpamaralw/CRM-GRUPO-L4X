// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

// Mock data — substituir por query Prisma/API quando DB estiver configurado
const MOCK_LEADS = [
  { cnpj: '15.699.215/0001-10', nome: 'JESSICA RUFINO RODRIGUES ALIMENTOS', fantasia: 'SUPERMERCADO SEMPRE BOM', valor: 'R$ 1.999.064,19', situacao: 'ATIVA', telefone: '61991068875', email: 'supermercado@email.com', status: 'NOVO' },
  { cnpj: '72.602.618/0001-32', nome: 'MAGNESAT MATERIAIS ELETRICOS E ELETRONICOS LTDA', fantasia: 'MAGNESAT DISTRIBUIDORA', valor: 'R$ 1.998.681,54', situacao: 'ATIVA', telefone: '61991068875', email: 'magnesatdf@hotmail.com', status: 'QUALIFICADO' },
  { cnpj: '10.340.574/0001-55', nome: 'PAI & FILHOS COMERCIO DE ALIMENTOS EIRELI', fantasia: '', valor: 'R$ 1.997.210,00', situacao: 'INAPTA', telefone: '', email: '', status: 'NOVO' },
  { cnpj: '05.421.760/0001-80', nome: 'CONSTRUCOES E REFORMAS LTDA', fantasia: 'CR CONSTRUCOES', valor: 'R$ 1.995.000,00', situacao: 'ATIVA', telefone: '61998765432', email: 'cr@construcoes.com.br', status: 'PROPOSTA' },
  { cnpj: '33.592.510/0001-48', nome: 'COMERCIO DE COMBUSTIVEIS BRASILIA LTDA', fantasia: 'POSTO BRASILIA', valor: 'R$ 1.990.500,00', situacao: 'SUSPENSA', telefone: '6132221100', email: '', status: 'NOVO' }
]

const STATUS_COLOR = { NOVO: 'default', QUALIFICADO: 'info', PROPOSTA: 'warning', FECHADO: 'success', PERDIDO: 'error' }
const SITUACAO_COLOR = { ATIVA: 'success', INAPTA: 'error', SUSPENSA: 'warning', BAIXADA: 'error' }

export default async function LeadsPGFNPage() {
  const mode = await getServerMode()

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={12}>
        <Typography variant='h4' fontWeight={700} color='primary'>
          Leads PGFN — Devedores Fiscais DF
        </Typography>
        <Typography variant='body2' color='text.secondary' mt={1}>
          Lista de devedores da Receita Federal enriquecida via Assertiva. Filtro: DF | R$100k–R$2M | 14.881 CNPJs
        </Typography>
      </Grid>

      {/* KPI Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant='h3' color='primary' fontWeight={700}>14.881</Typography>
            <Typography variant='body2' color='text.secondary'>Total Leads PGFN</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant='h3' color='success.main' fontWeight={700}>282</Typography>
            <Typography variant='body2' color='text.secondary'>Com Telefone</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant='h3' color='info.main' fontWeight={700}>135</Typography>
            <Typography variant='body2' color='text.secondary'>Com E-mail</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant='h3' color='warning.main' fontWeight={700}>803</Typography>
            <Typography variant='body2' color='text.secondary'>Enriquecidos</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' mb={3}>Leads (amostra — importar XLSX completo para ver todos)</Typography>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1A237E', color: '#fff' }}>
                    {['CNPJ', 'Razão Social', 'Valor Dívida', 'Situação', 'Telefone', 'E-mail', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LEADS.map((lead, i) => (
                    <tr key={lead.cnpj} style={{ background: i % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{lead.cnpj}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{lead.nome}</div>
                        {lead.fantasia && <div style={{ color: '#666', fontSize: 11 }}>{lead.fantasia}</div>}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1B5E20' }}>{lead.valor}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <Chip label={lead.situacao} color={SITUACAO_COLOR[lead.situacao] || 'default'} size='small' />
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{lead.telefone || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{lead.email || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <Chip label={lead.status} color={STATUS_COLOR[lead.status] || 'default'} size='small' variant='outlined' />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Typography variant='caption' color='text.secondary' mt={2} display='block'>
              💡 Para carregar todos os leads: importar Downloads/PGFN_Enriquecida_*.xlsx via API ou conectar ao banco Prisma.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
