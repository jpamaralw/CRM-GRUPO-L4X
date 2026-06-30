# HANDOFF — CRM L4 Ativos

> Documento de transferência para continuar o trabalho em outro computador.
> Última atualização: 2026-06-30. Branch: `main` (sincronizada com `origin/main`).

---

## 1. O que foi feito nesta sessão (já no GitHub)

Push feito: `50472ad..cad4ce0` em `main`. 5 commits novos:

| Commit | Workstream | Resumo |
|---|---|---|
| `6edce6d` | W1 — Polish | Rodapé L4 (sai Pixinvent), busca em PT (sai ⌘K), índice de busca só com rotas reais, dropdown de notificações em PT, botão "Ver todas" abre `/notificacoes` (página nova). Lib `src/libs/notifications.js`. |
| `13e82a4` | W4 — Telas reais | **Perfil** real (`/pages/user-profile`): carteira, follow-ups, valor, atividade. **Automações**: botão "consultar agora", destinatários do digest, grid responsivo. **Equipe**: relabel "Conta"/"Leads na carteira". |
| `00cf05b` | W4 — Configurações | Tabela `Setting` (key/value) editável (admin). `src/libs/settings.js` + `/api/configuracoes`. Wiring: destinatários extras do digest + limite de consulta. |
| `d974d01` | W3 — Performance | Acompanhamento DataJud agora **paralelo** (pool de 8, sem `sleep` cego) com guarda de tempo 270s. Cobre os ~1106 processos numa execução. Default de limite 150→1200. |
| `cad4ce0` | Branding | Remove `favicon.ico` antigo; o isotipo L4 (`src/app/icon.png`) vira o favicon. |

**Pendente: W2 — Redesenho do Kanban** (estilo HubSpot/Bitrix, migrar p/ `@dnd-kit`). Não iniciado.

---

## 2. Como continuar em outro computador

```bash
git clone https://github.com/jpamaralw/CRM-GRUPO-L4X.git
cd CRM-GRUPO-L4X
npm install
# >>> CRIAR O .env (NÃO está no git — ver abaixo) <<<
npm run dev      # http://localhost:3001
```

### ⚠️ O `.env` NÃO vai no git (está no `.gitignore`)
Você precisa recriá-lo no novo PC. Variáveis necessárias (copie do PC atual **ou** rode `vercel env pull` se tiver o Vercel CLI):

- `DATABASE_URL` — Postgres Neon (**produção** — cuidado, não há banco local separado)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_BASEPATH`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (login Google)
- `NEXT_PUBLIC_APP_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `BASEPATH`
- `MAPBOX_ACCESS_TOKEN`
- **Em produção (Vercel), também:** `RESEND_API_KEY` (e-mail), `API_SECRET_KEY` (trigger manual da consulta), `EMAIL_ACOMPANHAMENTO`, `DATAJUD_API_KEY` (opcional)

### Login de teste
Senha padrão dos usuários seedados: `L4@Temp2026`. Seu usuário (papel TI, vê tudo): `jpamaralwcontato@gmail.com`.

---

## 3. System Design

### Stack
- **Next.js 15.5** (App Router) + **React 19** + **MUI 6** (template Materialize como base).
- **Prisma 5** + **Postgres (Neon serverless)**.
- **NextAuth 4** (JWT) — credenciais (senha) + Google.
- Deploy na **Vercel** (plano Hobby). Cron diário às 09:00 UTC.
- i18n por segmento de rota `[lang]` (pt padrão).

### Estrutura de pastas (essencial)
```
src/
  app/
    [lang]/(dashboard)/(private)/   # páginas autenticadas (pipeline, equipe, acompanhamento, etc.)
    api/                            # rotas de API (notifications, configuracoes, acompanhamento, leads, ...)
  libs/      # prisma, auth, serverAuth, datajud, email, settings, notifications, acompanhamentoDigest
  utils/permissions.js   # papéis + regras de visibilidade (coração das regras de negócio)
  views/     # componentes de tela
  prisma/schema.prisma   # modelo de dados
```

### Modelo de dados (tabelas vivas em prod)
- **User** (15) — papéis: SDR, CLOSER, GESTOR, SOCIO, TI, ADVOGADO, RECEPCAO, FINANCEIRO...
- **Lead** → tabela `LeadJudicial` (`@@map`) — o "ativo": processo, valor, pipeline, status CRM, `assignedToId`, follow-up, compliance.
- **ProcessoMonitorado** (1106) + **MovimentacaoMonitorada** (8358) — acompanhamento processual.
- **ConsultaProcessualRun** — log de cada execução da consulta DataJud.
- **Activity** — histórico de ações no lead. **Automation/AutomationLog**, **ScrapingBatch**.
- **Setting** (novo) — configurações key/value.
- NextAuth: Account, Session, VerificationToken.

### Fluxos principais
1. **Comercial (pipeline):** leads importados → score/prioridade → SDR prospecta → CLOSER negocia → pós-venda. Visibilidade por papel via `getLeadVisibilityWhere(role)`.
2. **Compliance:** SDR/closer envia ativo → ADVOGADO (Dr) aprova/reprova → registro no histórico.
3. **Acompanhamento processual:** cron diário (09:00) chama `/api/acompanhamento/consultar` → consulta **DataJud (API pública CNJ)** em paralelo → grava movimentações novas → envia **digest por e-mail** aos Drs (Resend). Agora cobre toda a base ativa por execução.
4. **Notificações:** derivadas em tempo real (follow-ups vencidos + processos com nova movimentação) — `src/libs/notifications.js`.

### Papéis e permissões (`src/utils/permissions.js`)
Regras são aplicadas **no servidor** (cada página/route chama `getCurrentUser()` + uma função `canX(role)` e/ou `getLeadVisibilityWhere(role)` para filtro a nível de linha). Esse arquivo é a fonte de verdade das regras de negócio.

---

## 4. Segurança — estado atual e recomendações

### ✅ O que já está bom
- Senhas com hash **scrypt** + `timingSafeEqual` (comparação resistente a timing).
- Sessão **JWT** com `NEXTAUTH_SECRET`.
- Autorização **server-side** em páginas e rotas (não confia no cliente).
- Visibilidade de leads **a nível de linha** por papel.
- `.env` fora do git; `/api/configuracoes` restrito a admin.

### 🔴 Achados a corrigir (prioridade)
1. **Fallback de senha em texto puro** (`src/libs/auth.js:20`): `return password === storedPassword`. Se algum usuário tiver senha não-scrypt, o login compara em texto puro. **Remover o fallback** e exigir hash.
2. **Header de cron falsificável** (`src/app/api/acompanhamento/consultar/route.js`): `if (cronHeader) return ok` confia no header `x-vercel-cron`, que um chamador externo pode forjar para **disparar a consulta sem autenticação**. Trocar por um **`CRON_SECRET`** verificado (header secreto), como recomenda a Vercel.
3. **Mismatch seed × auth:** `seed-users.mjs` gera **bcrypt** (`$2a$...`), mas `auth.js` só valida **scrypt**. Alinhar para um único esquema (scrypt) e garantir que as senhas em prod batem — senão logins podem falhar/depender do fallback inseguro.
4. **Chave DataJud hardcoded** (`src/libs/datajud.js`) — é a chave pública do CNJ (risco baixo), mas mover 100% para env.
5. **Rate limiting / brute force no login** — não há. Considerar limitar tentativas (ex.: Vercel Firewall / BotID, ou contador por IP).

### Dívidas técnicas (não são bug, mas atenção)
- **Migrations dessincronizadas:** `prisma/migrations/` tem 2 migrações; o banco tem 6 aplicadas (resíduo da divergência de branches). A tabela `Setting` foi criada por SQL aditivo idempotente, **sem** migração. Antes de rodar `prisma migrate dev` (que compara e pode querer resetar), é preciso **reconciliar o histórico** (ex.: `prisma migrate resolve` / regerar baseline). `migrate deploy` no build da Vercel funciona porque não há migração pendente local.
- `.claude/settings.local.json` fica modificado localmente (permissões da sessão) — não precisa commitar.

---

## 5. Próximos passos sugeridos
1. **Deploy** dos 5 commits (push já feito) e **observar a 1ª execução paralela** do acompanhamento (botão "Consultar agora" em Automações ou aguardar o cron 09:00). Conferir `ConsultaProcessualRun` (status CONCLUIDO vs PARCIAL).
2. **W2 — Kanban** (HubSpot/Bitrix, `@dnd-kit`): precisa de desenho antes de codar.
3. **Correções de segurança** #1 e #2 acima (rápidas e de alto impacto).
4. **Reconciliar migrations** antes do próximo `migrate dev`.
