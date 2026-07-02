import prisma from '@/libs/prisma'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------
export function isMetaConfigured() {
  return !!(process.env.META_VERIFY_TOKEN && process.env.META_PAGE_ACCESS_TOKEN && process.env.META_APP_SECRET)
}

// ---------------------------------------------------------------------------
// Webhook verification (GET)
// ---------------------------------------------------------------------------
export function verifyWebhook(mode, token, challenge) {
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return { ok: true, challenge }
  }

  return { ok: false }
}

// ---------------------------------------------------------------------------
// Graph API: fetch full lead details by leadgen_id
// ---------------------------------------------------------------------------
export async function fetchLeadDetails(leadgenId) {
  const token = process.env.META_PAGE_ACCESS_TOKEN

  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN não configurado')

  const fields = 'field_data,created_time,ad_id,ad_name,campaign_id,campaign_name,form_id'
  const url = `${GRAPH_BASE}/${leadgenId}?fields=${fields}&access_token=${token}`

  const res = await fetch(url, { next: { revalidate: 0 } })

  if (!res.ok) {
    const body = await res.text()

    throw new Error(`Meta Graph API error ${res.status}: ${body}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Graph API: list all leads for a given form
// ---------------------------------------------------------------------------
export async function fetchFormLeads(formId, after = null) {
  const token = process.env.META_PAGE_ACCESS_TOKEN

  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN não configurado')

  const fields = 'field_data,created_time,ad_id,ad_name,campaign_id,campaign_name,form_id'
  let url = `${GRAPH_BASE}/${formId}/leads?fields=${fields}&limit=100&access_token=${token}`

  if (after) url += `&after=${after}`

  const res = await fetch(url, { next: { revalidate: 0 } })

  if (!res.ok) {
    const body = await res.text()

    throw new Error(`Meta Graph API error ${res.status}: ${body}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Graph API: list all lead forms for the page
// ---------------------------------------------------------------------------
export async function fetchPageForms() {
  const token = process.env.META_PAGE_ACCESS_TOKEN
  const pageId = process.env.META_PAGE_ID

  if (!token || !pageId) throw new Error('META_PAGE_ACCESS_TOKEN e META_PAGE_ID são necessários')

  const url = `${GRAPH_BASE}/${pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time&access_token=${token}`
  const res = await fetch(url, { next: { revalidate: 0 } })

  if (!res.ok) {
    const body = await res.text()

    throw new Error(`Meta Graph API error ${res.status}: ${body}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Field mapping: Meta form field_data → Lead fields
// ---------------------------------------------------------------------------
const norm = s =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

export function parseFormFields(fieldData) {
  const mapped = {}

  for (const { name, values } of fieldData) {
    const v = values?.[0] ?? null
    const n = norm(name)

    if (!v) continue

    if (n.includes('full_name') || n.includes('nome') || n.includes('name')) {
      mapped.autor = String(v).trim()
    } else if (n.includes('phone') || n.includes('telefone') || n.includes('celular') || n.includes('whats')) {
      mapped.telefone = String(v).trim()
    } else if (n.includes('email') || n.includes('e-mail')) {
      mapped.email = String(v).trim().toLowerCase()
    } else if (n.includes('cpf')) {
      mapped.cpf = String(v).replace(/\D/g, '').trim()
    } else if (n.includes('cnpj')) {
      mapped.cnpj = String(v).replace(/\D/g, '').trim()
    } else if (n.includes('cidade') || n.includes('city')) {
      mapped.detalhes = (mapped.detalhes ? mapped.detalhes + ' | ' : '') + `Cidade: ${v}`
    } else if (n.includes('estado') || n.includes('state') || n.includes('uf')) {
      mapped.detalhes = (mapped.detalhes ? mapped.detalhes + ' | ' : '') + `Estado: ${v}`
    } else if (n.includes('valor') || n.includes('value')) {
      const num = parseFloat(String(v).replace(/[^\d,.-]/g, '').replace(',', '.'))

      if (Number.isFinite(num)) mapped.valorCausa = num
    } else if (n.includes('tribunal')) {
      mapped.tribunal = String(v).trim()
    } else if (n.includes('processo') || n.includes('process')) {
      mapped.detalhes = (mapped.detalhes ? mapped.detalhes + ' | ' : '') + `Processo: ${v}`
    } else {
      const label = name.replace(/_/g, ' ')

      mapped.detalhes = (mapped.detalhes ? mapped.detalhes + ' | ' : '') + `${label}: ${v}`
    }
  }

  return mapped
}

// ---------------------------------------------------------------------------
// Upsert a Meta lead into the Lead table + log in MetaWebhookEvent
// ---------------------------------------------------------------------------
export async function upsertMetaLead(leadgenId, graphData, rawPayload = {}) {
  const fields = parseFormFields(graphData.field_data ?? [])

  const data = {
    numeroProcesso: `META-${leadgenId}`,
    tribunal: fields.tribunal || 'META',
    autor: fields.autor || null,
    telefone: fields.telefone || null,
    email: fields.email || null,
    cpf: fields.cpf || null,
    cnpj: fields.cnpj || null,
    valorCausa: fields.valorCausa ?? null,
    detalhes: fields.detalhes || null,
    origem: 'META_ADS',
    pipeline: 'PROSPECCAO',
    statusCrm: 'NOVO',
    metaLeadId: leadgenId,
    metaCampaignName: graphData.campaign_name || null,
    metaFormName: graphData.form_id || null,
    grupo: 'RPV',
    metadata: {
      meta_ad_id: graphData.ad_id,
      meta_ad_name: graphData.ad_name,
      meta_campaign_id: graphData.campaign_id,
      meta_campaign_name: graphData.campaign_name,
      meta_form_id: graphData.form_id,
      meta_created_time: graphData.created_time,
      raw_fields: graphData.field_data
    }
  }

  let lead

  try {
    lead = await prisma.lead.upsert({
      where: { metaLeadId: leadgenId },
      create: data,
      update: {
        telefone: { set: data.telefone },
        email: { set: data.email },
        autor: { set: data.autor }
      }
    })
  } catch (err) {
    await prisma.metaWebhookEvent.upsert({
      where: { leadgenId },
      create: {
        leadgenId,
        pageId: rawPayload.page_id || null,
        formId: graphData.form_id || null,
        adId: graphData.ad_id || null,
        campaignId: graphData.campaign_id || null,
        rawPayload,
        processed: false,
        error: err.message
      },
      update: { error: err.message }
    })
    throw err
  }

  await prisma.metaWebhookEvent.upsert({
    where: { leadgenId },
    create: {
      leadgenId,
      pageId: rawPayload.page_id || null,
      formId: graphData.form_id || null,
      adId: graphData.ad_id || null,
      campaignId: graphData.campaign_id || null,
      rawPayload,
      processed: true,
      leadId: lead.id
    },
    update: { processed: true, leadId: lead.id, error: null }
  })

  return lead
}
