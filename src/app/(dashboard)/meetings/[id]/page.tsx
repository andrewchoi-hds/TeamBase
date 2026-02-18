"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { LoadingState } from "@/components/common/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, Send, Calendar, Clock, Loader2 } from "lucide-react";

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");
  const [newAction, setNewAction] = useState("");

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => api.get<any>(`/meetings/${id}`),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => api.post(`/meetings/${id}/notes`, { content: noteContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      setNoteContent("");
      toast.success("노트가 추가되었습니다.");
    },
  });

  const addActionMutation = useMutation({
    mutationFn: () => api.post(`/meetings/${id}/action-items`, { title: newAction }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      setNewAction("");
      toast.success("액션 아이템이 추가되었습니다.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/meetings/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success("상태가 변경되었습니다.");
    },
  });

  if (isLoading) return <LoadingState rows={5} />;
  if (!meeting) return null;

  const other = meeting.organizerId === session?.user?.id ? meeting.participant : meeting.organizer;

  return (
    <div>
      <PageHeader title={meeting.title} description={`with ${other.name}`}>
        <StatusBadge status={meeting.status} />
        {meeting.status === "SCHEDULED" && (
          <Button size="sm" onClick={() => statusMutation.mutate("IN_PROGRESS")}>시작</Button>
        )}
        {meeting.status === "IN_PROGRESS" && (
          <Button size="sm" onClick={() => statusMutation.mutate("COMPLETED")}>완료</Button>
        )}
      </PageHeader>

      {/* Meeting Info */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(meeting.scheduledAt), "yyyy.M.d (EEE) HH:mm", { locale: ko })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />{meeting.duration}분
            </span>
          </div>
          {meeting.agenda && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">어젠다</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.agenda}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">미팅 노트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="노트를 작성하세요..."
                rows={2}
                className="flex-1"
              />
              <Button size="icon" onClick={() => addNoteMutation.mutate()} disabled={!noteContent || addNoteMutation.isPending}>
                {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-3">
              {meeting.notes?.map((note: any) => (
                <div key={note.id} className="border-l-2 pl-3 py-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{note.author.name}</span>
                    <span>{format(new Date(note.createdAt), "HH:mm")}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">액션 아이템</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="새 액션 아이템..."
                onKeyDown={(e) => e.key === "Enter" && newAction && addActionMutation.mutate()}
              />
              <Button size="icon" onClick={() => addActionMutation.mutate()} disabled={!newAction || addActionMutation.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {meeting.actionItems?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 py-1">
                  <Checkbox checked={item.status === "DONE"} />
                  <span className={`text-sm flex-1 ${item.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.assignee.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
