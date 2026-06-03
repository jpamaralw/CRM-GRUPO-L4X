// Third-party Imports
import { getServerSession } from 'next-auth'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'
import { authOptions } from '@/libs/auth'

export default async function AuthGuard({ children, locale }) {
  const session = await getServerSession(authOptions)

  return <>{session ? children : <AuthRedirect lang={locale} />}</>
}
