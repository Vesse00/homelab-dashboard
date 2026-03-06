import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "./prisma";
import { compare } from "bcryptjs"; // Używamy bcryptjs

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: "USER", // Domyślna rola dla osób logujących się przez GitHuba
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          console.log("❌ Logowanie: Nie znaleziono użytkownika:", credentials.email);
          return null;
        }

        // Porównanie hasła (wpisane vs hash w bazie)
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.log("❌ Logowanie: Błędne hasło dla:", credentials.email);
          return null;
        }

        console.log("✅ Logowanie: Sukces dla:", user.email, "Rola:", user.role);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  events: {
    async createUser({ user }) {
      const totalUsers = await prisma.user.count();
      
      // Jeżeli to absolutnie pierwszy użytkownik w systemie, zrób go Adminem
      if (totalUsers === 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" }
        });
        console.log(`👑 Pierwszy użytkownik (OAuth)! Zmieniono rolę na ADMIN dla: ${user.email}`);
      }
    }
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role || "USER"; // Ustawiamy rolę w tokenie
        token.id = user.id;
      }
      if (trigger === "update" && session) {
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.email) token.email = session.user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};