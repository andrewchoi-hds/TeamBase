export const KUDOS_TAGS = [
  { value: "teamwork", label: "팀워크", emoji: "🤝" },
  { value: "innovation", label: "혁신", emoji: "💡" },
  { value: "leadership", label: "리더십", emoji: "🏆" },
  { value: "communication", label: "소통", emoji: "💬" },
  { value: "growth", label: "성장", emoji: "🌱" },
  { value: "responsibility", label: "책임감", emoji: "🎯" },
  { value: "creativity", label: "창의성", emoji: "🎨" },
  { value: "caring", label: "배려", emoji: "💖" },
] as const;

export type KudosTagValue = (typeof KUDOS_TAGS)[number]["value"];
