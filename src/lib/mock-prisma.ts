/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock Prisma Client - operates on in-memory mock data arrays
// Provides Prisma-like interface (findMany, findUnique, create, update, delete, count, etc.)

import {
  users, departments, reviewTemplates, reviewCycles, reviewAssignments,
  reviews, reviewResponses, reviewCategories, reviewCriteria,
  notifications, accessLogs,
} from "./mock-data";

// ─── Where clause matcher ───

function matchValue(itemVal: any, condition: any): boolean {
  if (condition === null || condition === undefined) {
    return itemVal === condition;
  }
  if (typeof condition === "object" && !Array.isArray(condition) && !(condition instanceof Date)) {
    // Prisma operators: in, not, contains, gte, lte, gt, lt
    if ("in" in condition) return (condition.in as any[]).includes(itemVal);
    if ("not" in condition) return !matchValue(itemVal, condition.not);
    if ("contains" in condition) {
      const s = String(itemVal ?? "").toLowerCase();
      return s.includes(String(condition.contains).toLowerCase());
    }
    if ("gte" in condition) return itemVal >= condition.gte;
    if ("lte" in condition) return itemVal <= condition.lte;
    if ("gt" in condition) return itemVal > condition.gt;
    if ("lt" in condition) return itemVal < condition.lt;
    return false;
  }
  if (condition instanceof Date && itemVal instanceof Date) {
    return itemVal.getTime() === condition.getTime();
  }
  return itemVal === condition;
}

function matchWhere(item: any, where: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    if (key === "OR") {
      const orConditions = where.OR as any[];
      if (!orConditions.some((cond: any) => matchWhere(item, cond))) return false;
      continue;
    }
    if (key === "AND") {
      const andConditions = where.AND as any[];
      if (!andConditions.every((cond: any) => matchWhere(item, cond))) return false;
      continue;
    }
    if (key === "NOT") {
      if (matchWhere(item, where.NOT)) return false;
      continue;
    }
    if (!matchValue(item[key], where[key])) return false;
  }
  return true;
}

// ─── Sort helper ───

function applyOrderBy(arr: any[], orderBy: any): any[] {
  if (!orderBy) return arr;
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...arr].sort((a, b) => {
    for (const o of orders) {
      for (const [key, dir] of Object.entries(o)) {
        const av = a[key], bv = b[key];
        if (av == null && bv == null) continue;
        if (av == null) return dir === "asc" ? -1 : 1;
        if (bv == null) return dir === "asc" ? 1 : -1;
        if (av < bv) return dir === "asc" ? -1 : 1;
        if (av > bv) return dir === "asc" ? 1 : -1;
      }
    }
    return 0;
  });
}

// ─── Mock model factory ───

let idCounter = 1000;
function genId() { return `mock-${Date.now()}-${idCounter++}`; }

function createMockModel(data: any[]) {
  return {
    findMany: async (args?: any) => {
      let result = data.filter(item => matchWhere(item, args?.where));
      result = applyOrderBy(result, args?.orderBy);
      if (args?.skip) result = result.slice(args.skip);
      if (args?.take) result = result.slice(0, args.take);
      // select: just return full objects (mock data already shaped)
      return result;
    },
    findUnique: async (args: any) => {
      return data.find(item => matchWhere(item, args?.where)) ?? null;
    },
    findFirst: async (args?: any) => {
      let result = data.filter(item => matchWhere(item, args?.where));
      result = applyOrderBy(result, args?.orderBy);
      return result[0] ?? null;
    },
    create: async (args: any) => {
      const newItem = {
        id: genId(),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      data.push(newItem);
      return newItem;
    },
    createMany: async (args: any) => {
      const items = (Array.isArray(args.data) ? args.data : [args.data]).map((d: any) => ({
        id: genId(),
        ...d,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      data.push(...items);
      return { count: items.length };
    },
    update: async (args: any) => {
      const idx = data.findIndex(item => matchWhere(item, args.where));
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...args.data, updatedAt: new Date() };
        return data[idx];
      }
      throw new Error("Record not found");
    },
    updateMany: async (args: any) => {
      let count = 0;
      data.forEach((item, idx) => {
        if (matchWhere(item, args.where)) {
          data[idx] = { ...item, ...args.data, updatedAt: new Date() };
          count++;
        }
      });
      return { count };
    },
    delete: async (args: any) => {
      const idx = data.findIndex(item => matchWhere(item, args.where));
      if (idx >= 0) return data.splice(idx, 1)[0];
      throw new Error("Record not found");
    },
    deleteMany: async (args?: any) => {
      let count = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (matchWhere(data[i], args?.where)) {
          data.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    count: async (args?: any) => {
      return data.filter(item => matchWhere(item, args?.where)).length;
    },
    upsert: async (args: any) => {
      const existing = data.find(item => matchWhere(item, args.where));
      if (existing) {
        const idx = data.indexOf(existing);
        data[idx] = { ...existing, ...args.update, updatedAt: new Date() };
        return data[idx];
      } else {
        const newItem = { id: genId(), ...args.create, createdAt: new Date(), updatedAt: new Date() };
        data.push(newItem);
        return newItem;
      }
    },
  };
}

// ─── Mock Prisma Client ───

export const mockPrisma = {
  user: createMockModel(users),
  department: createMockModel(departments),
  reviewTemplate: createMockModel(reviewTemplates),
  reviewCycle: createMockModel(reviewCycles),
  reviewAssignment: createMockModel(reviewAssignments),
  review: createMockModel(reviews),
  reviewResponse: createMockModel(reviewResponses),
  reviewCategory: createMockModel(reviewCategories),
  reviewCriterion: createMockModel(reviewCriteria),
  notification: createMockModel(notifications),
  accessLog: createMockModel(accessLogs),
  // Prisma transaction mock - just execute sequentially
  $transaction: async (operations: any) => {
    if (typeof operations === "function") {
      return operations(mockPrisma);
    }
    return Promise.all(operations);
  },
  $connect: async () => {},
  $disconnect: async () => {},
};

export default mockPrisma;
