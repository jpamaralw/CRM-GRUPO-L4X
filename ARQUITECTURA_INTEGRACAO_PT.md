# 🏗️ Arquitetura Integrada - L4 Judiciais + CRM

**Status**: 🔴 Em Desenvolvimento
**Prioridade**: 🔴 CRÍTICA

---

## 📊 Visão Geral - Pipeline Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                  L4 LEADS JUDICIAIS (Python)                     │
│                                                                   │
│  1. FETCH               2. ENRICH              3. SCORE          │
│  ┌──────────────┐      ┌──────────────┐     ┌──────────────┐    │
│  │ DataJud API  │─────▶│  CNPJ/CPF    │────▶│ Phase Score  │    │
│  │ (Selenium)   │      │ + Projudi    │     │ + ML Model   │    │
│  │ + Playwright │      │ + Custom     │     │              │    │
│  └──────────────┘      └──────────────┘     └──────────────┘    │
│                              │                                     │
│                              ▼                                     │
│                    ┌──────────────────────┐                       │
│                    │  ASSERTIVA API       │                       │
│                    │  (Higienização)      │                       │
│                    └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │  CRM API ENDPOINT    │
                    │  POST /api/leads     │
                    │  (JSON)              │
                    └──────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CRM DATABASE (PostgreSQL)                      │
│                                                                   │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────┐            │
│  │   Leads    │  │ Activities  │  │ ProcessoMoni- │            │
│  │  (Cases)   │  │ (History)   │  │ torado (Court)│            │
│  └────────────┘  └─────────────┘  └───────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │     LAWYER DASHBOARD                 │
        │  ▪ SDRs veem: Leads qualificados    │
        │  ▪ Closers atacam: Cases            │
        │  ▪ Gestor monitora: Pipeline        │
        │  ▪ Sócios veem: ROI & Métricas      │
        └──────────────────────────────────────┘
```

---

## 🔌 ENDPOINTS CRM (Node.js/Next.js)

### 1️⃣ `POST /api/leads/ingest` - Ingesta de Leads Enriquecidos

Recebe dados do scraper Python, valida, enriquece com Assertiva se necessário, cria lead.

```typescript
// Request from L4 Scraper
POST /api/leads/ingest
Authorization: Bearer SCRAPER_API_KEY
Content-Type: application/json

{
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "tribunal": "TJSP",
  "autor": "L4 ATIVOS",
  "reu": "Pessoa X CNPJ: 12.345.678/0001-90",
  "valorCausa": 500000.00,
  "dataAjuizamento": "2024-06-01",
  "fase": "EXECUÇÃO",
  "score": 95,
  "cnpj": "12.345.678/0001-90",
  "cpf": null,
  "assertiva_id": "asrt_123456789",  // Se já enriquecido
  "assertiva_data": {
    "razao_social": "Empresa X LTDA",
    "endereco": "Rua Y, 123",
    "telefone": "1144442222"
  },
  "polo_ativo": "L4 ATIVOS",
  "polo_passivo": "Pessoa Y",
  "governo_papel": false,
  "has_citacao_final": true,
  "origem": "tjsp_fetch",
  "raw_metadata": {}
}

// Response
{
  "success": true,
  "leadId": "lead_xyz789",
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "status": "NOVO",
  "message": "Lead criado com sucesso"
}
```

### 2️⃣ `POST /api/leads/batch-ingest` - Ingesta em Lote

Para quando o scraper encontra múltiplos leads.

```typescript
POST /api/leads/batch-ingest
Authorization: Bearer SCRAPER_API_KEY
Content-Type: application/json

{
  "leads": [ ...array of leads... ],
  "batch_id": "batch_20260603_tjsp_fetch",
  "tribunal": "TJSP",
  "operation": "fetch|enrich|update"
}

// Response
{
  "success": true,
  "batch_id": "batch_20260603_tjsp_fetch",
  "total": 150,
  "created": 145,
  "updated": 5,
  "errors": 0,
  "timestamp": "2026-06-03T23:53:54Z"
}
```

### 3️⃣ `POST /api/leads/update-status` - Atualizar Status

Quando há movimentação/atualização em um caso já monitorado.

```typescript
POST /api/leads/update-status
Authorization: Bearer SCRAPER_API_KEY

{
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "statusCrm": "EM_CONTATO",  // NOVO, EM_CONTATO, NEGOCIANDO, CONVERTIDO, PERDIDO
  "statusConsulta": "NOVA_MOVIMENTACAO",  // PENDENTE, SEM_NOVIDADE, NOVA_MOVIMENTACAO, ERRO_CONSULTA
  "ultimaMovimentacao": "Sentença proferida em favor do cliente",
  "ultimaMovimentacaoData": "2026-06-02T10:30:00Z",
  "faseAtualizada": "RECURSO",
  "scoreAtualizado": 98
}
```

### 4️⃣ `POST /api/leads/enrich` - Enriquecimento via Assertiva

CRM chama Assertiva para higienizar dados quando necessário.

```typescript
POST /api/leads/enrich
Authorization: Bearer INTERNAL_API_KEY

{
  "cnpj": "12.345.678/0001-90",
  "cpf": null,
  "leadId": "lead_xyz789",
  "criarSeNaoExistir": true
}

// Response
{
  "success": true,
  "leadId": "lead_xyz789",
  "assertiva_id": "asrt_123456789",
  "empresa": {
    "razao_social": "EMPRESA X LTDA",
    "nome_fantasia": "Empresa X",
    "cnpj_valido": true,
    "ativa": true,
    "ramo": "Serviços Financeiros",
    "endereco_completo": "...",
    "telefone": "11 4444-2222",
    "email": "contato@empresa.com.br"
  },
  "score_qualidade": 95,
  "flags": {
    "cnpj_ativo": true,
    "endereco_validado": true,
    "telefone_validado": true
  }
}
```

### 5️⃣ `GET /api/leads/sync-status` - Verificar Sincronização

Scraper verifica se dados chegaram no CRM (health check).

```typescript
GET /api/leads/sync-status?numeroProcesso=0001234-56.2024.8.26.0100
Authorization: Bearer SCRAPER_API_KEY

// Response
{
  "numeroProcesso": "0001234-56.2024.8.26.0100",
  "found": true,
  "syncedAt": "2026-06-03T23:53:54Z",
  "status": "NOVO",
  "score": 95
}
```

---

## 🐍 CLIENTE PYTHON (l4leads)

Criar `l4leads/clients/crm.py`:

```python
"""Client para integração com CRM Node.js"""
import httpx
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict

@dataclass
class CRMLead:
    numeroProcesso: str
    tribunal: str
    autor: str
    reu: str
    valorCausa: float
    dataAjuizamento: str
    fase: str
    score: int
    cnpj: Optional[str] = None
    cpf: Optional[str] = None
    polo_ativo: Optional[str] = None
    polo_passivo: Optional[str] = None
    assertiva_id: Optional[str] = None
    assertiva_data: Optional[Dict[str, Any]] = None

class CRMClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.client = httpx.Client(
            headers={"Authorization": f"Bearer {api_key}"}
        )

    def ingest_lead(self, lead: CRMLead) -> Dict[str, Any]:
        """Enviar um lead individual para o CRM"""
        response = self.client.post(
            f"{self.base_url}/api/leads/ingest",
            json=asdict(lead)
        )
        response.raise_for_status()
        return response.json()

    def ingest_batch(self, leads: List[CRMLead], tribunal: str, 
                     batch_id: str) -> Dict[str, Any]:
        """Enviar lote de leads para o CRM"""
        response = self.client.post(
            f"{self.base_url}/api/leads/batch-ingest",
            json={
                "leads": [asdict(lead) for lead in leads],
                "batch_id": batch_id,
                "tribunal": tribunal
            }
        )
        response.raise_for_status()
        return response.json()

    def sync_status(self, numero_processo: str) -> bool:
        """Verificar se lead foi sincronizado"""
        response = self.client.get(
            f"{self.base_url}/api/leads/sync-status",
            params={"numeroProcesso": numero_processo}
        )
        data = response.json()
        return data.get("found", False)

# Uso no __main__.py:
# crm = CRMClient(os.getenv("CRM_BASE_URL"), os.getenv("CRM_API_KEY"))
# crm.ingest_lead(lead_data)
```

---

## 🚀 WORKFLOW: Scraper para CRM

### Cenário 1: Busca Inicial (Fetch)

```
1. L4 Scraper: python -m l4leads fetch --tribunal tjsp
2. Scraper encontra 150 leads no DataJud
3. Enrichment automático (CNPJ, dados públicos)
4. POST /api/leads/batch-ingest com 150 leads
5. CRM valida, enriquece com Assertiva se necessário
6. CRM cria Activity "Lead importado via TJSP fetch"
7. CRM retorna: created 145, updated 5, errors 0
8. SDRs veem 150 novos leads no Dashboard
9. Closers começam a trabalhar
```

### Cenário 2: Atualização de Movimento

```
1. Lawyer reports: "Caso XYZ teve sentença"
2. Scraper verifica caso XYZ no PJe/TJ
3. Encontra movimento: "Sentença proferida"
4. POST /api/leads/update-status com movimento
5. CRM atualiza lead: status = "EM_CONTATO", statusConsulta = "NOVA_MOVIMENTACAO"
6. CRM cria Activity "Nova movimentação: Sentença"
7. Acompanhamento Processual mostra: "1 case com novidade"
8. Advogado é notificado
```

### Cenário 3: Enriquecimento Manual via Assertiva

```
1. Gestor vê lead sem enriquecimento
2. Clica botão "Enriquecer com Assertiva"
3. CRM chama POST /api/leads/enrich
4. Assertiva valida CNPJ/CPF, retorna dados completos
5. CRM atualiza lead com empresa + contatos
6. Activity: "Enriquecido via Assertiva - Score 95"
7. Lead agora pode ser acionado com informações corretas
```

---

## 📋 Variáveis de Ambiente Necessárias

### L4 Judiciais (.env)
```env
CRM_BASE_URL=https://crm-grupo-l4x.vercel.app
CRM_API_KEY=sk_live_abc123def456...
ASSERTIVA_API_KEY=key_assertiva_xyz...
```

### CRM Vercel
```env
SCRAPER_SECRET_KEY=sk_scraper_xyz...
ASSERTIVA_API_KEY=key_assertiva_xyz...
DATABASE_URL=postgresql://...
```

---

## ✅ Implementação - Ordem de Prioridade

**FASE 1 (Hoje):**
- [ ] Criar endpoint `/api/leads/ingest` no CRM
- [ ] Criar `CRMClient` Python
- [ ] Integração básica (teste manual)

**FASE 2 (Amanhã):**
- [ ] Endpoint `/api/leads/batch-ingest`
- [ ] Validação e sanitização de dados
- [ ] Integração com Assertiva API

**FASE 3 (Esta semana):**
- [ ] Automação: CLI command para sincronizar
- [ ] Agendamento (Cron)
- [ ] Monitoramento e alertas

**FASE 4 (Próxima semana):**
- [ ] Dashboard de sincronização
- [ ] Histórico de ingestões
- [ ] Relatórios de qualidade

---

## 🔐 Segurança

### API Keys
```
CRM_API_KEY: Usado pelo scraper para autenticar
SCRAPER_SECRET_KEY: Usado pelo CRM para validar requests
ASSERTIVA_API_KEY: Compartilhado entre ambos
```

### Validações
- [ ] Validar CNPJ/CPF antes de enviar
- [ ] Rejeitar dados duplicados
- [ ] Rate limit: max 100 leads/min
- [ ] Logging de todas as ingestões
- [ ] Auditoria: quem enviou, quando, o quê

---

## 📊 Monitoramento

### Métricas Importantes
- Leads ingeridos por dia
- Taxa de enriquecimento Assertiva
- Tempo de sincronização (latência)
- Taxa de erro
- Leads convertidos (pipeline)

### Alertas
- ❌ Falha de conexão CRM (enviar email)
- ❌ Taxa de erro > 10% (pausar sync)
- ⚠️ Latência > 5s (investigar)
- ✅ Sucesso: log detalhado

---

**Próximo Passo**: Qual fase você quer que eu comece?

1. **Fase 1** - Criar endpoints básicos
2. **Fase 1+2** - Endpoints + Python client
3. **Tudo** - Implementação completa pronto para ir ao vivo

Preciso também:
- [ ] Excel com 62 casos (para teste)
- [ ] Assertiva API credentials (se tiver)
- [ ] Detalhes dos tribunais a monitorar
