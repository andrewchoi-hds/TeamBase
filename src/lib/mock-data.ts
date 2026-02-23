// In-memory mock data store - no database needed

const now = new Date();
const day = (n: number) => new Date(Date.now() + n * 86400000);

// ============ Departments ============
export const departments = [
  { id: "dept-dev", name: "개발팀", parentId: null, createdAt: now, updatedAt: now, parent: null, children: [], _count: { users: 5 } },
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
    _count: { assignments: 6, reviews: 2 },
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


// ============ Notifications ============
export const notifications: any[] = [
  { id: "noti-1", userId: "user-dev1", type: "REVIEW_REQUESTED", title: "새로운 평가 요청", message: "2024년 상반기 평가 주기가 시작되었습니다.", link: "/reviews/cycle-1", isRead: false, createdAt: day(-1) },
  { id: "noti-2", userId: "user-dev1", type: "FEEDBACK_RECEIVED", title: "새로운 피드백", message: "이팀장님이 피드백을 남겼습니다.", link: "/feedback", isRead: false, createdAt: day(-3) },
  { id: "noti-3", userId: "user-dev1", type: "FEEDBACK_RECEIVED", title: "피드백 알림", message: "새로운 피드백이 도착했습니다.", link: "/feedback", isRead: true, createdAt: day(-5) },
  { id: "noti-4", userId: "user-mgr1", type: "REVIEW_CYCLE_STARTED", title: "평가 주기 시작", message: "2024년 상반기 평가가 시작되었습니다.", link: "/reviews/cycle-1", isRead: false, createdAt: day(-1) },
  { id: "noti-5", userId: "user-mgr1", type: "ACCESS_LOG_ALERT", title: "열람 알림", message: "김관리님이 회원님의 프로필 정보를 열람했습니다.", link: "/notifications", isRead: false, createdAt: day(0) },
  { id: "noti-6", userId: "user-admin", type: "REVIEW_SUBMITTED", title: "평가 제출", message: "정개발님이 자기평가를 제출했습니다.", link: "/reviews/cycle-1", isRead: true, createdAt: day(-2) },
];

// ============ Access Logs ============
export const accessLogs: any[] = [
  { id: "log-1", viewerId: "user-admin", targetId: "user-dev1", resourceType: "PROFILE", resourceId: null, notificationSent: true, createdAt: day(0), viewer: { id: "user-admin", name: "김관리", role: "ADMIN" }, target: { id: "user-dev1", name: "정개발" } },
  { id: "log-2", viewerId: "user-mgr1", targetId: "user-dev1", resourceType: "REVIEW", resourceId: "rev-1", notificationSent: true, createdAt: day(-1), viewer: { id: "user-mgr1", name: "이팀장", role: "MANAGER" }, target: { id: "user-dev1", name: "정개발" } },
];

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

