import { PrismaClient, Role, ReviewType, FeedbackCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.developmentGoalFeedback.deleteMany();
  await prisma.developmentGoal.deleteMany();
  await prisma.feedbackSessionResponse.deleteMany();
  await prisma.feedbackSessionParticipant.deleteMany();
  await prisma.feedbackSessionTarget.deleteMany();
  await prisma.feedbackSession.deleteMany();
  await prisma.accessLog.deleteMany();
  await prisma.notification.deleteMany();
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

  // Feedback Session (기명)
  const fbSession = await prisma.feedbackSession.create({
    data: {
      name: "2024 상반기 피드백",
      description: "상반기 팀원 간 피드백 세션",
      mode: "NAMED",
      status: "ACTIVE",
      createdById: admin.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Feedback targets & responses
  const target1 = await prisma.feedbackSessionTarget.create({
    data: { sessionId: fbSession.id, userId: members[0].id },
  });
  const target2 = await prisma.feedbackSessionTarget.create({
    data: { sessionId: fbSession.id, userId: members[3].id },
  });

  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: target1.id,
      authorId: manager1.id,
      category: FeedbackCategory.STRENGTH,
      content: "코드 리뷰에서 항상 건설적인 피드백을 제공해주셔서 팀 전체의 코드 품질 향상에 큰 기여를 하고 계십니다.",
    },
  });
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: target1.id,
      authorId: members[1].id,
      category: FeedbackCategory.IMPROVEMENT,
      content: "가끔 기술적 설명이 어려운 부분이 있어요. 비개발자에게 설명할 때 좀 더 쉬운 용어를 사용하면 좋겠습니다.",
    },
  });
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: target2.id,
      authorId: manager2.id,
      category: FeedbackCategory.STRENGTH,
      content: "마케팅 캠페인 기획력이 뛰어납니다. 데이터 기반으로 의사결정하는 점이 인상적입니다.",
    },
  });

  console.log("Feedback session created");

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: members[0].id, type: "REVIEW_REQUESTED", title: "새로운 평가 요청", message: "2024년 상반기 평가 주기가 시작되었습니다.", link: `/reviews/${cycle.id}` },
      { userId: members[0].id, type: "FEEDBACK_RECEIVED", title: "새로운 피드백", message: "이팀장님이 피드백을 남겼습니다.", link: "/feedback" },
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
