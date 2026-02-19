import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// 프로덕션에서 NEXTAUTH_SECRET 필수 검증
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET 환경변수가 설정되지 않았습니다.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          throw new Error("등록되지 않은 사용자이거나 비활성 계정입니다.");
        }

        if (!user.passwordHash) {
          throw new Error("비밀번호가 설정되지 않은 계정입니다. 관리자에게 문의하세요.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isPasswordValid) {
          throw new Error("비밀번호가 올바르지 않습니다.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          managerId: user.managerId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.managerId = user.managerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.departmentId = token.departmentId;
        session.user.managerId = token.managerId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
