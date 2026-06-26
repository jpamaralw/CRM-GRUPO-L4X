import { Resend } from 'resend'

// E-mail via Resend. Só envia de fato quando RESEND_API_KEY está configurada.
// Remetente padrão: configurável por EMAIL_FROM (precisa de domínio verificado no Resend).
const FROM = process.env.EMAIL_FROM || 'L4 Ativos <acompanhamento@l4ativos.com.br>'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const emailEnabled = Boolean(resend)

/**
 * Envia e-mail. Se Resend não estiver configurado, apenas loga (modo dry-run).
 * @returns {Promise<{ok:boolean, id?:string, skipped?:boolean, error?:string}>}
 */
export async function sendEmail({ to, cc, subject, html, replyTo }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean)
  const ccList = (Array.isArray(cc) ? cc : [cc]).filter(Boolean)

  if (!recipients.length) return { ok: false, error: 'Sem destinatários' }

  if (!resend) {
    console.log(`[email:dry-run] Para: ${recipients.join(', ')} | Assunto: ${subject}`)

    return { ok: true, skipped: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      ...(ccList.length ? { cc: ccList } : {}),
      subject,
      html,
      ...(replyTo ? { replyTo } : {})
    })

    if (error) return { ok: false, error: error.message || String(error) }

    return { ok: true, id: data?.id }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
