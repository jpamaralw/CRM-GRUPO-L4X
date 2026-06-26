# 📋 Release Notes — L4 Ativos CRM v2.0

**Data de lançamento:** 26 de junho de 2026  
**Status:** ✅ Produção  
**Deploy:** https://crm-grupo-l4x.vercel.app

---

## 🎯 O que mudou nesta versão

### Design & Marca (Operação-first)
- ✅ **Logo L4 oficial** integrado (branco no login, isótipo na sidebar)
- ✅ **Dashboard hero** com gradiente azul L4 + saudação por papel
- ✅ **Ícones por segmento** (⚖️ Precatório, 💳 RPV, 🏢 Tributário)
- ✅ **Responsivo completo** (mobile, tablet, desktop)

### Pipeline — Filtros Avançados
- ✅ **Busca** por processo, autor, réu, telefone, e-mail
- ✅ **Filtro de prioridade** (Alta/Média/Baixa)
- ✅ **Filtro de responsável** (SDR/closer)
- ✅ **Filtro de valor mínimo** (faixa de valor da causa)
- ✅ **Botão "Limpar filtros"** para reset rápido

### Lead (Card + Drawer)
- ✅ **Ícones no chip de segmento** (visual 2x melhor)
- ✅ **WhatsApp + Ligar + E-mail** diretos do card (1 clique)
- ✅ **Botão "Registrar contato agora"** (grava lastContactAt)
- ✅ **Agendador de follow-up** no drawer (date picker + "Agendar")
- ✅ **Histórico de atividades** completo (quem/quando/o quê)

### Resultados — KPIs por Responsável
- ✅ **Performance table:** Carteira → Fechados → Taxa de conversão
- ✅ **Taxa colorida** (verde ≥30%, amarelo ≥15%, cinza <15%)
- ✅ **Valor médio** de fechamentos (em breve)
- ✅ **Comparação visual** entre SDRs e closers

### Onboarding Completo
- ✅ **Página /guia interativa** por papel (7 papéis cobertos)
- ✅ **Fluxo diário** visual (passo-a-passo)
- ✅ **Métricas que importam** por papel
- ✅ **Dicas práticas** e atalhos
- ✅ **Documento ONBOARDING.md** de referência

---

## 📊 Por Papel

### SDR (Prospecção)
**Novo:**
- Filtros: prioridade + responsável + valor
- WhatsApp/Ligar/E-mail 1-clique
- Agendador de follow-up automático
- Guia com fluxo PESQUISANDO → CONTATO_INICIAL → QUALIFICADO

**Métricas:**
- Carteira: quantos leads você tem
- Taxa de contato: % com telefone
- Follow-ups em dia: 0 vencidos (alerta automático no dashboard)

---

### CLOSER (Negociação)
**Novo:**
- Performance em Resultados (carteira + fechados + taxa)
- WhatsApp + Ligar integrados
- Guia com fluxo ABORDAGEM → REUNIÃO → PROPOSTA → FECHADO

**Métricas:**
- Taxa de conversão pessoal (meta: 20%+)
- Ciclo de venda (Abordagem até Fechado)
- Valor médio de contratos

---

### GESTOR (Gestão)
**Novo:**
- KPIs por responsável em Resultados
- Distribuição de carteira visual
- Follow-ups vencidos sinalizados
- Acompanhamento Processual (DataJud automático)
- Guia operacional completo

**Dashboards:**
- Dashboard principal: 4 pipelines + follow-ups + movimentos
- Resultados: funil + taxa conversão + performance do time
- Equipe: papéis + leads atribuídos
- Automações: rotinas ativas (DataJud, score)

---

### ADVOGADO (Processos)
**Novo:**
- Painel "Movimentações Recentes" no dashboard (últimas 8)
- Badge "Nova" para movimentos do dia
- Guia específico para acompanhamento

**Métricas:**
- Processos monitorados (count)
- Movimentações com "Nova" (ações urgentes)
- Datas de próximas audiências (em breve)

---

### RECEPCÃO (Atendimento)
**Novo:**
- Acesso a Dashboard + Acompanhamento
- Guia de atendimento
- Histórico de atividades por lead

---

## 🚀 Atalhos de Ouro

| Ação | Como | Tempo |
|------|------|-------|
| Chamar cliente | "Ligar" no card | 2 cliques |
| Enviar WhatsApp | "WhatsApp" no card | 2 cliques |
| Enviar e-mail | "E-mail" no drawer | 2 cliques |
| Agendar follow-up | Date picker + "Agendar" | 3 cliques |
| Ver histórico | Scroll no drawer | 1 clique |
| Buscar processo | Cole nº no search | 1 busca |
| Filtrar por responsável | Dropdown "Responsável" | 1 clique |
| Limpar todos filtros | Botão "Limpar filtros" | 1 clique |

---

## 📱 Responsividade

- ✅ **Mobile:** Drawer full-width, cards empilham, filtros em coluna
- ✅ **Tablet:** Layout flexível, tabelas scrolláveis
- ✅ **Desktop:** Grid otimizado, sidebars visíveis

---

## 🔧 Operação

### Dados
- **415 leads importados** (pós-higienização)
- **Segmentação:** Precatório / RPV / Tributário / Outros
- **Pipeline:** Prospecção → Negociação → Pós-Venda
- **Status:** 18 status customizados por pipeline

### Automações (Ativas)
1. **DataJud (CNJ):** Consulta diária 09:00 UTC
2. **Score:** Recalculado na importação
3. **Follow-up:** Alertas automáticos no dashboard
4. **Movimentação:** Log de cada transição com autor

### Segurança
- ✅ NextAuth + JWT
- ✅ Permissões por papel (RBAC)
- ✅ Criptografia de dados em repouso (Neon)
- ⚠️ **TODO:** Mudar senha padrão (todos ainda em L4@Temp2026)

---

## 📈 Métricas de Sucesso

**Esperadas em 30 dias:**
- Taxa de conversão geral: 20%+ (baseline: 15%)
- Follow-ups em dia: 95%+ (baseline: 70%)
- Tempo médio de ciclo: 21 dias (baseline: 28)
- Contatos por lead: 3+ (baseline: 1)

---

## 🆘 Suporte & FAQ

### "Como faço para..."
1. **...chamar um cliente?** → Clique "Lilar" no card do lead
2. **...agendar uma reunião?** → Use o agendador no drawer
3. **...ver o status de um processo?** → Veja "Movimentações Recentes"
4. **...filtrar leads por responsável?** → Use dropdown "Responsável"
5. **...mudar minha senha?** → Em desenvolvimento (TI priorizar)

### Erros comuns
- **"Lead não aparece no meu pipeline"** → Verifique filtro de responsável
- **"Não vejo movimentações novas"** → DataJud roda 1x/dia (09:00 UTC)
- **"Não consigo ligar"** → Telefone precisa estar preenchido
- **"Erro 500 no pipeline"** → Limpar cache (CTRL+SHIFT+DEL)

### Contato
- **TI:** Fale com a equipe de TI para bugs/deploy
- **Gestor:** Feedback sobre features
- **Produto:** Sugestões no repositório

---

## 🔄 Próximas Iterações (Roadmap)

### Curto prazo (2-3 semanas)
- [ ] Trocar senha obrigatória no primeiro login
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] Bulk actions (atribuir múltiplos leads)
- [ ] Integração com Zendesk/Help Center

### Médio prazo (1-2 meses)
- [ ] Agendar chamadas automáticas (Calendly)
- [ ] Análise preditiva de conversão (ML)
- [ ] Dashboard customizável por papel
- [ ] Integrações com WhatsApp Business API

### Longo prazo (3+ meses)
- [ ] Mobile app nativo (iOS/Android)
- [ ] Multi-tenant (outras operações L4)
- [ ] API pública (webhooks, sockets)
- [ ] BI avançado (Tableau/Looker)

---

## 📝 Changelog Técnico

### Backend
- Adicionado `porRespFechado` em `/resultados` para taxa conversão
- Campos `lastContactAt` (timestamp de contato) e `nextFollowUpAt` (próximo follow-up)
- Índices de banco para `assignedToId` + `statusCrm`

### Frontend
- `SEGMENTO_ICON` em `permissions.js` (novo)
- Filtros stateful no `PipelineBoard` (prioridade, responsável, valor)
- `/onboarding` como rota dinâmica com 7 guias expandíveis

### Dados
- 2.800 leads iniciais → 415 após remoção de despejo + higienização
- Score recalculado (log10(valor)+9, capped 100)
- Prioridade inferida (score ≥60=ALTA, ≥35=MEDIA, <35=BAIXA)

---

## 🎉 Obrigado!

Este CRM foi desenvolvido para **aumentar a produtividade** da equipe L4 Ativos.  
Seu feedback é essencial para melhorias contínuas.

**Versão:** 2.0  
**Build:** 2026-06-26  
**By:** Claude Code × João Pedro Amaral

---

### Primeiros passos

1. Login em https://crm-grupo-l4x.vercel.app
2. Acesse o menu "Guia" (sidebar)
3. Escolha seu papel para onboarding
4. Faça seu primeiro contato com um lead (WhatsApp 1-clique!)
5. Reportar bugs ao TI

**Bem-vindo ao L4 Ativos CRM v2.0!** 🚀
