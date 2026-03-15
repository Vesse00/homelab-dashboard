import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "./prisma";
import { compare } from "bcryptjs"; // Używamy bcryptjs
import * as OTPAuth from 'otpauth';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    error: '/login', // Jeśli wywali błąd GitHub, wróci na nasz piękny login
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
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          console.log("INVALID_CREDENTIALS");
          return null;
        }

        // Porównanie hasła (wpisane vs hash w bazie)
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.log("INVALID_CREDENTIALS");
          return null;
        }

        // --- LOGIKA 2FA ---
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          // NextAuth zamienia puste wartości na tekst "undefined", musimy to wyłapać!
          const code = credentials.totpCode;
          if (!code || code === "undefined" || code === "null" || code.trim() === "") {
            throw new Error("2FA_REQUIRED");
          }

          // Weryfikacja podanego kodu
          const totp = new OTPAuth.TOTP({
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
          });

          const delta = totp.validate({ token: credentials.totpCode, window: 1 });
          
          if (delta === null) {
            throw new Error("2FA_INVALID");
          }
        }

        console.log("✅ Login: Success for:", user.email, "Role:", user.role);

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

// --- NOWY SYSTEM PODWÓJNEJ AUTORYZACJI (PC + KIOSK) ---
export async function checkDualAuth(req: Request) {
  // 1. Sprawdzamy klasyczną sesję z przeglądarki (NextAuth)
  const session = await getServerSession(authOptions);
  if (session) return true;

  // 2. Jeśli nie ma sesji (czyli to tablet), sprawdzamy nagłówek Kiosku
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Sprawdzamy, czy token istnieje w bazie
    const kiosk = await prisma.kiosk.findUnique({
      where: { deviceToken: token },
      select: { id: true } // Pobieramy tylko ID dla szybkości
    });
    
    if (kiosk) return true;
  }

  // Odmowa dostępu
  return false;
}