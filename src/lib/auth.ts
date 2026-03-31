import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KeycloakProvider from "next-auth/providers/keycloak";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { logger } from "./logger";

// 프로덕션에서 NEXTAUTH_SECRET 필수 검증
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET 환경변수가 설정되지 않았습니다.");
}

const ssoEnabled = !!(process.env.SSO_URL && process.env.SSO_CLIENT_ID && process.env.SSO_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  providers: [
    // ====== SSO (Keycloak) — SSO_URL이 설정된 경우 활성화 ======
    ...(ssoEnabled
      ? [
          KeycloakProvider({
            clientId: process.env.SSO_CLIENT_ID!,
            clientSecret: process.env.SSO_CLIENT_SECRET!,
            issuer: `${process.env.SSO_URL}/realms/${process.env.SSO_REALM ?? "master"}`,
          }),
        ]
      : []),

    // ====== Credentials — 로컬 개발 / SSO 미설정 시 폴백 ======
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
          throw new Error("비밀번호가 설정되지 않은 계정입니다. SSO 로그인을 이용해주세요.");
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
    async signIn({ user, account, profile }) {
      // Keycloak SSO 로그인: 자동 프로비저닝
      if (account?.provider === "keycloak" && profile) {
        const email = profile.email as string | undefined;
        const keycloakId = profile.sub as string | undefined;

        if (!email || !keycloakId) {
          logger.error("SSO 로그인 실패: email 또는 keycloakId 누락");
          return false;
        }

        try {
          // 1. ssoId로 기존 유저 찾기
          let existingUser = await prisma.user.findUnique({
            where: { ssoId: keycloakId },
          });

          // 2. ssoId 없으면 email로 찾기 (기존 수동 생성 유저 매핑)
          if (!existingUser) {
            existingUser = await prisma.user.findUnique({
              where: { email },
            });
            if (existingUser) {
              // 기존 유저에 SSO 정보 연결
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { ssoProvider: "keycloak", ssoId: keycloakId },
              });
              logger.info(`기존 유저 SSO 연결: ${email}`);
            }
          }

          // 3. 유저가 없으면 신규 생성
          if (!existingUser) {
            const profileName =
              (profile as any).name ||
              (profile as any).preferred_username ||
              email.split("@")[0];

            existingUser = await prisma.user.create({
              data: {
                email,
                name: profileName,
                ssoProvider: "keycloak",
                ssoId: keycloakId,
                role: "MEMBER",
                isActive: true,
              },
            });
            logger.info(`SSO 신규 유저 생성: ${email}`);
          }

          // 4. 비활성 유저 차단
          if (!existingUser.isActive) {
            logger.warn(`비활성 유저 SSO 로그인 차단: ${email}`);
            return false;
          }

          // NextAuth user 객체에 DB 정보 주입
          user.id = existingUser.id;
          (user as any).role = existingUser.role;
          (user as any).departmentId = existingUser.departmentId;
          (user as any).managerId = existingUser.managerId;

          return true;
        } catch (error) {
          logger.error("SSO signIn 콜백 오류", { error: String(error) });
          return false;
        }
      }

      return true; // Credentials는 authorize()에서 처리됨
    },

    async jwt({ token, user, account }) {
      // 첫 로그인 시 user 정보를 토큰에 저장
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.departmentId = (user as any).departmentId;
        token.managerId = (user as any).managerId;
      }
      // Keycloak idToken 저장 (로그아웃 시 필요)
      if (account?.id_token) {
        token.idToken = account.id_token;
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

  events: {
    // Keycloak 서버에서도 로그아웃 처리
    async signOut(message) {
      if (ssoEnabled && (message as any)?.token?.idToken) {
        const issuer = `${process.env.SSO_URL}/realms/${process.env.SSO_REALM ?? "master"}`;
        const logoutUrl = `${issuer}/protocol/openid-connect/logout?id_token_hint=${(message as any).token.idToken}`;
        try {
          await fetch(logoutUrl);
        } catch {
          // Keycloak 로그아웃 실패해도 로컬 세션은 삭제됨
        }
      }
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

/** SSO 활성화 여부 (클라이언트에서 확인용) */
export { ssoEnabled };
