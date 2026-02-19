import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(
  req: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "MANAGER") return forbidden();

  const body = await req.json().catch(() => ({}));
  const reason = body.reason as string | undefined;

  const assignment = await reviewService.reopenAssignment(params.assignmentId, user.id, reason);
  return NextResponse.json({ success: true, assignmentId: assignment.id });
}

export const POST = withErrorHandler(handlePOST);
