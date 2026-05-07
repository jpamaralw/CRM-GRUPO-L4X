import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'

const STAGES = ['PROSPECÇÃO', 'QUALIFICAÇÃO', 'PROPOSTA', 'DUE DILIGENCE', 'FECHADO']
const STAGE_COLOR = { 'PROSPECÇÃO': 'default', 'QUALIFICAÇÃO': 'info', 'PROPOSTA': 'warning', 'DUE DILIGENCE': 'secondary', 'FECHADO': 'success' }

const MOCK_PIPELINE = [
  { id: 1, lead: 'MAGNESAT DISTRIBUIDORA', cnpj: '72.602.618/0001-32', tipo: 'PRECATORIO', tribunal: 'TJDFT', valor: 'R$ 1.998.681,54', fase: 'Cumprimento de Sentença', responsavel: 'SDR João', stage: 'QUALIFICAÇÃO' },
  { id: 2, lead: 'SUPERMERCADO SEMPRE BOM', cnpj: '15.699.215/0001-10', tipo: 'RPV', tribunal: 'TRF1', valor: 'R$ 1.999.064,19', fase: 'Precatório Expedido', responsavel: 'Closer Ana', stage: 'PROPOSTA' },
  { id: 3, lead: 'CR CONSTRUCOES', cnpj: '05.421.760/0001-80', tipo: 'SENTENCA', tribunal: 'TJGO', valor: 'R$ 1.995.000,00', fase: 'Sentença Favorável', responsavel: 'SDR Carlos', stage: 'PROSPECÇÃO' },
]

export default async function PipelinePage() {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Typography variant='h4' fontWeight={700} color='primary'>Pipeline — Ativos Judiciais</Typography>
        <Typography variant='body2' color='text.secondary' mt={1}>Precatórios • RPVs • Sentenças | L4 Ativos</Typography>
      </Grid>

      {STAGES.map(stage => (
        <Grid key={stage} size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' fontWeight={700}>{MOCK_PIPELINE.filter(p => p.stage === stage).length}</Typography>
              <Chip label={stage} color={STAGE_COLOR[stage]} size='small' sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' mb={3}>Ativos em Negociação</Typography>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1A237E', color: '#fff' }}>
                    {['Lead', 'CNPJ', 'Tipo', 'Tribunal', 'Valor Causa', 'Fase', 'Responsável', 'Estágio'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PIPELINE.map((item, i) => (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{item.lead}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11 }}>{item.cnpj}</td>
                      <td style={{ padding: '8px 12px' }}><Chip label={item.tipo} size='small' color='primary' variant='outlined' /></td>
                      <td style={{ padding: '8px 12px' }}>{item.tribunal}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1B5E20' }}>{item.valor}</td>
                      <td style={{ padding: '8px 12px' }}>{item.fase}</td>
                      <td style={{ padding: '8px 12px' }}>{item.responsavel}</td>
                      <td style={{ padding: '8px 12px' }}><Chip label={item.stage} color={STAGE_COLOR[item.stage]} size='small' /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
