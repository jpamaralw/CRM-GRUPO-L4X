import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { consultarProcesso } from '@/libs/datajud'
import { getCurrentUser } from '@/libs/serverAuth'
import { canViewAcompanhamento } from '@/utils/permissions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

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
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200)

  return runConsulta(limit)
}

export async function POST(request) {
  const auth = await authorize(request)

  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let limit = 50

  try {
    const body = await request.json().catch(() => ({}))

    if (body?.limit) limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200)
  } catch {
    /* sem body */
  }

  return runConsulta(limit)
}

async function runConsulta(limit) {
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

  return NextResponse.json({
    ok: true,
    runId: finalizado.id,
    totalProcessos: processos.length,
    consultados,
    novasMovimentacoes,
    erros
  })
}
