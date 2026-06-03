import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const users = [
  // Closers
  { email: 'brenno.leito@l4ativos.com.br', name: 'Brenno Leito', role: 'CLOSER' },
  { email: 'anderson.oliveira@l4ativos.com.br', name: 'Anderson Oliveira', role: 'CLOSER' },
  { email: 'matheus.leite@l4ativos.com.br', name: 'Matheus Leite', role: 'CLOSER' },
  { email: 'samuel@l4ativos.com.br', name: 'Samuel', role: 'CLOSER' },
  { email: 'phelipe.leite@l4ativos.com.br', name: 'Phelipe Leite', role: 'CLOSER' },
  { email: 'joaquim.petillo@l4ativos.com.br', name: 'Joaquim Petillo', role: 'CLOSER' },

  // Gestor
  { email: 'marcio.lemes@l4ativos.com.br', name: 'Marcio Lemes', role: 'GESTOR' },

  // TI
  { email: 'jpamaralwcontato@gmail.com', name: 'João Pedro Amaral', role: 'TI' },

  // SDR
  { email: 'gj-anchieta@hotmail.com', name: 'GJ Anchieta', role: 'SDR' },

  // Recepção
  { email: 'ketleecs21@gmail.com', name: 'Ketlee', role: 'RECEPCAO' },

  // Advogados
  { email: 'natane.monteiro@l4ativos.com.br', name: 'Natane Monteiro', role: 'ADVOGADO' },
  { email: 'fabio.bastos@l4ativos.com.br', name: 'Fabio Bastos', role: 'ADVOGADO' },

  // Sócios
  { email: 'mauricioleite@l4ativos.com.br', name: 'Maurício Leite', role: 'SOCIO' },
  { email: 'thiago@l4ativos.com.br', name: 'Thiago', role: 'SOCIO' },
  { email: 'bruno@l4ativos.com.br', name: 'Bruno', role: 'SOCIO' }
]

async function main() {
  console.log('🌱 Iniciando seed de usuários...')

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existing) {
      console.log(`⏭️  ${userData.email} já existe`)
      continue
    }

    const hashedPassword = await bcrypt.hash('L4@Temp2026', 10)

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: hashedPassword,
        isActive: true
      }
    })

    console.log(`✅ Criado: ${userData.email} (${userData.role})`)
  }

  console.log('✨ Seed completo!')
}

main()
  .catch(e => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
