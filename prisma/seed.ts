import { PrismaClient, Role, ReviewType, FeedbackCategory, ObjectiveLevel, MeetingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.developmentGoalFeedback.deleteMany();
  await prisma.developmentGoal.deleteMany();
  await prisma.accessLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.meetingNote.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.recurringMeeting.deleteMany();
  await prisma.keyResultCheckIn.deleteMany();
  await prisma.keyResult.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.anonymousFeedback.deleteMany();
  await prisma.anonymousFeedbackToken.deleteMany();
  await prisma.identifiedFeedback.deleteMany();
  await prisma.reviewResponse.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.reviewCycle.deleteMany();
  await prisma.reviewCriterion.deleteMany();
  await prisma.reviewCategory.deleteMany();
  await prisma.reviewTemplate.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // Departments
  const devDept = await prisma.department.create({ data: { name: "개발팀" } });
  const mktDept = await prisma.department.create({ data: { name: "마케팅팀" } });

  // Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@teambase.com",
      name: "김관리",
      passwordHash,
      role: Role.ADMIN,
      position: "CTO",
      departmentId: devDept.id,
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      email: "manager1@teambase.com",
      name: "이팀장",
      passwordHash,
      role: Role.MANAGER,
      position: "개발팀장",
      departmentId: devDept.id,
      managerId: admin.id,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: "manager2@teambase.com",
      name: "박팀장",
      passwordHash,
      role: Role.MANAGER,
      position: "마케팅팀장",
      departmentId: mktDept.id,
      managerId: admin.id,
    },
  });

  const members = await Promise.all([
    prisma.user.create({
      data: { email: "dev1@teambase.com", name: "정개발", passwordHash, role: Role.MEMBER, position: "시니어 개발자", departmentId: devDept.id, managerId: manager1.id },
    }),
    prisma.user.create({
      data: { email: "dev2@teambase.com", name: "최개발", passwordHash, role: Role.MEMBER, position: "주니어 개발자", departmentId: devDept.id, managerId: manager1.id },
    }),
    prisma.user.create({
      data: { email: "dev3@teambase.com", name: "강개발", passwordHash, role: Role.MEMBER, position: "프론트엔드 개발자", departmentId: devDept.id, managerId: manager1.id },
    }),
    prisma.user.create({
      data: { email: "mkt1@teambase.com", name: "한마케터", passwordHash, role: Role.MEMBER, position: "마케팅 매니저", departmentId: mktDept.id, managerId: manager2.id },
    }),
    prisma.user.create({
      data: { email: "mkt2@teambase.com", name: "윤마케터", passwordHash, role: Role.MEMBER, position: "콘텐츠 마케터", departmentId: mktDept.id, managerId: manager2.id },
    }),
    prisma.user.create({
      data: { email: "mkt3@teambase.com", name: "서마케터", passwordHash, role: Role.MEMBER, position: "퍼포먼스 마케터", departmentId: mktDept.id, managerId: manager2.id },
    }),
  ]);

  console.log("Users created");

  // Review Template
  const template = await prisma.reviewTemplate.create({
    data: {
      name: "분기별 역량 평가",
      description: "분기별 역량 및 성과 평가 템플릿",
      isDefault: true,
      categories: {
        create: [
          {
            name: "업무 역량",
            weight: 1.0,
            order: 0,
            criteria: {
              create: [
                { name: "전문 지식", description: "담당 업무 분야의 전문 지식 수준", order: 0 },
                { name: "문제 해결력", description: "업무 과제를 해결하는 능력", order: 1 },
                { name: "업무 품질", description: "산출물의 품질과 완성도", order: 2 },
              ],
            },
          },
          {
            name: "협업 및 소통",
            weight: 1.0,
            order: 1,
            criteria: {
              create: [
                { name: "팀워크", description: "동료와의 협업 능력", order: 0 },
                { name: "커뮤니케이션", description: "명확하고 효율적인 의사소통", order: 1 },
                { name: "리더십", description: "팀을 이끌고 동기부여하는 능력", order: 2 },
              ],
            },
          },
          {
            name: "성장 및 태도",
            weight: 0.8,
            order: 2,
            criteria: {
              create: [
                { name: "자기 개발", description: "지속적 학습과 성장 노력", order: 0 },
                { name: "주도성", description: "능동적이고 자발적인 업무 수행", order: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Review template created");

  // Review Cycle
  const cycle = await prisma.reviewCycle.create({
    data: {
      name: "2024년 상반기 평가",
      description: "2024년 상반기 정기 성과 평가",
      status: "ACTIVE",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-06-30"),
      templateId: template.id,
    },
  });

  // Assignments - Self + Peer for dev team
  const devTeam = [members[0], members[1], members[2]];
  for (const member of devTeam) {
    await prisma.reviewAssignment.create({
      data: { cycleId: cycle.id, reviewerId: member.id, targetId: member.id, reviewType: ReviewType.SELF },
    });
    await prisma.reviewAssignment.create({
      data: { cycleId: cycle.id, reviewerId: manager1.id, targetId: member.id, reviewType: ReviewType.DOWNWARD },
    });
  }
  // Peer reviews
  await prisma.reviewAssignment.create({
    data: { cycleId: cycle.id, reviewerId: members[0].id, targetId: members[1].id, reviewType: ReviewType.PEER },
  });
  await prisma.reviewAssignment.create({
    data: { cycleId: cycle.id, reviewerId: members[1].id, targetId: members[0].id, reviewType: ReviewType.PEER },
  });

  console.log("Review cycle and assignments created");

  // Identified Feedback
  await prisma.identifiedFeedback.create({
    data: {
      authorId: manager1.id,
      targetId: members[0].id,
      category: FeedbackCategory.STRENGTH,
      content: "코드 리뷰에서 항상 건설적인 피드백을 제공해주셔서 팀 전체의 코드 품질 향상에 큰 기여를 하고 계십니다. 특히 아키텍처 설계에 대한 깊은 이해가 돋보입니다.",
    },
  });
  await prisma.identifiedFeedback.create({
    data: {
      authorId: members[1].id,
      targetId: members[0].id,
      category: FeedbackCategory.IMPROVEMENT,
      content: "가끔 기술적 설명이 어려운 부분이 있어요. 비개발자에게 설명할 때 좀 더 쉬운 용어를 사용하면 좋겠습니다.",
    },
  });
  await prisma.identifiedFeedback.create({
    data: {
      authorId: manager2.id,
      targetId: members[3].id,
      category: FeedbackCategory.STRENGTH,
      content: "마케팅 캠페인 기획력이 뛰어납니다. 데이터 기반으로 의사결정하는 점이 인상적입니다.",
    },
  });

  console.log("Feedback created");

  // OKR
  const companyObj = await prisma.objective.create({
    data: {
      title: "2024년 상반기 매출 목표 달성",
      description: "전사 매출 목표 150억 달성",
      ownerId: admin.id,
      level: ObjectiveLevel.COMPANY,
      status: "ACTIVE",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      progress: 65,
    },
  });

  const teamObj = await prisma.objective.create({
    data: {
      title: "개발팀 생산성 30% 향상",
      ownerId: manager1.id,
      level: ObjectiveLevel.TEAM,
      status: "ACTIVE",
      parentId: companyObj.id,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      progress: 50,
    },
  });

  const personalObj = await prisma.objective.create({
    data: {
      title: "코드 커버리지 80% 이상 달성",
      description: "전체 프로젝트의 테스트 코드 커버리지를 80% 이상으로 유지",
      ownerId: members[0].id,
      level: ObjectiveLevel.INDIVIDUAL,
      status: "ACTIVE",
      parentId: teamObj.id,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      progress: 70,
    },
  });

  // Key Results
  const kr1 = await prisma.keyResult.create({
    data: {
      objectiveId: personalObj.id,
      title: "단위 테스트 커버리지",
      type: "PERCENTAGE",
      startValue: 45,
      currentValue: 72,
      targetValue: 80,
      unit: "%",
      progress: 77,
    },
  });

  const kr2 = await prisma.keyResult.create({
    data: {
      objectiveId: personalObj.id,
      title: "통합 테스트 케이스 수",
      type: "NUMERIC",
      startValue: 30,
      currentValue: 85,
      targetValue: 100,
      unit: "건",
      progress: 78,
    },
  });

  // Check-ins
  await prisma.keyResultCheckIn.createMany({
    data: [
      { keyResultId: kr1.id, value: 55, note: "주요 서비스 모듈 테스트 추가" },
      { keyResultId: kr1.id, value: 65, note: "API 레이어 테스트 보강" },
      { keyResultId: kr1.id, value: 72, note: "유틸리티 함수 테스트 완료" },
      { keyResultId: kr2.id, value: 50, note: "결제 플로우 통합 테스트" },
      { keyResultId: kr2.id, value: 70, note: "사용자 인증 통합 테스트" },
      { keyResultId: kr2.id, value: 85, note: "주문 시스템 통합 테스트 추가" },
    ],
  });

  console.log("OKR created");

  // Meetings
  const meeting1 = await prisma.meeting.create({
    data: {
      title: "주간 1:1 미팅",
      organizerId: manager1.id,
      participantId: members[0].id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 30,
      status: MeetingStatus.SCHEDULED,
      agenda: "1. 이번 주 업무 진행 상황\n2. 블로커 확인\n3. 다음 주 계획",
    },
  });

  const meeting2 = await prisma.meeting.create({
    data: {
      title: "분기 성과 리뷰",
      organizerId: manager1.id,
      participantId: members[1].id,
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      duration: 60,
      status: MeetingStatus.COMPLETED,
      agenda: "분기 성과 리뷰 및 피드백",
    },
  });

  await prisma.meetingNote.create({
    data: {
      meetingId: meeting2.id,
      authorId: manager1.id,
      content: "전반적으로 좋은 성과를 보여주고 있음. 특히 코드 품질 개선에 대한 노력이 돋보임.",
    },
  });

  await prisma.actionItem.createMany({
    data: [
      { meetingId: meeting2.id, assigneeId: members[1].id, title: "테스트 자동화 파이프라인 구축", status: "IN_PROGRESS" },
      { meetingId: meeting2.id, assigneeId: members[1].id, title: "기술 블로그 포스팅 1편 작성", status: "TODO" },
    ],
  });

  console.log("Meetings created");

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: members[0].id, type: "REVIEW_REQUESTED", title: "새로운 평가 요청", message: "2024년 상반기 평가 주기가 시작되었습니다.", link: `/reviews/${cycle.id}` },
      { userId: members[0].id, type: "FEEDBACK_RECEIVED", title: "새로운 피드백", message: "이팀장님이 피드백을 남겼습니다.", link: "/feedback" },
      { userId: members[0].id, type: "MEETING_SCHEDULED", title: "미팅 예약", message: "이팀장님과 주간 1:1 미팅이 예약되었습니다.", link: `/meetings/${meeting1.id}` },
      { userId: manager1.id, type: "REVIEW_CYCLE_STARTED", title: "평가 주기 시작", message: "2024년 상반기 평가가 시작되었습니다.", link: `/reviews/${cycle.id}` },
    ],
  });

  console.log("Notifications created");

  console.log("\n=== Seed Complete ===");
  console.log("Test accounts (password: password123):");
  console.log("  Admin:   admin@teambase.com");
  console.log("  Manager: manager1@teambase.com, manager2@teambase.com");
  console.log("  Members: dev1@teambase.com, dev2@teambase.com, dev3@teambase.com");
  console.log("           mkt1@teambase.com, mkt2@teambase.com, mkt3@teambase.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
