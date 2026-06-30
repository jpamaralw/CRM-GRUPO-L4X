import prisma from '@/libs/prisma'

// Definição das configurações editáveis da operação (chave -> metadados).
export const SETTINGS_SCHEMA = {
  digest_extra_recipients: {
    label: 'Destinatários extras do relatório diário',
    help: 'E-mails adicionais (separados por vírgula) que recebem o digest de acompanhamento, além dos advogados/gestores.',
    type: 'text',
    default: ''
  },
  consulta_daily_limit: {
    label: 'Limite de processos por consulta',
    help: 'Quantos processos são consultados no DataJud a cada execução (automática ou manual).',
    type: 'number',
    default: '150'
  },
  email_signature: {
    label: 'Assinatura do e-mail',
    help: 'Texto exibido no rodapé do relatório enviado aos Drs.',
    type: 'text',
    default: 'L4 Ativos · CRM Jurídico'
  }
}

// Lê todas as configurações, aplicando defaults para chaves ausentes.
export async function getSettings() {
  const rows = await prisma.setting.findMany()
  const stored = Object.fromEntries(rows.map(r => [r.key, r.value]))

  const result = {}

  for (const [key, meta] of Object.entries(SETTINGS_SCHEMA)) {
    result[key] = stored[key] ?? meta.default
  }

  return result
}

// Lê uma única configuração com fallback ao default.
export async function getSetting(key) {
  const row = await prisma.setting.findUnique({ where: { key } })

  return row?.value ?? SETTINGS_SCHEMA[key]?.default ?? null
}

// Persiste um conjunto de configurações (apenas chaves conhecidas).
export async function saveSettings(values, userId) {
  const ops = Object.entries(values)
    .filter(([key]) => key in SETTINGS_SCHEMA)
    .map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value ?? ''), updatedBy: userId || null },
        update: { value: String(value ?? ''), updatedBy: userId || null }
      })
    )

  await prisma.$transaction(ops)
}
