"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ADMIN: "bg-red-100 text-red-800",
  MANAGER: "bg-blue-100 text-blue-800",
  MEMBER: "bg-gray-100 text-gray-800",
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
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<any[]>("/users"),
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/users", { name, email, password, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("사용자가 추가되었습니다.");
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
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
              <Button className="w-full" onClick={() => mutation.mutate()} disabled={!name || !email || mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? <LoadingState /> : (
        <DataTable columns={columns} data={users || []} searchKey="name" searchPlaceholder="사용자 검색..." />
      )}
    </div>
  );
}
