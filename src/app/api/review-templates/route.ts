import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handleGET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const templates = await prisma.reviewTemplate.findMany({
    include: {
      categories: {
        include: { criteria: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=600" },
  });
}

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const data = await req.json();
  const template = await prisma.reviewTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      categories: {
        create: data.categories?.map((cat: { name: string; weight?: number; order?: number; criteria?: { name: string; description?: string; order?: number }[] }, i: number) => ({
          name: cat.name,
          weight: cat.weight ?? 1.0,
          order: cat.order ?? i,
          criteria: {
            create: cat.criteria?.map((c: { name: string; description?: string; order?: number; questionType?: string; options?: any; isRequired?: boolean }, j: number) => ({
              name: c.name,
              description: c.description,
              order: c.order ?? j,
              questionType: c.questionType ?? "RATING",
              options: c.options ?? undefined,
              isRequired: c.isRequired ?? true,
            })) ?? [],
          },
        })) ?? [],
      },
    },
    include: { categories: { include: { criteria: true } } },
  });

  return NextResponse.json(template, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
