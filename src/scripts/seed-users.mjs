import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Equipe oficial L4 Ativos (atualizada conforme operação real):
// Closers: Mateus(=Matheus), Brenno, Samuel, Anderson, Phelipe
// SDR: Jean | Drs/Compliance: Fábio, Natane | Gestores: Bruno, Thiago
// Reconciliação: cria quem falta e CORRIGE o papel de quem já existe.
// ⚠️ E-mails de Jean/Bruno/Thiago são suposições (nome@l4ativos.com.br) — confirmar com a empresa.
const users = [
  // Closers (já existem com e-mail nome.sobrenome@)
  { email: 'matheus.leite@l4ativos.com.br', name: 'Matheus Leite', role: 'CLOSER' },
  { email: 'brenno.leito@l4ativos.com.br', name: 'Brenno Leito', role: 'CLOSER' },
  { email: 'samuel@l4ativos.com.br', name: 'Samuel', role: 'CLOSER' },
  { email: 'anderson.oliveira@l4ativos.com.br', name: 'Anderson Oliveira', role: 'CLOSER' },
  { email: 'phelipe.leite@l4ativos.com.br', name: 'Phelipe Leite', role: 'CLOSER' },

  // SDR — Jean (novo). GJ Anchieta permanece como SDR também.
  { email: 'jean@l4ativos.com.br', name: 'Jean', role: 'SDR' },

  // Drs / Compliance (aprovam ou reprovam a compra dos ativos)
  { email: 'fabio.bastos@l4ativos.com.br', name: 'Fábio Bastos', role: 'ADVOGADO' },
  { email: 'natane.monteiro@l4ativos.com.br', name: 'Natane Monteiro', role: 'ADVOGADO' },

  // Gestores (acompanham toda a operação) — novos
  { email: 'bruno@l4ativos.com.br', name: 'Bruno', role: 'GESTOR' },
  { email: 'thiago@l4ativos.com.br', name: 'Thiago', role: 'GESTOR' },

  // TI
  { email: 'jpamaralwcontato@gmail.com', name: 'João Pedro Amaral', role: 'TI' }
]

async function main() {
  console.log('🌱 Iniciando seed de usuários...')

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existing) {
      // Reconcilia o papel se estiver diferente
      if (existing.role !== userData.role) {
        await prisma.user.update({ where: { email: userData.email }, data: { role: userData.role } })
        console.log(`🔄 ${userData.email}: papel ${existing.role} → ${userData.role}`)
      } else {
        console.log(`⏭️  ${userData.email} já ok (${userData.role})`)
      }

      continue
    }

    const hashedPassword = await bcrypt.hash('L4@Temp2026', 10)

    await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: hashedPassword,
        isActive: true
      }
    })

    console.log(`✅ Criado: ${userData.email} (${userData.role}) — senha L4@Temp2026`)
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
