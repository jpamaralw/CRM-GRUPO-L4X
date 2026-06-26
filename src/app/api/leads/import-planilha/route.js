import { NextResponse } from 'next/server'

import * as XLSX from 'xlsx'

import prisma from '@/libs/prisma'
import { getCurrentUser } from '@/libs/serverAuth'
import { ROLES } from '@/utils/permissions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const IMPORT_ROLES = [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI]

const CNJ_DIGITS = /\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}/

const TRIBUNAL_MAP = {
  '8.09': 'TJGO', '8.07': 'TJDFT', '8.13': 'TJMG', '8.26': 'TJSP',
  '8.19': 'TJRJ', '8.06': 'TJPE', '8.05': 'TJBA', '4.01': 'TRF1', '4.03': 'TRF3'
}

// remove acento + lowercase para casar cabeçalhos
const norm = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const findKey = (row, patterns) => {
  const keys = Object.keys(row)

  for (const p of patterns) {
    const k = keys.find(key => p.test(norm(key)))

    if (k) return k
  }

  return null
}

const parseValor = v => {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  const s = String(v).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)

  return Number.isFinite(n) ? n : null
}

const fmtCNJ = raw => {
  const d = String(raw || '').replace(/\D/g, '')

  if (d.length !== 20) return null

  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`
}

const tribunalFromNumero = numero => {
  const m = numero.match(/^\d{7}-\d{2}\.\d{4}\.(\d\.\d{2})\.\d{4}$/)

  return (m && TRIBUNAL_MAP[m[1]]) || null
}

export async function POST(request) {
  const user = await getCurrentUser()

  if (!user?.isActive || !IMPORT_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão para importar' }, { status: 403 })
  }

  let buffer

  try {
    const form = await request.formData()
    const file = form.get('file')

    if (!file) return NextResponse.json({ error: 'Envie um arquivo .xlsx' }, { status: 400 })
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'Falha ao ler o arquivo' }, { status: 400 })
  }

  let workbook

  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    return NextResponse.json({ error: 'Arquivo inválido (não é uma planilha)' }, { status: 400 })
  }

  const resumo = { abas: 0, linhas: 0, criados: 0, atualizados: 0, ignorados: 0, semProcesso: 0 }
  const exemplos = []

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null })

    if (!rows.length) continue
    resumo.abas++

    // Detecta colunas a partir do primeiro registro
    const sample = rows[0]
    const kProc = findKey(sample, [/processo/, /cnj/])
    const kParte = findKey(sample, [/parte/, /autor/, /cliente/, /cedente/, /nome/])
    const kValor = findKey(sample, [/valor.*bruto/, /valor.*causa/, /valor.*liquido/, /valor/])
    const kTel = findKey(sample, [/telefone/, /celular/, /whats/, /fone/, /contato/])
    const kMail = findKey(sample, [/e-?mail/])
    const kSit = findKey(sample, [/situacao/, /status/, /movimentacao/])

    for (const row of rows) {
      resumo.linhas++

      // tenta achar nº do processo na coluna detectada ou em qualquer célula
      let numero = kProc ? fmtCNJ(row[kProc]) : null

      if (!numero) {
        for (const v of Object.values(row)) {
          const m = v && CNJ_DIGITS.test(String(v)) ? fmtCNJ(String(v).match(CNJ_DIGITS)[0]) : null

          if (m) { numero = m; break }
        }
      }

      if (!numero) { resumo.semProcesso++; continue }

      const autor = kParte ? (row[kParte] ? String(row[kParte]).trim() : null) : null
      const valorCausa = kValor ? parseValor(row[kValor]) : null
      const telefone = kTel && row[kTel] ? String(row[kTel]).trim() : null
      const email = kMail && row[kMail] ? String(row[kMail]).trim().toLowerCase() : null
      const detalhes = kSit && row[kSit] ? String(row[kSit]).trim() : null
      const tribunal = tribunalFromNumero(numero)

      try {
        const existing = await prisma.lead.findUnique({ where: { numeroProcesso: numero } })

        if (existing) {
          await prisma.lead.update({
            where: { numeroProcesso: numero },
            data: {
              autor: existing.autor || autor,
              valorCausa: existing.valorCausa ?? valorCausa,
              telefone: existing.telefone || telefone,
              email: existing.email || email,
              detalhes: existing.detalhes || detalhes
            }
          })
          resumo.atualizados++
        } else {
          await prisma.lead.create({
            data: {
              numeroProcesso: numero,
              tribunal: tribunal || 'N/D',
              autor,
              valorCausa,
              telefone,
              email,
              detalhes,
              pipeline: 'PROSPECCAO',
              statusCrm: 'NOVO',
              origem: `Planilha: ${sheetName}`.slice(0, 80),
              grupo: 'RPV'
            }
          })
          resumo.criados++
          if (exemplos.length < 5) exemplos.push({ numero, autor, valorCausa })
        }
      } catch {
        resumo.ignorados++
      }
    }
  }

  return NextResponse.json({ ok: true, resumo, exemplos })
}
