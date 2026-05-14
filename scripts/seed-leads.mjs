/**
 * Comprehensive lead seed — merges all 12 CSV sources from l4-leads-judiciais/reports.
 * Deduplicates by numero_processo. Priority: hubspot > publicoCredor > others.
 * Usage: node scripts/seed-leads.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORTS = path.resolve(__dirname, '../../l4-leads-judiciais/reports')

// HubSpot dealstage → L4 stage
const HUBSPOT_STAGE = {
  appointmentscheduled:  'PROSPECÇÃO',
  qualifiedtobuy:        'QUALIFICAÇÃO',
  presentationscheduled: 'PROPOSTA',
  decisionmakerboughtin: 'PROPOSTA',
  contractsent:          'DUE DILIGENCE',
  closedwon:             'FECHADO',
  closedlost:            'PERDIDO'
}

// All CSV files to ingest, in priority order (first wins on conflicts)
const SOURCES = [
  // Tier 1 — HubSpot (has dealstage, notas, link)
  { file: 'hubspot_lote1_COMPLETO.csv',               tier: 1 },
  { file: 'hubspot_lote2_COMPLETO.csv',               tier: 1 },
  // Tier 2 — has CNPJ or link
  { file: 'ENTREGA_PublicoCredor_Ineditos_2026-04-07.csv', tier: 2 },
  // Tier 3 — rich data (reu, tipo, prioridade)
  { file: 'Tributarios_v2_2026-03-31.csv',            tier: 3 },
  { file: 'ENTREGA_Tributarios_v2_2026-03-31.csv',    tier: 3 },
  { file: 'ENTREGA_TJGO_Ineditos_2026-04-01.csv',     tier: 3 },
  { file: 'ENTREGA_Estado_GO_Ineditos_2026-04-01.csv',tier: 3 },
  { file: 'leads_perfeitos_estado_credor.csv',        tier: 3 },
  { file: 'quase_perfeitos.csv',                      tier: 3 },
  { file: 'leads_sem_advogado.csv',                   tier: 3 },
  { file: 'top35_alvos.csv',                          tier: 3 },
  // Tier 4 — minimal data
  { file: 'ENTREGA_Lote2_2026-03-30.csv',             tier: 4 },
]

async function parseCSV(filePath) {
  const rows = []
  const stream = fs.createReadStream(filePath)
  const rl = createInterface({ input: stream, crlfDelay: Infinity })
  let headers = null

  for await (const line of rl) {
    if (!line.trim()) continue
    if (!headers) {
      // strip BOM if present
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
  // Take the first company before "; " separator, trim whitespace
  return str.split(/;\s*/)[0].trim() || null
}

function normalizeValor(str) {
  if (!str) return null
  // Strip currency symbol and spaces
  let s = str.replace(/R\$\s*/g, '').trim()
  // Detect format: "69,905,667.19" (EN) vs "69.905.667,19" (PT)
  if (/\d{1,3}(,\d{3})+\.\d/.test(s)) {
    // English format: remove commas → parse
    s = s.replace(/,/g, '')
  } else if (/\d{1,3}(\.\d{3})+,\d/.test(s)) {
    // Portuguese format: remove dots, replace comma → parse
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const num = parseFloat(s)
  if (isNaN(num)) return str
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function deriveStage(row) {
  if (row.dealstage) return HUBSPOT_STAGE[row.dealstage] ?? 'PROSPECÇÃO'
  const p = (row.prioridade || row.prioridade_l4 || row.status_lead || '').toUpperCase()
  if (p.includes('URGENTE') || p.includes('MAXIMA') || p.includes('PERFEITO')) return 'PROSPECÇÃO'
  if (p.includes('ALTA'))    return 'PROSPECÇÃO'
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

  const valorRaw = row.valor_causa || row.valor_formatado ||
    (row.amount ? `${row.amount}` : null)
  const valorCausa = normalizeValor(valorRaw)

  const citacao = row.citacao_status || row.citacao || row.citacao_projudi || null
  const link = row.link_processo || null
  const notas = row.notas_l4 || null
  const tipo = row.tipo || row.classe || row.classe_nome || 'Execução Fiscal'
  const stage = deriveStage(row)

  return { processo, nome, tribunal, cnpj, valorCausa, citacao, link, notas, tipo, stage }
}

async function main() {
  const DB_URL = process.env.DATABASE_URL
  if (!DB_URL || !DB_URL.startsWith('postgresql')) {
    console.error('ERROR: DATABASE_URL must be a postgresql:// connection string.')
    console.error(`Got: ${DB_URL}`)
    process.exit(1)
  }

  console.log('Connecting to Neon...')
  await prisma.$connect()

  // Run schema migrations
  console.log('Ensuring schema columns exist...')
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PipelineAtivo" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'PROSPECÇÃO'
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PipelineAtivo" ADD COLUMN IF NOT EXISTS "linkProcesso" TEXT
  `)

  // Merge all sources into a map keyed by numero_processo
  // Lower tier number = higher priority (wins on merge)
  const merged = new Map() // processo → { tier, data }

  for (const { file, tier } of SOURCES) {
    const filePath = path.join(REPORTS, file)
    if (!fs.existsSync(filePath)) { console.warn(`  SKIP (not found): ${file}`); continue }

    console.log(`Reading [tier ${tier}] ${file}...`)
    const rows = await parseCSV(filePath)
    let added = 0, updated = 0

    for (const row of rows) {
      const data = normalizeRow(row)
      if (!data) continue

      const existing = merged.get(data.processo)
      if (!existing) {
        merged.set(data.processo, { tier, data })
        added++
      } else if (tier < existing.tier) {
        // Higher priority source: replace entirely
        merged.set(data.processo, { tier, data })
        updated++
      } else if (tier === existing.tier) {
        // Same tier: fill in missing fields
        const d = existing.data
        if (!d.cnpj && data.cnpj)           d.cnpj = data.cnpj
        if (!d.link && data.link)           d.link = data.link
        if (!d.notas && data.notas)         d.notas = data.notas
        if (!d.valorCausa && data.valorCausa) d.valorCausa = data.valorCausa
        if (!d.citacao && data.citacao)     d.citacao = data.citacao
        updated++
      }
    }
    console.log(`  ${rows.length} rows → ${added} new, ${updated} merged`)
  }

  console.log(`\nTotal unique leads: ${merged.size}`)
  console.log('Seeding database...\n')

  let created = 0, updated = 0, errored = 0

  for (const { data } of merged.values()) {
    const cnpjKey = data.cnpj || data.processo

    try {
      const lead = await prisma.lead.upsert({
        where: { cnpj: cnpjKey },
        create: {
          cnpj:    cnpjKey,
          nome:    data.nome,
          origem:  'JUDICIAL',
          status:  'NOVO',
          situacao: data.citacao || null
        },
        update: {
          nome:    data.nome,
          situacao: data.citacao || null
        }
      })

      const pipelineId = `seed-${data.processo}`
      const exists = await prisma.pipelineAtivo.findUnique({ where: { id: pipelineId } })

      if (!exists) {
        await prisma.pipelineAtivo.create({
          data: {
            id:           pipelineId,
            leadId:       lead.id,
            tipo:         data.tipo.slice(0, 100),
            tribunal:     data.tribunal,
            valorCausa:   data.valorCausa,
            fase:         data.notas?.slice(0, 200) || data.citacao || null,
            stage:        data.stage,
            linkProcesso: data.link
          }
        })
        created++
      } else {
        await prisma.pipelineAtivo.update({
          where: { id: pipelineId },
          data: {
            tribunal:     data.tribunal     || exists.tribunal,
            valorCausa:   data.valorCausa   || exists.valorCausa,
            stage:        data.stage        || exists.stage,
            linkProcesso: data.link         || exists.linkProcesso,
            fase:         data.notas?.slice(0, 200) || data.citacao || exists.fase
          }
        })
        updated++
      }
    } catch (e) {
      console.error(`  ERROR ${data.processo}: ${e.message}`)
      errored++
    }
  }

  console.log('\n=== SEED COMPLETE ===')
  console.log(`Created : ${created}`)
  console.log(`Updated : ${updated}`)
  console.log(`Errors  : ${errored}`)
  console.log(`Total   : ${created + updated}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
