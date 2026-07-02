import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { getCurrentUser } from '@/libs/serverAuth'
import { fetchFormLeads, upsertMetaLead } from '@/libs/meta'
import { ROLES } from '@/utils/permissions'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ALLOWED = [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI]

export async function POST(request) {
  const user = await getCurrentUser()

  if (!user?.isActive || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let formId

  try {
    const body = await request.json()

    formId = body.formId
  } catch {
    return NextResponse.json({ error: 'formId obrigatório' }, { status: 400 })
  }

  if (!formId) {
    return NextResponse.json({ error: 'formId obrigatório' }, { status: 400 })
  }

  let criados = 0
  let atualizados = 0
  let erros = 0
  let after = null

  do {
    let page

    try {
      page = await fetchFormLeads(formId, after)
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 })
    }

    for (const lead of page.data ?? []) {
      try {
        const existing = await prisma.lead.findUnique({ where: { metaLeadId: lead.id } })

        await upsertMetaLead(lead.id, lead, { form_id: formId })

        if (existing) {
          atualizados++
        } else {
          criados++
        }
      } catch {
        erros++
      }
    }

    after = page.paging?.cursors?.after
    const hasNext = !!page.paging?.next

    if (!hasNext) break
  } while (after)

  return NextResponse.json({ ok: true, criados, atualizados, erros })
}
