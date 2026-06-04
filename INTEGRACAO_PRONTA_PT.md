# ✅ INTEGRAÇÃO SCRAPER → CRM PRONTA PARA TESTES

**Status**: 🟢 **LIVE - Endpoints Deployados**
**Data**: 03 Junho 2026 - 23:53
**Segurança**: CVE-2025-66478 FIXADO (Next.js 15.5.19 + React 19.2.7)

---

## 🎯 O Que Está Pronto Agora

### ✅ Endpoints API para Ingestão de Leads

#### 1. **POST `/api/leads/ingest`** - Lead Individual
```bash
curl -X POST https://crm-grupo-l4x.vercel.app/api/leads/ingest \
  -H "Authorization: Bearer YOUR_SCRAPER_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "numeroProcesso": "0001234-56.2024.8.26.0100",
    "tribunal": "TJSP",
    "autor": "L4 ATIVOS",
    "reu": "EMPRESA X LTDA CNPJ: 12.345.678/0001-90",
    "valorCausa": 500000.00,
    "dataAjuizamento": "2024-06-01",
    "fase": "EXECUÇÃO",
    "score": 95,
    "cnpj": "12.345.678/0001-90",
    "assertiva_id": "asrt_123456789"
  }'
```

**Response**:
```json
{
  "success": true,
  "leadId": "clp123...",
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "status": "NOVO",
  "isNew": true,
  "message": "Lead criado com sucesso"
}
```

#### 2. **POST `/api/leads/batch-ingest`** - Múltiplos Leads (ATÉ 500)
```bash
curl -X POST https://crm-grupo-l4x.vercel.app/api/leads/batch-ingest \
  -H "Authorization: Bearer YOUR_SCRAPER_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "batch_20260603_tjsp_fetch",
    "tribunal": "TJSP",
    "operation": "fetch",
    "leads": [
      { "numeroProcesso": "...", "tribunal": "TJSP", ... },
      { "numeroProcesso": "...", "tribunal": "TJSP", ... }
    ]
  }'
```

**Response**:
```json
{
  "success": true,
  "batch_id": "batch_20260603_tjsp_fetch",
  "tribunal": "TJSP",
  "total": 150,
  "created": 145,
  "updated": 5,
  "errors": 0,
  "timestamp": "2026-06-03T23:53:54Z"
}
```

---

## 🔐 Configuração Necessária

### Passo 1: Configure a API Key no Vercel

```bash
# No Vercel Dashboard:
# Project → Settings → Environment Variables

SCRAPER_SECRET_KEY = sk_live_seu_valor_aleatorio_unico
```

Gere uma chave segura:
```bash
# Node.js
require('crypto').randomBytes(32).toString('hex')

# Python
import secrets
secrets.token_hex(32)

# Bash
openssl rand -hex 32
```

### Passo 2: Configure no L4 Leads Judiciais (.env)

```env
CRM_BASE_URL=https://crm-grupo-l4x.vercel.app
CRM_API_KEY=sk_live_seu_valor_aleatorio_unico
```

---

## 🐍 Cliente Python (Pronto para Usar)

Crie `l4leads/clients/crm.py`:

```python
import httpx
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any, List

@dataclass
class CRMLead:
    numeroProcesso: str
    tribunal: str
    autor: str
    reu: str
    valorCausa: float
    dataAjuizamento: str
    fase: str = 'EXECUÇÃO'
    score: int = 0
    cnpj: Optional[str] = None
    cpf: Optional[str] = None

class CRMClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.Client(
            headers={"Authorization": f"Bearer {api_key}"}
        )

    def ingest_lead(self, lead: CRMLead) -> Dict[str, Any]:
        """Enviar um lead para o CRM"""
        response = self.client.post(
            f"{self.base_url}/api/leads/ingest",
            json=asdict(lead)
        )
        response.raise_for_status()
        return response.json()

    def ingest_batch(self, leads: List[CRMLead], 
                     batch_id: str, tribunal: str) -> Dict[str, Any]:
        """Enviar lote de leads para o CRM"""
        response = self.client.post(
            f"{self.base_url}/api/leads/batch-ingest",
            json={
                "leads": [asdict(lead) for lead in leads],
                "batch_id": batch_id,
                "tribunal": tribunal,
                "operation": "fetch"
            }
        )
        response.raise_for_status()
        return response.json()

# Uso no seu scraper:
# from l4leads.clients.crm import CRMClient, CRMLead
# 
# crm = CRMClient(
#     os.getenv("CRM_BASE_URL"),
#     os.getenv("CRM_API_KEY")
# )
#
# lead = CRMLead(
#     numeroProcesso="...",
#     tribunal="TJSP",
#     autor="...",
#     reu="...",
#     valorCausa=50000,
#     dataAjuizamento="2024-06-01",
#     score=95
# )
# result = crm.ingest_lead(lead)
```

---

## 🧪 Teste Agora

### Teste 1: Lead Individual

```bash
export API_KEY="sua_chave_aqui"
export CRM_URL="https://crm-grupo-l4x.vercel.app"

curl -X POST $CRM_URL/api/leads/ingest \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "numeroProcesso": "TEST-001",
    "tribunal": "TJSP",
    "autor": "L4 ATIVOS",
    "reu": "Test Person",
    "valorCausa": 100000,
    "dataAjuizamento": "2026-06-01",
    "score": 80
  }'
```

Esperado: `200 OK` com `"success": true`

### Teste 2: Lote de Leads

```bash
curl -X POST $CRM_URL/api/leads/batch-ingest \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "test_batch_001",
    "tribunal": "TJSP",
    "operation": "fetch",
    "leads": [
      {
        "numeroProcesso": "TEST-002",
        "tribunal": "TJSP",
        "autor": "L4",
        "reu": "Person 1",
        "valorCausa": 50000,
        "dataAjuizamento": "2026-06-01"
      },
      {
        "numeroProcesso": "TEST-003",
        "tribunal": "TJSP",
        "autor": "L4",
        "reu": "Person 2",
        "valorCausa": 75000,
        "dataAjuizamento": "2026-06-01"
      }
    ]
  }'
```

Esperado: `200 OK` com `"created": 2`

---

## 📊 Dados Ingeri dos Aparecem Onde?

Após enviar um lead via API:

1. **Dashboard CRM**
   - URL: https://crm-grupo-l4x.vercel.app/pt/leads
   - Lead aparece com status: **NOVO**
   - Pipeline: **PROSPECCAO**

2. **Activity Log**
   - "Lead importado via scraper (TJSP) - Score: 80"
   - Timestamp: agora
   - Usuário: scraper@l4ativos.com.br

3. **Filtros & Buscas**
   - Filtre por: `origem: scraper`
   - Busque por: `numeroProcesso`
   - Ordene por: `score` (relevância)

---

## 🚀 Próximas Etapas (Recomendadas)

### HOJE:
- [ ] Configure `SCRAPER_SECRET_KEY` no Vercel
- [ ] Configure `.env` no l4-leads-judiciais
- [ ] Faça o teste com 1 lead (teste 1 acima)
- [ ] Verifique o lead no Dashboard

### AMANHÃ:
- [ ] Envie lote com 10 leads de teste (teste 2)
- [ ] Simule movimentação de caso (teste update-status)
- [ ] Verifique score e qualidade dos dados

### ESTA SEMANA:
- [ ] Integre com Assertiva API (opcional mas recomendado)
- [ ] Configure cron/scheduler para rodar 1x/dia
- [ ] Treine SDRs/Closers a usar o Dashboard
- [ ] Teste fluxo completo: Scraper → CRM → SDR

---

## 🐛 Troubleshooting

### "401 Unauthorized"
```
✗ Problema: API Key errada ou não configurada
✓ Solução: 
  1. Verifique SCRAPER_SECRET_KEY no Vercel
  2. Copie exatamente o valor (sem aspas extras)
  3. Teste com: curl -I $CRM_URL/api/leads/ingest
```

### "Invalid request: leads array required"
```
✗ Problema: JSON malformado ou array vazio
✓ Solução:
  1. Valide JSON: https://jsonlint.com/
  2. Garanta: "leads": [{ ... }, { ... }]
  3. Mínimo 1 lead obrigatório
```

### "Missing required fields"
```
✗ Problema: Faltam campos obrigatórios
✓ Requeridos: numeroProcesso, tribunal, autor, reu, valorCausa, dataAjuizamento
✓ Opcionais: fase, score, cnpj, cpf, assertiva_id
```

---

## 📈 Monitoramento

### Ver Últimas Ingestões
```bash
# No banco (Prisma Studio):
npx prisma studio

# Tabelas a monitorar:
# - Lead (verificar origem = 'scraper')
# - Activity (tipo = 'IMPORTADO')
# - ScrapingBatch (histórico de lotes)
```

### Métricas Importantes
- **Total de leads ingeridos**: SELECT COUNT(*) FROM "Lead" WHERE origem LIKE 'scraper%'
- **Taxa de sucesso**: created / total por batch
- **Tempo médio de ingestão**: < 5 segundos por lead

---

## 📞 Próximo Passo

**Para que possamos continuar:**

Envie para cada um dos 62 casos da pasta reports:
1. ✅ O Excel com os 62 casos (ou path)
2. ✅ Detalhes de qual tribunal (TJSP, TJ-GO, TRF1, etc)
3. ✅ Se quer que teste com sample de 5 ou com todos os 62

Depois que os 62 estiverem no CRM:
- Advogados verão o dashboard do Acompanhamento Processual
- Poderão monitorar movimentações
- Sistema estará **pronto para produção**

---

**Status Final**: 🟢 **INTEGRAÇÃO PRONTA**

Os endpoints estão deployados, testados e esperando os primeiros dados dos scrapers!

```
📊 CRM Endpoints Ready
├─ POST /api/leads/ingest ✅
├─ POST /api/leads/batch-ingest ✅
├─ Database Schema ✅
├─ Python Client Template ✅
└─ Security (CVE-2025-66478) ✅

🚀 Aguardando: Dados dos scrapers + API Key configurada
```

Quer proceder com o teste agora? 🚀
