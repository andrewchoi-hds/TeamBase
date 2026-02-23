import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth-utils";
import { reviewService } from "@/lib/services/review.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const assignments = await reviewService.getMyAssignments(user.id);
  return NextResponse.json(assignments);
}

export const GET = withErrorHandler(handleGET);
