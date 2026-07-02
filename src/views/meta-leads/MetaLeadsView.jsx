'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

import CustomAvatar from '@core/components/mui/Avatar'

const fmt = d => (d ? new Date(d).toLocaleString('pt-BR') : '—')
const fmtDate = d => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

const STATUS_COLOR = {
  NOVO: 'info',
  PESQUISANDO: 'default',
  CONTATO_INICIAL: 'warning',
  QUALIFICADO: 'success',
  DESCARTADO: 'error'
}

export default function MetaLeadsView({
  configured,
  webhookUrl,
  totalLeads,
  leadsHoje,
  recentLeads,
  recentEvents,
  byCampaign
}) {
  const [formId, setFormId] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  async function handleSync() {
    if (!formId.trim()) return

    setSyncing(true)
    setSyncResult(null)

    try {
      const res = await fetch('/api/meta/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: formId.trim() })
      })

      const data = await res.json()

      if (data.ok) {
        setSyncResult({ type: 'success', msg: `Importados: ${data.criados} novos, ${data.atualizados} atualizados, ${data.erros} erros.` })
      } else {
        setSyncResult({ type: 'error', msg: data.error || 'Erro desconhecido' })
      }
    } catch {
      setSyncResult({ type: 'error', msg: 'Falha de rede' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div>
        <Typography variant='h4' className='font-semibold'>
          Meta Lead Ads
        </Typography>
        <Typography color='text.secondary'>
          Leads captados por campanhas no Facebook e Instagram
        </Typography>
      </div>

      {/* Setup alert */}
      {!configured && (
        <Alert
          severity='warning'
          icon={<i className='ri-meta-line' />}
          action={
            <Button
              size='small'
              variant='outlined'
              color='warning'
              href='https://developers.facebook.com/apps/'
              target='_blank'
            >
              Meta for Devs
            </Button>
          }
        >
          <Typography variant='subtitle2' gutterBottom>
            Integração Meta não configurada
          </Typography>
          <Typography variant='body2'>
            Adicione as variáveis de ambiente abaixo no Vercel para ativar o recebimento automático de leads:
          </Typography>
          <Box component='ul' sx={{ mt: 1, mb: 0, pl: 2 }}>
            <li><code>META_APP_ID</code> — ID do app no Meta for Developers</li>
            <li><code>META_APP_SECRET</code> — Chave secreta do app</li>
            <li><code>META_VERIFY_TOKEN</code> — Token que você inventa (ex: <code>l4-crm-2026</code>)</li>
            <li><code>META_PAGE_ACCESS_TOKEN</code> — Token de acesso permanente da Página</li>
            <li><code>META_PAGE_ID</code> — ID numérico da Página do Facebook</li>
          </Box>
          <Typography variant='body2' sx={{ mt: 1 }}>
            URL do webhook a configurar no app Meta: <code>{webhookUrl}</code>
          </Typography>
        </Alert>
      )}

      {configured && (
        <Alert severity='success' icon={<i className='ri-check-line' />}>
          Integração ativa. Webhook: <code>{webhookUrl}</code>
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent className='flex items-center gap-4'>
              <CustomAvatar color='primary' skin='light' variant='rounded' size={48}>
                <i className='ri-user-add-line text-2xl' />
              </CustomAvatar>
              <div>
                <Typography variant='h4'>{totalLeads}</Typography>
                <Typography variant='body2' color='text.secondary'>Total de leads Meta</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent className='flex items-center gap-4'>
              <CustomAvatar color='success' skin='light' variant='rounded' size={48}>
                <i className='ri-flashlight-line text-2xl' />
              </CustomAvatar>
              <div>
                <Typography variant='h4'>{leadsHoje}</Typography>
                <Typography variant='body2' color='text.secondary'>Recebidos hoje</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent className='flex items-center gap-4'>
              <CustomAvatar color='info' skin='light' variant='rounded' size={48}>
                <i className='ri-megaphone-line text-2xl' />
              </CustomAvatar>
              <div>
                <Typography variant='h4'>{byCampaign.length}</Typography>
                <Typography variant='body2' color='text.secondary'>Campanhas com leads</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={6}>
        {/* Leads por campanha */}
        {byCampaign.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className='bs-full'>
              <CardHeader title='Por campanha' />
              <Divider />
              <CardContent className='flex flex-col gap-3'>
                {byCampaign.map(r => (
                  <div key={r.campaign} className='flex items-center justify-between'>
                    <Typography variant='body2' className='truncate' sx={{ maxWidth: 200 }}>
                      {r.campaign}
                    </Typography>
                    <Chip size='small' label={r.count} color='primary' variant='tonal' />
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Sync manual */}
        <Grid size={{ xs: 12, md: byCampaign.length > 0 ? 8 : 12 }}>
          <Card>
            <CardHeader
              title='Sincronização manual'
              subheader='Importa todos os leads de um formulário Meta específico (útil para backfill inicial)'
            />
            <Divider />
            <CardContent className='flex flex-col gap-4'>
              {!configured && (
                <Alert severity='info' sx={{ mb: 1 }}>
                  Configure as variáveis de ambiente Meta para habilitar a sincronização.
                </Alert>
              )}
              <div className='flex gap-3 items-start'>
                <TextField
                  label='ID do formulário Meta (Form ID)'
                  placeholder='Ex: 1234567890123456'
                  value={formId}
                  onChange={e => setFormId(e.target.value)}
                  size='small'
                  disabled={!configured || syncing}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant='contained'
                  onClick={handleSync}
                  disabled={!configured || syncing || !formId.trim()}
                  startIcon={<i className={syncing ? 'ri-loader-4-line animate-spin' : 'ri-download-cloud-2-line'} />}
                >
                  {syncing ? 'Importando...' : 'Importar'}
                </Button>
              </div>
              {syncResult && (
                <Alert severity={syncResult.type}>{syncResult.msg}</Alert>
              )}
              <Typography variant='caption' color='text.secondary'>
                O Form ID fica em Meta Business Manager → Ferramentas → Formulários de lead → clique no formulário → copie o ID da URL.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent events log */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader
            title='Eventos recentes do webhook'
            subheader='Últimas 15 notificações recebidas do Meta'
          />
          <Divider />
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Lead ID (Meta)</TableCell>
                <TableCell>Formulário</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Recebido em</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentEvents.map(ev => (
                <TableRow key={ev.leadgenId} hover>
                  <TableCell>
                    <Typography variant='caption' className='font-mono'>{ev.leadgenId}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>{ev.formId || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    {ev.processed ? (
                      <Chip size='small' label='Processado' color='success' variant='tonal' />
                    ) : ev.error ? (
                      <Chip size='small' label='Erro' color='error' variant='tonal' title={ev.error} />
                    ) : (
                      <Chip size='small' label='Pendente' color='warning' variant='tonal' />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>{fmt(ev.createdAt)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Leads table */}
      <Card>
        <CardHeader
          title='Leads captados pelo Meta'
          subheader={`${totalLeads} total — últimos 50 listados`}
        />
        <Divider />
        {recentLeads.length === 0 ? (
          <CardContent>
            <Typography color='text.secondary' align='center'>
              Nenhum lead Meta ainda. Configure o webhook e inicie uma campanha para começar a receber.
            </Typography>
          </CardContent>
        ) : (
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Campanha</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>Recebido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentLeads.map(lead => (
                <TableRow key={lead.id} hover>
                  <TableCell>
                    <Typography variant='body2'>{lead.autor || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    {lead.telefone ? (
                      <a
                        href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary'
                      >
                        {lead.telefone}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>{lead.email || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption' color='text.secondary'>
                      {lead.metaCampaignName || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={lead.statusCrm}
                      color={STATUS_COLOR[lead.statusCrm] || 'default'}
                      variant='tonal'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>{lead.assignedTo?.name || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='caption'>{fmtDate(lead.createdAt)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Setup guide */}
      <Card>
        <CardHeader title='Guia de configuração — Meta Lead Ads' />
        <Divider />
        <CardContent>
          <ol className='flex flex-col gap-3 pl-4 list-decimal'>
            <li>
              <Typography variant='body2'>
                <strong>Criar app no Meta for Developers</strong> → acesse developers.facebook.com → Meus Apps → Criar app → tipo &quot;Lead access&quot;.
              </Typography>
            </li>
            <li>
              <Typography variant='body2'>
                <strong>Adicionar produto &quot;Lead Ads&quot;</strong> ao app e vincular à Página do Facebook da L4.
              </Typography>
            </li>
            <li>
              <Typography variant='body2'>
                <strong>Gerar Page Access Token permanente</strong> via Graph API Explorer → selecionar a Página → permissões <code>leads_retrieval</code> + <code>pages_read_engagement</code> → gerar token de longa duração.
              </Typography>
            </li>
            <li>
              <Typography variant='body2'>
                <strong>Configurar variáveis no Vercel</strong>: <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, <code>META_VERIFY_TOKEN</code> (escolha qualquer string secreta), <code>META_PAGE_ACCESS_TOKEN</code>, <code>META_PAGE_ID</code>.
              </Typography>
            </li>
            <li>
              <Typography variant='body2'>
                <strong>Configurar webhook no app Meta</strong>: em Webhooks → Página → URL: <code>{webhookUrl}</code> → Token de verificação: o valor que você definiu em <code>META_VERIFY_TOKEN</code> → assinar o evento <code>leadgen</code>.
              </Typography>
            </li>
            <li>
              <Typography variant='body2'>
                <strong>Importar leads anteriores</strong>: use o campo &quot;Sincronização manual&quot; acima com o Form ID do formulário da campanha.
              </Typography>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
