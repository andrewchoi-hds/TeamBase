import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { auditLogService } from "@/lib/services/audit-log.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { AuditEntityType } from "@prisma/client";

async function handleGET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const searchParams = req.nextUrl.searchParams;
  const entityType = searchParams.get("entityType") as AuditEntityType | null;
  const entityId = searchParams.get("entityId");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  if (entityType && entityId) {
    const result = await auditLogService.getByEntity(entityType, entityId, { limit, offset });
    return NextResponse.json(result);
  }

  const userId = searchParams.get("userId");
  if (userId) {
    const result = await auditLogService.getByUser(userId, { limit, offset });
    return NextResponse.json(result);
  }

  // 전체 목록 조회 (필터 선택적)
  const action = searchParams.get("action") as import("@prisma/client").AuditAction | null;
  const result = await auditLogService.list({
    action: action ?? undefined,
    entityType: entityType ?? undefined,
    limit,
    offset,
  });
  return NextResponse.json(result);
}

export const GET = withErrorHandler(handleGET);
