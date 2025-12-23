import { db } from "./db";
import { 
  categories, snapshots, snapshotDetails, cashflows,
  type Category, type Snapshot, type Cashflow,
  type InsertCategory, type InsertSnapshot, type InsertCashflow
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: any): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Snapshots
  getSnapshots(): Promise<any[]>;
  createSnapshot(snapshot: any, balances: Record<string, string>): Promise<any>;

  // Cashflows
  getCashflows(): Promise<Cashflow[]>;
  createCashflow(cashflow: any): Promise<Cashflow>;
  deleteCashflow(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: any): Promise<Category> {
    const [inserted] = await db.insert(categories).values(category).returning();
    return inserted;
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
    return s;
  }

  async getCashflows(): Promise<Cashflow[]> {
    return await db.select().from(cashflows);
  }

  async createCashflow(cashflow: any): Promise<Cashflow> {
    const [inserted] = await db.insert(cashflows).values(cashflow).returning();
    return inserted;
  }

  async deleteCashflow(id: number): Promise<void> {
    await db.delete(cashflows).where(eq(cashflows.id, id));
  }
}

export const storage = new DatabaseStorage();
