import { NextRequest, NextResponse } from "next/server";
import { reminderService } from "@/lib/services/reminder.service";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  // CRON_SECRET 검증
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // autoClose를 먼저 실행 (종료된 사이클에 overdue 알림이 가지 않도록)
    const autoClose = await reminderService.autoCloseExpiredCycles();

    const [deadline, overdue, managerReminders] = await Promise.all([
      reminderService.sendReviewDeadlineReminders(),
      reminderService.sendOverdueReviewReminders(),
      reminderService.sendManagerReminders(),
    ]);

    const result = {
      autoClose,
      reviewDeadline: deadline,
      reviewOverdue: overdue,
      managerReminders,
      total: autoClose + deadline + overdue + managerReminders,
    };

    logger.info("리마인더 cron 실행 완료", result);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("리마인더 cron 실행 실패", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
