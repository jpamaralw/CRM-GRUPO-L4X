import { scryptSync, timingSafeEqual } from 'crypto'

import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

import prisma from '@/libs/prisma'

const verifyPassword = (password, storedPassword) => {
  if (!password || !storedPassword) return false

  if (storedPassword.startsWith('scrypt$')) {
    const [, salt, key] = storedPassword.split('$')
    const hashed = scryptSync(password, salt, 64)
    const stored = Buffer.from(key, 'hex')

    return stored.length === hashed.length && timingSafeEqual(stored, hashed)
  }

  // Local legacy fallback. New users should store scrypt hashes.
  return password === storedPassword
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials || {}

        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user?.isActive || !verifyPassword(password, user.password)) return null

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
    maxAge: 30 * 24 * 60 * 60
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.role = user.role
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.role = token.role
      }

      return session
    }
  }
}
