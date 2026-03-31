"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KUDOS_TAGS, type KudosTagValue } from "@/lib/constants/kudos-tags";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SendKudosDialogProps {
  trigger?: React.ReactNode;
}

interface SimpleUser {
  id: string;
  name: string;
  position: string | null;
}

export function SendKudosDialog({ trigger }: SendKudosDialogProps) {
  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTags, setSelectedTags] = useState<KudosTagValue[]>([]);
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["users-simple"],
    queryFn: () => api.get<SimpleUser[]>("/users?simple=true"),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/kudos", {
        receiverId,
        message,
        tags: selectedTags.length > 0 ? selectedTags : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kudos"] });
      toast.success("칭찬을 보냈습니다!");
      setOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function resetForm() {
    setReceiverId("");
    setMessage("");
    setSelectedTags([]);
  }

  function toggleTag(tag: KudosTagValue) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Heart className="mr-2 h-4 w-4" />
            칭찬 보내기
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>동료에게 칭찬 보내기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>대상자</Label>
            <Select value={receiverId} onValueChange={setReceiverId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="칭찬할 동료를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {(users ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}{u.position ? ` (${u.position})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>메시지</Label>
            <Textarea
              className="mt-1.5"
              placeholder="어떤 점이 좋았는지 알려주세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>태그 (선택)</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {KUDOS_TAGS.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.emoji} {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!receiverId || !message.trim() || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                전송 중...
              </>
            ) : (
              "칭찬 보내기"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
