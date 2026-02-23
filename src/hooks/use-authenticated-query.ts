import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";

/**
 * useSession + useQuery를 결합한 훅.
 * sessionStatus === "authenticated"일 때만 쿼리 실행.
 */
export function useAuthenticatedQuery<T>(
  queryKey: unknown[],
  url: string,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  const { data: session, status: sessionStatus } = useSession();

  const query = useQuery<T>({
    queryKey,
    queryFn: () => api.get<T>(url),
    enabled: sessionStatus === "authenticated" && (options?.enabled ?? true),
    ...options,
  });

  return {
    ...query,
    session,
    sessionStatus,
    isReady: sessionStatus === "authenticated",
  };
}
