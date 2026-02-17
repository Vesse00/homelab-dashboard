import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma"; // Upewnij się, że masz ten eksport klienta
import bcrypt from "bcryptjs";
import nextauth from '@/types/next-auth'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Używamy JWT, łatwiej w App Routerze
  },
  pages: {
    signIn: "/login", // Nasza customowa strona logowania (zrobimy ją zaraz)
  },
  providers: [
    // 1. Logowanie przez Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // 2. Logowanie Emial/Hasło
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
          return null; // Brak użytkownika lub użytkownik zarejestrowany przez Google (brak hasła)
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return user;
      }
    })
  ],
  callbacks: {
    // Dodajemy rolę użytkownika do sesji, żebyśmy mogli jej używać w Navbarze i Middleware
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub; // Dodajemy ID
        // Pobieramy rolę z bazy (token JWT może mieć nieaktualną)
        const user = await prisma.user.findUnique({ where: { id: token.sub }}); 
        if (user) {
            (session.user as any).role = user.role;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    }
  },
  events: {
    // === MAGIA: PIERWSZY USER ZOSTAJE ADMINEM ===
    createUser: async ({ user }) => {
      const count = await prisma.user.count();
      // Jeśli w bazie jest tylko 1 user (ten właśnie stworzony), daj mu Admina
      if (count === 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
        console.log(`User ${user.email} został automatycznie mianowany ADMINEM.`);
      }
    },
  },
};