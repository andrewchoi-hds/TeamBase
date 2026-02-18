import { vi } from "vitest";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
  departmentId?: string | null;
  managerId?: string | null;
}

export const mockAdmin: MockUser = {
  id: "admin-1",
  email: "admin@test.com",
  name: "관리자",
  role: "ADMIN",
  departmentId: "dept-1",
  managerId: null,
};

export const mockManager: MockUser = {
  id: "manager-1",
  email: "manager@test.com",
  name: "매니저",
  role: "MANAGER",
  departmentId: "dept-1",
  managerId: "admin-1",
};

export const mockMember: MockUser = {
  id: "member-1",
  email: "member@test.com",
  name: "팀원",
  role: "MEMBER",
  departmentId: "dept-1",
  managerId: "manager-1",
};

export function mockGetCurrentUser(user: MockUser | null) {
  const authUtils = require("@/lib/auth-utils");
  vi.spyOn(authUtils, "getCurrentUser").mockResolvedValue(user);
}
