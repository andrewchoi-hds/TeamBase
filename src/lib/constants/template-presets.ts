import type { TemplateCategoryFormData } from "@/lib/types/review-template";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  categories: TemplateCategoryFormData[];
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "three-axis",
    name: "3축 평가 (퍼포먼스/메타/인플루언스)",
    description: "퍼포먼스, 메타퍼포먼스, 인플루언스의 3가지 축으로 구성된 평가",
    categories: [
      {
        name: "퍼포먼스",
        weight: 1.0,
        criteria: [
          { name: "목표달성도", description: "설정된 목표 대비 달성률", questionType: "RATING", isRequired: true, options: { rubric: { "1": "목표 대비 30% 미만 달성", "2": "목표 대비 50% 수준 달성", "3": "목표 대비 70~80% 달성", "4": "목표를 100% 달성", "5": "목표를 초과 달성하며 기대 이상의 성과" } } },
          { name: "업무품질", description: "산출물의 완성도와 정확성", questionType: "RATING", isRequired: true, options: { rubric: { "1": "빈번한 오류, 재작업 필요", "2": "기본 수준이나 보완 필요", "3": "기대 수준 충족", "4": "높은 완성도, 세밀한 검토", "5": "탁월한 품질, 팀 기준 상향" } } },
          { name: "효율성", description: "시간과 자원을 효과적으로 활용하는 정도", questionType: "RATING", isRequired: true },
        ],
      },
      {
        name: "메타퍼포먼스",
        weight: 0.8,
        criteria: [
          { name: "자기인식", description: "자신의 강점과 약점을 정확히 파악하는 능력", questionType: "RATING", isRequired: true },
          { name: "학습속도", description: "새로운 지식과 기술을 습득하는 속도", questionType: "RATING", isRequired: true },
          { name: "피드백 수용력", description: "피드백을 열린 마음으로 받아들이고 개선에 반영하는 정도", questionType: "RATING", isRequired: true },
        ],
      },
      {
        name: "인플루언스",
        weight: 0.7,
        criteria: [
          { name: "팀기여도", description: "팀 전체의 성과에 기여하는 정도", questionType: "RATING", isRequired: true },
          { name: "지식공유", description: "습득한 지식과 경험을 동료와 나누는 정도", questionType: "RATING", isRequired: true },
          { name: "문화기여", description: "긍정적인 조직 문화 형성에 기여하는 정도", questionType: "RATING", isRequired: true },
        ],
      },
    ],
  },
  {
    id: "basic-competency",
    name: "기본 역량 평가",
    description: "업무역량, 커뮤니케이션, 리더십의 3가지 카테고리로 구성된 기본 평가",
    categories: [
      {
        name: "업무역량",
        weight: 1.0,
        criteria: [
          { name: "전문성", description: "담당 업무에 필요한 전문 지식과 기술 수준", questionType: "RATING", isRequired: true },
          { name: "문제해결력", description: "업무 중 발생하는 문제를 효과적으로 해결하는 능력", questionType: "RATING", isRequired: true },
          { name: "업무 계획 및 실행", description: "체계적인 계획 수립과 실행력", questionType: "RATING", isRequired: true },
        ],
      },
      {
        name: "커뮤니케이션",
        weight: 0.8,
        criteria: [
          { name: "의사소통", description: "명확하고 효과적인 커뮤니케이션 능력", questionType: "RATING", isRequired: true },
          { name: "협업", description: "동료 및 타 부서와의 협업 능력", questionType: "RATING", isRequired: true },
          { name: "보고 및 공유", description: "업무 현황을 적시에 보고하고 공유하는 정도", questionType: "RATING", isRequired: true },
        ],
      },
      {
        name: "리더십",
        weight: 0.7,
        criteria: [
          { name: "주도성", description: "업무를 능동적으로 이끌어가는 자세", questionType: "RATING", isRequired: true },
          { name: "동기부여", description: "팀원에게 동기를 부여하고 사기를 높이는 능력", questionType: "RATING", isRequired: true },
          { name: "의사결정", description: "합리적이고 신속한 의사결정 능력", questionType: "RATING", isRequired: true },
        ],
      },
    ],
  },
  {
    id: "self-assessment",
    name: "셀프 어세스먼트",
    description: "자기 성과와 역량을 스스로 돌아보는 자기평가 템플릿",
    categories: [
      {
        name: "성과 자기평가",
        weight: 1.0,
        criteria: [
          { name: "이번 분기 목표 달성도", description: "설정한 목표를 얼마나 달성했는지 스스로 평가", questionType: "RATING", isRequired: true },
          { name: "가장 큰 성과", description: "이번 분기 가장 의미 있었던 성과를 서술해주세요", questionType: "TEXT", isRequired: true },
          { name: "개선이 필요한 영역", description: "부족했거나 개선이 필요하다고 느끼는 부분을 서술해주세요", questionType: "TEXT", isRequired: true },
        ],
      },
      {
        name: "역량 자기평가",
        weight: 0.8,
        criteria: [
          { name: "성장 계획", description: "다음 분기 성장 목표와 계획을 서술해주세요", questionType: "TEXT", isRequired: true },
          { name: "필요한 지원", description: "성장을 위해 조직에서 지원받고 싶은 것을 서술해주세요", questionType: "TEXT", isRequired: false },
        ],
      },
    ],
  },
];
