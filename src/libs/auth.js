// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'

import prisma from '@/libs/prisma'

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,

  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials ?? {}

        const invalid = () => new Error(JSON.stringify({ message: ['Email ou senha inválidos'] }))

        if (!email || !password) throw invalid()

        // Match the user against the team registered in the database
        const user = await prisma.user.findUnique({
          where: { email: String(email).toLowerCase().trim() }
        })

        if (!user || !user.password) throw invalid()

        if (user.isActive === false) {
          throw new Error(JSON.stringify({ message: ['Usuário inativo. Fale com o administrador.'] }))
        }

        const passwordValid = await compare(String(password), user.password)

        if (!passwordValid) throw invalid()

        // Never return the password hash to the client/session
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name
        token.role = user.role
        token.uid = user.id
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.role = token.role
        session.user.id = token.uid
      }

      return session
    }
  }
}
