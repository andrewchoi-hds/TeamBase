import { NotificationType } from "@prisma/client";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function layout(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
<tr><td>
  <div style="background:#fff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:700;color:#18181b;margin:0;">TeamBase</h1>
    </div>
    ${content}
  </div>
  <p style="text-align:center;font-size:12px;color:#a1a1aa;margin-top:16px;">
    이 메일은 TeamBase에서 자동 발송되었습니다.
  </p>
</td></tr>
</table>
</body>
</html>`;
}

function button(text: string, link: string) {
  const url = link.startsWith("http") ? link : `${BASE_URL}${link}`;
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:#18181b;color:#fff;font-size:14px;font-weight:500;padding:10px 24px;border-radius:6px;text-decoration:none;">${text}</a>
  </div>`;
}

interface TemplateInput {
  title: string;
  message: string;
  link?: string;
  userName?: string;
}

const EMAIL_TEMPLATES: Partial<Record<NotificationType, (input: TemplateInput) => string>> = {
  REVIEW_REQUESTED: ({ message, link }) =>
    layout(`
      <h2 style="font-size:16px;color:#18181b;margin:0 0 12px;">새로운 평가 요청</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6;">${message}</p>
      ${link ? button("평가 작성하기", link) : ""}
    `),

  REVIEW_CYCLE_ENDING: ({ message, link }) =>
    layout(`
      <h2 style="font-size:16px;color:#b45309;margin:0 0 12px;">평가 마감 임박</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6;">${message}</p>
      ${link ? button("평가 확인하기", link) : ""}
    `),

  REVIEW_REOPENED: ({ message, link }) =>
    layout(`
      <h2 style="font-size:16px;color:#dc2626;margin:0 0 12px;">평가 재오픈</h2>
      <p style="font-size:14px;color:#52525b;line-height:1.6;">${message}</p>
      ${link ? button("평가 수정하기", link) : ""}
    `),
};

export const EMAIL_TYPES: NotificationType[] = [
  "REVIEW_REQUESTED",
  "REVIEW_CYCLE_ENDING",
  "REVIEW_REOPENED",
];

export function getEmailTemplate(type: NotificationType, input: TemplateInput): string | null {
  const templateFn = EMAIL_TEMPLATES[type];
  if (!templateFn) return null;
  return templateFn(input);
}
