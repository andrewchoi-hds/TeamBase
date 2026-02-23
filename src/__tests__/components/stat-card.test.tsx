import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/common/stat-card";

describe("StatCard", () => {
  it("제목과 값을 렌더링한다", () => {
    render(<StatCard title="총 평가" value={42} />);
    expect(screen.getByText("총 평가")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("설명을 표시한다", () => {
    render(<StatCard title="평가" value={10} description="이번 분기" />);
    expect(screen.getByText("이번 분기")).toBeInTheDocument();
  });

  it("문자열 값도 표시한다", () => {
    render(<StatCard title="상태" value="진행중" />);
    expect(screen.getByText("진행중")).toBeInTheDocument();
  });

  it("양수 트렌드를 표시한다", () => {
    render(<StatCard title="성장" value={100} trend={{ value: 15, label: "지난 달 대비" }} />);
    expect(screen.getByText("+15%")).toBeInTheDocument();
    expect(screen.getByText("지난 달 대비")).toBeInTheDocument();
  });

  it("음수 트렌드를 표시한다", () => {
    render(<StatCard title="감소" value={50} trend={{ value: -5, label: "지난 달 대비" }} />);
    expect(screen.getByText("-5%")).toBeInTheDocument();
    expect(screen.getByText("지난 달 대비")).toBeInTheDocument();
  });

  it("아이콘을 렌더링한다", () => {
    render(<StatCard title="테스트" value={0} icon={<span data-testid="icon">I</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
