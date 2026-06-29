import prisma from '@/libs/prisma'

const fmtData = v => {
  if (!v) return '—'
  const d = new Date(v)

  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}

// Destinatários do acompanhamento: Drs (ADVOGADO) recebem; gestores (GESTOR/SOCIO) em cópia.
export async function resolveDigestRecipients() {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ['ADVOGADO', 'GESTOR', 'SOCIO'] }, email: { not: null } },
    select: { email: true, role: true, name: true }
  })

  const to = users.filter(u => u.role === 'ADVOGADO').map(u => u.email)
  const cc = users.filter(u => u.role !== 'ADVOGADO').map(u => u.email)

  // Fallback por env caso ainda não haja advogados cadastrados
  const envTo = (process.env.EMAIL_ACOMPANHAMENTO || '').split(',').map(s => s.trim()).filter(Boolean)

  return { to: to.length ? to : envTo, cc }
}

/**
 * Monta o HTML do relatório diário de acompanhamento processual.
 * @param {object} args
 * @param {object} args.run - registro ConsultaProcessualRun
 * @param {Array} args.novidades - [{numeroProcesso, cliente, tribunal, descricao, dataMovimento}]
 */
export function buildDigestHtml({ run, novidades = [] }) {
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const total = run?.totalProcessos ?? 0
  const consultados = run?.consultados ?? 0
  const novas = novidades.length

  const linhas = novidades
    .map(
      n => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#0b1f3a;font-weight:600;">${n.cliente || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef0f4;font-size:12px;color:#5b6b85;font-family:monospace;">${n.numeroProcesso}${n.tribunal ? ` · ${n.tribunal}` : ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#0b1f3a;">${n.descricao || 'Movimentação'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef0f4;font-size:12px;color:#5b6b85;white-space:nowrap;">${fmtData(n.dataMovimento)}</td>
      </tr>`
    )
    .join('')

  const tabela = novas
    ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;border:1px solid #eef0f4;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f6f8fc;">
            <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#5b6b85;">Parte</th>
            <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#5b6b85;">Processo</th>
            <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#5b6b85;">Movimentação</th>
            <th align="left" style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#5b6b85;">Data</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>`
    : `<div style="margin-top:8px;padding:18px;border:1px dashed #d4dbe8;border-radius:10px;text-align:center;color:#5b6b85;font-size:13px;">
        Nenhuma movimentação nova hoje. Todos os processos consultados estão sem novidade.
      </div>`

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#eef2f8;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <div style="max-width:720px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#00224f 0%,#003C96 60%,#002a6b 100%);border-radius:16px 16px 0 0;padding:28px 28px 22px;">
      <div style="color:#9cc3ff;font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;">L4 Ativos · Acompanhamento Processual</div>
      <div style="color:#fff;font-size:22px;font-weight:800;margin-top:6px;">Relatório diário — DataJud / CNJ</div>
      <div style="color:rgba(255,255,255,.8);font-size:13px;margin-top:4px;text-transform:capitalize;">${dataHoje}</div>
    </div>

    <div style="background:#fff;padding:8px 16px;display:flex;gap:8px;flex-wrap:wrap;border-left:1px solid #e6ebf4;border-right:1px solid #e6ebf4;">
      <div style="flex:1;min-width:120px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#003C96;">${total}</div>
        <div style="font-size:11px;color:#5b6b85;text-transform:uppercase;letter-spacing:.4px;">Monitorados</div>
      </div>
      <div style="flex:1;min-width:120px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#0b1f3a;">${consultados}</div>
        <div style="font-size:11px;color:#5b6b85;text-transform:uppercase;letter-spacing:.4px;">Consultados hoje</div>
      </div>
      <div style="flex:1;min-width:120px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:${novas ? '#1faa55' : '#5b6b85'};">${novas}</div>
        <div style="font-size:11px;color:#5b6b85;text-transform:uppercase;letter-spacing:.4px;">Novas movimentações</div>
      </div>
    </div>

    <div style="background:#fff;padding:8px 28px 28px;border-radius:0 0 16px 16px;border:1px solid #e6ebf4;border-top:none;">
      <div style="font-size:14px;font-weight:700;color:#0b1f3a;margin:14px 0 2px;">Movimentações novas</div>
      ${tabela}
      <div style="margin-top:22px;padding-top:16px;border-top:1px solid #eef0f4;font-size:12px;color:#8a97ad;">
        Relatório automático do CRM L4 Ativos. Acesse o sistema para registrar a análise de compliance (aprovar/reprovar) de cada ativo.
      </div>
    </div>
  </div>
</body></html>`
}
