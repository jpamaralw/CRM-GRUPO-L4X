/**
 * Higieniza os leads do CRM (LeadJudicial):
 *  - Title Case PT-BR em autor/réu/advogado (mantém siglas e preposições)
 *  - Limpa artefatos de encoding, espaços e lixo
 *  - Normaliza telefone (formato BR) e CNPJ (XX.XXX.XXX/XXXX-XX)
 *  - E-mail em minúsculas e válido
 *  - Recalcula score/prioridade de forma consistente
 *
 * Uso: node -r dotenv/config src/scripts/higienizar-leads.mjs
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du', 'em', 'no', 'na', 'a', 'o', 'à', 'of', 'the'])
const UPPER = new Set([
  'ltda', 'me', 'epp', 'eireli', 'sa', 's/a', 's.a', 'cnpj', 'cpf', 'oab', 'rpv', 'cia', 'mei',
  'tjgo', 'tjsp', 'tjdft', 'trf1', 'trf3', 'df', 'go', 'sp', 'ii', 'iii', 'iv'
])

// Artefatos de encoding (cp1252 / C1 controls) -> caracteres corretos
const RE_DASH = new RegExp('[\\u0096\\u0097]', 'g')
const RE_APOS = new RegExp('[\\u0091\\u0092]', 'g')
const RE_QUOT = new RegExp('[\\u0093\\u0094]', 'g')
const RE_REPL = new RegExp('\\uFFFD', 'g')

const fixArtifacts = s =>
  String(s)
    .replace(RE_DASH, '–')
    .replace(RE_APOS, '’')
    .replace(RE_QUOT, '"')
    .replace(RE_REPL, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

function titleCase(value) {
  if (!value) return null
  const clean = fixArtifacts(value)

  if (!clean) return null

  return clean
    .toLowerCase()
    .split(/(\s+|\/|-)/)
    .map((tok, i) => {
      if (/^(\s+|\/|-)$/.test(tok)) return tok
      const bare = tok.replace(/[^a-zà-ú0-9]/gi, '')

      if (!bare) return tok
      if (UPPER.has(bare)) return tok.toUpperCase()
      if (i > 0 && LOWER.has(bare)) return tok
      if (/^\d/.test(tok)) return tok

      return tok.charAt(0).toUpperCase() + tok.slice(1)
    })
    .join('')
    .trim()
}

// Mantém nome do advogado + OAB legível
function cleanAdvogado(value) {
  if (!value) return null
  const clean = fixArtifacts(value)
  const first = clean.split(';')[0].trim()
  const m = first.match(/(.+?)\s*\(?\s*OAB[:\s]*([\d./-]+[A-Z/]*)\)?/i)

  if (m) return `${titleCase(m[1])} (OAB ${m[2].toUpperCase()})`

  return titleCase(first)
}

// Réu/credor pode vir com múltiplas entidades separadas por ;
function cleanParte(value) {
  if (!value) return null
  const clean = fixArtifacts(value)
  const parts = clean
    .split(';')
    .map(p => titleCase(p.trim()))
    .filter(Boolean)

  const seen = new Set()
  const uniq = parts.filter(p => {
    const k = p.toLowerCase()

    if (seen.has(k)) return false
    seen.add(k)

    return true
  })

  return uniq.slice(0, 2).join(' · ') || null
}

const onlyDigits = s => String(s || '').replace(/\D/g, '')

function formatPhone(value) {
  const d = onlyDigits(value)

  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`

  return d.length >= 10 ? d : null
}

function formatCNPJ(value) {
  const d = onlyDigits(value)

  if (d.length !== 14) return value || null

  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function cleanEmail(value) {
  if (!value) return null
  const m = String(value).match(/[\w.+-]+@[\w-]+\.[\w.-]+/)

  return m ? m[0].toLowerCase() : null
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

const prioridadeFromScore = s => (s >= 60 ? 'ALTA' : s >= 35 ? 'MEDIA' : 'BAIXA')

async function main() {
  const leads = await prisma.lead.findMany({
    select: {
      id: true, autor: true, reu: true, advogado: true, telefone: true, email: true,
      cnpj: true, cnpjEmpresa: true, valorCausa: true, prioridade: true
    }
  })

  console.log(`Higienizando ${leads.length} leads...`)
  let changed = 0

  for (const lead of leads) {
    const autor = cleanParte(lead.autor)
    const reu = cleanParte(lead.reu)
    const advogado = cleanAdvogado(lead.advogado)
    const telefone = formatPhone(lead.telefone)
    const email = cleanEmail(lead.email)
    const cnpj = lead.cnpj ? formatCNPJ(lead.cnpj) : null
    const cnpjEmpresa = lead.cnpjEmpresa ? formatCNPJ(lead.cnpjEmpresa) : cnpj
    const score = computeScore({ valorCausa: lead.valorCausa, prioridade: lead.prioridade, telefone, email, cnpj })
    const prioridade = prioridadeFromScore(score)

    await prisma.lead.update({
      where: { id: lead.id },
      data: { autor, reu, advogado, telefone, email, cnpj, cnpjEmpresa, score, prioridade }
    })
    changed++
  }

  console.log(`OK: ${changed} leads higienizados`)
}

main()
  .catch(e => {
    console.error('ERRO', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
