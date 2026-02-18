import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/common/status-badge";

describe("StatusBadge", () => {
  it("상태를 한국어로 표시한다", () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("진행중")).toBeInTheDocument();
  });

  it("DRAFT 상태를 표시한다", () => {
    render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText("초안")).toBeInTheDocument();
  });

  it("COMPLETED 상태를 표시한다", () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  it("SUBMITTED 상태를 표시한다", () => {
    render(<StatusBadge status="SUBMITTED" />);
    expect(screen.getByText("제출됨")).toBeInTheDocument();
  });

  it("PENDING 상태를 표시한다", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("대기")).toBeInTheDocument();
  });

  it("알 수 없는 상태는 원래 값을 표시한다", () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText("UNKNOWN_STATUS")).toBeInTheDocument();
  });
});
