import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { Role } from "@prisma/client";
import type { SessionUser } from "@/types";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("인증이 필요합니다.");
  }
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("권한이 없습니다.");
  }
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
}

export function notFound(message = "리소스를 찾을 수 없습니다.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message = "잘못된 요청입니다.") {
  return NextResponse.json({ error: message }, { status: 400 });
}
