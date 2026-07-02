import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { verifyWebhook, fetchLeadDetails, upsertMetaLead } from '@/libs/meta'

export const dynamic = 'force-dynamic'

// GET — Meta webhook verification challenge
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const result = verifyWebhook(mode, token, challenge)

  if (!result.ok) {
    return new Response('Forbidden', { status: 403 })
  }

  return new Response(result.challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

// POST — receive lead events from Meta
export async function POST(request) {
  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.object !== 'page') {
    return NextResponse.json({ ok: true })
  }

  const results = []

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue

      const { leadgen_id: leadgenId, page_id: pageId, form_id: formId, ad_id: adId } = change.value ?? {}

      if (!leadgenId) continue

      const existing = await prisma.metaWebhookEvent.findUnique({ where: { leadgenId } })

      if (existing?.processed) {
        results.push({ leadgenId, status: 'duplicate' })
        continue
      }

      try {
        const graphData = await fetchLeadDetails(leadgenId)
        const lead = await upsertMetaLead(leadgenId, graphData, { page_id: pageId, form_id: formId, ad_id: adId })

        results.push({ leadgenId, status: 'created', leadId: lead.id })
      } catch (err) {
        console.error('[Meta webhook] error processing', leadgenId, err.message)
        results.push({ leadgenId, status: 'error', error: err.message })
      }
    }
  }

  return NextResponse.json({ ok: true, results })
}
