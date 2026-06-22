import crypto from 'crypto'

// Cliente da API Pública DataJud (CNJ) para consulta de movimentações processuais.
// Base: https://api-publica.datajud.cnj.jus.br/{indice}/_search

const DATAJUD_BASE_URL = 'https://api-publica.datajud.cnj.jus.br'

// Chave pública oficial da API DataJud (mesma publicada pelo CNJ). Pode ser
// sobrescrita por env para rotação futura.
const DATAJUD_API_KEY =
  process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

// Sigla do tribunal -> índice DataJud
const TRIBUNAL_INDEX = {
  TJSP: 'api_publica_tjsp',
  TJDFT: 'api_publica_tjdft',
  TJGO: 'api_publica_tjgo',
  TJPR: 'api_publica_tjpr',
  TJMG: 'api_publica_tjmg',
  TJRS: 'api_publica_tjrs',
  TJRJ: 'api_publica_tjrj',
  TJBA: 'api_publica_tjba',
  TJPE: 'api_publica_tjpe',
  TJRN: 'api_publica_tjrn',
  TRF1: 'api_publica_trf1',
  TRF2: 'api_publica_trf2',
  TRF3: 'api_publica_trf3',
  TRF4: 'api_publica_trf4',
  TRF5: 'api_publica_trf5'
}

// Segmento J.TR do número CNJ -> sigla (fallback quando tribunal não informado)
const CNJ_SEGMENT_TO_TRIBUNAL = {
  '8.26': 'TJSP',
  '8.07': 'TJDFT',
  '8.09': 'TJGO',
  '8.16': 'TJPR',
  '8.13': 'TJMG',
  '8.21': 'TJRS',
  '8.19': 'TJRJ',
  '8.05': 'TJBA',
  '8.17': 'TJPE',
  '8.20': 'TJRN',
  '4.01': 'TRF1',
  '4.02': 'TRF2',
  '4.03': 'TRF3',
  '4.04': 'TRF4',
  '4.05': 'TRF5'
}

export function onlyDigits(numero) {
  return String(numero || '').replace(/\D/g, '')
}

export function tribunalFromNumero(numero) {
  const masked = String(numero || '')
  const m = masked.match(/\d{7}-?\d{2}\.?\d{4}\.?(\d\.?\d{2})\.?\d{4}/)

  if (!m) {
    // tenta a partir dos dígitos puros: NNNNNNN DD AAAA J TR OOOO
    const d = onlyDigits(numero)

    if (d.length === 20) {
      const seg = `${d[13]}.${d.slice(14, 16)}`

      return CNJ_SEGMENT_TO_TRIBUNAL[seg] || null
    }

    return null
  }

  const seg = m[1].replace('.', '').replace(/(\d)(\d{2})/, '$1.$2')

  return CNJ_SEGMENT_TO_TRIBUNAL[seg] || null
}

export function indexForTribunal(tribunal, numero) {
  const sigla = (tribunal || '').toUpperCase().trim() || tribunalFromNumero(numero)

  return { sigla, index: TRIBUNAL_INDEX[sigla] || null }
}

// Hash estável de uma movimentação (para deduplicar entre consultas)
export function hashMovimento({ codigo, nome, dataHora }) {
  return crypto
    .createHash('sha1')
    .update(`${codigo || ''}::${nome || ''}::${dataHora || ''}`)
    .digest('hex')
}

/**
 * Consulta um processo na API DataJud e retorna as movimentações normalizadas.
 *
 * @returns {Promise<{ ok: boolean, found: boolean, index: string|null,
 *   movimentos: Array<{codigo:number, nome:string, dataHora:string, hash:string}>,
 *   source: object|null, error: string|null }>}
 */
export async function consultarProcesso({ numeroProcesso, tribunal }) {
  const { sigla, index } = indexForTribunal(tribunal, numeroProcesso)

  if (!index) {
    return { ok: false, found: false, index: null, movimentos: [], source: null, error: `Tribunal não suportado: ${sigla || '??'}` }
  }

  const numero = onlyDigits(numeroProcesso)

  const body = {
    query: { match: { numeroProcesso: numero } },
    size: 1
  }

  try {
    const res = await fetch(`${DATAJUD_BASE_URL}/${index}/_search`, {
      method: 'POST',
      headers: {
        Authorization: `APIKey ${DATAJUD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000)
    })

    if (!res.ok) {
      return { ok: false, found: false, index, movimentos: [], source: null, error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    const hits = data?.hits?.hits || []

    if (!hits.length) {
      return { ok: true, found: false, index, movimentos: [], source: null, error: null }
    }

    const source = hits[0]._source || {}

    const movimentos = (source.movimentos || [])
      .map(m => ({
        codigo: m.codigo,
        nome: m.nome,
        dataHora: m.dataHora,
        hash: hashMovimento(m)
      }))
      .sort((a, b) => new Date(a.dataHora || 0) - new Date(b.dataHora || 0))

    return { ok: true, found: true, index, movimentos, source, error: null }
  } catch (err) {
    return { ok: false, found: false, index, movimentos: [], source: null, error: err.message || 'Erro de rede' }
  }
}
