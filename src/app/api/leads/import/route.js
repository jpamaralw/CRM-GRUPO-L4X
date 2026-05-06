import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function POST(req) {
  try {
    const leads = await req.json()

    if (!Array.isArray(leads)) {
      return NextResponse.json({ error: 'Payload must be an array' }, { status: 400 })
    }

    console.log(`Importing ${leads.length} leads...`)

    // We use sequential upserts in this batch for simplicity and to handle existing records
    // For very large batches, a more optimized approach might be needed
    const results = await Promise.all(
      leads.map(lead =>
        prisma.lead.upsert({
          where: { cnpj: lead.cnpj },
          update: {
            nome: lead.nome,
            valorDivida: lead.valorDivida,
            situacao: lead.situacao,
            telefone: lead.telefone,
            email: lead.email,
            endereco: lead.endereco,
            status: lead.status || 'NOVO'
          },
          create: {
            cnpj: lead.cnpj,
            nome: lead.nome,
            valorDivida: lead.valorDivida,
            situacao: lead.situacao,
            telefone: lead.telefone,
            email: lead.email,
            endereco: lead.endereco,
            status: lead.status || 'NOVO',
            origem: 'PGFN'
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      count: results.length
    })
  } catch (error) {
    console.error('Import error:', error)

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    )
  }
}
