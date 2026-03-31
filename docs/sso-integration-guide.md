# TeamBase SSO 연동 가이드

> BTS 프로젝트(`/nerd-cabinet/playground/bts`)의 Keycloak SSO 구현을 참고하여 작성

## 현재 상태 vs 목표

| 항목 | 현재 (TeamBase) | 목표 |
|------|----------------|------|
| NextAuth 버전 | v4.24.13 | v4 유지 (안정성) |
| 인증 방식 | Credentials (이메일/비번) | Keycloak SSO (OIDC) |
| 세션 전략 | JWT (7일) | JWT (유지) |
| 사용자 생성 | 관리자가 수동 등록 | SSO 첫 로그인 시 자동 생성 |
| passwordHash | 필수 (non-nullable) | 선택 (nullable) — SSO 유저는 비밀번호 없음 |
| 로그인 페이지 | 자체 이메일/비번 폼 | Keycloak 로그인 페이지로 리다이렉트 |

## 필요한 환경 변수

```env
# .env (추가)
SSO_PROVIDER=keycloak
SSO_URL=https://sso.hirediversity.kr
SSO_CLIENT_ID=teambase
SSO_CLIENT_SECRET=<Keycloak에서 발급받은 시크릿>
SSO_REALM=master
```

> Keycloak 관리 콘솔에서 `teambase` 클라이언트 생성 필요:
> - Client Protocol: openid-connect
> - Access Type: confidential
> - Valid Redirect URIs: `https://<teambase-url>/api/auth/callback/keycloak`
> - Web Origins: `https://<teambase-url>`

---

## 변경 파일 목록

### 1. Prisma 스키마 변경

**파일**: `prisma/schema.prisma`

```prisma
model User {
  // 기존 필드
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String?   // ← 필수 → 선택으로 변경 (SSO 유저는 null)
  role          Role      @default(MEMBER)
  
  // SSO 필드 추가
  ssoProvider   String?   // "keycloak"
  ssoId         String?   @unique  // Keycloak subject ID (sub claim)
  
  // 나머지 기존 필드 유지
  position      String?
  profileImage  String?
  departmentId  String?
  managerId     String?
  isActive      Boolean   @default(true)
  // ...
}
```

**마이그레이션**:
```bash
npx prisma migrate dev --name add-sso-fields
```

---

### 2. NextAuth 설정 변경

**파일**: `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    // ====== SSO (Keycloak) ======
    ...(process.env.SSO_URL ? [
      KeycloakProvider({
        clientId: process.env.SSO_CLIENT_ID!,
        clientSecret: process.env.SSO_CLIENT_SECRET!,
        issuer: `${process.env.SSO_URL}/realms/${process.env.SSO_REALM ?? "master"}`,
      }),
    ] : []),

    // ====== 폴백: 로컬 인증 (개발/테스트용) ======
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.passwordHash || !user.isActive) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // SSO 로그인: 자동 사용자 생성/매핑
      if (account?.provider === "keycloak" && profile) {
        const email = profile.email;
        const keycloakId = profile.sub;
        if (!email || !keycloakId) return false;

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
            }
          }

          // 3. 유저가 없으면 신규 생성
          if (!existingUser) {
            const name = (profile as any).name
              || (profile as any).preferred_username
              || email.split("@")[0];

            existingUser = await prisma.user.create({
              data: {
                email,
                name,
                ssoProvider: "keycloak",
                ssoId: keycloakId,
                role: "MEMBER",  // 기본 역할 — 관리자가 나중에 변경
                isActive: true,
              },
            });
          }

          // 4. 비활성 유저 차단
          if (!existingUser.isActive) return false;

          // NextAuth user 객체에 DB 정보 주입
          user.id = existingUser.id;
          (user as any).role = existingUser.role;
          (user as any).departmentId = existingUser.departmentId;
          (user as any).managerId = existingUser.managerId;

          return true;
        } catch (error) {
          console.error("SSO signIn error:", error);
          return false;
        }
      }

      return true; // Credentials 로그인은 authorize()에서 처리
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
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string | null;
        session.user.managerId = token.managerId as string | null;
      }
      return session;
    },
  },

  events: {
    // Keycloak 서버에서도 로그아웃 처리 (SSO 연동 시)
    async signOut(message: any) {
      if (process.env.SSO_URL && message?.token?.idToken) {
        const issuer = `${process.env.SSO_URL}/realms/${process.env.SSO_REALM ?? "master"}`;
        const logoutUrl = `${issuer}/protocol/openid-connect/logout?id_token_hint=${message.token.idToken}`;
        try {
          await fetch(logoutUrl);
        } catch {
          // 로그아웃 실패해도 로컬 세션은 삭제됨
        }
      }
    },
  },

  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
```

**핵심 설계**:
- `SSO_URL` 환경변수가 있으면 Keycloak 활성화, 없으면 Credentials만 사용
- 기존 수동 생성 유저도 email로 매칭하여 SSO 연결
- Keycloak 로그아웃 시 SSO 서버에서도 세션 종료

---

### 3. 로그인 페이지 변경

**파일**: `src/app/(auth)/login/page.tsx`

```typescript
// SSO 활성화 시: Keycloak 로그인 버튼 표시
// SSO 비활성화 시: 기존 이메일/비밀번호 폼 유지

// 판별 방법: 서버 컴포넌트에서 환경변수 확인 또는
// /api/auth/providers 호출하여 keycloak provider 존재 여부 확인

const ssoEnabled = providers에 "keycloak"이 있는지 확인;

if (ssoEnabled) {
  // "회사 계정으로 로그인" 버튼 하나만 표시
  <Button onClick={() => signIn("keycloak", { callbackUrl: "/" })}>
    회사 계정으로 로그인
  </Button>
} else {
  // 기존 이메일/비밀번호 폼
}
```

---

### 4. 회원가입 페이지 제거/조건부

**SSO 활성화 시**: `/register` 불필요 (Keycloak에서 사용자 관리)
**SSO 비활성화 시**: 개발/테스트용으로 유지

---

### 5. 미들웨어 (변경 없음)

현재 미들웨어는 NextAuth `withAuth`를 사용하고 있어서 SSO 추가 시 별도 변경 불필요. 
Keycloak 로그인 후 JWT 세션이 동일하게 생성됨.

---

## SSO 사용자 자동 프로비저닝 흐름

```
1. 사용자가 TeamBase 접속
   ↓
2. 미들웨어: 세션 없음 → /login 리다이렉트
   ↓
3. "회사 계정으로 로그인" 클릭
   ↓
4. Keycloak 로그인 페이지로 리다이렉트
   ↓
5. Keycloak 인증 성공 → callback URL로 돌아옴
   ↓
6. signIn 콜백 실행:
   ├─ ssoId로 기존 유저 찾기
   ├─ 없으면 email로 찾기 (수동 생성 유저 연결)
   ├─ 그래도 없으면 신규 생성 (role: MEMBER)
   └─ isActive === false면 차단
   ↓
7. JWT 토큰 생성 (id, role, departmentId, managerId)
   ↓
8. 대시보드로 이동
```

**신규 SSO 유저**: MEMBER 역할로 생성 → 관리자가 조직관리에서 부서/역할 설정

---

## 관리자 역할 부여 방식

SSO 환경에서 첫 관리자 설정 옵션:

### 옵션 A: 시드 데이터 (권장)
```typescript
// prisma/seed.ts에서 특정 이메일을 ADMIN으로 설정
await prisma.user.upsert({
  where: { email: "admin@company.com" },
  update: { role: "ADMIN" },
  create: {
    email: "admin@company.com",
    name: "관리자",
    role: "ADMIN",
    ssoProvider: "keycloak",
    ssoId: "placeholder",  // 첫 SSO 로그인 시 자동 업데이트
    isActive: true,
  },
});
```

### 옵션 B: 환경변수로 초기 관리자 지정
```env
INITIAL_ADMIN_EMAILS=admin@company.com,cto@company.com
```
signIn 콜백에서 이 이메일로 첫 로그인하면 자동 ADMIN 역할 부여.

### 옵션 C: 첫 번째 사용자 자동 ADMIN
신규 배포 시 DB에 유저가 0명이면 첫 로그인 유저를 ADMIN으로 설정.

---

## BTS 참고 사항 (차이점)

| 항목 | BTS | TeamBase |
|------|-----|----------|
| NextAuth 버전 | v5 (beta 30) | v4.24 (안정) |
| `auth()` 호출 | `import { auth } from "@/lib/auth"` | `getServerSession(authOptions)` |
| Provider 설정 | 최상위 export | `authOptions.providers` |
| User 모델 | `role: String ("user"/"admin")` | `role: Enum (ADMIN/MANAGER/MEMBER)` |
| DB Adapter | @auth/prisma-adapter v2 | 미사용 (JWT only) |

> BTS는 NextAuth v5를 쓰지만 TeamBase는 v4를 유지하는 것이 안전.
> v5는 아직 beta이고 API가 다름. v4에서 Keycloak Provider는 동일하게 지원됨.

---

## 체크리스트

### Keycloak 서버 설정
- [ ] Keycloak에 `teambase` 클라이언트 생성
- [ ] Client Protocol: openid-connect
- [ ] Access Type: confidential
- [ ] Valid Redirect URI 설정
- [ ] Client Secret 복사

### TeamBase 코드 변경
- [ ] Prisma 스키마: `passwordHash` nullable + `ssoProvider`, `ssoId` 추가
- [ ] 마이그레이션 실행
- [ ] `src/lib/auth.ts`: KeycloakProvider 추가 + signIn/jwt/session 콜백
- [ ] 로그인 페이지: SSO 버튼 추가
- [ ] 환경변수 설정: `SSO_URL`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`
- [ ] 시드 데이터: 초기 관리자 이메일 설정

### 테스트
- [ ] SSO 로그인 → 신규 유저 자동 생성 확인
- [ ] 기존 유저 SSO 로그인 → email 매칭 확인
- [ ] 비활성 유저 차단 확인
- [ ] 로그아웃 → Keycloak 세션 종료 확인
- [ ] JWT 토큰에 role/departmentId 포함 확인
- [ ] SSO_URL 미설정 시 Credentials 폴백 확인

---

## 환경별 동작

| 환경 | SSO_URL | 동작 |
|------|---------|------|
| 로컬 개발 | 미설정 | Credentials 로그인 (이메일/비밀번호) |
| 스테이징 | 설정 | Keycloak SSO + Credentials 폴백 |
| 프로덕션 | 설정 | Keycloak SSO 전용 (Credentials 비활성화 가능) |
