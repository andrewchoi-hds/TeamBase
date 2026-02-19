import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth-utils";
import { withErrorHandler } from "@/lib/api/with-error-handler";

async function handlePOST(req: NextRequest) {
  // 관리자만 사용자 등록 가능
  const currentUser = await getCurrentUser();
  if (!currentUser) return unauthorized();
  if (currentUser.role !== "ADMIN") return forbidden();

  const { name, email, password, role, departmentId, position } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "이름, 이메일, 비밀번호는 필수입니다." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      ...(role && { role }),
      ...(departmentId && { departmentId }),
      ...(position && { position }),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json(user, { status: 201 });
}

export const POST = withErrorHandler(handlePOST);
