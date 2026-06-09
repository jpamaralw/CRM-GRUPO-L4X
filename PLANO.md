# PLANO MESTRE — L4 Ativos CRM

> Identidade: Azul-marinho `#0A2540` · Preto `#0B0B0B` · Branco `#FFFFFF`
> Logo: `public/images/logo-l4.jpeg`
> Stack: Next.js 15 · MUI 6 · Prisma · Neon · NextAuth

---

## SESSÃO 1 — Fundação visual + limpeza

### 1.1 Rebrand (remover "Materialize" do CRM)
- `src/configs/themeConfig.js` → `templateName: 'L4 Ativos CRM'`
- `src/app/layout.jsx` → metadata `title`, `description`
- Sidebar logo SVG → trocar pelo `logo-l4.jpeg`
- Tela de login: branding L4
- Favicon → derivado da logo
- Footer: copyright "© L4 Ativos"
- Remover `<NextLink>` para themeselection.com e materializeui

### 1.2 Tema (paleta L4)
- `src/@core/theme/palette.js` → primary `#0A2540`, contraste branco
- Tipografia mantida (Inter), mas pesos ajustados para visual sério
- Dark mode: preto puro `#0B0B0B`

### 1.3 Limpeza de rotas (apagar)
**Apps a remover:**
- ❌ `apps/ecommerce` (não vendemos produtos)
- ❌ `apps/logistics` (não temos frota)
- ❌ `apps/chat` (avaliar — manter se quiser chat interno)

**Apps a MANTER e adaptar:**
- ✅ `apps/academy` → futura **L4 Academy** (cursos para clientes)
- ✅ `apps/invoice` → faturamento de honorários/comissões internas
- ✅ `apps/calendar` → agenda de equipe
- ✅ `apps/kanban` → BASE do novo kanban de leads
- ✅ `apps/user` + `roles` + `permissions` → gestão de equipe
- ✅ `apps/email` → caixa de entrada interna

**Pages a remover:**
- ❌ `front-pages/*` (checkout, help-center, landing-page, payment, pricing)
- ❌ `pages/dialog-examples`
- ❌ `pages/faq`
- ❌ `pages/pricing`
- ❌ `pages/wizard-examples`
- ❌ `pages/widget-examples/basic`
- ❌ `pages/widget-examples/advanced`

**Pages a MANTER e adaptar:**
- ✅ `pages/widget-examples/statistics` → **Dashboard de performance** (SDRs, closers)
- ✅ `pages/widget-examples/gamification` → **Ranking de equipe** (leads convertidos, valor fechado)
- ✅ `pages/widget-examples/charts` → **Gráficos de pipeline**
- ✅ `pages/widget-examples/actions` → **Ações rápidas**
- ✅ `pages/account-settings`
- ✅ `pages/user-profile`

**Outras rotas:**
- ❌ `charts/` (demos)
- ❌ `forms/` (demos)
- ❌ `react-table/` (demos)
- ❌ `dashboards/ecommerce`, `dashboards/logistics`, `dashboards/academy`
- ✅ `dashboards/crm` → adaptar para L4

### 1.4 Substituir pipeline quebrada
- Apagar `/pipeline/page.jsx` (a tabela feia)
- Criar novo `/pipeline` reaproveitando `src/views/apps/kanban` com:
  - Colunas: PROSPECÇÃO · QUALIFICAÇÃO · PROPOSTA · DUE DILIGENCE · FECHADO · PERDIDO
  - Cards: nome do lead, CNPJ, tipo (precatório/RPV/sentença), valor, responsável
  - Drag-and-drop entre colunas → atualiza `PipelineAtivo.stage` no Prisma

### 1.5 Limpar assets
- Apagar `public/images/apps/{academy,ecommerce,logistics,front-pages}` (preservar academy se for usar)
- Apagar `public/images/cards/{apple-iMac,apple-iPhone,etc}` (produtos do ecommerce)
- Apagar `public/images/illustrations/auth/*` que não usaremos

---

## SESSÃO 2 — Leads + Equipe

### 2.1 Página `/leads` (grid principal)
- Tabela Tanstack com:
  - Colunas: Nome, CNPJ, Tipo, Tribunal, Valor, Stage, Responsável, Data
  - Filtros: stage, tipo, tribunal, responsável
  - Busca global
  - Ações: editar, mover stage, atribuir responsável
  - Export CSV
- Import button → chama `/api/leads/import` (já existe parcial)

### 2.2 Modelo Prisma — refinar `Lead` e `PipelineAtivo`
- Adicionar `email`, `telefone`, `endereco`
- Histórico de interações (`LeadInteraction[]`)
- Atribuição (`assignedToId` → `User`)

### 2.3 Equipe (Users + Roles)
- Roles: `ADMIN` · `GERENTE` · `CLOSER` · `SDR` · `VIEWER`
- Cadastro via `/apps/user/list`
- Permissões por role:
  - SDR: vê só leads atribuídos
  - Closer: vê leads em proposta+
  - Gerente: vê tudo da equipe
  - Admin: tudo + configurações

### 2.4 Login customizado
- Tela de login com logo L4 grande
- Background azul-marinho com gradiente sutil
- "Esqueci a senha" funcional (email reset)

---

## SESSÃO 3 — Deploy + Integração

### 3.1 Deploy Vercel
- `vercel link` no projeto
- Vars de ambiente:
  - `DATABASE_URL` (Neon)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `RESEND_API_KEY` (preparar)
- `prisma migrate deploy` no build (já tá no `vercel-build`)
- Domínio: `crm.l4ativos.com.br` (precisa apontar CNAME no DNS)

### 3.2 Importação L4 Leads Judiciais
- Endpoint `/api/leads/import` recebe payload do scraper
- Mapper: dados do tribunal → schema `Lead`
- Auth via API key dedicada (`L4_JUDICIAL_API_KEY`)
- Dedup por CNPJ + número do processo

---

## SESSÃO 4 — Automações de abordagem

### 4.1 Email (Resend)
- Templates React Email:
  - Primeira abordagem (precatório federal)
  - Primeira abordagem (RPV)
  - Follow-up 1, 2, 3
  - Proposta enviada
- API key Resend nas envs
- Webhook de open/click → atualiza `LeadInteraction`

### 4.2 WhatsApp (Evolution API self-hosted ou Z-API)
- Configuração de instância
- Disparo manual e em lote
- Templates de mensagem aprovados
- Recebimento → linka com lead

### 4.3 Esteira automática
- Cron job (Vercel Cron):
  - Lead sem contato há 3 dias → email 1
  - 7 dias → wpp follow-up
  - 14 dias → reatribuir SDR
- Configurável por gerente

### 4.4 Instagram DM
- **AVISO:** Meta restringe DMs automáticos. Opções:
  - API Oficial: precisa ser conta business + aprovação da Meta
  - Tools como ManyChat (limitado a quem já interagiu primeiro)
- Recomendação: deixar Instagram para abordagem **manual assistida** (templates prontos no CRM, copy/paste)

---

## PARALELIZAÇÃO COM CODEX/GEMINI CLI

### Estratégia: git worktree (cada agente em pasta + branch isoladas)

**Passo 1 — Configurar worktrees (uma vez):**
```bash
cd C:\Users\Usuario\CRM-GRUPO-L4X

# Branch para limpeza (Claude/Haiku aqui)
git worktree add ../CRM-L4X-cleanup -b feat/cleanup-modules

# Branch para rebrand (Codex aqui)
git worktree add ../CRM-L4X-rebrand -b feat/rebrand-l4

# Branch para kanban novo (Gemini aqui)
git worktree add ../CRM-L4X-kanban -b feat/pipeline-kanban
```

**Passo 2 — Abrir 3 terminais:**
- Terminal A: `cd C:\Users\Usuario\CRM-L4X-cleanup` → `claude` (Haiku)
- Terminal B: `cd C:\Users\Usuario\CRM-L4X-rebrand` → `codex`
- Terminal C: `cd C:\Users\Usuario\CRM-L4X-kanban` → `gemini`

**Passo 3 — Dar tarefas isoladas:**
- **Terminal A (limpeza):** "Apague conforme `PLANO.md` seção 1.3. Não toque em theme/layout. Commite cada grupo separado."
- **Terminal B (rebrand):** "Execute `PLANO.md` seções 1.1, 1.2 e 1.5. Não mexa em rotas/apps."
- **Terminal C (kanban):** "Execute `PLANO.md` seção 1.4. Reaproveite `src/views/apps/kanban` adaptando para `PipelineAtivo`."

**Passo 4 — Merge sequencial em `main`:**
```bash
# Quando cada um terminar:
git checkout main
git merge feat/rebrand-l4         # primeiro (menos conflito)
git merge feat/cleanup-modules    # segundo
git merge feat/pipeline-kanban    # último (depende do kanban antigo)

# Limpar worktrees:
git worktree remove ../CRM-L4X-rebrand
git worktree remove ../CRM-L4X-cleanup
git worktree remove ../CRM-L4X-kanban
```

### Regras de segurança da paralelização
1. **Cada branch toca arquivos diferentes** — verificar antes de começar.
2. **Não mexer em `prisma/schema.prisma` em paralelo** — schema só na main, agentes consomem.
3. **`package.json` é zona única** — só um agente pode modificar deps por vez.
4. **Commits atômicos**: cada agente commita ao terminar cada subtarefa.
5. **Rebase antes de merge**: `git fetch && git rebase main` em cada branch antes do merge.

### Custo / modelo recomendado por tarefa
| Tarefa | Complexidade | Modelo ideal |
|--------|--------------|--------------|
| Limpeza (deletar arquivos) | Baixa | Haiku |
| Rebrand (substituir strings/cores) | Baixa | Haiku |
| Kanban novo (lógica + DnD) | Alta | Sonnet/Opus |
| Integração L4 Judiciais | Média | Sonnet |
| Automações | Alta | Sonnet/Opus |

---

## CHECKLIST DE ENTREGA — Sessão 1

- [ ] Logo L4 no sidebar e login
- [ ] Cores azul/preto/branco aplicadas
- [ ] Zero menções a "Materialize" no app
- [ ] Módulos lixo apagados
- [ ] Pipeline novo (kanban) funcionando com dados mock
- [ ] Build local passa (`npm run build`)
- [ ] PR/merge para main
- [ ] Deploy preview na Vercel verde
