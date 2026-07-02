import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/libs/serverAuth'
import { fetchPageForms, isMetaConfigured } from '@/libs/meta'
import { ROLES } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

const ALLOWED = [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI]

export async function GET() {
  const user = await getCurrentUser()

  if (!user?.isActive || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (!isMetaConfigured()) {
    return NextResponse.json({ error: 'Meta não configurado', configured: false }, { status: 200 })
  }

  try {
    const data = await fetchPageForms()

    return NextResponse.json({ ok: true, forms: data.data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
