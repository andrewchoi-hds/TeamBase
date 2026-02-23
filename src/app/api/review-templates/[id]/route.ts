import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const template = await prisma.reviewTemplate.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: { criteria: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!template) return notFound("템플릿을 찾을 수 없습니다.");
  return NextResponse.json(template);
}

async function handlePATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();

  // 카테고리가 포함된 전체 업데이트
  if (data.categories) {
    const template = await prisma.$transaction(async (tx) => {
      // 기존 카테고리 삭제 (cascade로 기준도 삭제됨)
      await tx.reviewCategory.deleteMany({ where: { templateId: params.id } });

      // 새 카테고리/기준 생성
      const updated = await tx.reviewTemplate.update({
        where: { id: params.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          categories: {
            create: data.categories.map((cat: any, ci: number) => ({
              name: cat.name,
              order: ci,
              criteria: {
                create: cat.criteria.map((c: any, cri: number) => ({
                  name: c.name,
                  description: c.description || null,
                  order: cri,
                  questionType: c.questionType ?? "RATING",
                  options: c.options ?? undefined,
                  isRequired: c.isRequired ?? true,
                })),
              },
            })),
          },
        },
        include: {
          categories: {
            orderBy: { order: "asc" },
            include: { criteria: { orderBy: { order: "asc" } } },
          },
        },
      });

      return updated;
    });

    return NextResponse.json(template);
  }

  // 기본 정보만 업데이트
  const template = await prisma.reviewTemplate.update({
    where: { id: params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });

  return NextResponse.json(template);
}

async function handleDELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  await prisma.reviewTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "삭제되었습니다." });
}

export const GET = withErrorHandler(handleGET);
export const PATCH = withErrorHandler(handlePATCH);
export const DELETE = withErrorHandler(handleDELETE);
