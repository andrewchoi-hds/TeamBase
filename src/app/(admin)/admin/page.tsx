"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, ClipboardCheck, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<any[]>("/departments"),
  });

  const { data: cycles } = useQuery({
    queryKey: ["review-cycles"],
    queryFn: () => api.get<any[]>("/review-cycles"),
  });

  const activeCycles = (cycles ?? []).filter((c: any) => c.status === "ACTIVE").length;

  return (
    <div>
      <PageHeader title="관리자 대시보드" description="시스템 전체 현황을 관리합니다." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="전체 사용자" value={users?.length ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="부서 수" value={departments?.length ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="진행중 평가" value={activeCycles} icon={<ClipboardCheck className="h-5 w-5" />} />
        <StatCard title="시스템 상태" value="정상" icon={<Shield className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "사용자 관리", href: "/admin/users", desc: "사용자 추가, 역할 변경" },
          { title: "조직 관리", href: "/admin/organization", desc: "부서 구조 관리" },
          { title: "평가 주기 관리", href: "/admin/review-cycles", desc: "평가 주기 생성, 배정 관리" },
          { title: "평가 템플릿", href: "/admin/templates", desc: "평가 항목 템플릿 설정" },
          { title: "피드백 세션", href: "/admin/feedback-sessions", desc: "피드백 세션 생성/관리" },
          { title: "감사 로그", href: "/admin/audit-logs", desc: "시스템 활동 이력 조회" },
          { title: "시스템 설정", href: "/admin/system", desc: "시스템 환경 설정" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
