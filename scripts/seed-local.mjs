/**
 * Local SQLite seeder for the Bijos & Silva Neto Advogados CRM demo.
 * Reads CSVs from ../l4-leads-judiciais/reports (if present) and dedupes by numero_processo.
 * Falls back to a small inline sample when CSVs are missing.
 *
 * Usage: node scripts/seed-local.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORTS = path.resolve(__dirname, '../../l4-leads-judiciais/reports')

const SOURCES = [
  { file: 'hubspot_lote1_COMPLETO.csv', tier: 1 },
  { file: 'hubspot_lote2_COMPLETO.csv', tier: 1 },
  { file: 'ENTREGA_PublicoCredor_Ineditos_2026-04-07.csv', tier: 2 },
  { file: 'Tributarios_v2_2026-03-31.csv', tier: 3 },
  { file: 'ENTREGA_Tributarios_v2_2026-03-31.csv', tier: 3 },
  { file: 'ENTREGA_TJGO_Ineditos_2026-04-01.csv', tier: 3 },
  { file: 'ENTREGA_Estado_GO_Ineditos_2026-04-01.csv', tier: 3 },
  { file: 'leads_perfeitos_estado_credor.csv', tier: 3 },
  { file: 'quase_perfeitos.csv', tier: 3 },
  { file: 'leads_sem_advogado.csv', tier: 3 },
  { file: 'top35_alvos.csv', tier: 3 },
  { file: 'ENTREGA_Lote2_2026-03-30.csv', tier: 4 }
]

const HUBSPOT_STAGE = {
  appointmentscheduled: 'PROSPECÇÃO',
  qualifiedtobuy: 'QUALIFICAÇÃO',
  presentationscheduled: 'PROPOSTA',
  decisionmakerboughtin: 'PROPOSTA',
  contractsent: 'DUE DILIGENCE',
  closedwon: 'FECHADO',
  closedlost: 'PERDIDO'
}

async function parseCSV(filePath) {
  const rows = []
  const stream = fs.createReadStream(filePath)
  const rl = createInterface({ input: stream, crlfDelay: Infinity })
  let headers = null

  for await (const line of rl) {
    if (!line.trim()) continue
    if (!headers) {
      const clean = line.replace(/^﻿/, '')
      headers = clean.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      continue
    }
    const fields = []
    let current = ''
    let inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === ',' && !inQuote) { fields.push(current); current = ''; continue }
      current += ch
    }
    fields.push(current)
    const row = {}
    headers.forEach((h, i) => { row[h] = (fields[i] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

function firstCompany(str) {
  if (!str) return null
  return str.split(/;\s*/)[0].trim() || null
}

function normalizeValor(str) {
  if (!str) return null
  let s = str.replace(/R\$\s*/g, '').trim()
  if (/\d{1,3}(,\d{3})+\.\d/.test(s)) s = s.replace(/,/g, '')
  else if (/\d{1,3}(\.\d{3})+,\d/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(s)
  if (isNaN(num)) return str
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function deriveStage(row) {
  if (row.dealstage) return HUBSPOT_STAGE[row.dealstage] ?? 'PROSPECÇÃO'
  return 'PROSPECÇÃO'
}

function normalizeRow(row) {
  const processo = (row.numero_processo || '').trim()
  if (!processo) return null
  const reu = firstCompany(row.reu || row.reu_devedor || row.polo_passivo || null)
  const autor = row.autor || row.credor_autor || row.polo_ativo || row.autor_credor || null
  const nome = reu || autor || row.dealname || processo
  const tribunal = (row.tribunal || row.tribunal_origem || '').toUpperCase() || null
  const cnpj = (row.cnpj_empresa || '').trim() || null
  const valorRaw = row.valor_causa || row.valor_formatado || (row.amount ? `${row.amount}` : null)
  const valorCausa = normalizeValor(valorRaw)
  const citacao = row.citacao_status || row.citacao || row.citacao_projudi || null
  const link = row.link_processo || null
  const notas = row.notas_l4 || null
  const tipo = row.tipo || row.classe || row.classe_nome || 'Execução Fiscal'
  const stage = deriveStage(row)
  return { processo, nome, tribunal, cnpj, valorCausa, citacao, link, notas, tipo, stage }
}

const FALLBACK_LEADS = [
  { processo: 'DEMO-001', nome: 'Construtora Aurora Ltda', tribunal: 'TJGO', cnpj: '12345678000101', valorCausa: 'R$ 1.250.000,00', citacao: 'Efetivada', link: null, notas: null, tipo: 'Execução Fiscal', stage: 'PROSPECÇÃO' },
  { processo: 'DEMO-002', nome: 'Transbrasil Logística S.A.', tribunal: 'TJSP', cnpj: '98765432000188', valorCausa: 'R$ 3.480.000,00', citacao: 'Pendente', link: null, notas: null, tipo: 'Precatório', stage: 'QUALIFICAÇÃO' },
  { processo: 'DEMO-003', nome: 'Agropecuária Cerrado Verde', tribunal: 'TRF1', cnpj: '45678912000133', valorCausa: 'R$ 890.000,00', citacao: 'Efetivada', link: null, notas: null, tipo: 'RPV', stage: 'PROPOSTA' },
  { processo: 'DEMO-004', nome: 'Indústrias Metalúrgicas Goiás', tribunal: 'TJGO', cnpj: '78912345000122', valorCausa: 'R$ 2.150.000,00', citacao: 'Efetivada', link: null, notas: null, tipo: 'Execução Fiscal', stage: 'DUE DILIGENCE' },
  { processo: 'DEMO-005', nome: 'Comercial Tropical do Brasil', tribunal: 'TJGO', cnpj: '15975385000144', valorCausa: 'R$ 540.000,00', citacao: 'Efetivada', link: null, notas: null, tipo: 'Sentença', stage: 'FECHADO' },
  { processo: 'DEMO-006', nome: 'Distribuidora Solaris', tribunal: 'TJDF', cnpj: '35795185000155', valorCausa: 'R$ 1.780.000,00', citacao: 'Pendente', link: null, notas: null, tipo: 'Execução Fiscal', stage: 'PROSPECÇÃO' }
]

async function main() {
  await prisma.$connect()

  const merged = new Map()
  let csvCount = 0

  if (fs.existsSync(REPORTS)) {
    for (const { file, tier } of SOURCES) {
      const filePath = path.join(REPORTS, file)
      if (!fs.existsSync(filePath)) continue
      console.log(`Reading [tier ${tier}] ${file}`)
      const rows = await parseCSV(filePath)
      csvCount += rows.length
      for (const row of rows) {
        const data = normalizeRow(row)
        if (!data) continue
        const existing = merged.get(data.processo)
        if (!existing || tier < existing.tier) merged.set(data.processo, { tier, data })
      }
    }
  } else {
    console.log(`No CSV reports at ${REPORTS} — using fallback sample leads`)
  }

  const records = merged.size > 0
    ? [...merged.values()].map(v => v.data)
    : FALLBACK_LEADS

  console.log(`Seeding ${records.length} leads...`)
  let created = 0, errored = 0
  for (const data of records) {
    const cnpjKey = data.cnpj || data.processo
    try {
      const lead = await prisma.lead.upsert({
        where: { cnpj: cnpjKey },
        create: { cnpj: cnpjKey, nome: data.nome, origem: 'JUDICIAL', status: 'NOVO', situacao: data.citacao || null },
        update: { nome: data.nome, situacao: data.citacao || null }
      })
      const pipelineId = `seed-${data.processo}`
      const exists = await prisma.pipelineAtivo.findUnique({ where: { id: pipelineId } })
      if (!exists) {
        await prisma.pipelineAtivo.create({
          data: {
            id: pipelineId,
            leadId: lead.id,
            tipo: String(data.tipo || 'Execução Fiscal').slice(0, 100),
            tribunal: data.tribunal,
            valorCausa: data.valorCausa,
            fase: data.notas?.slice(0, 200) || data.citacao || null,
            stage: data.stage || 'PROSPECÇÃO',
            linkProcesso: data.link
          }
        })
        created++
      }
    } catch (e) {
      errored++
      if (errored < 5) console.error(`  ERROR ${data.processo}: ${e.message}`)
    }
  }

  console.log('\n=== SEED COMPLETE ===')
  console.log(`CSVs read   : ${csvCount}`)
  console.log(`Unique leads: ${records.length}`)
  console.log(`Created     : ${created}`)
  console.log(`Errors      : ${errored}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
