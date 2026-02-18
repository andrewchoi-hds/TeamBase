import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("단일 클래스 문자열을 반환한다", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("여러 클래스를 합친다", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("falsy 값을 무시한다", () => {
    expect(cn("foo", false && "bar", null, undefined, "baz")).toBe("foo baz");
  });

  it("조건부 클래스를 처리한다", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("Tailwind 클래스 충돌을 해결한다", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
