import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth-utils";
import { notificationService } from "@/lib/services/notification.service";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { KUDOS_TAGS } from "@/lib/constants/kudos-tags";

const VALID_TAG_VALUES = new Set<string>(KUDOS_TAGS.map((t) => t.value));
const MAX_MESSAGE_LENGTH = 500;
const MAX_TAGS = 5;

async function handleGET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const receiverId = searchParams.get("receiverId");

  const where = receiverId ? { receiverId } : {};

  const [kudos, total] = await Promise.all([
    prisma.kudos.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, profileImage: true, position: true } },
        receiver: { select: { id: true, name: true, profileImage: true, position: true } },
      },
    }),
    prisma.kudos.count({ where }),
  ]);

  return NextResponse.json({ kudos, total });
}

async function handlePOST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { receiverId, message, tags } = body;

  if (!receiverId || !message?.trim()) {
    return badRequest("대상자와 메시지는 필수입니다.");
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return badRequest(`메시지는 ${MAX_MESSAGE_LENGTH}자 이하로 작성해주세요.`);
  }

  if (receiverId === user.id) {
    return badRequest("자기 자신에게는 칭찬을 보낼 수 없습니다.");
  }

  // 태그 유효성 검증
  if (tags != null) {
    if (!Array.isArray(tags)) {
      return badRequest("태그는 배열 형식이어야 합니다.");
    }
    if (tags.length > MAX_TAGS) {
      return badRequest(`태그는 최대 ${MAX_TAGS}개까지 선택할 수 있습니다.`);
    }
    const invalidTags = tags.filter((t: string) => !VALID_TAG_VALUES.has(t));
    if (invalidTags.length > 0) {
      return badRequest(`유효하지 않은 태그: ${invalidTags.join(", ")}`);
    }
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, name: true },
  });
  if (!receiver) {
    return badRequest("존재하지 않는 사용자입니다.");
  }

  const kudos = await prisma.kudos.create({
    data: {
      senderId: user.id,
      receiverId,
      message: trimmedMessage,
      tags: tags ?? null,
    },
    include: {
      sender: { select: { id: true, name: true, profileImage: true, position: true } },
      receiver: { select: { id: true, name: true, profileImage: true, position: true } },
    },
  });

  // 알림 전송
  await notificationService.create({
    userId: receiverId,
    type: "KUDOS_RECEIVED",
    title: "칭찬을 받았습니다!",
    message: `${user.name}님이 칭찬을 보냈습니다: "${message.trim().slice(0, 50)}"`,
    link: "/",
  });

  return NextResponse.json(kudos, { status: 201 });
}

export const GET = withErrorHandler(handleGET);
export const POST = withErrorHandler(handlePOST);
