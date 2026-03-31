"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { History, Mail, Building2, User } from "lucide-react";

const roleLabels: Record<string, string> = { ADMIN: "관리자", MANAGER: "팀장", MEMBER: "팀원" };

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: member, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get<any>(`/users/${id}`),
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!member) return null;

  return (
    <div>
      <PageHeader title={member.name} description="사용자 프로필">
        <Button asChild variant="outline">
          <Link href={`/admin/users/${id}/history`}>
            <History className="mr-2 h-4 w-4" />
            평정 이력
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {member.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <p className="text-muted-foreground">{member.position}</p>
              <Badge variant="outline" className="mt-2">{roleLabels[member.role]}</Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{member.email}</span>
              </div>
              {member.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{member.department.name}</span>
                </div>
              )}
              {member.manager && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>리더: {member.manager.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">사용자 정보</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">가입일</p>
                  <p className="font-medium">
                    {member.createdAt ? new Date(member.createdAt).toLocaleDateString("ko-KR") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">역할</p>
                  <p className="font-medium">{roleLabels[member.role]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">부서</p>
                  <p className="font-medium">{member.department?.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">직속 리더</p>
                  <p className="font-medium">{member.manager?.name ?? "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
