'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { toast } from 'react-toastify'

const TEMPLATES = {
  whatsapp: [
    {
      id: 'qualif-inicial',
      nome: 'Qualificação Inicial',
      categoria: 'Prospecção',
      icon: 'ri-whatsapp-line',
      color: 'success',
      template: `Olá {{NOME}}! 👋

Tudo bem? Sou {{SEU_NOME}} da L4 Ativos.

Vim acompanhando o processo {{PROCESSO}} e vejo que você pode se beneficiar de uma antecipação de crédito.

Você teria uns 15 minutos para conversar esta semana?

Abraços!
L4 Ativos`
    },
    {
      id: 'confirmar-reuniao',
      nome: 'Confirmar Reunião',
      categoria: 'Negociação',
      icon: 'ri-whatsapp-line',
      color: 'success',
      template: `Oi {{NOME}}! 📅

Só confirmando nossa reunião:
📍 {{DATA}}
⏰ {{HORA}}

Qualquer dúvida, me avisa!

Abraço,
{{SEU_NOME}}`
    },
    {
      id: 'proposta-enviada',
      nome: 'Proposta Enviada',
      categoria: 'Negociação',
      icon: 'ri-whatsapp-line',
      color: 'success',
      template: `{{NOME}}, tudo certo! ✅

Acabei de enviar a proposta para seu e-mail:
📧 {{EMAIL}}

Revisa com calma e me retorna com dúvidas.

Estou aqui para ajudar! 💪
{{SEU_NOME}}`
    },
    {
      id: 'follow-up-proposta',
      nome: 'Follow-up Proposta',
      categoria: 'Negociação',
      icon: 'ri-whatsapp-line',
      color: 'success',
      template: `Oi {{NOME}}! 👋

Vendo se você teve chance de revisar a proposta que enviei.

Alguma dúvida? Posso ajudar em qualquer coisa!

Me retorna assim que puder?

{{SEU_NOME}}`
    }
  ],
  email: [
    {
      id: 'apresentacao',
      nome: 'Apresentação da L4',
      categoria: 'Prospecção',
      icon: 'ri-mail-line',
      color: 'primary',
      template: `Assunto: Antecipação de Crédito Judicial — L4 Ativos

Prezado {{NOME}},

Espero que esteja bem!

Meu nome é {{SEU_NOME}} e trabalho na L4 Ativos há {{TEMPO}} anos. Somos especializados em antecipação de crédito judicial para precatórios, RPV e ativos tributários.

Analisando seus processos, identificamos uma oportunidade de **antecipar até X%** do valor, com **aprovação em até 48h**.

Seria interessante agendar uma conversa de 15 minutos?

Fico no aguardo!

Abraços,
{{SEU_NOME}}
L4 Ativos
{{TELEFONE}}`
    },
    {
      id: 'proposta-formal',
      nome: 'Proposta Formal',
      categoria: 'Negociação',
      icon: 'ri-mail-line',
      color: 'primary',
      template: `Assunto: Proposta de Antecipação — {{PROCESSO}}

Prezado {{NOME}},

Conforme conversado em {{DATA}}, segue em anexo a proposta customizada para seus processos.

**Resumo da oferta:**
- Valor antecipado: R$ {{VALOR}}
- Taxa: {{TAXA}}%
- Aprovação: {{PRAZO}} dias
- Liberação: {{LIBERACAO}} dias

Para prosseguir, precisaremos de:
1. Documentação dos processos
2. Assinatura do contrato
3. Abertura de conta corrente (se necessário)

Alguma dúvida? Fico à disposição!

{{SEU_NOME}}
L4 Ativos
{{TELEFONE}}`
    },
    {
      id: 'agradecimento',
      nome: 'Agradecimento Pós-Fechamento',
      categoria: 'Pós-Venda',
      icon: 'ri-mail-line',
      color: 'primary',
      template: `Assunto: Obrigado por escolher a L4 Ativos!

Prezado {{NOME}},

É com prazer que confirmamos a aprovação e liberação dos seus recursos!

**Contrato:** {{CONTRATO}}
**Data de liberação:** {{DATA_LIBERACAO}}
**Valor liberado:** R$ {{VALOR}}

Seu gerente de conta é {{GERENTE_NOME}} — ele entrará em contato para acompanhamento.

Obrigado por confiar na L4 Ativos! 🙏

Abraços,
{{SEU_NOME}}
L4 Ativos`
    }
  ]
}

const TemplateCard = ({ template, onCopy, onEdit }) => {
  const Icon = template.icon

  return (
    <Card className='h-full hover:shadow-lg transition-shadow'>
      <CardContent className='flex flex-col gap-3 h-full'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <Typography variant='subtitle2' className='font-semibold'>
              {template.nome}
            </Typography>
            <Chip size='small' variant='outlined' label={template.categoria} className='mt-1' />
          </div>
          <Tooltip title={template.icon.includes('whatsapp') ? 'WhatsApp' : 'E-mail'}>
            <i
              className={`${template.icon} text-[20px]`}
              style={{ color: `var(--mui-palette-${template.color}-main)` }}
            />
          </Tooltip>
        </div>

        <Typography variant='body2' className='text-gray-600 dark:text-gray-300 line-clamp-4 flex-1'>
          {template.template}
        </Typography>

        <div className='flex gap-2 pt-2'>
          <Button size='small' variant='outlined' fullWidth onClick={() => onCopy(template)} startIcon={<i className='ri-file-copy-line' />}>
            Copiar
          </Button>
          <Button size='small' variant='text' onClick={() => onEdit(template)}>
            <i className='ri-edit-line' />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('whatsapp')
  const [editOpen, setEditOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const templates = selectedCategory === 'whatsapp' ? TEMPLATES.whatsapp : TEMPLATES.email

  const handleCopy = template => {
    navigator.clipboard.writeText(template.template)
    toast.success('Template copiado! Cole no seu app preferido.')
  }

  const handleEdit = template => {
    setEditingTemplate({ ...template })
    setEditOpen(true)
  }

  const handleSaveEdit = () => {
    toast.success('Template salvo! (Em desenvolvimento)')
    setEditOpen(false)
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-semibold'>
          📝 Templates de Mensagens
        </Typography>
        <Typography color='text.secondary'>Use e customize modelos prontos para economizar tempo</Typography>
      </div>

      {/* Tabs */}
      <div className='flex gap-3'>
        <Button
          variant={selectedCategory === 'whatsapp' ? 'contained' : 'outlined'}
          onClick={() => setSelectedCategory('whatsapp')}
          startIcon={<i className='ri-whatsapp-line' />}
        >
          WhatsApp ({TEMPLATES.whatsapp.length})
        </Button>
        <Button
          variant={selectedCategory === 'email' ? 'contained' : 'outlined'}
          onClick={() => setSelectedCategory('email')}
          startIcon={<i className='ri-mail-line' />}
        >
          E-mail ({TEMPLATES.email.length})
        </Button>
      </div>

      {/* Grid */}
      <Grid container spacing={4}>
        {templates.map(template => (
          <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <TemplateCard template={template} onCopy={handleCopy} onEdit={handleEdit} />
          </Grid>
        ))}
      </Grid>

      {/* Dialog edição */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Editar Template</DialogTitle>
        <DialogContent className='pt-4'>
          {editingTemplate && (
            <div className='flex flex-col gap-4'>
              <TextField label='Nome' value={editingTemplate.nome} fullWidth size='small' />
              <TextField
                label='Conteúdo'
                value={editingTemplate.template}
                onChange={e => setEditingTemplate({ ...editingTemplate, template: e.target.value })}
                multiline
                minRows={6}
                fullWidth
              />
              <Typography variant='caption' color='text.secondary'>
                Use variáveis: {'{'}NOME{'}'}, {'{'}EMAIL{'}'}, {'{'}TELEFONE{'}'}, {'{'}SEU_NOME{'}'}, etc.
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant='contained'>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
