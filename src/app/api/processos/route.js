import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function GET() {
  try {
    const items = await prisma.processoMonitorado.findMany({
      orderBy: [{ ultimaMovimentacaoAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        numeroProcesso: true,
        tribunal: true,
        cliente: true,
        responsavelNome: true,
        status: true,
        statusConsulta: true,
        ultimaConsultaAt: true,
        ultimaMovimentacaoAt: true,
        ultimaMovimentacaoTexto: true
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
