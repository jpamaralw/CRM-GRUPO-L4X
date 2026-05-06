// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'

const PIPELINE_ATIVOS = [
  {
    lead: 'JESSICA RUFINO RODRIGUES ALIMENTOS',
    tipo: 'PRECATORIO',
    tribunal: 'TRF1',
    valor: 'R$ 420.000,00',
    fase: 'Prospecção',
    responsavel: 'Equipe L4',
    status: 'ABERTO'
  },
  {
    lead: 'MAGNESAT MATERIAIS ELETRICOS E ELETRONICOS LTDA',
    tipo: 'RPV',
    tribunal: 'TJDFT',
    valor: 'R$ 58.400,00',
    fase: 'Análise documental',
    responsavel: 'Comercial',
    status: 'EM_ANALISE'
  },
  {
    lead: 'PAI & FILHOS COMERCIO DE ALIMENTOS EIRELI',
    tipo: 'PRECATORIO',
    tribunal: 'TRT10',
    valor: 'R$ 185.900,00',
    fase: 'Contato inicial',
    responsavel: 'Operações',
    status: 'NOVO'
  },
  {
    lead: 'CONSTRUCOES E REFORMAS LTDA',
    tipo: 'RPV',
    tribunal: 'TRF1',
    valor: 'R$ 41.200,00',
    fase: 'Proposta enviada',
    responsavel: 'Equipe L4',
    status: 'PROPOSTA'
  }
]

const STATUS_COLOR = {
  NOVO: 'default',
  ABERTO: 'info',
  EM_ANALISE: 'warning',
  PROPOSTA: 'primary',
  FECHADO: 'success',
  PERDIDO: 'error'
}

const TIPO_COLOR = {
  PRECATORIO: 'primary',
  RPV: 'success'
}

export default function PipelineAtivosPage() {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Typography variant='h4' fontWeight={700} color='primary'>
          Pipeline Ativos
        </Typography>
        <Typography variant='body2' color='text.secondary' mt={1}>
          Acompanhamento de oportunidades em precatórios e RPVs vinculadas aos leads PGFN.
        </Typography>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant='h6' mb={3}>
              Oportunidades
            </Typography>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1A237E', color: '#fff' }}>
                    {['Lead', 'Tipo', 'Tribunal', 'Valor', 'Fase', 'Responsável', 'Status'].map(header => (
                      <th key={header} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PIPELINE_ATIVOS.map((ativo, index) => (
                    <tr
                      key={`${ativo.lead}-${ativo.tipo}`}
                      style={{ background: index % 2 === 0 ? '#f8f9fa' : '#fff' }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{ativo.lead}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Chip
                          label={ativo.tipo}
                          color={TIPO_COLOR[ativo.tipo] || 'default'}
                          size='small'
                          variant='tonal'
                        />
                      </td>
                      <td style={{ padding: '10px 12px' }}>{ativo.tribunal}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1B5E20' }}>{ativo.valor}</td>
                      <td style={{ padding: '10px 12px' }}>{ativo.fase}</td>
                      <td style={{ padding: '10px 12px' }}>{ativo.responsavel}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Chip
                          label={ativo.status.replace('_', ' ')}
                          color={STATUS_COLOR[ativo.status] || 'default'}
                          size='small'
                          variant='outlined'
                        />
                      </td>
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
