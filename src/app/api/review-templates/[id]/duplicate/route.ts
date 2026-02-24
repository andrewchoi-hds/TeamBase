import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden, notFound } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const original = await prisma.reviewTemplate.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: { criteria: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!original) return notFound("템플릿을 찾을 수 없습니다.");

  const duplicate = await prisma.reviewTemplate.create({
    data: {
      name: `${original.name} (복사)`,
      description: original.description,
      guideline: original.guideline,
      categories: {
        create: original.categories.map((cat) => ({
          name: cat.name,
          weight: cat.weight,
          order: cat.order,
          criteria: {
            create: cat.criteria.map((c) => ({
              name: c.name,
              description: c.description,
              order: c.order,
              questionType: c.questionType,
              options: c.options ?? undefined,
              isRequired: c.isRequired,
            })),
          },
        })),
      },
    },
    include: {
      categories: {
        include: { criteria: true },
      },
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}

export const POST = withErrorHandler(handlePOST);
