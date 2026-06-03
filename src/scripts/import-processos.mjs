import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

async function importFromFile(filePath) {
  console.log(`📂 Lendo arquivo: ${filePath}`)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`)
    return { success: 0, errors: 0 }
  }

  const workbook = XLSX.readFile(filePath)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(worksheet)

  console.log(`📋 ${rows.length} linhas encontradas`)

  let success = 0
  let errors = 0

  for (const row of rows) {
    const numeroProcesso = row['Número do Processo'] || row['numeroProcesso'] || row['processo']
    const tribunal = row['Tribunal'] || row['tribunal'] || ''
    const cliente = row['Cliente'] || row['cliente'] || ''
    const responsavel = row['Responsável'] || row['responsavel'] || ''
    const obs = row['Observações'] || row['observacoes'] || ''

    if (!numeroProcesso || !numeroProcesso.toString().trim()) {
      errors++
      continue
    }

    try {
      const existing = await prisma.processoMonitorado.findUnique({
        where: { numeroProcesso: numeroProcesso.toString().trim() }
      })

      if (existing) {
        console.log(`⏭️  ${numeroProcesso} já existe`)
        continue
      }

      await prisma.processoMonitorado.create({
        data: {
          numeroProcesso: numeroProcesso.toString().trim(),
          tribunal: tribunal?.toString() || null,
          cliente: cliente?.toString() || null,
          responsavelNome: responsavel?.toString() || null,
          origemArquivo: path.basename(filePath),
          status: 'ATIVO',
          statusConsulta: 'PENDENTE',
          observacoes: obs?.toString() || null
        }
      })

      console.log(`✅ Importado: ${numeroProcesso}`)
      success++
    } catch (error) {
      console.error(`❌ Erro ao importar ${numeroProcesso}:`, error.message)
      errors++
    }
  }

  return { success, errors }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('📚 Importador de Processos Monitorados')
    console.log('')
    console.log('Uso:')
    console.log('  node src/scripts/import-processos.mjs <arquivo.xlsx>')
    console.log('  node src/scripts/import-processos.mjs <pasta>')
    console.log('')
    console.log('Exemplo:')
    console.log('  node src/scripts/import-processos.mjs processos.xlsx')
    process.exit(0)
  }

  const target = args[0]

  if (!fs.existsSync(target)) {
    console.error(`❌ Alvo não encontrado: ${target}`)
    process.exit(1)
  }

  const stats = fs.statSync(target)
  let totalSuccess = 0
  let totalErrors = 0

  if (stats.isDirectory()) {
    const files = fs.readdirSync(target).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
    console.log(`📂 Encontrados ${files.length} arquivos Excel\n`)

    for (const file of files) {
      const result = await importFromFile(path.join(target, file))
      totalSuccess += result.success
      totalErrors += result.errors
      console.log('')
    }
  } else {
    const result = await importFromFile(target)
    totalSuccess = result.success
    totalErrors = result.errors
  }

  console.log('📊 Resumo:')
  console.log(`   ✅ Importados: ${totalSuccess}`)
  console.log(`   ❌ Erros: ${totalErrors}`)
}

main()
  .catch(e => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
