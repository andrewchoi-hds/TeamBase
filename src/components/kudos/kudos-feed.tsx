"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KudosCard } from "./kudos-card";
import { SendKudosDialog } from "./send-kudos-dialog";
import { Heart } from "lucide-react";

interface KudosItem {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  tags: string[] | null;
  createdAt: string;
  sender: { id: string; name: string; profileImage: string | null; position: string | null };
  receiver: { id: string; name: string; profileImage: string | null; position: string | null };
}

export function KudosFeed() {
  const { status: sessionStatus } = useSession();

  const { data } = useQuery({
    queryKey: ["kudos", "recent"],
    queryFn: () => api.get<{ kudos: KudosItem[]; total: number }>("/kudos?limit=5"),
    enabled: sessionStatus === "authenticated",
  });

  const kudos = data?.kudos ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <CardTitle className="text-lg">동료 칭찬</CardTitle>
          {kudos.length > 0 && (
            <Badge variant="secondary" className="text-xs">{data?.total ?? 0}</Badge>
          )}
        </div>
        <SendKudosDialog />
      </CardHeader>
      <CardContent className="pt-0">
        {kudos.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">아직 칭찬이 없습니다.</p>
            <p className="text-xs text-muted-foreground mt-1">
              동료에게 첫 번째 칭찬을 보내보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {kudos.map((k) => (
              <KudosCard
                key={k.id}
                sender={k.sender}
                receiver={k.receiver}
                message={k.message}
                tags={k.tags}
                createdAt={k.createdAt}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
