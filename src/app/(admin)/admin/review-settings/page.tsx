"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, FileText } from "lucide-react";

export default function ReviewSettingsPage() {
  return (
    <div>
      <PageHeader title="평가 설정" description="평가 항목과 템플릿을 관리합니다." />
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/reviews/templates">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <FileText className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-semibold">평가 템플릿 관리</h3>
              <p className="text-sm text-muted-foreground mt-1">평가 카테고리와 항목을 설정합니다.</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <Settings className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold">평가 정책 설정</h3>
            <p className="text-sm text-muted-foreground mt-1">평가 주기, 가중치 등 정책을 설정합니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
