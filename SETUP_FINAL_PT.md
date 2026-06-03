# 🎯 Guia Final - Ativar Sistema em Produção

## ✅ Status Atual
- **Deploy**: LIVE em Vercel
- **URL**: https://crm-grupo-l4x-89zh5evxv-jpamaralwcontato-6661s-projects.vercel.app
- **Status**: 🟢 Operacional (requer login)

---

## 🔐 PASSO 1: Primeiro Acesso (CRÍTICO)

### Credenciais Master
```
Email:    master@l4ativos.com.br
Senha:    L4@Master2026!
```

**IMPORTANTE**: Altere a senha no primeiro login!

### Como fazer login
1. Acesse a URL de produção
2. Você verá a tela de login
3. Digite as credenciais acima
4. ✅ Você terá acesso total ao sistema

---

## 📊 PASSO 2: Importar 62 Processos Judiciais (CRÍTICO)

### Arquivo Necessário
```
📁 Arquivo: "CONTROLE E MOVIMENTAÇÃO PROCESSUAL.xlsx"
📍 Localização: reports/ ou seu local
```

### Opção A: Via Comando (Recomendado)
```bash
# 1. Copie o arquivo Excel para a raiz do projeto
cp /caminho/reports/"CONTROLE E MOVIMENTAÇÃO PROCESSUAL.xlsx" .

# 2. Execute import
npm run import:processos

# 3. Verifique resultado
npm run validate:prod

# 4. Commit e deploy
git add src/prisma/dev.db  # Se for SQLite local
git commit -m "feat: Import 62 judicial processes"
git push origin main
```

### Opção B: Via Vercel (Mais seguro para produção)

Se a base está em Neon, você pode usar o Neon console para:
1. Acessar: https://console.neon.tech
2. Executar import via SQL ou script

---

## 👥 PASSO 3: Preparar Contas de Usuários

### Remover Contas Admin (Conforme Solicitado)
```bash
npm run cleanup-and-setup
```

Remove:
- ❌ marcio.lemes@l4ativos.com.br
- ❌ mauricioleite@l4ativos.com.br
- ❌ thiago@l4ativos.com.br
- ❌ bruno@l4ativos.com.br
- ❌ jpamaralwcontato@gmail.com

Mantém:
- ✅ master@l4ativos.com.br (SOCIO - acesso total)

### Criar Novos Usuários para o Time
```bash
npm run seed:users
```

Ou manualmente:
```javascript
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/libs/auth'

const prisma = new PrismaClient()

const hashedPwd = await hashPassword('SenhaSegura123!')
await prisma.user.create({
  data: {
    email: 'usuario@l4ativos.com.br',
    name: 'Nome do Usuário',
    password: hashedPwd,
    role: 'CLOSER'  // ou ADVOGADO, GESTOR, etc
  }
})
```

---

## ✔️ PASSO 4: Verificar Módulos Principais

Após login, acesse cada módulo e verifique:

### 🎯 Dashboard CRM
```
URL: /pt/dashboards/crm
Deve mostrar: Leads por estágio, métricas
```

### ⚖️ Acompanhamento Processual ⭐ (CRÍTICO)
```
URL: /pt/acompanhamento-processual
Roles: ADVOGADO, GESTOR, RECEPCAO, TI, SOCIO

Deve mostrar:
✅ 62 processos monitorados
✅ Métricas: Com novidades, Pendentes, Erros
✅ Tabela detalhada de cada processo
✅ Histórico de rotinas de consulta
```

### 📋 Leads Judiciais
```
URL: /pt/leads
Campos: Número, Tribunal, Autor, Réu, Valor, Status
```

### 🔀 Pipelines (Kanban)
```
URL: /pt/pipelines/prospeccao
Visualização: Prospeccão → Negociação → Pós-venda
```

---

## 📋 Checklist de Go-Live

- [ ] **1. ACESSO**: Login com master user funciona
- [ ] **2. DADOS**: 62 processos importados corretamente
- [ ] **3. ACOMPANHAMENTO**: Módulo mostra os 62 processos
- [ ] **4. USUÁRIOS**: Contas admin removidas, time criado
- [ ] **5. PAPÉIS**: Cada papel pode ver o que deve
- [ ] **6. BANCO**: Backup configurado em Neon
- [ ] **7. TEAM**: Time treinado nas funcionalidades
- [ ] **8. DOCS**: Todos com acesso ao GUIA_PRODUCAO_PT.md
- [ ] **9. SUPORTE**: Canal de suporte definido
- [ ] **10. GO**: Aprovado para uso em produção

---

## 🔑 Roles e Permissões (11 Total)

| Papel | Acesso |
|-------|--------|
| **SOCIO** | Tudo (admin completo) |
| **GESTOR** | Pipeline, relatórios, acompanhamento |
| **ADVOGADO** | Acompanhamento processual, detalhes |
| **CLOSER** | Converter leads, fechar negócios |
| **SDR** | Prospectar, qualificar leads |
| **TI** | Administrativo, logs |
| **RECEPCAO** | Acompanhamento processual |
| **GERENTE_JUDICIAL** | Processos judiciais |
| **ANALISTA_CREDITICIO** | Análise de leads |
| **OPERACIONAL** | Tarefas operacionais |
| **CONSULTOR** | Acesso limitado |

---

## 🆘 Troubleshooting Rápido

### Problema: Não consegue fazer login
```
✓ Verifique DATABASE_URL em Vercel settings
✓ Confirme senha do master user
✓ Verifique logs: vercel logs [URL]
```

### Problema: Acompanhamento mostra 0 processos
```
✓ Execute: npm run import:processos
✓ Verifique formato do Excel
✓ Confirme DATABASE_URL está correto
```

### Problema: Página branca ou erro
```
✓ Verifique browser console (F12)
✓ Verifique Vercel Function logs
✓ Limpe cache: Ctrl+Shift+Del
```

---

## 📞 Contatos e Referências

- **Documentação Completa**: GUIA_PRODUCAO_PT.md
- **Quick Reference**: QUICKSTART_PT.md
- **Status de Deploy**: DEPLOYMENT_STATUS.md
- **Repo GitHub**: https://github.com/jpamaralw/CRM-GRUPO-L4X
- **Issues**: Criar em GitHub issues

---

## ⚡ Próximos Passos Imediatos

```
1️⃣  Teste login com master user
     └─ Se funciona → próximo passo
     └─ Se falha → verificar logs

2️⃣  Importe arquivo "CONTROLE E MOVIMENTAÇÃO PROCESSUAL.xlsx"
     └─ Se importa → próximo passo
     └─ Se falha → verificar formato

3️⃣  Verifique acompanhamento-processual
     └─ Se mostra 62 → próximo passo
     └─ Se mostra 0 → verificar import

4️⃣  Crie contas para o time
     └─ Remova contas antigas
     └─ Adicione novos usuários

5️⃣  Treine o time
     └─ Compartilhe GUIA_PRODUCAO_PT.md
     └─ Mostre cada módulo
```

---

**Data**: 03 Junho 2026
**Versão**: 1.0
**Status**: 🟢 PRONTO PARA PRODUÇÃO

Quando estiver pronto para o próximo passo, avise!
