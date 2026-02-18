"use client";

import { useSession } from "next-auth/react";
import type { Role } from "@/types";

interface RoleGateProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
