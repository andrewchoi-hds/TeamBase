import { Role } from "@prisma/client";

export type { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId?: string | null;
  managerId?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    id: string;
    role: Role;
    departmentId?: string | null;
    managerId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    departmentId?: string | null;
    managerId?: string | null;
  }
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: Role[];
  badge?: number;
}

export interface AssignmentUser {
  id: string;
  name: string;
  position?: string;
  department?: { id: string; name: string } | null;
}

export interface Assignment {
  id: string;
  reviewerId: string;
  targetId: string;
  reviewType: string;
  status: string;
  reviewer: AssignmentUser;
  target: AssignmentUser;
  review?: {
    id: string;
    overallRating?: number | null;
  } | null;
}

export interface ReviewCycleDetail {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  assignments?: Assignment[];
  assignmentRules?: {
    strategies?: string[];
  };
}
