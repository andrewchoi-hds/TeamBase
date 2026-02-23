"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Check, PenLine, ShieldCheck, Eye, X, Info, UserCheck, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ONBOARDING_KEY = "feedback-session-onboarding-seen";

export default function FeedbackSessionDetailPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen) setShowGuide(true);
    }
  }, []);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const { data: fbSession, isLoading } = useQuery({
    queryKey: ["feedback-session", sessionId],
    queryFn: () => api.get<any>(`/feedback-sessions/${sessionId}`),
    enabled: sessionStatus === "authenticated",
  });

  if (sessionStatus === "loading" || isLoading) return <LoadingState rows={4} />;
  if (!fbSession) return null;

  const myTargets = fbSession.targets?.filter((t: any) => t.userId !== userId) ?? [];

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
      </div>

      <PageHeader title={fbSession.name} description={fbSession.description}>
        <StatusBadge status={fbSession.status} />
        <Badge variant="outline">{fbSession.mode === "NAMED" ? "기명" : "익명"}</Badge>
      </PageHeader>

      {/* 온보딩 가이드 */}
      {showGuide && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                피드백 세션 안내
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={dismissGuide}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground">
              피드백 세션은 팀원 간 건설적인 피드백을 주고받는 공간입니다.
              각 대상자에게 강점, 개선점, 또는 일반 피드백을 작성할 수 있습니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                <UserCheck className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">기명 모드</p>
                  <p className="text-xs text-muted-foreground">
                    작성자 이름이 대상자에게 공개됩니다. 직접적이고 구체적인 피드백에 적합합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background border">
                <EyeOff className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">익명 모드</p>
                  <p className="text-xs text-muted-foreground">
                    작성자 정보가 비공개됩니다. 일정 수 이상 피드백이 모여야 대상자가 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={dismissGuide}>
              확인했습니다
            </Button>
          </CardContent>
        </Card>
      )}

      {fbSession.mode === "ANONYMOUS" && !showGuide && (
        <Alert className="mb-6">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            이 세션은 익명 모드입니다. 작성자 정보가 대상자에게 공개되지 않습니다.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">피드백 대상자</CardTitle>
        </CardHeader>
        <CardContent>
          {myTargets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              피드백을 작성할 대상자가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {myTargets.map((target: any) => {
                const hasWritten = target._count?.responses > 0 &&
                  target.responses?.some?.((r: any) => r.authorId === userId);

                return (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium">{target.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {target.user.position}
                        {target.user.department?.name && ` / ${target.user.department.name}`}
                      </p>
                    </div>
                    {fbSession.status === "ACTIVE" ? (
                      hasWritten ? (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="mr-1 h-3 w-3" />
                          작성 완료
                        </Badge>
                      ) : (
                        <Button size="sm" asChild>
                          <Link href={`/feedback/sessions/${sessionId}/write/${target.id}`}>
                            <PenLine className="mr-1 h-3 w-3" />
                            피드백 작성
                          </Link>
                        </Button>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="mr-1 h-3 w-3" />
                        조회만 가능
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
