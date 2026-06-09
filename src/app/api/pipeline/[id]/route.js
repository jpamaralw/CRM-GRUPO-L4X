import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function PATCH(req, { params }) {
  try {
    const { stage } = await req.json()

    const updated = await prisma.pipelineAtivo.update({
      where: { id: params.id },
      data: { stage }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
