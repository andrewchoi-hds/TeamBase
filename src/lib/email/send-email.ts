import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? "TeamBase <noreply@teambase.app>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<boolean> {
  if (!resend) {
    logger.debug("RESEND_API_KEY 미설정 - 이메일 발송 건너뜀", { to, subject });
    return false;
  }

  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    logger.info("이메일 발송 성공", { to, subject });
    return true;
  } catch (error) {
    logger.error("이메일 발송 실패", { to, subject, error: String(error) });
    return false;
  }
}
