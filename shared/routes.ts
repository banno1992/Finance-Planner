import { z } from "zod";
import { 
  insertCategorySchema, 
  insertSnapshotSchema, 
  insertCashflowSchema,
  insertStudentLoanSchema,
  insertMortgageSchema,
  insertPensionSchema,
  categories,
  snapshots,
  cashflows,
  studentLoans,
  mortgages,
  pensions
} from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
};

export const api = {
  categories: {
    list: {
      method: "GET" as const,
      path: "/api/categories",
      responses: { 200: z.array(z.custom<typeof categories.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/categories",
      input: insertCategorySchema,
      responses: { 201: z.custom<typeof categories.$inferSelect>() },
    },
    reorder: {
      method: "PATCH" as const,
      path: "/api/categories/reorder",
      input: z.array(z.object({ id: z.number(), displayOrder: z.number() })),
      responses: { 200: z.array(z.custom<typeof categories.$inferSelect>()) },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/categories/:id",
      responses: { 204: z.void() },
    },
  },
  settings: {
    get: {
      method: "GET" as const,
      path: "/api/settings",
      responses: { 200: z.object({ currency: z.string() }) },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/settings",
      input: z.object({ currency: z.string() }),
      responses: { 200: z.object({ currency: z.string() }) },
    },
  },
  snapshots: {
    list: {
      method: "GET" as const,
      path: "/api/snapshots",
      responses: { 200: z.array(z.any()) }, // Returns snapshots with details
    },
    create: {
      method: "POST" as const,
      path: "/api/snapshots",
      input: z.object({
        month: z.string(),
        balances: z.record(z.string(), z.string()), // categoryId -> balance
      }),
      responses: { 201: z.any() },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/snapshots/:id",
      input: z.object({
        balances: z.record(z.string(), z.string()),
      }),
      responses: { 200: z.any() },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/snapshots/:id",
      responses: { 204: z.void() },
    },
  },
  cashflows: {
    list: {
      method: "GET" as const,
      path: "/api/cashflows",
      responses: { 200: z.array(z.custom<typeof cashflows.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/cashflows",
      input: insertCashflowSchema,
      responses: { 201: z.custom<typeof cashflows.$inferSelect>() },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/cashflows/:id",
      input: insertCashflowSchema.partial(),
      responses: { 200: z.custom<typeof cashflows.$inferSelect>() },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/cashflows/:id",
      responses: { 204: z.void() },
    },
  },
  studentLoans: {
    list: {
      method: "GET" as const,
      path: "/api/student-loans",
      responses: { 200: z.array(z.custom<typeof studentLoans.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/student-loans",
      input: insertStudentLoanSchema,
      responses: { 201: z.custom<typeof studentLoans.$inferSelect>() },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/student-loans/:id",
      input: insertStudentLoanSchema.partial(),
      responses: { 200: z.custom<typeof studentLoans.$inferSelect>() },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/student-loans/:id",
      responses: { 204: z.void() },
    },
  },
  mortgages: {
    list: {
      method: "GET" as const,
      path: "/api/mortgages",
      responses: { 200: z.array(z.custom<typeof mortgages.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/mortgages",
      input: insertMortgageSchema,
      responses: { 201: z.custom<typeof mortgages.$inferSelect>() },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/mortgages/:id",
      input: insertMortgageSchema.partial(),
      responses: { 200: z.custom<typeof mortgages.$inferSelect>() },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/mortgages/:id",
      responses: { 204: z.void() },
    },
  },
  pensions: {
    list: {
      method: "GET" as const,
      path: "/api/pensions",
      responses: { 200: z.array(z.custom<typeof pensions.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/pensions",
      input: insertPensionSchema,
      responses: { 201: z.custom<typeof pensions.$inferSelect>() },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/pensions/:id",
      input: insertPensionSchema.partial(),
      responses: { 200: z.custom<typeof pensions.$inferSelect>() },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/pensions/:id",
      responses: { 204: z.void() },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
