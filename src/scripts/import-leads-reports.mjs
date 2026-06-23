/**
 * Importa leads das planilhas de ENTREGA (l4-leads-judiciais/reports) para o CRM.
 *
 * - Detecta colunas de forma flexível (ignora acentos/encoding).
 * - Normaliza número CNJ, valor da causa, telefone, e-mail.
 * - Calcula score e prioridade.
 * - Segmenta por grupo/lote e mantém todos em PROSPECCAO/NOVO (leads frescos).
 * - Cria/atualiza ProcessoMonitorado vinculado para alimentar o Acompanhamento Processual.
 *
 * Uso:  node src/scripts/import-leads-reports.mjs            (set curado padrão)
 *       node src/scripts/import-leads-reports.mjs <arquivo.xlsx> GRUPO TIPO
 */
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'

import { PrismaClient } from '@prisma/client'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const prisma = new PrismaClient()

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Neon (serverless) às vezes derruba a conexão sob carga — tenta de novo.
async function withRetry(fn, tries = 4) {
  let lastErr

  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (!/reach database|Closed|ECONNRESET|terminating|timeout/i.test(e.message)) throw e
      await sleep(800 * (i + 1))
    }
  }

  throw lastErr
}

const REPORTS_DIR = 'C:\\Users\\ppped\\l4-leads-judiciais\\reports'

// Set curado de entregas recentes e higienizadas (melhor qualidade de contato).
const CURATED = [
  { file: 'ENTREGA_RPV_TJGO_2026-06-18.xlsx', grupo: 'RPV_TJGO', tipo: 'RPV', abordagem: 'RPV_CREDOR' },
  { file: 'ENTREGA_Despejo_TJGO_HIGIENIZADOS_209.xlsx', grupo: 'DESPEJO_TJGO', tipo: 'DESPEJO', abordagem: 'DEFESA_DESPEJO' },
  { file: 'ENTREGA_TRF1_ExecFiscal_2026-05-05_HIGIENIZADA.xlsx', grupo: 'EXEC_FISCAL_TRF1', tipo: 'EXECUCAO_FISCAL', abordagem: 'DEFESA_TRIBUTARIA' }
]

// Infere grupo/tipo/abordagem a partir do nome do arquivo de entrega.
function inferMeta(filename) {
  const f = filename.toLowerCase()

  if (f.includes('rpv')) return { grupo: 'RPV_TJGO', tipo: 'RPV', abordagem: 'RPV_CREDOR' }
  if (f.includes('precatori')) return { grupo: 'PRECATORIO', tipo: 'PRECATORIO', abordagem: 'PRECATORIO_CREDOR' }
  if (f.includes('despejo')) return { grupo: 'DESPEJO_TJGO', tipo: 'DESPEJO', abordagem: 'DEFESA_DESPEJO' }
  if (f.includes('fiscal') || f.includes('tributar'))
    return { grupo: 'EXEC_FISCAL', tipo: 'EXECUCAO_FISCAL', abordagem: 'DEFESA_TRIBUTARIA' }

  return { grupo: 'OUTROS', tipo: 'LEAD', abordagem: null }
}

const CNJ_SEGMENT = {
  '8.26': 'TJSP', '8.07': 'TJDFT', '8.09': 'TJGO', '8.16': 'TJPR', '8.13': 'TJMG',
  '8.21': 'TJRS', '8.19': 'TJRJ', '8.05': 'TJBA', '8.17': 'TJPE', '8.20': 'TJRN',
  '4.01': 'TRF1', '4.02': 'TRF2', '4.03': 'TRF3', '4.04': 'TRF4', '4.05': 'TRF5'
}

const norm = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()

// Resolve um valor de coluna por palavras-chave (substring no nome normalizado).
function pick(row, keys, candidates) {
  for (const cand of candidates) {
    const c = norm(cand)
    const hit = keys.find(k => norm(k).includes(c))

    if (hit && row[hit] != null && String(row[hit]).trim() !== '') return row[hit]
  }

  return null
}

const clean = v => {
  if (v == null) return null
  const s = String(v).trim()

  return s === '' ? null : s
}

function formatCNJ(numero) {
  const d = String(numero ?? '').replace(/\D/g, '')

  if (d.length !== 20) return clean(numero)

  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`
}

function tribunalFromNumero(numero) {
  const d = String(numero ?? '').replace(/\D/g, '')

  if (d.length !== 20) return null
  const seg = `${d[13]}.${d.slice(14, 16)}`

  return CNJ_SEGMENT[seg] || null
}

function parseValor(v) {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  let s = String(v).replace(/r\$/i, '').trim().replace(/\s/g, '')

  // formato brasileiro: 1.234.567,89
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const n = Number(s.replace(/[^0-9.]/g, ''))

  return Number.isFinite(n) && n > 0 ? n : null
}

function parsePhone(v) {
  if (!v) return null
  // pega o primeiro número, preferindo um marcado com (WA)
  const tokens = String(v).split(/[|;,/]+/).map(t => t.trim()).filter(Boolean)
  const wa = tokens.find(t => /wa/i.test(t))
  const chosen = wa || tokens[0] || ''
  const d = chosen.replace(/\D/g, '')

  return d.length >= 10 ? d : null
}

function parseEmail(v) {
  if (!v) return null
  const m = String(v).match(/[\w.+-]+@[\w-]+\.[\w.-]+/)

  return m ? m[0].toLowerCase() : null
}

function parseDate(v) {
  if (v == null || v === '') return null
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)

    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d))
  }

  const s = String(v).trim()
  // dd/mm/yyyy
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)

  if (br) return new Date(Date.UTC(+br[3], +br[2] - 1, +br[1]))
  const iso = new Date(s)

  return Number.isNaN(iso.getTime()) ? null : iso
}

function computeScore({ valorCausa, prioridade, telefone, email, cnpj }) {
  let score = 0

  if (valorCausa) score += Math.min(50, Math.round(Math.log10(valorCausa + 1) * 9))
  if (prioridade && /80\s*anos|idos|priorit/i.test(prioridade)) score += 25
  if (telefone) score += 12
  if (email) score += 6
  if (cnpj) score += 7

  return Math.min(100, score)
}

const prioridadeFromScore = score => (score >= 60 ? 'ALTA' : score >= 35 ? 'MEDIA' : 'BAIXA')

async function importFile({ file, grupo, tipo, abordagem }) {
  const full = path.isAbsolute(file) ? file : path.join(REPORTS_DIR, file)
  const lote = path.basename(file).replace(/\.(xlsx|csv)$/i, '')

  console.log(`\n📂 ${file}  (grupo=${grupo})`)

  const wb = XLSX.read(fs.readFileSync(full), { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

  if (!rows.length) {
    console.log('   (vazia)')

    return { created: 0, updated: 0, skipped: 0 }
  }

  const keys = Object.keys(rows[0])
  let created = 0
  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const numeroRaw = pick(row, keys, ['numero processo', 'numero do processo', 'processo', 'no do processo', 'n do processo'])
    const numeroProcesso = formatCNJ(numeroRaw)

    if (!numeroProcesso || String(numeroProcesso).replace(/\D/g, '').length !== 20) {
      skipped++
      continue
    }

    const tribunal =
      clean(pick(row, keys, ['tribunal'])) || tribunalFromNumero(numeroProcesso) || 'DESCONHECIDO'

    const valorCausa = parseValor(pick(row, keys, ['valor da causa', 'valor causa', 'valor bruto']))
    const autor = clean(pick(row, keys, ['polo ativo', 'exequente', 'credor', 'autor', 'parte']))
    const reu = clean(pick(row, keys, ['polo passivo', 'empresa executada', 'executad', 'devedor', 'reu']))
    const cnpjRaw = clean(pick(row, keys, ['cnpj empresa', 'cnpj']))
    const cnpj = cnpjRaw ? cnpjRaw.replace(/\D/g, '') || null : null
    const advogado = clean(pick(row, keys, ['advogado']))
    const telefone = parsePhone(pick(row, keys, ['telefone', 'tel celular', 'tel_celular', 'celular', 'tel fixo']))
    const email = parseEmail(pick(row, keys, ['email', 'e-mail']))
    const classeNome = clean(pick(row, keys, ['classe', 'tipo']))
    const dataAjuizamento = parseDate(pick(row, keys, ['data ajuizamento', 'data expedicao', 'data abertura']))
    const prioridadeTxt = clean(pick(row, keys, ['prioridade']))
    const linkProcesso = clean(pick(row, keys, ['link tribunal', 'link']))
    const responsavel = clean(
      pick(row, keys, ['nome responsavel', 'socio principal', 'socio 1 nome', 'razao social', 'socio'])
    )

    const score = computeScore({ valorCausa, prioridade: prioridadeTxt, telefone, email, cnpj })
    const prioridade = prioridadeFromScore(score)

    const data = {
      tribunal,
      classeNome,
      valorCausa,
      dataAjuizamento,
      score,
      prioridade,
      autor,
      reu,
      advogado,
      cnpj,
      cnpjEmpresa: cnpj,
      telefone,
      email,
      temAdvogado: advogado ? true : null,
      linkProcesso,
      grupo,
      loteEntrega: lote,
      abordagemTipo: abordagem,
      origem: 'IMPORT_REPORTS',
      fonte: tipo,
      detalhes: responsavel ? `Responsável/Sócio: ${responsavel}` : null
    }

    const existing = await withRetry(() =>
      prisma.lead.findUnique({ where: { numeroProcesso }, select: { id: true } })
    )

    const lead = await withRetry(() =>
      prisma.lead.upsert({
        where: { numeroProcesso },
        update: data,
        create: { numeroProcesso, pipeline: 'PROSPECCAO', statusCrm: 'NOVO', ...data }
      })
    )

    existing ? updated++ : created++

    // Alimenta o Acompanhamento Processual
    await withRetry(() =>
      prisma.processoMonitorado.upsert({
        where: { numeroProcesso },
        update: { tribunal, cliente: autor || reu, leadId: lead.id, origemArquivo: lote },
        create: {
          numeroProcesso,
          tribunal,
          cliente: autor || reu,
          leadId: lead.id,
          origemArquivo: lote,
          status: 'ATIVO',
          statusConsulta: 'PENDENTE'
        }
      })
    )
  }

  console.log(`   ✅ criados ${created} | 🔄 atualizados ${updated} | ⏭️  ignorados ${skipped}`)

  return { created, updated, skipped }
}

async function main() {
  const argv = process.argv.slice(2)

  let jobs

  if (argv[0] === 'all') {
    // Importa TODAS as entregas .xlsx da pasta reports, inferindo o segmento pelo nome.
    jobs = fs
      .readdirSync(REPORTS_DIR)
      .filter(f => /^ENTREGA_.*\.xlsx$/i.test(f) && !f.startsWith('~$'))
      .map(file => ({ file, ...inferMeta(file) }))
    console.log(`📦 Modo "all": ${jobs.length} arquivos`)
  } else if (argv.length >= 1) {
    jobs = [{ file: argv[0], grupo: argv[1] || 'IMPORT', tipo: argv[2] || 'LEAD', abordagem: argv[3] || null }]
  } else {
    jobs = CURATED
  }

  const totals = { created: 0, updated: 0, skipped: 0 }

  for (const job of jobs) {
    try {
      const r = await importFile(job)

      totals.created += r.created
      totals.updated += r.updated
      totals.skipped += r.skipped
    } catch (e) {
      console.error(`   ❌ erro em ${job.file}:`, e.message)
    }
  }

  console.log('\n📊 TOTAL:', totals)
}

main()
  .catch(e => {
    console.error('❌ Fatal:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
