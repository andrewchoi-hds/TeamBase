"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SystemSettingsPage() {
  return (
    <div>
      <PageHeader title="시스템 설정" description="시스템 환경을 관리합니다." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">시스템 정보</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">버전</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">프레임워크</span>
                <span className="text-sm font-medium">Next.js 14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">데이터베이스</span>
                <Badge variant="outline" className="text-green-600 dark:text-green-400">연결됨</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">환경</span>
                <span className="text-sm font-medium">Development</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">보안 설정</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">익명 피드백 최소 수집 수</span>
                <span className="text-sm font-medium">3건</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">열람 로그 자동 알림</span>
                <Badge variant="outline" className="text-green-600 dark:text-green-400">활성</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">세션 만료 시간</span>
                <span className="text-sm font-medium">30일</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
