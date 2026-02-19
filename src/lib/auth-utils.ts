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

/** 리소스 소유자이거나 ADMIN인지 확인 */
export function isOwnerOrAdmin(user: SessionUser, ownerId: string): boolean {
  return user.id === ownerId || user.role === "ADMIN";
}

/** 리소스 관련자(소유자/대상자)이거나 ADMIN인지 확인 */
export function isParticipantOrAdmin(user: SessionUser, ...participantIds: (string | null | undefined)[]): boolean {
  if (user.role === "ADMIN") return true;
  return participantIds.some((id) => id != null && id === user.id);
}

/** MANAGER가 직속 부하의 리소스에 접근 가능한지 확인 */
export function isManagerOf(user: SessionUser, targetManagerId: string | null | undefined): boolean {
  return user.role === "MANAGER" && targetManagerId === user.id;
}
