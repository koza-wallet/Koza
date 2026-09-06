import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Mock Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@koza.com" },
        password: { label: "Password (bebas)", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Cari user di database lokal (SQLite)
        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Auto-register jika belum ada (karena ini Mock Login lokal)
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              subscriptionTier: "FREE" // Default FREE
            }
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionTier: user.subscriptionTier,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = (user as any).subscriptionTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).subscriptionTier = token.subscriptionTier;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login", // Nanti kita buat halaman kustom
  }
};
