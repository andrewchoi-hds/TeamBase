import type { TemplateCategoryFormData } from "@/lib/types/review-template";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  tags: string[];
  guideline: string;
  categories: TemplateCategoryFormData[];
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // ───────────────────────────────────────────────
  // 1. 360° 종합 성장 평가
  // ───────────────────────────────────────────────
  {
    id: "growth-360",
    name: "360° 성장 중심 평가",
    description: "성과뿐 아니라 성장 가능성과 협업 임팩트까지 다차원으로 바라보는 MZ 맞춤형 360° 평가",
    tags: ["360°", "성장", "추천"],
    guideline: "평가 시 구체적인 행동 사례를 중심으로 작성해주세요. '잘한다/못한다' 같은 추상적 표현 대신, '언제 어떤 상황에서 어떤 행동을 했는지'를 서술하면 피드백의 가치가 높아집니다. 점수만큼 코멘트가 중요합니다.",
    categories: [
      {
        name: "임팩트 & 실행력",
        weight: 1.0,
        criteria: [
          {
            name: "목표 달성도",
            description: "OKR/KPI 등 설정한 목표 대비 실제 성과",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "목표 대비 30% 미만, 주요 마일스톤 미달성",
                "2": "목표 대비 50% 수준, 일부 마일스톤 달성",
                "3": "목표 대비 70~80% 달성, 핵심 마일스톤 충족",
                "4": "목표 100% 달성, 추가 가치도 창출",
                "5": "목표 초과 달성, 팀 전체에 영향을 줄 만한 임팩트",
              },
            },
          },
          {
            name: "실행 속도 & 완결성",
            description: "주어진 일을 빠르게 끝까지 마무리하는 능력",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "마감을 자주 놓치고 중간에 멈추는 경우가 많음",
                "2": "리마인드가 필요하지만 결국 마무리함",
                "3": "기한 내 안정적으로 마무리",
                "4": "빠른 실행력 + 높은 완성도",
                "5": "기대 이상의 속도와 퀄리티, 주변에 추진력을 전파",
              },
            },
          },
          {
            name: "이 사람이 특히 잘한 프로젝트/업무는?",
            description: "구체적인 프로젝트명이나 상황을 적어주세요",
            questionType: "TEXT",
            isRequired: false,
          },
        ],
      },
      {
        name: "협업 & 커뮤니케이션",
        weight: 0.9,
        criteria: [
          {
            name: "팀 시너지",
            description: "함께 일할 때 팀의 전체 역량이 올라가는 정도",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "사일로 방식으로 일하며 공유가 부족",
                "2": "요청 시 협업하지만 자발적이지 않음",
                "3": "원활하게 협업하고 적절히 공유",
                "4": "적극적으로 동료를 돕고 팀 퍼포먼스를 끌어올림",
                "5": "이 사람이 참여하면 팀 전체의 아웃풋이 눈에 띄게 향상",
              },
            },
          },
          {
            name: "피드백 주고받기",
            description: "건설적인 피드백을 주고, 받은 피드백을 반영하는 자세",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "투명한 소통",
            description: "진행 상황, 리스크, 의견을 솔직하게 공유하는 정도",
            questionType: "RATING",
            isRequired: true,
          },
        ],
      },
      {
        name: "성장 & 학습",
        weight: 0.8,
        criteria: [
          {
            name: "학습 속도",
            description: "새로운 도구, 기술, 도메인을 빠르게 흡수하는 능력",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "자기 인식",
            description: "자신의 강점과 개선점을 정확히 파악하고 있는 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "지식 공유",
            description: "배운 것을 문서화하거나 동료에게 전달하는 습관",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "이 사람에게 추천하고 싶은 성장 방향은?",
            description: "구체적인 스킬, 역할, 경험 등을 자유롭게 적어주세요",
            questionType: "TEXT",
            isRequired: false,
          },
        ],
      },
      {
        name: "문화 기여 & 리더십",
        weight: 0.7,
        criteria: [
          {
            name: "심리적 안전감 기여",
            description: "팀원이 편하게 의견을 말하고 실수를 공유할 수 있는 분위기를 만드는 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "오너십",
            description: "역할 범위를 넘어서 '내 일'처럼 챙기는 주인의식",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "이 사람의 가장 큰 강점 한 가지는?",
            description: "",
            questionType: "TEXT",
            isRequired: true,
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────
  // 2. 퍼포먼스 리뷰 (성과 집중)
  // ───────────────────────────────────────────────
  {
    id: "performance-focused",
    name: "퍼포먼스 리뷰",
    description: "OKR/KPI 기반 성과를 정량적으로 평가하고, 다음 분기 방향을 잡는 데 집중하는 템플릿",
    tags: ["성과", "OKR", "분기"],
    guideline: "이번 분기의 구체적인 성과와 수치를 기반으로 평가해주세요. 과정보다는 결과에 초점을 맞추되, 결과에 이르게 한 핵심 행동도 함께 언급해주세요.",
    categories: [
      {
        name: "목표 달성",
        weight: 1.0,
        criteria: [
          {
            name: "핵심 목표 달성률",
            description: "이번 분기 핵심 OKR/KPI 달성 수준",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "핵심 목표 대부분 미달 (30% 이하)",
                "2": "일부 달성했으나 핵심 지표 부족 (50%)",
                "3": "핵심 지표 대부분 달성 (70~80%)",
                "4": "모든 핵심 지표 달성 (100%)",
                "5": "목표 초과 달성 + 스트레치 목표까지 도달",
              },
            },
          },
          {
            name: "업무 품질",
            description: "산출물의 정확성, 완성도, 재작업 빈도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "우선순위 판단력",
            description: "중요도에 따라 자원과 시간을 배분하는 능력",
            questionType: "RATING",
            isRequired: true,
          },
        ],
      },
      {
        name: "문제 해결 & 의사결정",
        weight: 0.9,
        criteria: [
          {
            name: "문제 정의 능력",
            description: "복잡한 상황에서 핵심 문제를 빠르게 파악하는 능력",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "해결 창의성",
            description: "기존 방식에 머물지 않고 새로운 접근법을 시도하는 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "의사결정 속도와 질",
            description: "적절한 시점에 합리적인 결정을 내리는 능력",
            questionType: "RATING",
            isRequired: true,
          },
        ],
      },
      {
        name: "다음 분기 방향",
        weight: 0.5,
        criteria: [
          {
            name: "이 사람이 다음 분기에 집중하면 좋을 영역은?",
            description: "구체적인 프로젝트, 스킬, 역할 등",
            questionType: "TEXT",
            isRequired: true,
          },
          {
            name: "이 사람에게 줄이거나 그만하면 좋겠다고 생각하는 것은?",
            description: "건설적인 관점에서 솔직하게 적어주세요",
            questionType: "TEXT",
            isRequired: false,
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────
  // 3. 피어 리뷰 (동료 간 상호 평가)
  // ───────────────────────────────────────────────
  {
    id: "peer-review",
    name: "피어 리뷰 (동료 평가)",
    description: "동료 간 신뢰를 기반으로 강점 발견과 개선점을 나누는 수평적 피드백 템플릿",
    tags: ["동료", "피어", "수평"],
    guideline: "이 평가는 서열이 아닌 '동료로서의 솔직한 관찰'입니다. 좋은 피어 리뷰는 (1) 구체적 상황 (2) 관찰한 행동 (3) 그 행동이 미친 영향 — 이 세 가지를 담고 있습니다. 점수보다 코멘트에 더 공을 들여주세요.",
    categories: [
      {
        name: "함께 일하기",
        weight: 1.0,
        criteria: [
          {
            name: "신뢰도",
            description: "이 동료에게 중요한 일을 맡겼을 때 안심이 되는 정도",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "결과물을 다시 확인해야 하는 경우가 잦음",
                "2": "기본적으로 수행하나 가끔 누락이 있음",
                "3": "맡기면 안정적으로 처리",
                "4": "기대 이상으로 꼼꼼하게 처리, 안심이 됨",
                "5": "이 사람에게 맡기면 내 일처럼 챙겨줌, 완벽한 신뢰",
              },
            },
          },
          {
            name: "소통 편안함",
            description: "의견 차이가 있을 때도 편하게 대화할 수 있는 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "협업 시 이 사람의 강점은?",
            description: "함께 일하면서 느낀 이 동료만의 강점을 적어주세요",
            questionType: "TEXT",
            isRequired: true,
          },
        ],
      },
      {
        name: "팀에 미치는 영향",
        weight: 0.9,
        criteria: [
          {
            name: "에너지 기여",
            description: "이 사람이 팀 분위기에 미치는 긍정적 영향",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "도움 주기",
            description: "다른 팀원이 막혔을 때 적극적으로 돕는 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "계속해주면 좋겠는 행동",
            description: "이 동료가 지금처럼 계속 해줬으면 하는 것",
            questionType: "TEXT",
            isRequired: true,
          },
          {
            name: "바뀌면 더 좋을 점",
            description: "하나만 바꾸면 훨씬 더 좋아질 것 같은 점",
            questionType: "TEXT",
            isRequired: false,
          },
        ],
      },
      {
        name: "종합",
        weight: 0.5,
        criteria: [
          {
            name: "다시 같은 팀으로 일하고 싶은 정도",
            description: "다음 프로젝트에서 이 동료와 함께 하고 싶은 정도",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "가능하면 다른 구성이 좋겠음",
                "2": "괜찮지만 특별히 원하진 않음",
                "3": "함께 하면 무난하게 잘 될 것",
                "4": "적극적으로 같은 팀을 원함",
                "5": "반드시 함께 하고 싶은 동료",
              },
            },
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────
  // 4. 리더 리뷰 (상향 평가)
  // ───────────────────────────────────────────────
  {
    id: "manager-review",
    name: "리더 리뷰 (상향 평가)",
    description: "리더에게 솔직한 피드백을 전달하여 리더십을 성장시키는 상향 평가 템플릿",
    tags: ["상향", "리더십", "리더"],
    guideline: "이 평가는 리더의 성장을 돕기 위한 것입니다. 익명으로 처리되며, 솔직한 피드백이 리더와 팀 모두에게 도움이 됩니다. '좋다/나쁘다'보다 '이런 상황에서 이렇게 했으면 좋겠다'는 제안 형태가 효과적입니다.",
    categories: [
      {
        name: "방향 제시 & 의사결정",
        weight: 1.0,
        criteria: [
          {
            name: "비전 & 방향성",
            description: "팀이 어디로 가야 하는지 명확한 방향을 제시하는 능력",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "의사결정 투명성",
            description: "결정의 이유와 맥락을 팀에 충분히 공유하는 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "우선순위 정렬",
            description: "팀이 지금 가장 중요한 일에 집중할 수 있도록 조율하는 능력",
            questionType: "RATING",
            isRequired: true,
          },
        ],
      },
      {
        name: "팀원 성장 지원",
        weight: 1.0,
        criteria: [
          {
            name: "1:1 미팅 품질",
            description: "정기 1:1에서 의미 있는 대화가 이루어지는 정도",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "1:1이 없거나 형식적",
                "2": "간헐적, 업무 보고 위주",
                "3": "정기적이고 업무+성장 모두 다룸",
                "4": "매 1:1이 유익하고 구체적인 액션이 나옴",
                "5": "1:1 후 항상 동기부여 되고 방향이 선명해짐",
              },
            },
          },
          {
            name: "성장 기회 제공",
            description: "도전적인 업무, 학습 기회, 노출 기회를 만들어주는 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "피드백 품질",
            description: "적시에 구체적이고 실행 가능한 피드백을 주는 능력",
            questionType: "RATING",
            isRequired: true,
          },
        ],
      },
      {
        name: "심리적 안전 & 문화",
        weight: 0.9,
        criteria: [
          {
            name: "심리적 안전감",
            description: "팀에서 실수를 인정하고, 다른 의견을 말하기 편한 분위기",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "공정성",
            description: "성과 인정, 업무 배분, 기회 제공에서 공정한 정도",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "이 리더에게 하고 싶은 말",
            description: "칭찬, 요청, 제안 등 자유롭게 적어주세요",
            questionType: "TEXT",
            isRequired: false,
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────
  // 5. 셀프 체크인 (자기 평가)
  // ───────────────────────────────────────────────
  {
    id: "self-checkin",
    name: "셀프 체크인",
    description: "스스로의 성과와 성장을 돌아보고, 다음 분기 방향을 정리하는 자기 평가 템플릿",
    tags: ["자기평가", "회고", "셀프"],
    guideline: "이 평가는 '자기 PR'이 아니라 '정직한 회고'를 위한 것입니다. 잘한 점은 구체적 근거와 함께, 부족한 점은 원인 분석과 개선 계획을 함께 적어주세요. 솔직한 셀프 체크인이 가장 좋은 성장 도구입니다.",
    categories: [
      {
        name: "이번 분기 성과",
        weight: 1.0,
        criteria: [
          {
            name: "목표 달성도 (자기 평가)",
            description: "내가 설정한 목표를 얼마나 달성했는지 스스로 평가",
            questionType: "RATING",
            isRequired: true,
          },
          {
            name: "가장 임팩트 있었던 일",
            description: "이번 분기에 내가 팀/조직에 가장 큰 기여를 한 일은?",
            questionType: "TEXT",
            isRequired: true,
          },
          {
            name: "아쉬웠던 점",
            description: "기대만큼 되지 않았거나, 다시 한다면 다르게 할 일은?",
            questionType: "TEXT",
            isRequired: true,
          },
        ],
      },
      {
        name: "역량 & 성장",
        weight: 0.8,
        criteria: [
          {
            name: "이번 분기에 성장한 스킬/역량",
            description: "새로 배우거나 크게 늘어난 역량을 구체적으로 적어주세요",
            questionType: "TEXT",
            isRequired: true,
          },
          {
            name: "현재 가장 부족하다고 느끼는 역량",
            description: "솔직하게 적어주세요. 이 답변이 성장 계획의 기초가 됩니다",
            questionType: "TEXT",
            isRequired: true,
          },
          {
            name: "업무 몰입도",
            description: "이번 분기 업무에 얼마나 몰입할 수 있었는지",
            questionType: "RATING",
            isRequired: true,
            options: {
              rubric: {
                "1": "번아웃 / 동기부여가 크게 부족했음",
                "2": "산만하거나 의욕이 낮은 시기가 많았음",
                "3": "평균적인 몰입, 무난하게 수행",
                "4": "대부분의 업무에 높은 집중도",
                "5": "플로우 상태, 일이 즐겁고 에너지가 넘쳤음",
              },
            },
          },
        ],
      },
      {
        name: "다음 분기 계획",
        weight: 0.5,
        criteria: [
          {
            name: "다음 분기 핵심 목표",
            description: "2~3가지 핵심 목표를 적어주세요",
            questionType: "TEXT",
            isRequired: true,
          },
          {
            name: "필요한 지원",
            description: "목표 달성을 위해 리더/팀/조직에서 도움받고 싶은 것",
            questionType: "TEXT",
            isRequired: false,
          },
          {
            name: "커리어 방향",
            description: "6개월~1년 후 어떤 역할/포지션으로 성장하고 싶은지",
            questionType: "SINGLE_CHOICE",
            isRequired: false,
            options: {
              choices: [
                { label: "현재 역할에서 깊이를 더 키우고 싶다", value: "deepen" },
                { label: "새로운 도메인/역할로 확장하고 싶다", value: "expand" },
                { label: "리더십/매니지먼트 역할에 관심이 있다", value: "leadership" },
                { label: "아직 고민 중이다", value: "exploring" },
              ],
            },
          },
        ],
      },
    ],
  },
];
