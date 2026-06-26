import { redirect } from 'next/navigation'

import { requireCurrentUser } from '@/libs/serverAuth'
import { ROLES } from '@/utils/permissions'
import ImportUploader from '@/views/importar/ImportUploader'

export const dynamic = 'force-dynamic'

export default async function ImportarPage(props) {
  const params = await props.params
  const user = await requireCurrentUser()

  const allowed = [ROLES.GESTOR, ROLES.SOCIO, ROLES.TI]

  if (!user || !allowed.includes(user.role)) redirect(`/${params.lang}/dashboards/crm`)

  return <ImportUploader />
}
