import crypto from 'crypto'

import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

const DEFAULT_PATH = 'C:\\Users\\ppped\\OneDrive\\Desktop\\CONTROLE E MOVIMENTAÇÃO PROCESSUAL.xlsx'

const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/

// Mapeamento de segmento de justiça/tribunal do número CNJ (J.TR) para sigla
const TRIBUNAL_MAP = {
  '8.09': 'TJGO',
  '8.07': 'TJDFT',
  '8.13': 'TJMG',
  '8.26': 'TJSP',
  '8.19': 'TJRJ',
  '8.06': 'TJPE',
  '8.05': 'TJBA',
  '8.21': 'TJRN',
  '4.01': 'TRF1',
  '4.03': 'TRF3'
}

function tribunalFromNumero(numero) {
  const m = numero.match(/^\d{7}-\d{2}\.\d{4}\.(\d\.\d{2})\.\d{4}$/)

  return (m && TRIBUNAL_MAP[m[1]]) || null
}

// Converte serial de data do Excel (ou texto) para dd/mm/yyyy
function toDateStr(value) {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value)

    if (!d) return null

    return `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')}/${d.y}`
  }

  return String(value).trim()
}

function clean(value) {
  if (value === null || value === undefined) return null

  const str = String(value).trim()

  return str === '' ? null : str
}

function joinFields(pairs) {
  const parts = pairs
    .map(([label, value]) => {
      const v = clean(value)

      return v ? `${label}: ${v}` : null
    })
    .filter(Boolean)

  return parts.length ? parts.join(' | ') : null
}

// --- Extratores por aba -----------------------------------------------------

function extractControleRpvsL4(rows) {
  return rows.map(row => ({
    numeroProcesso: row['Número do processo'],
    cliente: clean(row['Parte']),
    movimentacaoTexto: clean(row['última ação']) || clean(row['RPVS INFORMAÇÕES']),
    observacoes: joinFields([
      ['Entrada CCARPV', toDateStr(row['ENCAMINHADOS PARA A CCARPV PELA PRIMEIRA VEZ DATA DA ENTRADA NA ORDEM CRONOLOGICA PARA EXPEDIÇÃO'])],
      ['Informações importantes', row['Informações importantes']],
      ['Valores e descontos', row['Valores e descontos']],
      ['Cedidos para terceiros', row['Cedidos para terceiros']],
      ['Custas', row['Custas']],
      ['Dossiê', row['DOSSIÊ CEDENTE 61 processos, faltam documentos de  27']]
    ])
  }))
}

function extractRpvsL4(rows) {
  return rows.map(row => ({
    numeroProcesso: row['Nº DO PROCESSO'],
    cliente: clean(row['PARTE']),
    movimentacaoTexto: clean(row['SITUAÇÃO']),
    observacoes: joinFields([
      ['Valor bruto', row['VALOR BRUTO']],
      ['Valor líquido', row['VALOR LÍQUIDO']],
      ['Valores e descontos', row['VALORES E DESCONTOS']]
    ])
  }))
}

function extractControleRpvsAi(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  // rows[0] vazia, rows[1] cabeçalho, dados a partir de rows[2]
  return rows.slice(2).map(row => ({
    numeroProcesso: row[0],
    cliente: clean(row[1]),
    movimentacaoTexto: clean(row[4]),
    observacoes: joinFields([
      ['Peticionado', toDateStr(row[2])],
      ['Decisão', toDateStr(row[3])],
      ['Enviado CCARPV 1ª vez', toDateStr(row[5])],
      ['Deferimento', toDateStr(row[6])],
      ['Enviado CCARPV 2ª vez', toDateStr(row[7])],
      ['RPV expedido em', toDateStr(row[8])],
      ['Custas', row[9]],
      ['Dossiê', row[10]]
    ])
  }))
}

function extractOperacaoJanot(rows) {
  return rows.map(row => ({
    numeroProcesso: row['__EMPTY'],
    cliente: clean(row['PARTE']),
    movimentacaoTexto: clean(row['SITUAÇÃO']) || clean(row['INFORMAÇÕES MOVIMENTAÇÃO']),
    observacoes: joinFields([
      ['Peticionado', toDateStr(row['PETICIONADO'])],
      ['Informações movimentação', row['INFORMAÇÕES MOVIMENTAÇÃO']],
      ['Custos', row['CUSTOS']],
      ['Dossiê', row['DOSSIÊ CEDENTE 108 processo, faltam documentos de 33']]
    ])
  }))
}

function extractRepassadosTerceiros(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  return rows
    .slice(3)
    .filter(row => row[0] && CNJ_REGEX.test(String(row[0]).trim()))
    .map(row => ({
      numeroProcesso: row[0],
      cliente: clean(row[1]),
      movimentacaoTexto: clean(row[4]),
      observacoes: joinFields([
        ['Repassado para', row[2]],
        ['Valor bruto', row[5]],
        ['Valor líquido', row[6]]
      ])
    }))
}

// --- Persistência ------------------------------------------------------------

async function upsertProcesso({ numeroProcesso, cliente, movimentacaoTexto, observacoes, origemAba }) {
  const numero = String(numeroProcesso || '').trim()

  if (!CNJ_REGEX.test(numero)) return 'skipped'

  const tribunal = tribunalFromNumero(numero)
  const existing = await prisma.processoMonitorado.findUnique({ where: { numeroProcesso: numero } })

  let result

  if (existing) {
    const novoBloco = observacoes ? `[${origemAba}] ${observacoes}` : null
    const jaTemBloco = novoBloco && existing.observacoes?.includes(novoBloco)

    await prisma.processoMonitorado.update({
      where: { numeroProcesso: numero },
      data: {
        cliente: existing.cliente || cliente || existing.cliente,
        tribunal: existing.tribunal || tribunal,
        ultimaMovimentacaoTexto: existing.ultimaMovimentacaoTexto || movimentacaoTexto || existing.ultimaMovimentacaoTexto,
        observacoes:
          novoBloco && !jaTemBloco
            ? [existing.observacoes, novoBloco].filter(Boolean).join('\n')
            : existing.observacoes
      }
    })
    result = 'updated'
  } else {
    await prisma.processoMonitorado.create({
      data: {
        numeroProcesso: numero,
        tribunal,
        cliente,
        origemArquivo: origemAba,
        status: 'ATIVO',
        statusConsulta: 'PENDENTE',
        observacoes: observacoes ? `[${origemAba}] ${observacoes}` : null,
        ultimaMovimentacaoTexto: movimentacaoTexto
      }
    })
    result = 'created'
  }

  if (movimentacaoTexto) {
    const processo = await prisma.processoMonitorado.findUnique({ where: { numeroProcesso: numero } })
    const hash = crypto.createHash('sha1').update(`${origemAba}::${movimentacaoTexto}`).digest('hex')

    await prisma.movimentacaoMonitorada
      .create({
        data: {
          processoMonitoradoId: processo.id,
          descricao: movimentacaoTexto,
          fonte: origemAba,
          hash
        }
      })
      .catch(() => {
        // já existe (hash duplicado) - ignora
      })
  }

  return result
}

async function main() {
  const filePath = process.argv[2] || DEFAULT_PATH

  console.log(`📂 Lendo planilha: ${filePath}`)

  const workbook = XLSX.readFile(filePath)

  const extractors = {
    'controle movimentação RPVS  L4': sheet => extractControleRpvsL4(XLSX.utils.sheet_to_json(sheet, { defval: null })),
    'RPVS L4': sheet => extractRpvsL4(XLSX.utils.sheet_to_json(sheet, { defval: null })),
    'controle movimentação RPVS AI': extractControleRpvsAi,
    'Operação Janot controle movimen': sheet => extractOperacaoJanot(XLSX.utils.sheet_to_json(sheet, { defval: null })),
    'RPVS REPASSADOS A TERCEIROS': extractRepassadosTerceiros
  }

  const totals = { created: 0, updated: 0, skipped: 0 }

  for (const sheetName of workbook.SheetNames) {
    const extractor = extractors[sheetName]

    if (!extractor) {
      console.log(`⏭️  Aba ignorada (sem mapeamento): ${sheetName}`)
      continue
    }

    const rows = extractor(workbook.Sheets[sheetName])

    console.log(`\n📋 Aba "${sheetName}": ${rows.length} linhas`)

    let created = 0
    let updated = 0
    let skipped = 0

    for (const row of rows) {
      const result = await upsertProcesso({ ...row, origemAba: sheetName })

      if (result === 'created') created++
      else if (result === 'updated') updated++
      else skipped++
    }

    console.log(`   ✅ Criados: ${created} | 🔄 Atualizados: ${updated} | ⏭️  Ignorados: ${skipped}`)
    totals.created += created
    totals.updated += updated
    totals.skipped += skipped
  }

  console.log('\n📊 Resumo total:')
  console.log(`   ✅ Criados: ${totals.created}`)
  console.log(`   🔄 Atualizados: ${totals.updated}`)
  console.log(`   ⏭️  Ignorados: ${totals.skipped}`)
}

main()
  .catch(e => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
