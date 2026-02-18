import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/common/empty-state";

describe("EmptyState", () => {
  it("제목을 렌더링한다", () => {
    render(<EmptyState title="데이터 없음" />);
    expect(screen.getByText("데이터 없음")).toBeInTheDocument();
  });

  it("설명을 표시한다", () => {
    render(<EmptyState title="없음" description="아직 데이터가 없습니다." />);
    expect(screen.getByText("아직 데이터가 없습니다.")).toBeInTheDocument();
  });

  it("아이콘을 렌더링한다", () => {
    render(<EmptyState title="빈 상태" icon={<span data-testid="empty-icon">E</span>} />);
    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
  });

  it("액션 버튼을 표시한다", () => {
    render(
      <EmptyState
        title="없음"
        action={<button>생성하기</button>}
      />
    );
    expect(screen.getByText("생성하기")).toBeInTheDocument();
  });
});
