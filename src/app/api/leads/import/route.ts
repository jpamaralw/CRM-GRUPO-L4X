import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const leads: any[] = await req.json()

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'Array de leads vazio' }, { status: 400 })
    }

    let imported = 0
    let skipped = 0

    for (const lead of leads) {
      if (!lead.cnpj) { skipped++; continue }

      await prisma.lead.upsert({
        where: { cnpj: lead.cnpj },
        update: {
          nome: lead.nome || '',
          valorDivida: lead.valorDivida || lead.valor_pgfn || null,
          situacao: lead.situacao || lead.Situacao || null,
          telefone: lead.telefone || lead.Tel_Celular_1 || lead.Tel_Fixo_1 || null,
          email: lead.email || lead.Email_1 || null,
          endereco: lead.endereco || lead.Endereco || null,
          origem: lead.origem || 'PGFN',
          atualizadoEm: new Date()
        },
        create: {
          cnpj: lead.cnpj,
          nome: lead.nome || lead.nome_pgfn || '',
          valorDivida: lead.valorDivida || lead.valor_pgfn || null,
          situacao: lead.situacao || lead.Situacao || null,
          telefone: lead.telefone || lead.Tel_Celular_1 || lead.Tel_Fixo_1 || null,
          email: lead.email || lead.Email_1 || null,
          endereco: lead.endereco || lead.Endereco || null,
          origem: lead.origem || 'PGFN',
          status: 'NOVO'
        }
      })
      imported++
    }

    return NextResponse.json({ imported, skipped, total: leads.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
