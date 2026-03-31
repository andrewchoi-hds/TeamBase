"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { toast } from "sonner";
import { Plus, Building2, Users, Loader2, Pencil, Trash2, UserPlus, Crown, ChevronDown, ChevronRight } from "lucide-react";

const roleLabels: Record<string, string> = { ADMIN: "관리자", MANAGER: "팀장", MEMBER: "팀원" };

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  departmentId: string | null;
  managerId: string | null;
  department?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  children?: { id: string; name: string }[];
  _count?: { users: number };
}

export default function OrganizationPage() {
  const queryClient = useQueryClient();

  // 부서 생성/수정 state
  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptParentId, setDeptParentId] = useState("");
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);

  // 사용자 배치 state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDeptId, setAssignDeptId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");

  // 리더 설정 state
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [leaderDeptId, setLeaderDeptId] = useState<string | null>(null);
  const [leaderUserId, setLeaderUserId] = useState("");

  // 펼침 상태
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/departments"),
  });

  const { data: allUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  // 부서별 사용자 맵
  const usersByDept = new Map<string, User[]>();
  const unassignedUsers: User[] = [];
  allUsers?.forEach((u) => {
    if (u.departmentId) {
      if (!usersByDept.has(u.departmentId)) usersByDept.set(u.departmentId, []);
      usersByDept.get(u.departmentId)!.push(u);
    } else {
      unassignedUsers.push(u);
    }
  });

  // 부서별 리더 찾기
  const getLeader = (deptId: string) => {
    const members = usersByDept.get(deptId) ?? [];
    // 부서 내 MANAGER 역할이거나, 해당 부서 멤버의 managerId로 가장 많이 지정된 사람
    return members.find((u) => u.role === "MANAGER") ?? null;
  };

  // Mutations
  const createDeptMutation = useMutation({
    mutationFn: () => api.post("/departments", { name: deptName, parentId: deptParentId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("부서가 추가되었습니다.");
      setCreateOpen(false);
      setDeptName("");
      setDeptParentId("");
    },
  });

  const editDeptMutation = useMutation({
    mutationFn: () => api.patch(`/departments/${editDept!.id}`, { name: deptName, parentId: deptParentId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("부서가 수정되었습니다.");
      setEditDept(null);
      setDeptName("");
      setDeptParentId("");
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: () => api.delete(`/departments/${deleteDeptId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("부서가 삭제되었습니다.");
      setDeleteDeptId(null);
    },
    onError: () => toast.error("부서에 소속된 사용자가 있으면 삭제할 수 없습니다."),
  });

  const assignUserMutation = useMutation({
    mutationFn: (payload: { userId: string; departmentId: string | null }) =>
      api.patch(`/users/${payload.userId}`, { departmentId: payload.departmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("사용자가 배치되었습니다.");
      setAssignOpen(false);
      setAssignUserId("");
    },
  });

  const setLeaderMutation = useMutation({
    mutationFn: (payload: { deptId: string; userId: string }) => {
      const members = usersByDept.get(payload.deptId) ?? [];
      // 해당 부서 멤버 전원의 managerId를 이 사람으로 설정
      return Promise.all([
        // 리더 역할 설정
        api.patch(`/users/${payload.userId}`, { role: "MANAGER" }),
        // 부서 멤버들의 리더로 설정
        ...members
          .filter((m) => m.id !== payload.userId)
          .map((m) => api.patch(`/users/${m.id}`, { managerId: payload.userId })),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("리더가 설정되었습니다.");
      setLeaderOpen(false);
      setLeaderUserId("");
    },
  });

  const removeFromDeptMutation = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/users/${userId}`, { departmentId: null, managerId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("부서에서 제외되었습니다.");
    },
  });

  const toggleDept = (id: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (deptLoading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="조직 관리" description="부서 구조와 팀원 배치를 관리합니다.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />부서 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 부서</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>부서명</Label>
                <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="예: 개발팀" />
              </div>
              <div className="space-y-2">
                <Label>상위 부서 (선택)</Label>
                <Select value={deptParentId} onValueChange={setDeptParentId}>
                  <SelectTrigger><SelectValue placeholder="없음" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {departments?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => createDeptMutation.mutate()} disabled={!deptName.trim() || createDeptMutation.isPending}>
                {createDeptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-4">
        {/* 부서 목록 */}
        {departments?.map((dept) => {
          const members = usersByDept.get(dept.id) ?? [];
          const leader = getLeader(dept.id);
          const isExpanded = expandedDepts.has(dept.id);

          return (
            <Card key={dept.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-2 hover:text-primary transition-colors" onClick={() => toggleDept(dept.id)}>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{dept.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs ml-1">{members.length}명</Badge>
                    {dept.parent && <Badge variant="outline" className="text-[10px]">상위: {dept.parent.name}</Badge>}
                    {leader && (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                        <Crown className="h-2.5 w-2.5 mr-0.5" />리더: {leader.name}
                      </Badge>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setAssignDeptId(dept.id); setAssignOpen(true); }}
                      title="팀원 추가"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setLeaderDeptId(dept.id); setLeaderOpen(true); }}
                      title="리더 설정"
                    >
                      <Crown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => {
                        setEditDept(dept);
                        setDeptName(dept.name);
                        setDeptParentId(dept.parentId ?? "");
                      }}
                      title="부서 수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDeptId(dept.id)}
                      title="부서 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 px-4 pb-3">
                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">
                      아직 배치된 팀원이 없습니다.
                      <button className="text-primary ml-1 hover:underline" onClick={() => { setAssignDeptId(dept.id); setAssignOpen(true); }}>
                        팀원 추가하기
                      </button>
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {members
                        .sort((a, b) => (a.role === "MANAGER" ? -1 : b.role === "MANAGER" ? 1 : 0))
                        .map((user) => (
                        <div key={user.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 group">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {user.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">{user.name}</span>
                                {user.role === "MANAGER" && (
                                  <Crown className="h-3 w-3 text-primary" />
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">{user.position ?? user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="text-[10px]">{roleLabels[user.role]}</Badge>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromDeptMutation.mutate(user.id)}
                              title="부서에서 제외"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* 미배치 사용자 */}
        {unassignedUsers.length > 0 && (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4">
              <button className="flex items-center gap-2 hover:text-primary transition-colors" onClick={() => toggleDept("__unassigned__")}>
                {expandedDepts.has("__unassigned__") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base text-muted-foreground">미배치 사용자</CardTitle>
                <Badge variant="secondary" className="text-xs ml-1">{unassignedUsers.length}명</Badge>
              </button>
            </CardHeader>
            {expandedDepts.has("__unassigned__") && (
              <CardContent className="pt-0 px-4 pb-3">
                <div className="space-y-1">
                  {unassignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 group">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                            {user.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="text-[11px] text-muted-foreground ml-2">{user.email}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{roleLabels[user.role]}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* 팀원 추가 다이얼로그 */}
      <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) setAssignUserId(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {departments?.find((d) => d.id === assignDeptId)?.name}에 팀원 추가
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const candidates = allUsers?.filter((u) => u.departmentId !== assignDeptId) ?? [];
            const unassigned = candidates.filter((u) => !u.departmentId);
            const fromOther = candidates.filter((u) => u.departmentId);
            const selectedUser = candidates.find((u) => u.id === assignUserId);

            return (
              <div className="space-y-3">
                {/* 선택된 사용자 + 이동 경고 */}
                {selectedUser && selectedUser.departmentId && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      <strong>{selectedUser.name}</strong>은(는) 현재 <strong>{selectedUser.department?.name}</strong> 소속입니다.
                      배치하면 기존 부서에서 이동됩니다.
                    </p>
                  </div>
                )}

                <div className="max-h-[300px] overflow-y-auto space-y-3">
                  {/* 미배치 사용자 */}
                  {unassigned.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">미배치</p>
                      <div className="space-y-0.5">
                        {unassigned.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setAssignUserId(u.id)}
                            className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left transition-colors ${
                              assignUserId === u.id
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/60 border border-transparent"
                            }`}
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                {u.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{u.position ?? u.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">신규 배치</Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 타 부서 사용자 */}
                  {fromOther.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">타 부서 (이동)</p>
                      <div className="space-y-0.5">
                        {fromOther.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setAssignUserId(u.id)}
                            className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left transition-colors ${
                              assignUserId === u.id
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/60 border border-transparent"
                            }`}
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {u.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{u.position ?? u.email}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 border-amber-300 text-amber-600 dark:text-amber-400">
                              {u.department?.name} → 이동
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidates.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">배치 가능한 사용자가 없습니다.</p>
                  )}
                </div>

                <Button
                  className="w-full"
                  disabled={!assignUserId || assignUserMutation.isPending}
                  onClick={() => assignUserMutation.mutate({ userId: assignUserId, departmentId: assignDeptId })}
                >
                  {assignUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedUser?.departmentId ? `${selectedUser.department?.name}에서 이동` : "배치"}
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 리더 설정 다이얼로그 */}
      <Dialog open={leaderOpen} onOpenChange={(o) => { setLeaderOpen(o); if (!o) setLeaderUserId(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>리더 설정</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {departments?.find((d) => d.id === leaderDeptId)?.name}의 리더를 선택하세요.
            선택한 사용자가 팀장 역할로 설정되고, 해당 부서원의 직속 리더가 됩니다.
          </p>
          <Select value={leaderUserId} onValueChange={setLeaderUserId}>
            <SelectTrigger><SelectValue placeholder="리더 선택" /></SelectTrigger>
            <SelectContent>
              {(usersByDept.get(leaderDeptId ?? "") ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} {u.role === "MANAGER" ? "(현재 팀장)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            disabled={!leaderUserId || setLeaderMutation.isPending}
            onClick={() => leaderDeptId && setLeaderMutation.mutate({ deptId: leaderDeptId, userId: leaderUserId })}
          >
            {setLeaderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            리더 설정
          </Button>
        </DialogContent>
      </Dialog>

      {/* 부서 수정 다이얼로그 */}
      <Dialog open={!!editDept} onOpenChange={(o) => { if (!o) { setEditDept(null); setDeptName(""); setDeptParentId(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>부서 수정</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>부서명</Label>
              <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>상위 부서</Label>
              <Select value={deptParentId || "none"} onValueChange={(v) => setDeptParentId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {departments?.filter((d) => d.id !== editDept?.id).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => editDeptMutation.mutate()} disabled={!deptName.trim() || editDeptMutation.isPending}>
              {editDeptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}수정
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 부서 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteDeptId}
        onOpenChange={(o) => { if (!o) setDeleteDeptId(null); }}
        title="부서를 삭제하시겠습니까?"
        description="해당 부서에 소속된 사용자가 있으면 삭제할 수 없습니다."
        confirmText="삭제"
        variant="destructive"
        onConfirm={() => deleteDeptMutation.mutate()}
      />
    </div>
  );
}
