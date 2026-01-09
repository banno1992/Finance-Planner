import { db } from "./db";
import { 
  categories, snapshots, snapshotDetails, cashflows, settings, studentLoans, mortgages, pensions,
  type Category, type Snapshot, type Cashflow, type StudentLoan, type Mortgage, type Pension,
  type InsertCategory, type InsertSnapshot, type InsertCashflow,
  type InsertSnapshotDetail, type InsertStudentLoan, type InsertMortgage, type InsertPension
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: any): Promise<Category>;
  reorderCategories(order: Array<{ id: number; displayOrder: number }>): Promise<Category[]>;
  deleteCategory(id: number): Promise<void>;

  // Snapshots
  getSnapshots(): Promise<any[]>;
  createSnapshot(snapshot: any, balances: Record<string, string>): Promise<any>;
  updateSnapshot(id: number, balances: Record<string, string>): Promise<any>;
  deleteSnapshot(id: number): Promise<void>;

  // Cashflows
  getCashflows(): Promise<Cashflow[]>;
  createCashflow(cashflow: any): Promise<Cashflow>;
  updateCashflow(id: number, cashflow: any): Promise<Cashflow>;
  deleteCashflow(id: number): Promise<void>;

  // Settings
  getSettings(): Promise<{ currency: string }>;
  updateSettings(currency: string): Promise<{ currency: string }>;

  // Student Loans
  getStudentLoans(): Promise<StudentLoan[]>;
  createStudentLoan(loan: any): Promise<StudentLoan>;
  updateStudentLoan(id: number, loan: any): Promise<StudentLoan>;
  deleteStudentLoan(id: number): Promise<void>;

  // Mortgages
  getMortgages(): Promise<Mortgage[]>;
  createMortgage(mortgage: any): Promise<Mortgage>;
  updateMortgage(id: number, mortgage: any): Promise<Mortgage>;
  deleteMortgage(id: number): Promise<void>;

  // Pensions
  getPensions(): Promise<Pension[]>;
  createPension(pension: any): Promise<Pension>;
  updatePension(id: number, pension: any): Promise<Pension>;
  deletePension(id: number): Promise<void>;

  // Bulk Data
  importData(data: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    const cats = await db.select().from(categories).orderBy(categories.displayOrder);
    return cats;
  }

  async createCategory(category: any): Promise<Category> {
    const maxOrder = await db.select({ max: categories.displayOrder }).from(categories);
    const nextOrder = (maxOrder[0]?.max ?? 0) + 1;
    const [inserted] = await db.insert(categories).values({ ...category, displayOrder: nextOrder }).returning();
    return inserted;
  }

  async reorderCategories(order: Array<{ id: number; displayOrder: number }>): Promise<Category[]> {
    for (const item of order) {
      await db.update(categories).set({ displayOrder: item.displayOrder }).where(eq(categories.id, item.id));
    }
    return await this.getCategories();
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getSnapshots(): Promise<any[]> {
    const allSnapshots = await db.select().from(snapshots).orderBy(desc(snapshots.month));
    const results = [];
    for (const s of allSnapshots) {
      const details = await db.select().from(snapshotDetails).where(eq(snapshotDetails.snapshotId, s.id));
      results.push({ ...s, details });
    }
    return results;
  }

  async createSnapshot(snapshot: any, balances: Record<string, string>): Promise<any> {
    const [s] = await db.insert(snapshots).values(snapshot).returning();
    for (const [catId, balance] of Object.entries(balances)) {
      await db.insert(snapshotDetails).values({
        snapshotId: s.id,
        categoryId: parseInt(catId),
        balance: balance
      });
    }
    const details = await db.select().from(snapshotDetails).where(eq(snapshotDetails.snapshotId, s.id));
    return { ...s, details };
  }

  async updateSnapshot(id: number, balances: Record<string, string>): Promise<any> {
    // Delete old details
    await db.delete(snapshotDetails).where(eq(snapshotDetails.snapshotId, id));
    
    // Calculate new total
    let total = 0;
    Object.values(balances).forEach(val => total += parseFloat(val as string));
    
    // Update snapshot total
    await db.update(snapshots).set({ totalNetWorth: total.toString() }).where(eq(snapshots.id, id));
    
    // Insert new details
    for (const [catId, balance] of Object.entries(balances)) {
      await db.insert(snapshotDetails).values({
        snapshotId: id,
        categoryId: parseInt(catId),
        balance: balance
      });
    }
    
    const s = await db.select().from(snapshots).where(eq(snapshots.id, id));
    const details = await db.select().from(snapshotDetails).where(eq(snapshotDetails.snapshotId, id));
    return { ...s[0], details };
  }

  async deleteSnapshot(id: number): Promise<void> {
    await db.delete(snapshotDetails).where(eq(snapshotDetails.snapshotId, id));
    await db.delete(snapshots).where(eq(snapshots.id, id));
  }

  async getCashflows(): Promise<Cashflow[]> {
    return await db.select().from(cashflows);
  }

  async createCashflow(cashflow: any): Promise<Cashflow> {
    const [inserted] = await db.insert(cashflows).values(cashflow).returning();
    return inserted;
  }

  async updateCashflow(id: number, updates: any): Promise<Cashflow> {
    const [updated] = await db.update(cashflows).set(updates).where(eq(cashflows.id, id)).returning();
    return updated;
  }

  async deleteCashflow(id: number): Promise<void> {
    await db.delete(cashflows).where(eq(cashflows.id, id));
  }

  async getSettings(): Promise<{ currency: string }> {
    const result = await db.select({ currency: settings.currency }).from(settings).limit(1);
    return result[0] || { currency: "USD" };
  }

  async updateSettings(currency: string): Promise<{ currency: string }> {
    const existing = await db.select().from(settings).limit(1);
    if (existing.length === 0) {
      await db.insert(settings).values({ currency });
    } else {
      await db.update(settings).set({ currency }).where(eq(settings.id, existing[0].id));
    }
    return { currency };
  }

  async getStudentLoans(): Promise<StudentLoan[]> {
    return await db.select().from(studentLoans);
  }

  async createStudentLoan(loan: any): Promise<StudentLoan> {
    const [inserted] = await db.insert(studentLoans).values(loan).returning();
    return inserted;
  }

  async updateStudentLoan(id: number, updates: any): Promise<StudentLoan> {
    const [updated] = await db.update(studentLoans).set(updates).where(eq(studentLoans.id, id)).returning();
    return updated;
  }

  async deleteStudentLoan(id: number): Promise<void> {
    await db.delete(studentLoans).where(eq(studentLoans.id, id));
  }

  async getMortgages(): Promise<Mortgage[]> {
    return await db.select().from(mortgages);
  }

  async createMortgage(mortgage: any): Promise<Mortgage> {
    const [inserted] = await db.insert(mortgages).values(mortgage).returning();
    return inserted;
  }

  async updateMortgage(id: number, updates: any): Promise<Mortgage> {
    const [updated] = await db.update(mortgages).set(updates).where(eq(mortgages.id, id)).returning();
    return updated;
  }

  async deleteMortgage(id: number): Promise<void> {
    await db.delete(mortgages).where(eq(mortgages.id, id));
  }

  async getPensions(): Promise<Pension[]> {
    return await db.select().from(pensions);
  }

  async createPension(pension: any): Promise<Pension> {
    const [inserted] = await db.insert(pensions).values(pension).returning();
    return inserted;
  }

  async updatePension(id: number, updates: any): Promise<Pension> {
    const [updated] = await db.update(pensions).set(updates).where(eq(pensions.id, id)).returning();
    return updated;
  }

  async deletePension(id: number): Promise<void> {
    await db.delete(pensions).where(eq(pensions.id, id));
  }

  async importData(data: any): Promise<void> {
    await db.transaction(async (tx) => {
      // Clear existing data
      await tx.delete(snapshotDetails);
      await tx.delete(snapshots);
      await tx.delete(categories);
      await tx.delete(cashflows);
      await tx.delete(studentLoans);
      await tx.delete(mortgages);
      await tx.delete(pensions);

      // Re-import categories
      if (data.categories?.length) {
        await tx.insert(categories).values(data.categories as InsertCategory[]);
      }

      // Re-import snapshots and details
      if (data.snapshots?.length) {
        for (const snap of data.snapshots) {
          const { details, ...snapData } = snap;
          const [insertedSnap] = await tx.insert(snapshots).values(snapData as InsertSnapshot).returning();
          if (details?.length) {
            const detailsWithSnapId = details.map((d: any) => ({ ...d, snapshotId: insertedSnap.id }));
            await tx.insert(snapshotDetails).values(detailsWithSnapId as InsertSnapshotDetail[]);
          }
        }
      }

      // Re-import other entities
      if (data.cashflows?.length) await tx.insert(cashflows).values(data.cashflows as InsertCashflow[]);
      if (data.studentLoans?.length) await tx.insert(studentLoans).values(data.studentLoans as InsertStudentLoan[]);
      if (data.mortgages?.length) await tx.insert(mortgages).values(data.mortgages as InsertMortgage[]);
      if (data.pensions?.length) await tx.insert(pensions).values(data.pensions as InsertPension[]);
    });
  }
}

export const storage = new DatabaseStorage();
