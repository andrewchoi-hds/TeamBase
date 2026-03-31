"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { History, Mail, Building2, User, Pencil, X, Check, Loader2 } from "lucide-react";

const roleLabels: Record<string, string> = { ADMIN: "관리자", MANAGER: "팀장", MEMBER: "팀원" };

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  // 편집 폼 state
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");

  const { data: member, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get<any>(`/users/${id}`),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<any[]>("/departments"),
    enabled: editing,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
    enabled: editing,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/users/${id}`, {
        name: editName,
        position: editPosition || null,
        role: editRole,
        departmentId: editDeptId || null,
        managerId: editManagerId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("사용자 정보가 수정되었습니다.");
      setEditing(false);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const startEditing = () => {
    if (!member) return;
    setEditName(member.name ?? "");
    setEditPosition(member.position ?? "");
    setEditRole(member.role ?? "MEMBER");
    setEditDeptId(member.department?.id ?? "");
    setEditManagerId(member.manager?.id ?? "");
    setEditing(true);
  };

  if (isLoading) return <LoadingState rows={5} />;
  if (!member) return null;

  return (
    <div>
      <PageHeader title={member.name} description="사용자 프로필">
        <div className="flex gap-2">
          {!editing && (
            <Button variant="outline" onClick={startEditing}>
              <Pencil className="mr-2 h-4 w-4" />편집
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/admin/users/${id}/history`}>
              <History className="mr-2 h-4 w-4" />평정 이력
            </Link>
          </Button>
        </div>
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
          {editing ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">정보 수정</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>이름</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>직책</Label>
                    <Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)} placeholder="예: 선임 개발자" />
                  </div>
                  <div className="space-y-2">
                    <Label>역할</Label>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">팀원</SelectItem>
                        <SelectItem value="MANAGER">팀장</SelectItem>
                        <SelectItem value="ADMIN">관리자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>부서</Label>
                    <Select value={editDeptId || "none"} onValueChange={(v) => setEditDeptId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="미배치" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">미배치</SelectItem>
                        {departments?.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>직속 리더</Label>
                    <Select value={editManagerId || "none"} onValueChange={(v) => setEditManagerId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="없음" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        {allUsers
                          ?.filter((u: any) => u.id !== id && (u.role === "MANAGER" || u.role === "ADMIN"))
                          .map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.department?.name ?? "미배치"})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>
                  <Button onClick={() => updateMutation.mutate()} disabled={!editName.trim() || updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
