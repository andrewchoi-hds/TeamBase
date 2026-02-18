// In-memory mock data store - no database needed

const now = new Date();
const day = (n: number) => new Date(Date.now() + n * 86400000);

// ============ Departments ============
export const departments = [
  { id: "dept-dev", name: "개발팀", parentId: null, createdAt: now, updatedAt: now, parent: null, children: [], _count: { users: 4 } },
  { id: "dept-mkt", name: "마케팅팀", parentId: null, createdAt: now, updatedAt: now, parent: null, children: [], _count: { users: 4 } },
];

// ============ Users ============
export const users: any[] = [
  {
    id: "user-admin", email: "admin@teambase.com", name: "김관리", passwordHash: "$mock",
    role: "ADMIN", position: "CTO", departmentId: "dept-dev", managerId: null, isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-dev", name: "개발팀" }, manager: null,
  },
  {
    id: "user-mgr1", email: "manager1@teambase.com", name: "이팀장", passwordHash: "$mock",
    role: "MANAGER", position: "개발팀장", departmentId: "dept-dev", managerId: "user-admin", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-dev", name: "개발팀" }, manager: { id: "user-admin", name: "김관리" },
  },
  {
    id: "user-mgr2", email: "manager2@teambase.com", name: "박팀장", passwordHash: "$mock",
    role: "MANAGER", position: "마케팅팀장", departmentId: "dept-mkt", managerId: "user-admin", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-mkt", name: "마케팅팀" }, manager: { id: "user-admin", name: "김관리" },
  },
  {
    id: "user-dev1", email: "dev1@teambase.com", name: "정개발", passwordHash: "$mock",
    role: "MEMBER", position: "시니어 개발자", departmentId: "dept-dev", managerId: "user-mgr1", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-dev", name: "개발팀" }, manager: { id: "user-mgr1", name: "이팀장" },
  },
  {
    id: "user-dev2", email: "dev2@teambase.com", name: "최개발", passwordHash: "$mock",
    role: "MEMBER", position: "주니어 개발자", departmentId: "dept-dev", managerId: "user-mgr1", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-dev", name: "개발팀" }, manager: { id: "user-mgr1", name: "이팀장" },
  },
  {
    id: "user-dev3", email: "dev3@teambase.com", name: "강개발", passwordHash: "$mock",
    role: "MEMBER", position: "프론트엔드 개발자", departmentId: "dept-dev", managerId: "user-mgr1", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-dev", name: "개발팀" }, manager: { id: "user-mgr1", name: "이팀장" },
  },
  {
    id: "user-mkt1", email: "mkt1@teambase.com", name: "한마케터", passwordHash: "$mock",
    role: "MEMBER", position: "마케팅 매니저", departmentId: "dept-mkt", managerId: "user-mgr2", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-mkt", name: "마케팅팀" }, manager: { id: "user-mgr2", name: "박팀장" },
  },
  {
    id: "user-mkt2", email: "mkt2@teambase.com", name: "윤마케터", passwordHash: "$mock",
    role: "MEMBER", position: "콘텐츠 마케터", departmentId: "dept-mkt", managerId: "user-mgr2", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-mkt", name: "마케팅팀" }, manager: { id: "user-mgr2", name: "박팀장" },
  },
  {
    id: "user-mkt3", email: "mkt3@teambase.com", name: "서마케터", passwordHash: "$mock",
    role: "MEMBER", position: "퍼포먼스 마케터", departmentId: "dept-mkt", managerId: "user-mgr2", isActive: true,
    createdAt: now, updatedAt: now,
    department: { id: "dept-mkt", name: "마케팅팀" }, manager: { id: "user-mgr2", name: "박팀장" },
  },
];

// ============ Review Templates ============
export const reviewTemplates: any[] = [
  {
    id: "tmpl-1", name: "분기별 역량 평가", description: "분기별 역량 및 성과 평가 템플릿", isDefault: true, createdAt: now, updatedAt: now,
    categories: [
      {
        id: "cat-1", templateId: "tmpl-1", name: "업무 역량", weight: 1.0, order: 0,
        criteria: [
          { id: "cri-1", categoryId: "cat-1", name: "전문 지식", description: "담당 업무 분야의 전문 지식 수준", order: 0 },
          { id: "cri-2", categoryId: "cat-1", name: "문제 해결력", description: "업무 과제를 해결하는 능력", order: 1 },
          { id: "cri-3", categoryId: "cat-1", name: "업무 품질", description: "산출물의 품질과 완성도", order: 2 },
        ],
      },
      {
        id: "cat-2", templateId: "tmpl-1", name: "협업 및 소통", weight: 1.0, order: 1,
        criteria: [
          { id: "cri-4", categoryId: "cat-2", name: "팀워크", description: "동료와의 협업 능력", order: 0 },
          { id: "cri-5", categoryId: "cat-2", name: "커뮤니케이션", description: "명확하고 효율적인 의사소통", order: 1 },
          { id: "cri-6", categoryId: "cat-2", name: "리더십", description: "팀을 이끌고 동기부여하는 능력", order: 2 },
        ],
      },
      {
        id: "cat-3", templateId: "tmpl-1", name: "성장 및 태도", weight: 0.8, order: 2,
        criteria: [
          { id: "cri-7", categoryId: "cat-3", name: "자기 개발", description: "지속적 학습과 성장 노력", order: 0 },
          { id: "cri-8", categoryId: "cat-3", name: "주도성", description: "능동적이고 자발적인 업무 수행", order: 1 },
        ],
      },
    ],
  },
];

// ============ Review Cycles ============
export const reviewCycles: any[] = [
  {
    id: "cycle-1", name: "2024년 상반기 평가", description: "2024년 상반기 정기 성과 평가",
    status: "ACTIVE", startDate: new Date("2024-06-01"), endDate: new Date("2024-06-30"),
    templateId: "tmpl-1", createdAt: now, updatedAt: now,
    template: reviewTemplates[0],
    _count: { assignments: 8, reviews: 2 },
  },
  {
    id: "cycle-2", name: "2024년 하반기 평가", description: "2024년 하반기 정기 성과 평가",
    status: "DRAFT", startDate: new Date("2024-12-01"), endDate: new Date("2024-12-31"),
    templateId: "tmpl-1", createdAt: now, updatedAt: now,
    template: reviewTemplates[0],
    _count: { assignments: 0, reviews: 0 },
  },
];

// ============ Review Assignments ============
export const reviewAssignments: any[] = [
  { id: "asgn-1", cycleId: "cycle-1", reviewerId: "user-dev1", targetId: "user-dev1", reviewType: "SELF", status: "SUBMITTED", createdAt: now, updatedAt: now, dueDate: null,
    reviewer: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
    target: { id: "user-dev1", name: "정개발", position: "시니어 개발자", department: { id: "dept-dev", name: "개발팀" } },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가", status: "ACTIVE", endDate: new Date("2024-06-30") },
    review: { id: "rev-1", status: "SUBMITTED" },
  },
  { id: "asgn-2", cycleId: "cycle-1", reviewerId: "user-mgr1", targetId: "user-dev1", reviewType: "DOWNWARD", status: "SUBMITTED", createdAt: now, updatedAt: now, dueDate: null,
    reviewer: { id: "user-mgr1", name: "이팀장", position: "개발팀장" },
    target: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가", status: "ACTIVE", endDate: new Date("2024-06-30") },
    review: { id: "rev-2", status: "SUBMITTED" },
  },
  { id: "asgn-3", cycleId: "cycle-1", reviewerId: "user-dev2", targetId: "user-dev2", reviewType: "SELF", status: "PENDING", createdAt: now, updatedAt: now, dueDate: null,
    reviewer: { id: "user-dev2", name: "최개발", position: "주니어 개발자" },
    target: { id: "user-dev2", name: "최개발", position: "주니어 개발자" },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가", status: "ACTIVE", endDate: new Date("2024-06-30") },
    review: null,
  },
  { id: "asgn-4", cycleId: "cycle-1", reviewerId: "user-mgr1", targetId: "user-dev2", reviewType: "DOWNWARD", status: "PENDING", createdAt: now, updatedAt: now, dueDate: null,
    reviewer: { id: "user-mgr1", name: "이팀장", position: "개발팀장" },
    target: { id: "user-dev2", name: "최개발", position: "주니어 개발자" },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가", status: "ACTIVE", endDate: new Date("2024-06-30") },
    review: null,
  },
  { id: "asgn-5", cycleId: "cycle-1", reviewerId: "user-dev1", targetId: "user-dev2", reviewType: "PEER", status: "PENDING", createdAt: now, updatedAt: now, dueDate: null,
    reviewer: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
    target: { id: "user-dev2", name: "최개발", position: "주니어 개발자" },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가", status: "ACTIVE", endDate: new Date("2024-06-30") },
    review: null,
  },
  { id: "asgn-6", cycleId: "cycle-1", reviewerId: "user-dev2", targetId: "user-dev1", reviewType: "PEER", status: "PENDING", createdAt: now, updatedAt: now, dueDate: null,
    reviewer: { id: "user-dev2", name: "최개발", position: "주니어 개발자" },
    target: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가", status: "ACTIVE", endDate: new Date("2024-06-30") },
    review: null,
  },
];

// ============ Reviews ============
export const reviews: any[] = [
  {
    id: "rev-1", assignmentId: "asgn-1", cycleId: "cycle-1", authorId: "user-dev1", targetId: "user-dev1",
    status: "SUBMITTED", overallRating: 4.2, overallComment: "전반적으로 목표한 바를 잘 달성했다고 생각합니다.",
    createdAt: now, updatedAt: now,
    author: { id: "user-dev1", name: "정개발" },
    target: { id: "user-dev1", name: "정개발" },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가" },
    assignment: { reviewType: "SELF" },
    responses: [
      { id: "resp-1", reviewId: "rev-1", criterionId: "cri-1", rating: 4, comment: "새로운 기술 스택 학습에 적극적이었습니다.", criterion: { name: "전문 지식", category: { name: "업무 역량" } } },
      { id: "resp-2", reviewId: "rev-1", criterionId: "cri-2", rating: 5, comment: "복잡한 문제도 체계적으로 해결했습니다.", criterion: { name: "문제 해결력", category: { name: "업무 역량" } } },
      { id: "resp-3", reviewId: "rev-1", criterionId: "cri-4", rating: 4, comment: "동료들과 잘 협업하고 있습니다.", criterion: { name: "팀워크", category: { name: "협업 및 소통" } } },
    ],
  },
  {
    id: "rev-2", assignmentId: "asgn-2", cycleId: "cycle-1", authorId: "user-mgr1", targetId: "user-dev1",
    status: "SUBMITTED", overallRating: 4.5, overallComment: "팀 내 기술 리더 역할을 잘 수행하고 있습니다. 주니어 개발자 멘토링도 적극적으로 해주세요.",
    createdAt: now, updatedAt: now,
    author: { id: "user-mgr1", name: "이팀장" },
    target: { id: "user-dev1", name: "정개발" },
    cycle: { id: "cycle-1", name: "2024년 상반기 평가" },
    assignment: { reviewType: "DOWNWARD" },
    responses: [
      { id: "resp-4", reviewId: "rev-2", criterionId: "cri-1", rating: 5, comment: "기술 전문성이 뛰어납니다.", criterion: { name: "전문 지식", category: { name: "업무 역량" } } },
      { id: "resp-5", reviewId: "rev-2", criterionId: "cri-2", rating: 4, comment: "문제 해결력이 좋습니다.", criterion: { name: "문제 해결력", category: { name: "업무 역량" } } },
      { id: "resp-6", reviewId: "rev-2", criterionId: "cri-6", rating: 5, comment: "팀 내 기술 리더십 우수.", criterion: { name: "리더십", category: { name: "협업 및 소통" } } },
    ],
  },
];

// ============ Identified Feedback ============
export const identifiedFeedbacks: any[] = [
  {
    id: "fb-1", authorId: "user-mgr1", targetId: "user-dev1", category: "STRENGTH",
    content: "코드 리뷰에서 항상 건설적인 피드백을 제공해주셔서 팀 전체의 코드 품질 향상에 큰 기여를 하고 계십니다.", isPublic: false,
    createdAt: day(-5), updatedAt: day(-5),
    author: { id: "user-mgr1", name: "이팀장", position: "개발팀장" },
    target: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
  },
  {
    id: "fb-2", authorId: "user-dev2", targetId: "user-dev1", category: "IMPROVEMENT",
    content: "가끔 기술적 설명이 어려운 부분이 있어요. 비개발자에게 설명할 때 좀 더 쉬운 용어를 사용하면 좋겠습니다.", isPublic: false,
    createdAt: day(-3), updatedAt: day(-3),
    author: { id: "user-dev2", name: "최개발", position: "주니어 개발자" },
    target: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
  },
  {
    id: "fb-3", authorId: "user-mgr2", targetId: "user-mkt1", category: "STRENGTH",
    content: "마케팅 캠페인 기획력이 뛰어납니다. 데이터 기반으로 의사결정하는 점이 인상적입니다.", isPublic: false,
    createdAt: day(-2), updatedAt: day(-2),
    author: { id: "user-mgr2", name: "박팀장", position: "마케팅팀장" },
    target: { id: "user-mkt1", name: "한마케터", position: "마케팅 매니저" },
  },
  {
    id: "fb-4", authorId: "user-dev1", targetId: "user-mgr1", category: "GENERAL",
    content: "주간 미팅에서의 피드백이 항상 구체적이고 도움이 됩니다. 덕분에 성장하는 느낌입니다.", isPublic: false,
    createdAt: day(-1), updatedAt: day(-1),
    author: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
    target: { id: "user-mgr1", name: "이팀장", position: "개발팀장" },
  },
];

// ============ Objectives ============
export const objectives: any[] = [
  {
    id: "obj-1", title: "2024년 상반기 매출 목표 달성", description: "전사 매출 목표 150억 달성",
    ownerId: "user-admin", level: "COMPANY", status: "ACTIVE", parentId: null,
    startDate: new Date("2024-01-01"), endDate: new Date("2024-06-30"), progress: 65,
    createdAt: now, updatedAt: now,
    owner: { id: "user-admin", name: "김관리", position: "CTO" },
    parent: null, children: [{ id: "obj-2", title: "개발팀 생산성 30% 향상", progress: 50, status: "ACTIVE" }],
    keyResults: [], _count: { children: 1 },
  },
  {
    id: "obj-2", title: "개발팀 생산성 30% 향상", description: null,
    ownerId: "user-mgr1", level: "TEAM", status: "ACTIVE", parentId: "obj-1",
    startDate: new Date("2024-01-01"), endDate: new Date("2024-06-30"), progress: 50,
    createdAt: now, updatedAt: now,
    owner: { id: "user-mgr1", name: "이팀장", position: "개발팀장" },
    parent: { id: "obj-1", title: "2024년 상반기 매출 목표 달성" },
    children: [{ id: "obj-3", title: "코드 커버리지 80% 이상 달성", progress: 70, status: "ACTIVE" }],
    keyResults: [], _count: { children: 1 },
  },
  {
    id: "obj-3", title: "코드 커버리지 80% 이상 달성", description: "전체 프로젝트의 테스트 코드 커버리지를 80% 이상으로 유지",
    ownerId: "user-dev1", level: "INDIVIDUAL", status: "ACTIVE", parentId: "obj-2",
    startDate: new Date("2024-01-01"), endDate: new Date("2024-06-30"), progress: 70,
    createdAt: now, updatedAt: now,
    owner: { id: "user-dev1", name: "정개발", position: "시니어 개발자" },
    parent: { id: "obj-2", title: "개발팀 생산성 30% 향상" },
    children: [],
    keyResults: [
      {
        id: "kr-1", objectiveId: "obj-3", title: "단위 테스트 커버리지", type: "PERCENTAGE",
        startValue: 45, currentValue: 72, targetValue: 80, unit: "%", progress: 77,
        createdAt: now, updatedAt: now,
        checkIns: [
          { id: "ci-1", keyResultId: "kr-1", value: 72, note: "유틸리티 함수 테스트 완료", createdAt: day(-2) },
          { id: "ci-2", keyResultId: "kr-1", value: 65, note: "API 레이어 테스트 보강", createdAt: day(-7) },
          { id: "ci-3", keyResultId: "kr-1", value: 55, note: "주요 서비스 모듈 테스트 추가", createdAt: day(-14) },
        ],
      },
      {
        id: "kr-2", objectiveId: "obj-3", title: "통합 테스트 케이스 수", type: "NUMERIC",
        startValue: 30, currentValue: 85, targetValue: 100, unit: "건", progress: 78,
        createdAt: now, updatedAt: now,
        checkIns: [
          { id: "ci-4", keyResultId: "kr-2", value: 85, note: "주문 시스템 통합 테스트 추가", createdAt: day(-1) },
          { id: "ci-5", keyResultId: "kr-2", value: 70, note: "사용자 인증 통합 테스트", createdAt: day(-5) },
        ],
      },
    ],
    _count: { children: 0 },
  },
];

// ============ Meetings ============
export const meetings: any[] = [
  {
    id: "mtg-1", title: "주간 1:1 미팅", organizerId: "user-mgr1", participantId: "user-dev1",
    scheduledAt: day(2), duration: 30, status: "SCHEDULED",
    agenda: "1. 이번 주 업무 진행 상황\n2. 블로커 확인\n3. 다음 주 계획",
    recurringId: null, createdAt: now, updatedAt: now,
    organizer: { id: "user-mgr1", name: "이팀장" },
    participant: { id: "user-dev1", name: "정개발" },
    _count: { notes: 0, actionItems: 0 },
    notes: [], actionItems: [],
  },
  {
    id: "mtg-2", title: "분기 성과 리뷰", organizerId: "user-mgr1", participantId: "user-dev2",
    scheduledAt: day(-3), duration: 60, status: "COMPLETED",
    agenda: "분기 성과 리뷰 및 피드백", recurringId: null, createdAt: now, updatedAt: now,
    organizer: { id: "user-mgr1", name: "이팀장" },
    participant: { id: "user-dev2", name: "최개발" },
    _count: { notes: 1, actionItems: 2 },
    notes: [
      { id: "note-1", meetingId: "mtg-2", authorId: "user-mgr1", content: "전반적으로 좋은 성과. 코드 품질 개선 노력이 돋보임.", createdAt: day(-3), updatedAt: day(-3), author: { id: "user-mgr1", name: "이팀장" } },
    ],
    actionItems: [
      { id: "ai-1", meetingId: "mtg-2", assigneeId: "user-dev2", title: "테스트 자동화 파이프라인 구축", status: "IN_PROGRESS", dueDate: day(7), createdAt: now, updatedAt: now, assignee: { id: "user-dev2", name: "최개발" } },
      { id: "ai-2", meetingId: "mtg-2", assigneeId: "user-dev2", title: "기술 블로그 포스팅 1편 작성", status: "TODO", dueDate: day(14), createdAt: now, updatedAt: now, assignee: { id: "user-dev2", name: "최개발" } },
    ],
  },
  {
    id: "mtg-3", title: "마케팅 전략 논의", organizerId: "user-mgr2", participantId: "user-mkt1",
    scheduledAt: day(5), duration: 45, status: "SCHEDULED",
    agenda: "Q3 마케팅 전략 및 예산 논의", recurringId: null, createdAt: now, updatedAt: now,
    organizer: { id: "user-mgr2", name: "박팀장" },
    participant: { id: "user-mkt1", name: "한마케터" },
    _count: { notes: 0, actionItems: 0 },
    notes: [], actionItems: [],
  },
];

// ============ Notifications ============
export const notifications: any[] = [
  { id: "noti-1", userId: "user-dev1", type: "REVIEW_REQUESTED", title: "새로운 평가 요청", message: "2024년 상반기 평가 주기가 시작되었습니다.", link: "/reviews/cycle-1", isRead: false, createdAt: day(-1) },
  { id: "noti-2", userId: "user-dev1", type: "FEEDBACK_RECEIVED", title: "새로운 피드백", message: "이팀장님이 피드백을 남겼습니다.", link: "/feedback", isRead: false, createdAt: day(-3) },
  { id: "noti-3", userId: "user-dev1", type: "MEETING_SCHEDULED", title: "미팅 예약", message: "이팀장님과 주간 1:1 미팅이 예약되었습니다.", link: "/meetings/mtg-1", isRead: true, createdAt: day(-5) },
  { id: "noti-4", userId: "user-mgr1", type: "REVIEW_CYCLE_STARTED", title: "평가 주기 시작", message: "2024년 상반기 평가가 시작되었습니다.", link: "/reviews/cycle-1", isRead: false, createdAt: day(-1) },
  { id: "noti-5", userId: "user-mgr1", type: "ACCESS_LOG_ALERT", title: "열람 알림", message: "김관리님이 회원님의 프로필 정보를 열람했습니다.", link: "/notifications", isRead: false, createdAt: day(0) },
  { id: "noti-6", userId: "user-admin", type: "REVIEW_SUBMITTED", title: "평가 제출", message: "정개발님이 자기평가를 제출했습니다.", link: "/reviews/cycle-1", isRead: true, createdAt: day(-2) },
];

// ============ Access Logs ============
export const accessLogs: any[] = [
  { id: "log-1", viewerId: "user-admin", targetId: "user-dev1", resourceType: "PROFILE", resourceId: null, notificationSent: true, createdAt: day(0), viewer: { id: "user-admin", name: "김관리", role: "ADMIN" }, target: { id: "user-dev1", name: "정개발" } },
  { id: "log-2", viewerId: "user-mgr1", targetId: "user-dev1", resourceType: "REVIEW", resourceId: "rev-1", notificationSent: true, createdAt: day(-1), viewer: { id: "user-mgr1", name: "이팀장", role: "MANAGER" }, target: { id: "user-dev1", name: "정개발" } },
];

// ============ Anonymous Feedback Tokens ============
export const anonymousFeedbackTokens: any[] = [];
export const anonymousFeedbacks: any[] = [];

// ============ Cross-references (patch after all arrays defined) ============

// Add assignments to review cycles
reviewCycles[0].assignments = reviewAssignments.filter((a: any) => a.cycleId === "cycle-1");
reviewCycles[1].assignments = [];

// ============ Extracted nested entities ============

// ReviewResponses (from reviews)
export const reviewResponses: any[] = reviews.flatMap((r: any) =>
  (r.responses || []).map((resp: any) => ({ ...resp, review: { id: r.id, cycleId: r.cycleId } }))
);

// ReviewCategories (from templates)
export const reviewCategories: any[] = reviewTemplates.flatMap((t: any) =>
  (t.categories || []).map((cat: any) => ({ ...cat, template: { id: t.id, name: t.name } }))
);

// ReviewCriteria (from categories)
export const reviewCriteria: any[] = reviewCategories.flatMap((cat: any) =>
  (cat.criteria || []).map((cri: any) => ({ ...cri, category: { id: cat.id, name: cat.name } }))
);

// KeyResults (from objectives)
export const keyResults: any[] = objectives.flatMap((obj: any) =>
  (obj.keyResults || []).map((kr: any) => ({ ...kr, objective: { id: obj.id, title: obj.title } }))
);

// KeyResultCheckIns (from keyResults)
export const keyResultCheckIns: any[] = keyResults.flatMap((kr: any) =>
  (kr.checkIns || []).map((ci: any) => ({ ...ci, keyResult: { id: kr.id, title: kr.title } }))
);

// MeetingNotes (from meetings)
export const meetingNotes: any[] = meetings.flatMap((m: any) =>
  (m.notes || []).map((n: any) => ({ ...n, meeting: { id: m.id, title: m.title } }))
);

// ActionItems (from meetings)
export const actionItems: any[] = meetings.flatMap((m: any) =>
  (m.actionItems || []).map((ai: any) => ({ ...ai, meeting: { id: m.id, title: m.title } }))
);
