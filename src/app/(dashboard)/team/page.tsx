"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

const roleLabels: Record<string, string> = { ADMIN: "관리자", MANAGER: "팀장", MEMBER: "팀원" };

export default function TeamPage() {
  const { data: session } = useSession();
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  if (isLoading) return <LoadingState rows={6} />;

  // Filter team members based on role
  const teamMembers = session?.user?.role === "ADMIN"
    ? users
    : users?.filter((u: any) => u.managerId === session?.user?.id || u.id === session?.user?.id);

  return (
    <div>
      <PageHeader title="팀 관리" description="팀원 정보를 확인하고 관리하세요.">
        <Button asChild variant="outline">
          <Link href="/team/report"><BarChart3 className="mr-2 h-4 w-4" />팀 리포트</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers?.map((member: any) => (
          <Link key={member.id} href={`/team/${member.id}`}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {member.name?.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{member.position ?? ""}</span>
                      <Badge variant="outline" className="text-xs">{roleLabels[member.role]}</Badge>
                    </div>
                    {member.department && (
                      <p className="text-xs text-muted-foreground">{member.department.name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
