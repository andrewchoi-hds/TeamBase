import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingState } from "@/components/common/loading-state";

describe("LoadingState", () => {
  it("기본 3개 행의 스켈레톤을 렌더링한다", () => {
    const { container } = render(<LoadingState />);
    // 각 row에 2개의 Skeleton이 있으므로 총 6개
    // div.space-y-2 가 3개
    const rows = container.querySelectorAll(".space-y-2");
    expect(rows).toHaveLength(3);
  });

  it("커스텀 행 수를 렌더링한다", () => {
    const { container } = render(<LoadingState rows={5} />);
    const rows = container.querySelectorAll(".space-y-2");
    expect(rows).toHaveLength(5);
  });
});
