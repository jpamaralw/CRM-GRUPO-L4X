import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { consultarProcesso } from '@/libs/datajud'
import { getCurrentUser } from '@/libs/serverAuth'
import { canViewAcompanhamento } from '@/utils/permissions'
import { sendEmail } from '@/libs/email'
import { buildDigestHtml, resolveDigestRecipients } from '@/libs/acompanhamentoDigest'
import { getSetting } from '@/libs/settings'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DEFAULT_LIMIT = 150

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// Limite configurável nas Configurações; usado quando a chamada não envia limit explícito.
async function settingLimit() {
  const raw = Number(await getSetting('consulta_daily_limit'))

  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 200) : DEFAULT_LIMIT
}

// Autoriza por (a) header de cron com API_SECRET_KEY ou (b) usuário logado com permissão.
async function authorize(request) {
  const headerKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  const cronHeader = request.headers.get('x-vercel-cron')

  if (cronHeader) return { ok: true, via: 'cron' }
  if (process.env.API_SECRET_KEY && headerKey === process.env.API_SECRET_KEY) return { ok: true, via: 'apikey' }

  const user = await getCurrentUser()

  if (user?.isActive && canViewAcompanhamento(user.role)) return { ok: true, via: 'user', user }

  return { ok: false }
}

export async function GET(request) {
  const auth = await authorize(request)

  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const explicit = Number(searchParams.get('limit'))
  const limit = explicit ? Math.min(Math.max(explicit, 1), 200) : await settingLimit()

  // Envia o relatório por e-mail aos Drs quando rodando via cron ou com ?digest=1
  const sendDigest = auth.via === 'cron' || searchParams.get('digest') === '1'

  return runConsulta(limit, { sendDigest })
}

export async function POST(request) {
  const auth = await authorize(request)

  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let limit = await settingLimit()
  let sendDigest = auth.via === 'cron'

  try {
    const body = await request.json().catch(() => ({}))

    if (body?.limit) limit = Math.min(Math.max(Number(body.limit) || limit, 1), 200)
    if (body?.digest) sendDigest = true
  } catch {
    /* sem body */
  }

  return runConsulta(limit, { sendDigest })
}

async function runConsulta(limit, { sendDigest = false } = {}) {
  const processos = await prisma.processoMonitorado.findMany({
    where: { status: 'ATIVO' },
    orderBy: [{ ultimaConsultaAt: { sort: 'asc', nulls: 'first' } }],
    take: limit
  })

  const run = await prisma.consultaProcessualRun.create({
    data: { status: 'RUNNING', totalProcessos: processos.length }
  })

  let consultados = 0
  let novasMovimentacoes = 0
  let erros = 0
  const detalhes = []
  const novidades = []

  for (const processo of processos) {
    const resultado = await consultarProcesso({
      numeroProcesso: processo.numeroProcesso,
      tribunal: processo.tribunal
    })

    if (!resultado.ok) {
      erros++
      detalhes.push(`${processo.numeroProcesso}: ${resultado.error}`)
      await prisma.processoMonitorado.update({
        where: { id: processo.id },
        data: { statusConsulta: 'ERRO_CONSULTA', ultimaConsultaAt: new Date() }
      })
      await sleep(1200)
      continue
    }

    consultados++

    // Movimentações já registradas (por hash)
    const existentes = await prisma.movimentacaoMonitorada.findMany({
      where: { processoMonitoradoId: processo.id },
      select: { hash: true }
    })

    const hashesExistentes = new Set(existentes.map(m => m.hash))

    const novas = resultado.movimentos.filter(m => !hashesExistentes.has(m.hash))

    if (novas.length) {
      await prisma.movimentacaoMonitorada.createMany({
        data: novas.map(m => ({
          processoMonitoradoId: processo.id,
          dataMovimento: m.dataHora ? new Date(m.dataHora) : null,
          descricao: m.nome || 'Movimentação',
          hash: m.hash,
          fonte: 'DATAJUD',
          nova: true,
          visualizada: false
        })),
        skipDuplicates: true
      })
      novasMovimentacoes += novas.length
    }

    const ultima = resultado.movimentos[resultado.movimentos.length - 1]

    // Se nunca tinha sido consultado, a primeira carga não conta como "novidade"
    const jaConsultado = !!processo.ultimaConsultaAt
    const temNovidadeReal = jaConsultado && novas.length > 0

    // Coleta novidades reais para o relatório por e-mail
    if (temNovidadeReal) {
      novas.forEach(m =>
        novidades.push({
          numeroProcesso: processo.numeroProcesso,
          cliente: processo.cliente,
          tribunal: processo.tribunal,
          descricao: m.nome || 'Movimentação',
          dataMovimento: m.dataHora || null
        })
      )
    }

    await prisma.processoMonitorado.update({
      where: { id: processo.id },
      data: {
        statusConsulta: temNovidadeReal ? 'NOVA_MOVIMENTACAO' : 'SEM_NOVIDADE',
        ultimaConsultaAt: new Date(),
        ultimaMovimentacaoAt: ultima?.dataHora ? new Date(ultima.dataHora) : processo.ultimaMovimentacaoAt,
        ultimaMovimentacaoTexto: ultima?.nome || processo.ultimaMovimentacaoTexto
      }
    })

    await sleep(1200)
  }

  const finalizado = await prisma.consultaProcessualRun.update({
    where: { id: run.id },
    data: {
      status: 'CONCLUIDO',
      finishedAt: new Date(),
      consultados,
      novasMovimentacoes,
      erros,
      detalhes: detalhes.slice(0, 50).join('\n') || null
    }
  })

  // Relatório diário por e-mail aos Drs (Fábio/Natane) + gestores em cópia
  let emailResult = null

  if (sendDigest) {
    try {
      const { to, cc } = await resolveDigestRecipients()

      if (to.length) {
        const totalMonitorados = await prisma.processoMonitorado.count({ where: { status: 'ATIVO' } })

        const html = buildDigestHtml({
          run: { ...finalizado, totalProcessos: totalMonitorados },
          novidades
        })

        emailResult = await sendEmail({
          to,
          cc,
          subject: `Acompanhamento Processual L4 — ${novidades.length} novidade(s) · ${new Date().toLocaleDateString('pt-BR')}`,
          html
        })
      } else {
        emailResult = { ok: false, error: 'Sem destinatários (cadastre Drs/advogados ou EMAIL_ACOMPANHAMENTO)' }
      }
    } catch (err) {
      emailResult = { ok: false, error: err.message }
    }
  }

  return NextResponse.json({
    ok: true,
    runId: finalizado.id,
    totalProcessos: processos.length,
    consultados,
    novasMovimentacoes,
    erros,
    email: emailResult
  })
}
