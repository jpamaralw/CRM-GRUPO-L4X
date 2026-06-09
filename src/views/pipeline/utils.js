// Stage configuration: order, label and accent color for the Ativos pipeline
export const STAGES = [
  { key: 'PROSPECÇÃO', color: '#6D788D' },
  { key: 'QUALIFICAÇÃO', color: '#0B3DA0' },
  { key: 'PROPOSTA', color: '#20AFEC' },
  { key: 'DUE DILIGENCE', color: '#FDB528' },
  { key: 'FECHADO', color: '#28C76F' },
  { key: 'PERDIDO', color: '#FF4D49' }
]

// Parse a free-form currency string ("R$ 1.234.567,89", "1234567.89", etc.) into a number
export const parseValor = value => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value

  let s = String(value).replace(/[^0-9.,-]/g, '').trim()

  if (!s) return 0

  const hasDot = s.includes('.')
  const hasComma = s.includes(',')

  if (hasDot && hasComma) {
    // Brazilian format: dot = thousands, comma = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    s = s.replace(',', '.')
  }

  const n = parseFloat(s)

  return Number.isFinite(n) ? n : 0
}

export const formatBRL = n =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(n || 0)

export const formatBRLCompact = n => {
  const v = n || 0

  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)} mil`

  return formatBRL(v)
}

export const initials = name => {
  if (!name) return '?'

  const parts = String(name).trim().split(/\s+/)

  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}
