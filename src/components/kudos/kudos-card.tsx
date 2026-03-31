"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { KUDOS_TAGS } from "@/lib/constants/kudos-tags";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface KudosUser {
  id: string;
  name: string;
  profileImage: string | null;
  position: string | null;
}

interface KudosCardProps {
  sender: KudosUser;
  receiver: KudosUser;
  message: string;
  tags: string[] | null;
  createdAt: string;
}

export function KudosCard({ sender, receiver, message, tags, createdAt }: KudosCardProps) {
  const tagList = Array.isArray(tags) ? tags : [];
  const tagMap = new Map<string, (typeof KUDOS_TAGS)[number]>(KUDOS_TAGS.map((t) => [t.value, t]));

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-background">
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {sender.name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium">{sender.name}</span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-sm font-medium">{receiver.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tagList.map((tag) => {
              const info = tagMap.get(tag);
              return (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {info ? `${info.emoji} ${info.label}` : tag}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
