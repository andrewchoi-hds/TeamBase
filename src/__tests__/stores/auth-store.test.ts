import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";

describe("AuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("초기 user는 null이다", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setUser로 사용자를 설정한다", () => {
    const user = { id: "1", email: "a@b.com", name: "테스트", role: "MEMBER" as const, departmentId: null, managerId: null };
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("isAdmin은 ADMIN 역할일 때 true", () => {
    useAuthStore.setState({ user: { id: "1", email: "a@b.com", name: "관리자", role: "ADMIN" as const, departmentId: null, managerId: null } });
    expect(useAuthStore.getState().isAdmin()).toBe(true);
    expect(useAuthStore.getState().isManager()).toBe(false);
  });

  it("isManager는 MANAGER 역할일 때 true", () => {
    useAuthStore.setState({ user: { id: "1", email: "a@b.com", name: "매니저", role: "MANAGER" as const, departmentId: null, managerId: null } });
    expect(useAuthStore.getState().isManager()).toBe(true);
    expect(useAuthStore.getState().isAdmin()).toBe(false);
  });

  it("isManagerOrAdmin은 ADMIN 또는 MANAGER일 때 true", () => {
    useAuthStore.setState({ user: { id: "1", email: "a@b.com", name: "관리자", role: "ADMIN" as const, departmentId: null, managerId: null } });
    expect(useAuthStore.getState().isManagerOrAdmin()).toBe(true);

    useAuthStore.setState({ user: { id: "2", email: "b@b.com", name: "매니저", role: "MANAGER" as const, departmentId: null, managerId: null } });
    expect(useAuthStore.getState().isManagerOrAdmin()).toBe(true);

    useAuthStore.setState({ user: { id: "3", email: "c@b.com", name: "멤버", role: "MEMBER" as const, departmentId: null, managerId: null } });
    expect(useAuthStore.getState().isManagerOrAdmin()).toBe(false);
  });

  it("user가 null이면 isAdmin/isManager는 false", () => {
    expect(useAuthStore.getState().isAdmin()).toBe(false);
    expect(useAuthStore.getState().isManager()).toBe(false);
    expect(useAuthStore.getState().isManagerOrAdmin()).toBe(false);
  });
});
