import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis
const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const SCRAPER_API_KEY = process.env.SCRAPER_SECRET_KEY || ''

export async function POST(request) {
  try {
    // Validate API key
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    if (!apiKey || apiKey !== SCRAPER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.numeroProcesso || !body.tribunal) {
      return NextResponse.json(
        { error: 'Missing required fields: numeroProcesso, tribunal' },
        { status: 400 }
      )
    }

    // Extract CNPJ/CPF from reu if needed
    let cnpj = body.cnpj
    let cpf = body.cpf

    if (!cnpj && !cpf) {
      const cnpjMatch = body.reu?.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/)
      const cpfMatch = body.reu?.match(/(\d{3}\.\d{3}\.\d{3}-\d{2})/)

      if (cnpjMatch) cnpj = cnpjMatch[1]
      if (cpfMatch) cpf = cpfMatch[1]
    }

    // Check if lead already exists
    const existingLead = await prisma.lead.findUnique({
      where: { numeroProcesso: body.numeroProcesso }
    })

    // Upsert lead
    const lead = await prisma.lead.upsert({
      where: { numeroProcesso: body.numeroProcesso },
      create: {
        numeroProcesso: body.numeroProcesso,
        tribunal: body.tribunal,
        autor: body.autor,
        reu: body.reu,
        valorCausa: body.valorCausa,
        dataAjuizamento: new Date(body.dataAjuizamento),
        statusCrm: existingLead?.statusCrm || 'NOVO',
        pipeline: existingLead?.pipeline || 'PROSPECCAO',
        cnpj: cnpj || null,
        cpf: cpf || null,
        fase: body.fase || 'EXECUÇÃO',
        score: body.score || 0,
        origem: body.origem || 'scraper',
        metadata: {
          polo_ativo: body.polo_ativo,
          polo_passivo: body.polo_passivo,
          assertiva_id: body.assertiva_id,
          assertiva_data: body.assertiva_data,
          raw_metadata: body.raw_metadata
        }
      },
      update: {
        tribunal: body.tribunal,
        autor: body.autor,
        reu: body.reu,
        valorCausa: body.valorCausa,
        dataAjuizamento: new Date(body.dataAjuizamento),
        ...(body.fase && { fase: body.fase }),
        ...(body.score !== undefined && { score: body.score }),
        ...(cnpj && { cnpj }),
        ...(cpf && { cpf }),
        metadata: {
          ...existingLead?.metadata,
          polo_ativo: body.polo_ativo,
          polo_passivo: body.polo_passivo,
          assertiva_id: body.assertiva_id,
          assertiva_data: body.assertiva_data,
          raw_metadata: body.raw_metadata
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        tipo: existingLead ? 'ATUALIZADO' : 'IMPORTADO',
        descricao: existingLead
          ? `Lead atualizado via scraper - Score: ${body.score || 0}`
          : `Lead importado via scraper (${body.tribunal}) - Score: ${body.score || 0}`,
        usuario: 'scraper@l4ativos.com.br'
      }
    })

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      numeroProcesso: lead.numeroProcesso,
      status: lead.statusCrm,
      isNew: !existingLead,
      message: existingLead ? 'Lead atualizado com sucesso' : 'Lead criado com sucesso'
    })
  } catch (error) {
    console.error('[/api/leads/ingest] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
