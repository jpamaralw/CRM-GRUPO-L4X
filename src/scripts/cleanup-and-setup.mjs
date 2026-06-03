import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpando dados para produção...\n')

  // 1. Remover usuários específicos
  const usersToDelete = [
    'marcio.lemes@l4ativos.com.br',
    'mauricioleite@l4ativos.com.br',
    'thiago@l4ativos.com.br',
    'bruno@l4ativos.com.br',
    'jpamaralwcontato@gmail.com'
  ]

  for (const email of usersToDelete) {
    const result = await prisma.user.deleteMany({
      where: { email }
    })
    if (result.count > 0) {
      console.log(`✅ Removido: ${email}`)
    }
  }

  console.log()

  // 2. Limpar processos importados da forma errada (manter tabela, deletar registros)
  const processCount = await prisma.processoMonitorado.deleteMany({})
  console.log(`✅ Deletados ${processCount.count} processos antigos`)

  console.log()

  // 3. Criar master user
  const hashedPassword = await bcrypt.hash('L4@Master2026!', 10)

  await prisma.user.upsert({
    where: { email: 'master@l4ativos.com.br' },
    update: { password: hashedPassword },
    create: {
      email: 'master@l4ativos.com.br',
      name: 'Master L4 Ativos',
      password: hashedPassword,
      role: 'SOCIO',
      isActive: true
    }
  })

  console.log(`✅ Master user criado/atualizado`)
  console.log(`   Email: master@l4ativos.com.br`)
  console.log(`   Senha: L4@Master2026!`)
  console.log(`   Role: SOCIO (acesso total)\n`)

  // 4. Contar usuários restantes
  const remainingUsers = await prisma.user.count()
  console.log(`📊 Usuários restantes: ${remainingUsers}`)

  const remainingProcesses = await prisma.processoMonitorado.count()
  console.log(`📊 Processos na base: ${remainingProcesses}`)

  console.log('\n✨ Limpeza concluída!')
}

main()
  .catch(e => {
    console.error('❌ Erro:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
