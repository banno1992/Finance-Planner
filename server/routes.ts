import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.categories.list.path, async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.post(api.categories.create.path, async (req, res) => {
    const category = await storage.createCategory(req.body);
    res.status(201).json(category);
  });

  app.delete(api.categories.delete.path, async (req, res) => {
    await storage.deleteCategory(parseInt(req.params.id));
    res.status(204).end();
  });

  app.get(api.snapshots.list.path, async (_req, res) => {
    const snapshots = await storage.getSnapshots();
    res.json(snapshots);
  });

  app.post(api.snapshots.create.path, async (req, res) => {
    const { month, balances } = req.body;
    let total = 0;
    Object.values(balances).forEach(val => total += parseFloat(val as string));
    
    const snapshot = await storage.createSnapshot({ 
      month: month, 
      totalNetWorth: total.toString() 
    }, balances);
    res.status(201).json(snapshot);
  });

  app.get(api.cashflows.list.path, async (_req, res) => {
    const flows = await storage.getCashflows();
    res.json(flows);
  });

  app.post(api.cashflows.create.path, async (req, res) => {
    const flow = await storage.createCashflow(req.body);
    res.status(201).json(flow);
  });

  app.delete(api.cashflows.delete.path, async (req, res) => {
    await storage.deleteCashflow(parseInt(req.params.id));
    res.status(204).end();
  });

  return httpServer;
}
