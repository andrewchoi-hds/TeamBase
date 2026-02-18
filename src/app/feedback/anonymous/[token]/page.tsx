"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";

const schema = z.object({
  content: z.string().min(10, "최소 10자 이상 작성해주세요."),
  category: z.enum(["STRENGTH", "IMPROVEMENT", "GENERAL"]),
});

type FormData = z.infer<typeof schema>;

export default function AnonymousFeedbackPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "submitted">("loading");
  const [targetName, setTargetName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "GENERAL" },
  });

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMsg("토큰이 없습니다.");
      return;
    }

    fetch("/api/feedback/anonymous/validate-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setStatus("valid");
          setTargetName(data.targetName);
        } else {
          setStatus("invalid");
          setErrorMsg(data.error || "유효하지 않은 링크입니다.");
        }
      })
      .catch(() => {
        setStatus("invalid");
        setErrorMsg("토큰 검증에 실패했습니다.");
      });
  }, [token]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...data }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      setStatus("submitted");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "제출 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">TB</div>
          <h1 className="mt-4 text-2xl font-bold">TeamBase</h1>
        </div>

        {status === "loading" && (
          <Card><CardContent className="py-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">토큰 검증 중...</p></CardContent></Card>
        )}

        {status === "invalid" && (
          <Card><CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <p className="mt-4 font-semibold">유효하지 않은 링크</p>
            <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
          </CardContent></Card>
        )}

        {status === "submitted" && (
          <Card><CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-4 font-semibold">피드백이 제출되었습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">소중한 의견 감사합니다. 이 페이지를 닫으셔도 됩니다.</p>
          </CardContent></Card>
        )}

        {status === "valid" && (
          <Card>
            <CardHeader>
              <CardTitle>익명 피드백 작성</CardTitle>
              <CardDescription>{targetName}님에 대한 피드백을 작성해주세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>이 피드백은 완전히 익명으로 처리됩니다. 작성자 정보는 어디에도 기록되지 않습니다.</AlertDescription>
              </Alert>
              {errorMsg && <Alert variant="destructive" className="mb-4"><AlertDescription>{errorMsg}</AlertDescription></Alert>}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Select defaultValue="GENERAL" onValueChange={(v) => setValue("category", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRENGTH">강점</SelectItem>
                      <SelectItem value="IMPROVEMENT">개선점</SelectItem>
                      <SelectItem value="GENERAL">일반</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>피드백 내용 *</Label>
                  <Textarea {...register("content")} placeholder="구체적인 피드백을 작성해주세요. (최소 10자)" rows={6} />
                  {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  익명으로 제출
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
