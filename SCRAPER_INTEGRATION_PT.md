# 🔗 Integração Scraper - Acompanhamento Processual

**Status**: 🔴 Awaiting Setup
**Criticality**: 🔴 CRÍTICO - Lawyers depend on daily updates

---

## 📋 Visão Geral da Integração

O sistema precisa conectar a **l4-leads-judiciais** (scraper) com o **CRM** para que:

1. **62 casos** sejam importados do Excel
2. **Scrapers rodem diariamente** checando atualizações
3. **Advogados vejam** em tempo real as movimentações
4. **Erros sejam rastreados** e alertados

```
l4-leads-judiciais (Scraper)
         ↓
    Check Cases
         ↓
    Find Updates
         ↓
    POST → CRM API
         ↓
    Update Database
         ↓
    Show in Dashboard
```

---

## 🚀 PASSO 1: Importar 62 Casos do Excel

### Localizar Arquivo
```
Projeto: l4-leads-judiciais (seu notebook)
Pasta: reports/
Arquivo: "CONTROLE E MOVIMENTAÇÃO PROCESSUAL.xlsx"
```

**Ações necessárias:**
1. Enviar arquivo ou fornecer caminho completo
2. Confirmar estrutura do Excel (colunas esperadas)
3. Executar import script

### Colunas Esperadas no Excel

O script `import-processos.mjs` espera:
```
✓ Número do processo   (numeroProcesso) - ÚNICA (chave única)
✓ Tribunal             (tribunal)
✓ Autor               (autor)
✓ Réu                 (reu)
✓ Valor da causa      (valorCausa)
✓ Data de ajuizamento (dataAjuizamento)
```

Ou estrutura customizada se different.

---

## 🔌 PASSO 2: Criar API para Scraper Enviar Atualizações

### Endpoint: POST `/api/leads/update-status`

Este endpoint JÁ EXISTE no CRM. Permite que o scraper envie atualizações.

```javascript
// Request do Scraper
POST /api/leads/update-status
{
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "statusCrm": "EM_CONTATO",      // ou NOVO, NEGOCIANDO, CONVERTIDO, PERDIDO
  "statusConsulta": "NOVA_MOVIMENTACAO", // ou PENDENTE, SEM_NOVIDADE, ERRO_CONSULTA
  "ultimaMovimentacao": "Agravo de instrumento interposto",
  "ultimaConsultaAt": "2026-06-03T23:53:54Z"
}
```

### Endpoint: POST `/api/leads/activities`

Para registrar cada movimentação encontrada:

```javascript
{
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "tipo": "MOVIMENTACAO",
  "descricao": "Sentença proferida em favor do cliente",
  "data": "2026-06-02T00:00:00Z",
  "usuario": "scraper@sistema"
}
```

---

## 📊 PASSO 3: Configurar Scraper para Chamar API

### No projeto l4-leads-judiciais:

Após encontrar atualização em um caso:

```javascript
// Exemplo de integração
const updateCase = async (caseData) => {
  const response = await fetch(
    'https://crm-grupo-l4x-89zh5evxv.vercel.app/api/leads/update-status',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SCRAPER_SECRET_KEY'
      },
      body: JSON.stringify({
        numeroProcesso: caseData.numero,
        statusConsulta: caseData.encontrouNovidade ? 'NOVA_MOVIMENTACAO' : 'SEM_NOVIDADE',
        ultimaMovimentacao: caseData.ultimoEvento,
        ultimaConsultaAt: new Date().toISOString()
      })
    }
  )
  
  return response.json()
}
```

---

## 🔐 PASSO 4: Configurar Autenticação (IMPORTANTE)

### Opção A: API Key Simples
```
Gerar chave no CRM
Scraper inclui: Authorization: Bearer API_KEY
```

### Opção B: NextAuth Token
```
Scraper autentica como "scraper@l4ativos.com.br"
Recebe token JWT
Inclui em Authorization: Bearer TOKEN
```

### Gerar Secret no Vercel:
1. Vercel Dashboard → Project Settings → Environment Variables
2. Adicionar: `SCRAPER_SECRET_KEY=seu_valor_unico`
3. Usar na API para validar requests

---

## ⏰ PASSO 5: Agendar Execução Diária

### Opção A: Cron Job Local (Seu Servidor)
```bash
# crontab -e
0 8 * * *  cd /home/l4/l4-leads-judiciais && node scraper.js
```

Executa todo dia às 8 AM

### Opção B: Vercel Crons (Recomendado)
```javascript
// next.config.mjs
export const config = {
  crons: [
    {
      path: '/api/crons/scraper-run',
      schedule: '0 8 * * *'  // Todo dia 8 AM
    }
  ]
}
```

Cria endpoint que roda automaticamente.

### Opção C: GitHub Actions
```yaml
name: Daily Case Check
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run scraper
```

---

## 📱 PASSO 6: Monitorar Resultados

### Dashboard do Advogado
```
URL: /pt/acompanhamento-processual

Vê em Tempo Real:
✓ Quantos casos: 62 monitorados
✓ Quantos com novidade: X processos
✓ Quantos em erro: Y processos
✓ Última consulta: data/hora
✓ Histórico de rotinas: resultados anteriores
```

### Histórico de Rotinas
```
Cada execução registra:
- Quando começou/terminou
- Quantos casos foram consultados
- Quantas novas movimentações foram encontradas
- Quantos tiveram erro
```

---

## 🛠️ Checklist de Implementação

- [ ] **1. Excel**: Arquivo "CONTROLE E MOVIMENTAÇÃO PROCESSUAL.xlsx" disponível
- [ ] **2. Import**: Executar `npm run import:processos` no CRM
- [ ] **3. Verificar**: Dashboard mostra 62 processos
- [ ] **4. API Secret**: Configurar `SCRAPER_SECRET_KEY` no Vercel
- [ ] **5. Scraper**: Configurar scraper para chamar `/api/leads/update-status`
- [ ] **6. Teste**: Simular 1 atualização manualmente
- [ ] **7. Agendamento**: Configurar cron para rodar diariamente
- [ ] **8. Monitoramento**: Advogados veem dados em tempo real
- [ ] **9. Alertas**: Configurar notificação de erros
- [ ] **10. Go Live**: Aprovar com time jurídico

---

## 🚨 Troubleshooting

### Problema: API retorna 401
```
✓ Verificar SCRAPER_SECRET_KEY está configurado
✓ Verificar Authorization header no request
✓ Confirmar formato: "Bearer API_KEY"
```

### Problema: Cron não executa
```
✓ Verificar timezone do servidor
✓ Checar logs no Vercel: vercel logs
✓ Confirmar caminho correto da rota /api/crons/scraper-run
```

### Problema: Dashboard mostra 0 processos
```
✓ Verificar se import foi executado
✓ Confirmar dados no banco: npx prisma studio
✓ Verificar permissão do usuário (role)
```

### Problema: Movimentações aparecem com atraso
```
✓ Verificar horário da execução do scraper
✓ Confirmar velocidade da internet/scraper
✓ Aumentar frequência se necessário
```

---

## 📞 Próximos Passos

**Envie para continuar:**
1. ✅ Arquivo Excel (ou caminho no seu notebook)
2. ✅ Detalhes do scraper (como funciona, linguagem, API)
3. ✅ Frequência desejada (diária, horária?)
4. ✅ Horário preferido para execução

Após receber isso, vou:
1. Importar os 62 casos
2. Criar API endpoints se necessário
3. Configurar integração completa
4. Testar com você antes de ir para os advogados

---

**Data**: 03 Junho 2026
**Versão**: 1.0
**Status**: 🔴 Aguardando dados do scraper
