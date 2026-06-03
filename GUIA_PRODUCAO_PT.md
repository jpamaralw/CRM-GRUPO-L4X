# 📋 CRM L4 Ativos - Guia de Produção

## 🎯 Visão Geral do Sistema

Este é o **CRM Judicial** da L4 Ativos, desenvolvido para gestão de processos judiciais, leads e acompanhamento processual em tempo real.

### Stack Tecnológico
- **Frontend**: Next.js 15.1.2 + React 18.3.1
- **Backend**: Node.js + API REST
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma 5.22.0
- **UI**: Material-UI (MUI) 6.2.1
- **Autenticação**: NextAuth.js 4.24.11
- **Deploy**: Vercel

---

## 🚀 Começando (Developers)

### Instalação Local
```bash
# Clonar repositório
git clone https://github.com/jpamaralw/CRM-GRUPO-L4X.git
cd CRM-GRUPO-L4X

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com DATABASE_URL do Neon

# Rodar em desenvolvimento
npm run dev
# Acessar em http://localhost:3001
```

### Scripts Disponíveis
```bash
npm run dev              # Iniciar servidor de desenvolvimento
npm run build           # Build para produção
npm start               # Rodar servidor de produção
npm run lint            # Verificar código com ESLint
npm run format          # Formatar código com Prettier
npm run seed:users      # Semear usuários iniciais
npm run import:leads    # Importar leads de arquivo
npm run import:processos # Importar processos judiciais
npm run validate:prod   # Validar dados de produção
```

---

## 👥 Sistema de Roles e Permissões

### 11 Roles Disponíveis
| Role | Descrição | Permissões |
|------|-----------|-----------|
| **SOCIO** | Sócio/Proprietário | Acesso total, gerenciar usuários |
| **GESTOR** | Gestor de vendas | Ver pipeline completo, relatórios |
| **ADVOGADO** | Advogado | Acompanhamento processual, detalhes |
| **CLOSER** | Closer/Closer de vendas | Converter leads, fechar negócios |
| **SDR** | Sales Development Rep | Prospectar, qualificar leads |
| **TI** | Técnico de TI | Acesso administrativo, logs |
| **RECEPCAO** | Recepção | Acompanhamento processual |
| **GERENTE_JUDICIAL** | Gerente judicial | Processos judiciais |
| **ANALISTA_CREDITICIO** | Analista crédito | Análise de leads |
| **OPERACIONAL** | Operacional | Tarefas operacionais |
| **CONSULTOR** | Consultor externo | Acesso limitado |

### Verificar Permissão no Código
```javascript
import { canViewAcompanhamento } from '@/utils/permissions'

if (canViewAcompanhamento(user.role)) {
  // Mostrar acompanhamento processual
}
```

---

## 📊 Módulos Principais

### 1. Dashboard CRM
**Rota**: `/[lang]/dashboards/crm`
- Visão geral de leads por estágio
- Métricas de conversão
- Atividades recentes

### 2. Acompanhamento Processual ⭐
**Rota**: `/[lang]/(private)/acompanhamento-processual`
**Usuários**: ADVOGADO, GESTOR, RECEPCAO, TI, SOCIO

Módulo para rastreamento de processos judiciais:
- **Dashboard**: 4 métricas principais
  - Processos monitorados
  - Com novidades
  - Pendentes
  - Erros de consulta
- **Tabela de Processos**: Detalhes de cada processo
- **Histórico de Rotinas**: Resultados das consultas automáticas

**Dados**: 62 processos importados da planilha oficial "CONTROLE E MOVIMENTAÇÃO PROCESSUAL.xlsx"

### 3. Leads (Judicial)
**Rota**: `/[lang]/(private)/leads`
**Campos principais**:
- numeroProcesso (único)
- tribunal
- autor / réu
- valorCausa
- dataAjuizamento
- statusCrm (NOVO, EM_CONTATO, NEGOCIANDO, CONVERTIDO, PERDIDO)
- pipeline (PROSPECCAO, NEGOCIACAO, POS_VENDA)
- assignedTo (Responsável)

### 4. Pipelines
Visualização Kanban de leads por estágio:
- Prospecção
- Negociação
- Pós-venda

---

## 🔐 Autenticação e Usuários

### Usuário Master (Admin)
```
Email: master@l4ativos.com.br
Senha: L4@Master2026!
Role: SOCIO
```
⚠️ **IMPORTANTE**: Altere a senha na primeira utilização!

### Criar Novo Usuário
```bash
npm run seed:users
```

Ou via código:
```javascript
import { hashPassword } from '@/libs/auth'

const hashedPassword = await hashPassword('senhaSegura123')
await prisma.user.create({
  data: {
    email: 'usuario@l4ativos.com.br',
    name: 'Usuário',
    password: hashedPassword,
    role: 'CLOSER'
  }
})
```

---

## 📥 Importar Dados

### Processos Judiciais
```bash
npm run import:processos
```
Importa de Excel com coluna "Número do processo"

### Leads
```bash
npm run import:leads
```
Importa de arquivo Excel com campos obrigatórios

---

## 🗄️ Banco de Dados

### Schema Principal
```prisma
// User - Usuários do sistema
- id, email, name, password, role, isActive, phone

// Lead - Processos judiciais
- numeroProcesso (único), tribunal, autor, réu, valorCausa
- pipeline, statusCrm, assignedTo

// ProcessoMonitorado - Acompanhamento
- numeroProcesso, tribunal, cliente
- statusConsulta, ultimaConsultaAt
- movimentacoes (Movimentação[])

// Activity - Atividades de usuários
- leadId, userId, tipo, descricao
```

### Migrations
```bash
# Ver status
npx prisma migrate status

# Aplicar migrations
npx prisma migrate deploy

# Criar nova migration
npx prisma migrate dev --name adicionar_campo
```

---

## 🚀 Deploy em Produção

### Deploy no Vercel (Automático)
```bash
git push origin main
```
→ Vercel detecta automaticamente e faz deploy

### Deploy Manual
```bash
npm run build
vercel deploy --prod
```

### Variáveis de Ambiente (Vercel)
```env
DATABASE_URL=postgresql://...
```

Configurar em: https://vercel.com/dashboard → Projeto → Settings → Environment Variables

---

## 🐛 Troubleshooting

### Build falha com "Module not found"
**Solução**: Verificar tsconfig.json paths e limpar node_modules
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro de conexão com banco
```
Error: ECONNREFUSED or Error: password authentication failed
```
**Solução**: Verificar DATABASE_URL em .env.local

### NextAuth erro de configuração
**Solução**: Gerar novo NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

---

## 📝 Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── [lang]/            # Multi-idioma (pt, en, fr)
│   ├── (dashboard)/       # Layout dashboard
│   └── (private)/         # Rotas privadas
├── components/            # Componentes React
├── @core/                 # Core utilities
├── @menu/                 # Menu system
├── @layouts/              # Layout components
├── hocs/                  # Higher-Order Components
├── hooks/                 # Custom hooks
├── libs/                  # Bibliotecas (auth, prisma)
├── utils/                 # Utilitários
├── views/                 # View components
├── prisma/                # Prisma schema
├── scripts/               # Scripts utilitários
├── configs/               # Configurações globais
└── data/                  # Dados estáticos

```

---

## 🔄 Workflow de Desenvolvimento

### Feature Nova
```bash
# 1. Criar branch
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e testar
npm run dev

# 3. Formatar e validar
npm run format
npm run lint

# 4. Commit
git commit -m "feat: descrição da feature"

# 5. Push e PR
git push origin feature/nova-funcionalidade
# Abrir Pull Request no GitHub

# 6. Merge e deploy automático
# Após aprovação, merge para main → Vercel faz deploy
```

### Bug Fix
```bash
git checkout -b fix/nome-do-bug
# Fazer fix
git commit -m "fix: descrição do bug"
git push origin fix/nome-do-bug
# Abrir PR para review
```

---

## 📊 Monitoramento

### Verificar Saúde do Sistema
```bash
npm run validate:prod
```

### Logs no Vercel
```bash
vercel logs [URL] --follow
```

### Performance
- Usar React DevTools
- Verificar Network tab no Chrome DevTools
- Monitorar bundle size: `next/bundle-analyzer`

---

## 🔒 Segurança

### Checklist de Segurança
- [ ] Senhas com mínimo 12 caracteres
- [ ] NextAuth secret configurado
- [ ] DATABASE_URL em variável de ambiente
- [ ] CORS configurado corretamente
- [ ] SQL injection prevenido (usar Prisma)
- [ ] XSS prevenido (escape de outputs)
- [ ] CSRF tokens em formulários

### Resetar Senha de Usuário
```javascript
const newPassword = await hashPassword('novaSenha123')
await prisma.user.update({
  where: { email: 'usuario@l4ativos.com.br' },
  data: { password: newPassword }
})
```

---

## 📞 Suporte e Contato

- **Issues**: https://github.com/jpamaralw/CRM-GRUPO-L4X/issues
- **Documentação**: Este arquivo (GUIA_PRODUCAO_PT.md)
- **Código**: Bem comentado com padrão ES6+

---

## ✅ Checklist de Go-Live

- [ ] Database backup configurado (Neon)
- [ ] Todos usuários criados e com roles corretos
- [ ] Processos 62 importados com sucesso
- [ ] Acompanhamento Processual testado
- [ ] Email de notificação testado
- [ ] Backup strategy documentada
- [ ] Runbook de emergência criado
- [ ] Time treinado
- [ ] Monitoramento de erros configurado

---

**Versão**: 1.0  
**Data**: Junho 2026  
**Última atualização**: por Claude AI  
**Status**: ✅ PRODUÇÃO
