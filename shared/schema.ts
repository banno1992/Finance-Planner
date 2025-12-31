import { pgTable, text, serial, numeric, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Categories for assets/debts
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
});

// Settings (currency, etc.)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  currency: text("currency").default("USD"),
});

// Monthly net worth entries
export const snapshots = pgTable("snapshots", {
  id: serial("id").primaryKey(),
  month: date("month").notNull(), // Stores YYYY-MM-01
  totalNetWorth: numeric("total_net_worth").notNull(),
});

// Breakdown of values per category for a specific snapshot
export const snapshotDetails = pgTable("snapshot_details", {
  id: serial("id").primaryKey(),
  snapshotId: serial("snapshot_id").references(() => snapshots.id),
  categoryId: serial("category_id").references(() => categories.id),
  balance: numeric("balance").notNull(),
});

// Cashflow settings (Income/Expenses)
export const cashflows = pgTable("cashflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
});

// Student loans
export const studentLoans = pgTable("student_loans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  loanAmount: numeric("loan_amount").notNull(),
  annualInterestRate: numeric("annual_interest_rate").notNull(),
  monthlyPayment: numeric("monthly_payment").notNull(),
});

// Mortgages
export const mortgages = pgTable("mortgages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  loanAmount: numeric("loan_amount").notNull(),
  annualInterestRate: numeric("annual_interest_rate").notNull(),
  monthlyPayment: numeric("monthly_payment").notNull(),
  overpayment: numeric("overpayment").default("0"),
  propertyValue: numeric("property_value").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertSnapshotSchema = createInsertSchema(snapshots).omit({ id: true });
export const insertSnapshotDetailSchema = createInsertSchema(snapshotDetails).omit({ id: true });
export const insertCashflowSchema = createInsertSchema(cashflows).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export const insertStudentLoanSchema = createInsertSchema(studentLoans).omit({ id: true });
export const insertMortgageSchema = createInsertSchema(mortgages).omit({ id: true });

export type Category = typeof categories.$inferSelect;
export type Snapshot = typeof snapshots.$inferSelect;
export type SnapshotDetail = typeof snapshotDetails.$inferSelect;
export type Cashflow = typeof cashflows.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type StudentLoan = typeof studentLoans.$inferSelect;
export type Mortgage = typeof mortgages.$inferSelect;
