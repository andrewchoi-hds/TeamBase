/**
 * 인메모리 Rate Limiter
 * - 슬라이딩 윈도우 방식
 * - 서버 재시작 시 초기화됨 (프로덕션에서는 Redis 권장)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 5분마다 만료된 엔트리 정리
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** 윈도우 당 최대 요청 수 */
  limit: number;
  /** 윈도우 크기 (밀리초) */
  windowMs: number;
}

const PRESETS: Record<string, RateLimitConfig> = {
  /** 로그인: 분당 5회 */
  auth: { limit: 5, windowMs: 60 * 1000 },
  /** 회원가입: 시간당 3회 */
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** 일반 API: 분당 60회 */
  api: { limit: 60, windowMs: 60 * 1000 },
  /** 익명 피드백 제출: 시간당 10회 */
  feedback: { limit: 10, windowMs: 60 * 60 * 1000 },
};

export function rateLimit(
  key: string,
  preset: keyof typeof PRESETS = "api"
): { success: boolean; remaining: number; resetAt: number } {
  const config = PRESETS[preset];
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  if (entry.count > config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
