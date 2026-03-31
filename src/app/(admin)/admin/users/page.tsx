"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

const roleLabels: Record<string, string> = { ADMIN: "관리자", MANAGER: "팀장", MEMBER: "팀원" };
const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  MANAGER: "bg-sky-50 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  MEMBER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const columns: ColumnDef<any>[] = [
  { accessorKey: "name", header: "이름" },
  { accessorKey: "email", header: "이메일" },
  { accessorKey: "position", header: "직책", cell: ({ row }) => row.original.position || "-" },
  { accessorKey: "department", header: "부서", cell: ({ row }) => row.original.department?.name || "-" },
  {
    accessorKey: "role",
    header: "역할",
    cell: ({ row }) => (
      <Badge variant="secondary" className={`border-0 ${roleBadgeColors[row.original.role]}`}>
        {roleLabels[row.original.role]}
      </Badge>
    ),
  },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [position, setPosition] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get<any[]>("/departments"),
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/users", {
      name, email, password, role,
      position: position || undefined,
      departmentId: departmentId || undefined,
      managerId: managerId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("사용자가 추가되었습니다.");
      setOpen(false);
      setName(""); setEmail(""); setPassword(""); setPosition("");
      setDepartmentId(""); setManagerId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="사용자 관리" description="사용자를 추가하고 역할을 관리합니다.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />사용자 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 사용자</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>이름</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>이메일</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>비밀번호</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>역할</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">팀원</SelectItem>
                      <SelectItem value="MANAGER">팀장</SelectItem>
                      <SelectItem value="ADMIN">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>직책 <span className="text-muted-foreground text-xs">(선택)</span></Label>
                  <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 선임 개발자" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>부서 <span className="text-muted-foreground text-xs">(선택)</span></Label>
                  <Select value={departmentId || "none"} onValueChange={(v) => setDepartmentId(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="미배치" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">미배치</SelectItem>
                      {departments?.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>직속 리더 <span className="text-muted-foreground text-xs">(선택)</span></Label>
                  <Select value={managerId || "none"} onValueChange={(v) => setManagerId(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="없음" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      {users?.filter((u: any) => u.role === "MANAGER" || u.role === "ADMIN").map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => mutation.mutate()} disabled={!name || !email || mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <LoadingState /> : (
        <DataTable
          columns={columns}
          data={users || []}
          searchKey="name"
          searchPlaceholder="사용자 검색..."
          onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        />
      )}
    </div>
  );
}
