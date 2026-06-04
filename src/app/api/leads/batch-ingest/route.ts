import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

const SCRAPER_API_KEY = process.env.SCRAPER_SECRET_KEY || ''

interface BatchLead {
  numeroProcesso: string
  tribunal: string
  autor: string
  reu: string
  valorCausa: number
  dataAjuizamento: string
  fase?: string
  score?: number
  cnpj?: string
  cpf?: string
  [key: string]: any
}

interface BatchIngestRequest {
  leads: BatchLead[]
  batch_id: string
  tribunal?: string
  operation?: 'fetch' | 'enrich' | 'update'
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    if (!apiKey || apiKey !== SCRAPER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      )
    }

    const body: BatchIngestRequest = await request.json()

    if (!body.leads || !Array.isArray(body.leads) || body.leads.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: leads array required and must not be empty' },
        { status: 400 }
      )
    }

    if (!body.batch_id) {
      return NextResponse.json(
        { error: 'Invalid request: batch_id required' },
        { status: 400 }
      )
    }

    const batchId = body.batch_id
    const tribunal = body.tribunal || 'UNKNOWN'
    const operation = body.operation || 'fetch'
    const maxLeads = 500

    // Warn if batch is too large
    if (body.leads.length > maxLeads) {
      return NextResponse.json(
        {
          error: `Batch too large: maximum ${maxLeads} leads per request`,
          provided: body.leads.length
        },
        { status: 400 }
      )
    }

    let created = 0
    let updated = 0
    let errors = 0
    const errorDetails: Array<{ numeroProcesso?: string; error: string }> = []

    // Process each lead
    for (const leadData of body.leads) {
      try {
        if (!leadData.numeroProcesso || !leadData.tribunal) {
          errors++
          errorDetails.push({
            numeroProcesso: leadData.numeroProcesso,
            error: 'Missing required fields'
          })
          continue
        }

        // Extract CNPJ/CPF
        let cnpj = leadData.cnpj
        let cpf = leadData.cpf

        if (!cnpj && !cpf && leadData.reu) {
          const cnpjMatch = leadData.reu.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/)
          const cpfMatch = leadData.reu.match(/(\d{3}\.\d{3}\.\d{3}-\d{2})/)

          if (cnpjMatch) cnpj = cnpjMatch[1]
          if (cpfMatch) cpf = cpfMatch[1]
        }

        // Check if exists
        const existing = await prisma.lead.findUnique({
          where: { numeroProcesso: leadData.numeroProcesso }
        })

        // Upsert
        await prisma.lead.upsert({
          where: { numeroProcesso: leadData.numeroProcesso },
          create: {
            numeroProcesso: leadData.numeroProcesso,
            tribunal: leadData.tribunal,
            autor: leadData.autor,
            reu: leadData.reu,
            valorCausa: leadData.valorCausa,
            dataAjuizamento: new Date(leadData.dataAjuizamento),
            statusCrm: 'NOVO',
            pipeline: 'PROSPECCAO',
            cnpj: cnpj || null,
            cpf: cpf || null,
            fase: leadData.fase || 'EXECUÇÃO',
            score: leadData.score || 0,
            origem: `scraper_${tribunal}`,
            metadata: {
              batch_id: batchId,
              operation,
              ...leadData
            }
          },
          update: {
            tribunal: leadData.tribunal,
            autor: leadData.autor,
            reu: leadData.reu,
            valorCausa: leadData.valorCausa,
            dataAjuizamento: new Date(leadData.dataAjuizamento),
            ...(leadData.fase && { fase: leadData.fase }),
            ...(leadData.score !== undefined && { score: leadData.score }),
            ...(cnpj && { cnpj }),
            ...(cpf && { cpf }),
            metadata: {
              ...existing?.metadata,
              batch_id: batchId,
              operation,
              ...leadData
            }
          }
        })

        if (existing) {
          updated++
        } else {
          created++
        }

        // Create activity for new leads
        if (!existing) {
          const leadRecord = await prisma.lead.findUnique({
            where: { numeroProcesso: leadData.numeroProcesso }
          })

          if (leadRecord) {
            await prisma.activity.create({
              data: {
                leadId: leadRecord.id,
                tipo: 'IMPORTADO',
                descricao: `Importado via batch ${batchId} - ${tribunal} - Score: ${leadData.score || 0}`,
                usuario: 'scraper@l4ativos.com.br'
              }
            })
          }
        }

      } catch (leadError) {
        errors++
        errorDetails.push({
          numeroProcesso: leadData.numeroProcesso,
          error: leadError instanceof Error ? leadError.message : 'Unknown error'
        })
      }
    }

    // Save batch record
    await prisma.scrapingBatch.create({
      data: {
        batch_id: batchId,
        tribunal,
        operation,
        total_leads: body.leads.length,
        created,
        updated,
        errors,
        error_details: errors > 0 ? errorDetails : undefined,
        status: errors > 0 && (created + updated) === 0 ? 'FAILED' : 'SUCCESS',
        processed_at: new Date()
      }
    }).catch(() => {
      // Table might not exist yet, continue anyway
    })

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      tribunal,
      operation,
      total: body.leads.length,
      created,
      updated,
      errors,
      error_details: errors > 0 ? errorDetails.slice(0, 10) : undefined,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[/api/leads/batch-ingest] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
