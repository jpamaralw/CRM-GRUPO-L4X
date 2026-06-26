# 🚀 Migração para o CRM L4 — Da Planilha à Operação

**Como sair do controle em Excel e operar tudo no CRM, por papel.**

---

## 👥 Equipe (papéis no sistema)

| Pessoa | Papel | O que vê/faz |
|--------|-------|--------------|
| **Jean** | SDR | Prospecção: cria/qualifica leads e envia ativos para compliance |
| **Mateus, Brenno, Samuel, Anderson, Phelipe** | Closer | Negociação: fecham contratos, enviam ativos para compliance |
| **Fábio Bastos, Natane Monteiro** | Advogado (Compliance) | Aprovam/reprovam a compra dos ativos + recebem o acompanhamento diário |
| **Bruno, Thiago** | Gestor | Acompanham tudo: resultados, equipe, compliance, processos |
| **João Pedro** | TI | Administração do sistema |

> Senha inicial de todos: **L4@Temp2026** (trocar no primeiro acesso — pendência de TI).
> ⚠️ Os e-mails de **Jean, Bruno e Thiago** foram criados como `nome@l4ativos.com.br` — confirmar com a empresa e ajustar se necessário.

---

## 🔄 O fluxo da operação (ponta a ponta)

```
1. SDR (Jean) prospecta  →  acha um ativo (precatório/RPV)
2. SDR qualifica e ENVIA PARA COMPLIANCE  →  status "Aguardando"
3. Dr. (Fábio/Natane) analisa  →  APROVA ou REPROVA a compra
4. Aprovado → Closer (Mateus/Brenno/...) negocia e fecha
5. Processo entra no ACOMPANHAMENTO PROCESSUAL (DataJud diário)
6. Toda manhã: relatório por e-mail para os Drs com as movimentações
7. Gestores (Bruno/Thiago) acompanham resultados e compliance
```

---

## 📋 Antes (planilha) × Agora (CRM)

| Antes (Excel) | Agora (CRM) |
|---------------|-------------|
| Controle de RPVs em 5 abas | Tudo em **Acompanhamento Processual** (691 processos) |
| Atualizar movimentação manualmente | **DataJud consulta sozinho todo dia** |
| Avisar Dr. por WhatsApp/print | **E-mail automático diário** para Fábio/Natane |
| Aprovação de compra informal | **Botão Aprovar/Reprovar** com parecer registrado |
| Sem histórico de quem fez o quê | **Histórico completo** por lead (quem, quando) |
| Contato copiando número | **WhatsApp/Ligar/E-mail** em 1 clique |
| Sem visão de funil | **Resultados** com taxa de conversão por pessoa |

---

## 🎯 Primeiros passos por papel

### SDR — Jean
1. Login → menu **Prospecção**
2. Trabalhe os leads (WhatsApp/Ligar direto do card)
3. Achou um ativo bom? Abra o lead → **"Enviar para compliance"**
4. Aguarde o Dr. aprovar → passe para o closer

### Closer — Mateus, Brenno, Samuel, Anderson, Phelipe
1. Login → menu **Negociação**
2. Trabalhe os ativos **aprovados** pelo compliance
3. Use **Templates** de WhatsApp/e-mail (menu Templates)
4. Avance status: Abordagem → Reunião → Proposta → **Fechado**

### Dr. / Compliance — Fábio, Natane
1. Login → menu **Compliance**
2. Veja a fila **"Aguardando análise"**
3. Em cada ativo: **Aprovar** ou **Reprovar** (com parecer jurídico)
4. Todo dia de manhã: confira o **e-mail de acompanhamento** (movimentações DataJud)

### Gestor — Bruno, Thiago
1. Login → **Dashboard** (visão geral)
2. **Resultados** → performance de cada SDR/closer
3. **Compliance** → acompanhe aprovações/reprovações
4. **Equipe** → papéis e carteira
5. **Importar Leads** → suba novas planilhas quando precisar

---

## 📥 Importar mais leads (gestores/TI)
1. Menu **Importar Leads**
2. Selecione o `.xlsx` (qualquer layout — o sistema detecta as colunas)
3. Clique **Importar** → leads novos entram em Prospecção → Novo
4. Leads repetidos (mesmo nº de processo) são **atualizados**, não duplicados

---

## ⚙️ Automações ativas
- **DataJud diário (09:00):** consulta movimentações dos 691 processos
- **E-mail diário aos Drs:** relatório com as novidades (requer chave Resend)
- **Compliance:** fluxo enviar → aprovar/reprovar → registro
- **Follow-up:** leads vencidos aparecem no dashboard
- **Score/prioridade:** calculado na importação

---

## 🔜 Pendências de ativação (TI)
1. **Chave Resend** (`RESEND_API_KEY`) + domínio `l4ativos.com.br` verificado → liga o e-mail diário
2. **Confirmar e-mails** de Jean/Bruno/Thiago
3. **Trocar senha padrão** no primeiro login
4. **Frequência do DataJud:** hoje 80/dia; para cobrir os 691 mais rápido, aumentar limite/rodar mais vezes

---

**L4 Ativos · CRM Jurídico · Junho 2026**
