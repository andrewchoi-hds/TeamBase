import { PrismaClient, Role, ReviewType, ReviewStatus, FeedbackCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ==========================================
  // Clean existing data (order matters for FK)
  // ==========================================
  await prisma.developmentGoalFeedback.deleteMany();
  await prisma.developmentGoal.deleteMany();
  await prisma.feedbackSessionResponse.deleteMany();
  await prisma.feedbackSessionParticipant.deleteMany();
  await prisma.feedbackSessionTarget.deleteMany();
  await prisma.feedbackSession.deleteMany();
  await prisma.auditLog.deleteMany();
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

  // ==========================================
  // 1. Departments
  // ==========================================
  const devDept = await prisma.department.create({ data: { name: "개발팀" } });
  const mktDept = await prisma.department.create({ data: { name: "마케팅팀" } });
  const designDept = await prisma.department.create({ data: { name: "디자인팀" } });
  console.log("✅ 부서 생성 완료 (3개)");

  // ==========================================
  // 2. Users — 관리자 / 팀장 / 팀원
  // ==========================================
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
      email: "manager@teambase.com",
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

  const dev1 = await prisma.user.create({
    data: {
      email: "member@teambase.com",
      name: "정개발",
      passwordHash,
      role: Role.MEMBER,
      position: "시니어 개발자",
      departmentId: devDept.id,
      managerId: manager1.id,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: "dev2@teambase.com",
      name: "최개발",
      passwordHash,
      role: Role.MEMBER,
      position: "주니어 개발자",
      departmentId: devDept.id,
      managerId: manager1.id,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: "dev3@teambase.com",
      name: "강프론트",
      passwordHash,
      role: Role.MEMBER,
      position: "프론트엔드 개발자",
      departmentId: devDept.id,
      managerId: manager1.id,
    },
  });

  const mkt1 = await prisma.user.create({
    data: {
      email: "mkt1@teambase.com",
      name: "한마케터",
      passwordHash,
      role: Role.MEMBER,
      position: "마케팅 매니저",
      departmentId: mktDept.id,
      managerId: manager2.id,
    },
  });

  const mkt2 = await prisma.user.create({
    data: {
      email: "mkt2@teambase.com",
      name: "윤콘텐츠",
      passwordHash,
      role: Role.MEMBER,
      position: "콘텐츠 마케터",
      departmentId: mktDept.id,
      managerId: manager2.id,
    },
  });

  const designer = await prisma.user.create({
    data: {
      email: "design1@teambase.com",
      name: "송디자인",
      passwordHash,
      role: Role.MEMBER,
      position: "UI/UX 디자이너",
      departmentId: designDept.id,
      managerId: admin.id,
    },
  });

  const allMembers = [dev1, dev2, dev3, mkt1, mkt2, designer];
  const devTeam = [dev1, dev2, dev3];
  const mktTeam = [mkt1, mkt2];
  console.log("✅ 사용자 생성 완료 (10명)");

  // ==========================================
  // 3. Review Template
  // ==========================================
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
                { name: "문제 해결력", description: "업무 과제를 분석하고 해결하는 능력", order: 1 },
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
                { name: "팀워크", description: "동료와의 협업 및 상호 지원", order: 0 },
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
    include: {
      categories: {
        include: { criteria: true },
        orderBy: { order: "asc" },
      },
    },
  });

  const allCriteria = template.categories.flatMap((c) => c.criteria);
  console.log(`✅ 평가 템플릿 생성 완료 (카테고리 ${template.categories.length}개, 항목 ${allCriteria.length}개)`);

  // ==========================================
  // 4. Review Cycle #1 — 완료된 평가 (결과 확인용)
  // ==========================================
  const completedCycle = await prisma.reviewCycle.create({
    data: {
      name: "2025년 상반기 평가",
      description: "2025년 상반기 정기 성과 평가 (완료)",
      status: "COMPLETED",
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-02-15"),
      templateId: template.id,
    },
  });

  // Helper: create assignment + submitted review with responses
  async function createSubmittedReview(
    cycleId: string,
    reviewerId: string,
    targetId: string,
    reviewType: ReviewType,
    ratings: number[],
    overallComment: string,
  ) {
    const assignment = await prisma.reviewAssignment.create({
      data: {
        cycleId,
        reviewerId,
        targetId,
        reviewType,
        status: "SUBMITTED",
      },
    });

    const review = await prisma.review.create({
      data: {
        assignmentId: assignment.id,
        cycleId,
        authorId: reviewerId,
        targetId,
        status: ReviewStatus.SUBMITTED,
        overallRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        overallComment,
      },
    });

    for (let i = 0; i < allCriteria.length; i++) {
      await prisma.reviewResponse.create({
        data: {
          reviewId: review.id,
          criterionId: allCriteria[i].id,
          rating: ratings[i] ?? 3,
        },
      });
    }

    return { assignment, review };
  }

  // --- dev1 (정개발) receives 4 reviews ---
  await createSubmittedReview(
    completedCycle.id, dev1.id, dev1.id, ReviewType.SELF,
    [4, 4, 5, 4, 3, 3, 4, 4],
    "이번 분기에 백엔드 성능 최적화 프로젝트를 주도했습니다. API 응답 속도가 40% 개선되었습니다.",
  );
  await createSubmittedReview(
    completedCycle.id, manager1.id, dev1.id, ReviewType.DOWNWARD,
    [5, 4, 5, 4, 3, 3, 4, 5],
    "기술적 역량이 뛰어나고 문제 해결 시 체계적인 접근을 합니다. 다만 비개발 직군과의 소통 시 좀 더 쉬운 용어를 사용하면 좋겠습니다.",
  );
  await createSubmittedReview(
    completedCycle.id, dev2.id, dev1.id, ReviewType.PEER,
    [5, 5, 5, 5, 4, 4, 4, 4],
    "코드 리뷰에서 항상 건설적인 피드백을 주셔서 큰 도움이 됩니다. 팀 내 기술 공유도 적극적입니다.",
  );
  await createSubmittedReview(
    completedCycle.id, dev3.id, dev1.id, ReviewType.PEER,
    [4, 4, 4, 4, 3, 3, 3, 4],
    "실력은 의심의 여지가 없지만 가끔 회의에서 의견을 좀 더 적극적으로 공유해주시면 좋겠습니다.",
  );

  // --- dev2 (최개발) receives 3 reviews ---
  await createSubmittedReview(
    completedCycle.id, dev2.id, dev2.id, ReviewType.SELF,
    [3, 3, 3, 4, 4, 2, 3, 3],
    "아직 배워야 할 것이 많지만, 코드 리뷰 과정에서 많은 성장을 했습니다.",
  );
  await createSubmittedReview(
    completedCycle.id, manager1.id, dev2.id, ReviewType.DOWNWARD,
    [3, 3, 3, 4, 4, 2, 4, 3],
    "성장 속도가 빠르고 학습 의지가 좋습니다. 독립적인 문제 해결 역량을 더 키워나갈 필요가 있습니다.",
  );
  await createSubmittedReview(
    completedCycle.id, dev1.id, dev2.id, ReviewType.PEER,
    [3, 3, 4, 5, 5, 2, 4, 4],
    "팀 분위기를 좋게 만들어주는 긍정적인 에너지를 가지고 있습니다. 기술적으로도 빠르게 성장 중입니다.",
  );

  // --- manager1 (이팀장) receives 2 reviews (upward from team) ---
  await createSubmittedReview(
    completedCycle.id, manager1.id, manager1.id, ReviewType.SELF,
    [4, 4, 4, 5, 4, 5, 4, 4],
    "팀원들의 성장에 집중하면서도 프로젝트 일정을 잘 관리했습니다.",
  );
  await createSubmittedReview(
    completedCycle.id, dev1.id, manager1.id, ReviewType.UPWARD,
    [4, 4, 4, 5, 5, 5, 4, 4],
    "기술적 결정에 대한 신뢰감이 높고, 팀원의 의견을 경청해 주십니다. 1:1 피드백이 매우 도움됩니다.",
  );

  console.log("✅ 완료된 평가 주기 생성 (리뷰 9건, 제출 완료)");

  // ==========================================
  // 5. Review Cycle #2 — 진행중 평가 (작성 대기)
  // ==========================================
  const activeCycle = await prisma.reviewCycle.create({
    data: {
      name: "2025년 하반기 평가",
      description: "2025년 하반기 정기 성과 평가",
      status: "ACTIVE",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2026-03-15"),
      templateId: template.id,
    },
  });

  // dev1: self (pending) + peer for dev2 (pending)
  await prisma.reviewAssignment.create({
    data: { cycleId: activeCycle.id, reviewerId: dev1.id, targetId: dev1.id, reviewType: ReviewType.SELF, status: "PENDING" },
  });
  await prisma.reviewAssignment.create({
    data: { cycleId: activeCycle.id, reviewerId: dev1.id, targetId: dev2.id, reviewType: ReviewType.PEER, status: "PENDING" },
  });
  await prisma.reviewAssignment.create({
    data: { cycleId: activeCycle.id, reviewerId: dev1.id, targetId: dev3.id, reviewType: ReviewType.PEER, status: "PENDING" },
  });

  // dev2: self + peer for dev1
  await prisma.reviewAssignment.create({
    data: { cycleId: activeCycle.id, reviewerId: dev2.id, targetId: dev2.id, reviewType: ReviewType.SELF, status: "PENDING" },
  });
  await prisma.reviewAssignment.create({
    data: { cycleId: activeCycle.id, reviewerId: dev2.id, targetId: dev1.id, reviewType: ReviewType.PEER, status: "PENDING" },
  });

  // dev3: self
  await prisma.reviewAssignment.create({
    data: { cycleId: activeCycle.id, reviewerId: dev3.id, targetId: dev3.id, reviewType: ReviewType.SELF, status: "PENDING" },
  });

  // manager1: downward for all dev team
  for (const dev of devTeam) {
    await prisma.reviewAssignment.create({
      data: { cycleId: activeCycle.id, reviewerId: manager1.id, targetId: dev.id, reviewType: ReviewType.DOWNWARD, status: "PENDING" },
    });
  }

  // upward: dev team evaluates manager1
  for (const dev of devTeam) {
    await prisma.reviewAssignment.create({
      data: { cycleId: activeCycle.id, reviewerId: dev.id, targetId: manager1.id, reviewType: ReviewType.UPWARD, status: "PENDING" },
    });
  }

  // mkt team assignments
  for (const m of mktTeam) {
    await prisma.reviewAssignment.create({
      data: { cycleId: activeCycle.id, reviewerId: m.id, targetId: m.id, reviewType: ReviewType.SELF, status: "PENDING" },
    });
    await prisma.reviewAssignment.create({
      data: { cycleId: activeCycle.id, reviewerId: manager2.id, targetId: m.id, reviewType: ReviewType.DOWNWARD, status: "PENDING" },
    });
  }

  console.log("✅ 진행중 평가 주기 생성 (배정 15건, 작성 대기)");

  // ==========================================
  // 6. Feedback Session #1 — 기명 (ACTIVE)
  // ==========================================
  const namedSession = await prisma.feedbackSession.create({
    data: {
      name: "2025 하반기 동료 피드백",
      description: "팀원 간 상호 피드백을 통해 협업을 개선하고 성장 포인트를 발견합니다.",
      mode: "NAMED",
      status: "ACTIVE",
      createdById: admin.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-31"),
    },
  });

  // Targets: dev1, dev2, dev3, manager1
  const namedTargets = await Promise.all(
    [dev1, dev2, dev3, manager1].map((u) =>
      prisma.feedbackSessionTarget.create({
        data: { sessionId: namedSession.id, userId: u.id },
      }),
    ),
  );
  const [ntDev1, ntDev2, ntDev3, ntManager1] = namedTargets;

  // Responses for dev1 (정개발)
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntDev1.id,
      authorId: manager1.id,
      category: FeedbackCategory.STRENGTH,
      content: "코드 리뷰에서 항상 건설적이고 구체적인 피드백을 주셔서 팀 전체의 코드 품질이 향상되고 있습니다. 특히 성능 최적화에 대한 인사이트가 탁월합니다.",
    },
  });
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntDev1.id,
      authorId: dev2.id,
      category: FeedbackCategory.STRENGTH,
      content: "어려운 기술적 문제가 생기면 항상 도움을 주시고, 단순히 답을 알려주기보다 함께 고민하며 해결 과정을 공유해주셔서 많이 배웁니다.",
    },
  });
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntDev1.id,
      authorId: dev3.id,
      category: FeedbackCategory.IMPROVEMENT,
      content: "가끔 기술적 설명이 전문 용어 중심으로 되어 있어서 비개발 직군 분들이 이해하기 어려워하시는 것 같습니다. 좀 더 쉬운 용어를 사용하면 좋겠습니다.",
    },
  });
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntDev1.id,
      authorId: designer.id,
      category: FeedbackCategory.GENERAL,
      content: "프론트엔드 구현 시 디자인 시스템 가이드를 잘 따라주셔서 디자이너로서 협업하기 편합니다. 다만 디자인 변경 요청 시 커뮤니케이션이 조금 더 적극적이면 좋겠습니다.",
    },
  });

  // Responses for dev2 (최개발)
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntDev2.id,
      authorId: dev1.id,
      category: FeedbackCategory.STRENGTH,
      content: "학습 속도가 정말 빠르고, 새로운 기술을 적극적으로 도입하려는 자세가 좋습니다. 팀 분위기를 밝게 만드는 긍정적인 에너지가 있습니다.",
    },
  });
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntDev2.id,
      authorId: manager1.id,
      category: FeedbackCategory.IMPROVEMENT,
      content: "코드 작성 후 자체 테스트를 좀 더 꼼꼼히 하면 좋겠습니다. QA 단계에서 발견되는 이슈가 줄어들 것입니다.",
    },
  });

  // Responses for manager1 (이팀장)
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntManager1.id,
      authorId: dev1.id,
      category: FeedbackCategory.STRENGTH,
      content: "기술적 결정에 대한 신뢰감이 높고, 팀원 각자의 커리어 방향에 맞는 업무 배분을 해주셔서 성장하고 있다고 느낍니다.",
    },
  });
  await prisma.feedbackSessionResponse.create({
    data: {
      targetId: ntManager1.id,
      authorId: dev3.id,
      category: FeedbackCategory.IMPROVEMENT,
      content: "바쁠 때 코드 리뷰가 지연되는 경우가 종종 있습니다. 리뷰 SLA를 정하면 팀 전체의 속도가 올라갈 것 같습니다.",
    },
  });

  console.log("✅ 기명 피드백 세션 생성 (대상자 4명, 피드백 8건)");

  // ==========================================
  // 7. Feedback Session #2 — 익명 (ACTIVE)
  // ==========================================
  const anonSession = await prisma.feedbackSession.create({
    data: {
      name: "분기 익명 피드백",
      description: "솔직한 의견을 익명으로 전달할 수 있는 피드백 세션입니다.",
      mode: "ANONYMOUS",
      status: "ACTIVE",
      createdById: admin.id,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-03-31"),
      minResponsesForVisibility: 3,
    },
  });

  const anonTarget1 = await prisma.feedbackSessionTarget.create({
    data: { sessionId: anonSession.id, userId: manager1.id },
  });
  const anonTarget2 = await prisma.feedbackSessionTarget.create({
    data: { sessionId: anonSession.id, userId: manager2.id },
  });

  // 익명 피드백 — manager1 대상 (3건 이상이어야 보임)
  await prisma.feedbackSessionResponse.createMany({
    data: [
      { targetId: anonTarget1.id, authorId: dev1.id, category: FeedbackCategory.STRENGTH, content: "팀원을 존중하고 의견을 경청하는 리더십이 좋습니다." },
      { targetId: anonTarget1.id, authorId: dev2.id, category: FeedbackCategory.IMPROVEMENT, content: "회의가 길어지는 경향이 있어요. 안건별 시간제한이 있으면 좋겠습니다." },
      { targetId: anonTarget1.id, authorId: dev3.id, category: FeedbackCategory.GENERAL, content: "전반적으로 만족스러운 팀 환경입니다. 기술 세미나를 더 자주 했으면 합니다." },
    ],
  });

  // 익명 피드백 — manager2 대상 (2건, visibility 미달)
  await prisma.feedbackSessionResponse.createMany({
    data: [
      { targetId: anonTarget2.id, authorId: mkt1.id, category: FeedbackCategory.STRENGTH, content: "캠페인 전략 방향을 명확하게 제시해주셔서 업무 진행이 수월합니다." },
      { targetId: anonTarget2.id, authorId: mkt2.id, category: FeedbackCategory.IMPROVEMENT, content: "KPI 기준이 자주 변경되어 혼란스러울 때가 있습니다." },
    ],
  });

  console.log("✅ 익명 피드백 세션 생성 (대상자 2명, 피드백 5건)");

  // ==========================================
  // 8. Development Goals
  // ==========================================
  const goal1 = await prisma.developmentGoal.create({
    data: {
      ownerId: dev1.id,
      title: "비개발자 커뮤니케이션 역량 개선",
      description: "기술적 내용을 비개발 직군에게 설명할 때 쉬운 용어를 사용하고, 비유를 활용하는 연습을 합니다. 매주 1회 디자인/마케팅팀과의 미팅에서 실천합니다.",
      status: "ACTIVE",
      sourceType: "REVIEW",
      sourceCycleId: completedCycle.id,
      targetDate: new Date("2026-06-30"),
      progress: 30,
    },
  });

  await prisma.developmentGoal.create({
    data: {
      ownerId: dev1.id,
      title: "시스템 설계 문서화 습관화",
      description: "주요 기능 구현 전 설계 문서를 먼저 작성하고 팀 리뷰를 받는 프로세스를 정착시킵니다.",
      status: "ACTIVE",
      sourceType: "SELF",
      targetDate: new Date("2026-04-30"),
      progress: 60,
    },
  });

  await prisma.developmentGoal.create({
    data: {
      ownerId: dev2.id,
      title: "자체 테스트 꼼꼼히 하기",
      description: "PR 올리기 전 체크리스트를 만들고, 엣지 케이스까지 커버하는 테스트 습관을 기릅니다.",
      status: "ACTIVE",
      sourceType: "FEEDBACK",
      targetDate: new Date("2026-05-31"),
      progress: 20,
    },
  });

  await prisma.developmentGoal.create({
    data: {
      ownerId: dev1.id,
      title: "TypeScript 고급 패턴 학습",
      description: "제네릭, 조건부 타입, infer 등 고급 타입 시스템을 학습하고 실무에 적용합니다.",
      status: "COMPLETED",
      sourceType: "SELF",
      completedAt: new Date("2025-11-15"),
      progress: 100,
    },
  });

  await prisma.developmentGoal.create({
    data: {
      ownerId: manager1.id,
      title: "코드 리뷰 SLA 개선",
      description: "팀원의 PR을 24시간 이내에 리뷰하는 것을 목표로 합니다.",
      status: "ACTIVE",
      sourceType: "FEEDBACK",
      targetDate: new Date("2026-04-30"),
      progress: 45,
    },
  });

  // Link feedback to goal
  const linkedFeedback = await prisma.feedbackSessionResponse.findFirst({
    where: { targetId: ntDev1.id, category: FeedbackCategory.IMPROVEMENT },
  });
  if (linkedFeedback) {
    await prisma.developmentGoalFeedback.create({
      data: { developmentGoalId: goal1.id, sessionResponseId: linkedFeedback.id },
    });
  }

  console.log("✅ 개선 목표 생성 완료 (5건)");

  // ==========================================
  // 9. Notifications
  // ==========================================
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  await prisma.notification.createMany({
    data: [
      // dev1 notifications
      {
        userId: dev1.id,
        type: "REVIEW_REQUESTED",
        title: "새로운 평가 요청",
        message: "2025년 하반기 평가 주기가 시작되었습니다. 3건의 평가를 작성해주세요.",
        link: `/reviews/${activeCycle.id}`,
        createdAt: new Date(now.getTime() - 2 * oneDay),
      },
      {
        userId: dev1.id,
        type: "FEEDBACK_RECEIVED",
        title: "새로운 피드백 도착",
        message: "동료 피드백 세션에서 새로운 피드백 4건이 도착했습니다.",
        link: "/feedback",
        createdAt: new Date(now.getTime() - 1 * oneDay),
      },
      {
        userId: dev1.id,
        type: "REVIEW_CYCLE_ENDING",
        title: "평가 마감 임박",
        message: "2025년 하반기 평가 마감이 2주 남았습니다.",
        link: `/reviews/${activeCycle.id}`,
        createdAt: now,
      },
      // manager1 notifications
      {
        userId: manager1.id,
        type: "REVIEW_CYCLE_STARTED",
        title: "평가 주기 시작",
        message: "2025년 하반기 평가가 시작되었습니다. 팀원 3명의 평가를 진행해주세요.",
        link: `/reviews/${activeCycle.id}`,
        createdAt: new Date(now.getTime() - 2 * oneDay),
      },
      {
        userId: manager1.id,
        type: "FEEDBACK_RECEIVED",
        title: "새로운 피드백 도착",
        message: "분기 익명 피드백에서 피드백 3건이 도착했습니다.",
        link: "/feedback",
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      // admin notifications
      {
        userId: admin.id,
        type: "REVIEW_CYCLE_STARTED",
        title: "평가 주기 시작됨",
        message: "2025년 하반기 평가가 정상적으로 시작되었습니다.",
        link: `/admin/review-cycles`,
        createdAt: new Date(now.getTime() - 3 * oneDay),
      },
      {
        userId: admin.id,
        type: "REVIEW_CYCLE_ENDING",
        title: "평가 마감 임박 알림",
        message: "일부 팀원이 아직 평가를 완료하지 않았습니다.",
        link: `/admin/review-cycles`,
        createdAt: now,
      },
      // dev2 notifications
      {
        userId: dev2.id,
        type: "REVIEW_REQUESTED",
        title: "평가 요청",
        message: "2025년 하반기 자기평가 및 동료평가를 작성해주세요.",
        link: `/reviews/${activeCycle.id}`,
        createdAt: new Date(now.getTime() - 2 * oneDay),
      },
    ],
  });

  console.log("✅ 알림 생성 완료 (8건)");

  // ==========================================
  // 10. Audit Logs (sample)
  // ==========================================
  await prisma.auditLog.createMany({
    data: [
      {
        action: "CREATE",
        entityType: "REVIEW_CYCLE",
        entityId: activeCycle.id,
        userId: admin.id,
        metadata: { cycleName: activeCycle.name },
        createdAt: new Date(now.getTime() - 3 * oneDay),
      },
      {
        action: "STATUS_CHANGE",
        entityType: "REVIEW_CYCLE",
        entityId: completedCycle.id,
        userId: admin.id,
        changes: { status: { from: "ACTIVE", to: "COMPLETED" } },
        createdAt: new Date(now.getTime() - 10 * oneDay),
      },
    ],
  });

  console.log("✅ 감사 로그 생성 완료 (2건)");

  // ==========================================
  // Summary
  // ==========================================
  console.log("\n========================================");
  console.log("  SEED COMPLETE");
  console.log("========================================\n");
  console.log("  모든 계정 비밀번호: password123\n");
  console.log("  ┌────────────────────────────────────────────────┐");
  console.log("  │  역할       이메일                  이름       │");
  console.log("  ├────────────────────────────────────────────────┤");
  console.log("  │  관리자     admin@teambase.com      김관리     │");
  console.log("  │  팀장(개발) manager@teambase.com     이팀장     │");
  console.log("  │  팀장(마케) manager2@teambase.com    박팀장     │");
  console.log("  │  팀원(개발) member@teambase.com      정개발     │");
  console.log("  │  팀원(개발) dev2@teambase.com        최개발     │");
  console.log("  │  팀원(개발) dev3@teambase.com        강프론트   │");
  console.log("  │  팀원(마케) mkt1@teambase.com        한마케터   │");
  console.log("  │  팀원(마케) mkt2@teambase.com        윤콘텐츠   │");
  console.log("  │  팀원(디자) design1@teambase.com     송디자인   │");
  console.log("  └────────────────────────────────────────────────┘\n");
  console.log("  데이터 요약:");
  console.log("  - 부서 3개 (개발/마케팅/디자인)");
  console.log("  - 평가 주기 2개 (완료 1 + 진행중 1)");
  console.log("  - 제출된 리뷰 9건 (완료 주기)");
  console.log("  - 대기중 배정 15건 (진행중 주기)");
  console.log("  - 피드백 세션 2개 (기명 1 + 익명 1)");
  console.log("  - 피드백 응답 13건");
  console.log("  - 개선 목표 5건");
  console.log("  - 알림 8건\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
