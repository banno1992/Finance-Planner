import { db } from "./db";
import { 
  categories, snapshots, snapshotDetails, cashflows, settings,
  type Category, type Snapshot, type Cashflow,
  type InsertCategory, type InsertSnapshot, type InsertCashflow
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

  // Cashflows
  getCashflows(): Promise<Cashflow[]>;
  createCashflow(cashflow: any): Promise<Cashflow>;
  updateCashflow(id: number, cashflow: any): Promise<Cashflow>;
  deleteCashflow(id: number): Promise<void>;

  // Settings
  getSettings(): Promise<{ currency: string }>;
  updateSettings(currency: string): Promise<{ currency: string }>;
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
    return s;
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
}

export const storage = new DatabaseStorage();
