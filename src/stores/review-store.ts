import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResponseValue } from "@/lib/types/review-template";

interface ReviewDraft {
  assignmentId: string;
  responses: Record<string, ResponseValue>;
  overallComment: string;
  savedAt: string;
}

interface ReviewStore {
  drafts: Record<string, ReviewDraft>;
  saveDraft: (assignmentId: string, draft: Omit<ReviewDraft, "assignmentId" | "savedAt">) => void;
  getDraft: (assignmentId: string) => ReviewDraft | null;
  removeDraft: (assignmentId: string) => void;
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      drafts: {},
      saveDraft: (assignmentId, draft) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [assignmentId]: {
              ...draft,
              assignmentId,
              savedAt: new Date().toISOString(),
            },
          },
        })),
      getDraft: (assignmentId) => get().drafts[assignmentId] ?? null,
      removeDraft: (assignmentId) =>
        set((state) => {
          const { [assignmentId]: _removed, ...rest } = state.drafts;
          return { drafts: rest };
        }),
    }),
    { name: "review-store", partialize: (state) => ({ drafts: state.drafts }) }
  )
);
