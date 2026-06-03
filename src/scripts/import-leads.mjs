import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Importador de Leads SQLite → PostgreSQL')
  console.log('')

  const sqliteDbPath = path.join(__dirname, '../prisma/dev.db')

  console.log(`📖 Abrindo SQLite: ${sqliteDbPath}`)
  const sourceDb = new Database(sqliteDbPath)

  const leads = sourceDb
    .prepare(
      `SELECT * FROM "Lead"
       WHERE pipeline IS NOT NULL
       AND numeroProcesso IS NOT NULL`
    )
    .all()

  console.log(`📋 ${leads.length} leads encontrados no SQLite`)
  console.log('')

  let success = 0
  let skipped = 0
  let errors = 0

  for (const lead of leads) {
    try {
      const existing = await prisma.lead.findUnique({
        where: { numeroProcesso: lead.numeroProcesso }
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.lead.create({
        data: {
          numeroProcesso: lead.numeroProcesso,
          tribunal: lead.tribunal || null,
          autor: lead.autor || null,
          reu: lead.reu || null,
          tipoAcao: lead.tipoAcao || null,
          dataProtocolo: lead.dataProtocolo ? new Date(lead.dataProtocolo) : null,
          valorCausa: lead.valorCausa ? parseFloat(lead.valorCausa) : 0,
          prioridade: lead.prioridade || 'NORMAL',
          score: lead.score ? parseInt(lead.score) : 0,
          pipeline: lead.pipeline || 'PROSPECCAO',
          statusCrm: lead.statusCrm || 'NOVO',
          source: lead.source || null,
          notes: lead.notes || null,
          isActive: lead.isActive !== false
        }
      })

      success++

      if (success % 100 === 0) {
        console.log(`✅ ${success} leads importados...`)
      }
    } catch (error) {
      errors++
      if (errors <= 5) {
        console.error(`❌ Erro ao importar ${lead.numeroProcesso}:`, error.message)
      }
    }
  }

  console.log('')
  console.log('📊 Resumo:')
  console.log(`   ✅ Importados: ${success}`)
  console.log(`   ⏭️  Já existentes: ${skipped}`)
  console.log(`   ❌ Erros: ${errors}`)
  console.log('')

  sourceDb.close()
}

main()
  .catch(e => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
