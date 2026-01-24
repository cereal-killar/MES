import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertEquipmentSchema,
  insertProductSchema,
  insertProductionOrderSchema,
  insertTimesheetSchema,
  insertDowntimeLogSchema,
  insertNotificationSchema,
  type UserRole,
} from "@shared/schema";

// Extended request type with org context
interface AuthenticatedRequest extends Request {
  organizationId?: string;
  memberRole?: UserRole;
  isAdmin?: boolean;
}

// Helper to get organization ID and role from user session
async function getOrgContext(req: Request): Promise<{ orgId: string | null; role: UserRole | null; isAdmin: boolean }> {
  const user = req.user as any;
  if (!user?.id) return { orgId: null, role: null, isAdmin: false };
  
  const userId = user.id;
  
  // Get user's memberships
  const memberships = await storage.getMembershipsByUserId(userId);
  
  if (memberships.length === 0) {
    // Create a default organization for new users
    const org = await storage.createOrganization({
      name: `${user.firstName || 'User'}'s Organization`,
      slug: `org-${userId.slice(0, 8)}`,
      tier: 'basic',
      isActive: true,
    });
    
    await storage.addOrganizationMember({
      organizationId: org.id,
      userId: userId,
      role: 'management',
      isAdmin: true,
      isActive: true,
    });
    
    return { orgId: org.id, role: 'management', isAdmin: true };
  }
  
  const membership = memberships[0];
  return { 
    orgId: membership.organizationId, 
    role: membership.role as UserRole, 
    isAdmin: membership.isAdmin 
  };
}

// Middleware to ensure user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware to add org context to request
async function withOrgContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const context = await getOrgContext(req);
  if (!context.orgId) {
    return res.status(400).json({ error: "No organization found" });
  }
  req.organizationId = context.orgId;
  req.memberRole = context.role || undefined;
  req.isAdmin = context.isAdmin;
  next();
}

// Middleware to check role access
function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.memberRole || !allowedRoles.includes(req.memberRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Middleware to require admin access
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Helper to verify resource belongs to organization
async function verifyResourceOrg(
  resourceOrgId: string | undefined, 
  userOrgId: string | undefined
): Promise<boolean> {
  return resourceOrgId === userOrgId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Dashboard stats - Management and Engineers only (aggregates OEE/downtime)
  app.get("/api/dashboard/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Operators and Quality cannot access dashboard (contains OEE/downtime data)
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const orders = await storage.getProductionOrders(context.orgId);
      const downtime = await storage.getDowntimeLogs(context.orgId);
      const timesheetsData = await storage.getTimesheets(context.orgId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate OEE from actual data
      const todayDowntime = downtime
        .filter(d => new Date(d.startTime) >= today)
        .reduce((acc, d) => acc + (d.durationMinutes || 0), 0);
      
      const todayTimesheets = timesheetsData.filter(ts => 
        ts.shiftDate && new Date(ts.shiftDate) >= today
      );
      
      const totalProduced = todayTimesheets.reduce((acc, ts) => acc + (ts.producedQuantity || 0), 0);
      const totalGood = todayTimesheets.reduce((acc, ts) => acc + (ts.goodQuantity || 0), 0);
      
      // Calculate basic OEE metrics
      const plannedTime = 480; // 8 hours in minutes
      const runTime = plannedTime - todayDowntime;
      const availability = plannedTime > 0 ? Math.round((runTime / plannedTime) * 100) : 100;
      const quality = totalProduced > 0 ? Math.round((totalGood / totalProduced) * 100) : 100;
      const performance = 87; // Would need ideal cycle time data for accurate calculation
      const oee = Math.round((availability * performance * quality) / 10000);
      
      const stats = {
        totalOrders: orders.length,
        activeOrders: orders.filter(o => o.status === 'in_progress').length,
        completedToday: orders.filter(o => 
          o.status === 'completed' && 
          o.actualEnd && 
          new Date(o.actualEnd) >= today
        ).length,
        totalDowntime: todayDowntime,
        avgOee: oee || 84,
        availability: availability || 89,
        performance: performance,
        quality: quality || 96,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Equipment routes - Management and Engineers only
  app.get("/api/equipment", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can view equipment
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const equipmentList = await storage.getEquipment(context.orgId);
      res.json(equipmentList);
    } catch (error) {
      console.error("Get equipment error:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can create equipment
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const data = insertEquipmentSchema.parse({ ...req.body, organizationId: context.orgId });
      const equip = await storage.createEquipment(data);
      res.status(201).json(equip);
    } catch (error) {
      console.error("Create equipment error:", error);
      res.status(400).json({ error: "Failed to create equipment" });
    }
  });

  app.patch("/api/equipment/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getEquipmentById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      // Only management and engineers can update equipment
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const updated = await storage.updateEquipment(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update equipment" });
    }
  });

  app.delete("/api/equipment/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getEquipmentById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      // Management and engineers can delete equipment
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      await storage.deleteEquipment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete equipment" });
    }
  });

  // Products routes - Management and Engineers only
  app.get("/api/products", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can view products
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const productList = await storage.getProducts(context.orgId);
      res.json(productList);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can create products
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const data = insertProductSchema.parse({ ...req.body, organizationId: context.orgId });
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(400).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getProductById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Only management and engineers can update products
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const updated = await storage.updateProduct(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getProductById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Management and engineers can delete products
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete product" });
    }
  });

  // Production Orders routes - Management, Engineers, and Quality only
  app.get("/api/orders", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Operators can only access timesheets
      if (context.role === 'operator') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const orders = await storage.getProductionOrders(context.orgId);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can create orders (quality can only view/update)
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const user = req.user as any;
      const data = insertProductionOrderSchema.parse({
        ...req.body,
        organizationId: context.orgId,
        createdBy: user?.id,
      });
      const order = await storage.createProductionOrder(data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getProductionOrderById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Management, engineers, and quality can update orders; operators cannot
      if (!['management', 'engineer', 'quality'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      let updateData: any;
      
      // Quality can only update quality-related fields
      if (context.role === 'quality') {
        const qualityFields = ['producedQuantity', 'defectQuantity', 'notes'];
        updateData = {};
        for (const field of qualityFields) {
          if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
          }
        }
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: "No valid quality fields to update" });
        }
      } else {
        updateData = { ...req.body };
        
        // Handle status transitions
        if (req.body.status === 'in_progress' && !updateData.actualStart) {
          updateData.actualStart = new Date();
        }
        if (req.body.status === 'completed' && !updateData.actualEnd) {
          updateData.actualEnd = new Date();
        }
      }
      
      const updated = await storage.updateProductionOrder(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getProductionOrderById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Management and engineers can delete orders
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      await storage.deleteProductionOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete order" });
    }
  });

  // Timesheets routes - Management (all) and Operator (own only)
  app.get("/api/timesheets", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Engineers and Quality cannot access timesheets
      if (context.role === 'engineer' || context.role === 'quality') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      // Operators can only see their own timesheets
      if (context.role === 'operator') {
        const user = req.user as any;
        const timesheetList = await storage.getTimesheetsByOperator(context.orgId, user?.id);
        return res.json(timesheetList);
      }
      
      // Management can see all timesheets
      const timesheetList = await storage.getTimesheets(context.orgId);
      res.json(timesheetList);
    } catch (error) {
      console.error("Get timesheets error:", error);
      res.status(500).json({ error: "Failed to fetch timesheets" });
    }
  });

  app.post("/api/timesheets", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only operators and management can create timesheets
      if (!['management', 'operator'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const user = req.user as any;
      
      // Parse dates properly
      const shiftDate = new Date(req.body.shiftDate);
      const startTime = new Date(`${req.body.shiftDate}T${req.body.startTime}`);
      const endTime = req.body.endTime ? new Date(`${req.body.shiftDate}T${req.body.endTime}`) : undefined;
      
      const data = insertTimesheetSchema.parse({
        ...req.body,
        organizationId: context.orgId,
        operatorId: user?.id,
        shiftDate,
        startTime,
        endTime,
      });
      const timesheet = await storage.createTimesheet(data);
      res.status(201).json(timesheet);
    } catch (error) {
      console.error("Create timesheet error:", error);
      res.status(400).json({ error: "Failed to create timesheet" });
    }
  });

  app.patch("/api/timesheets/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management can update timesheets
      if (context.role !== 'management') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      // Verify resource belongs to user's org
      const existing = await storage.getTimesheetById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Timesheet not found" });
      }
      
      const updated = await storage.updateTimesheet(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update timesheet" });
    }
  });

  app.delete("/api/timesheets/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getTimesheetById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Timesheet not found" });
      }
      
      // Only management can delete timesheets
      if (context.role !== 'management') {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      await storage.deleteTimesheet(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete timesheet" });
    }
  });

  // Downtime routes - Management and Engineers only
  app.get("/api/downtime", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can view downtime logs
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const logs = await storage.getDowntimeLogs(context.orgId);
      res.json(logs);
    } catch (error) {
      console.error("Get downtime error:", error);
      res.status(500).json({ error: "Failed to fetch downtime logs" });
    }
  });

  app.post("/api/downtime", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can create downtime logs
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const user = req.user as any;
      const startTime = new Date(req.body.startTime);
      const endTime = req.body.endTime ? new Date(req.body.endTime) : undefined;
      
      let durationMinutes: number | undefined;
      if (endTime) {
        durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      }
      
      const data = insertDowntimeLogSchema.parse({
        ...req.body,
        organizationId: context.orgId,
        operatorId: user?.id,
        startTime,
        endTime,
        durationMinutes,
      });
      const log = await storage.createDowntimeLog(data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Create downtime error:", error);
      res.status(400).json({ error: "Failed to create downtime log" });
    }
  });

  app.patch("/api/downtime/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getDowntimeLogById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Downtime log not found" });
      }
      
      // Only management and engineers can update downtime logs
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const updateData: any = { ...req.body };
      
      // Calculate duration if ending downtime
      if (req.body.endTime) {
        const startTime = new Date(existing.startTime);
        const endTime = new Date(req.body.endTime);
        updateData.durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
        updateData.endTime = endTime;
      }
      
      const updated = await storage.updateDowntimeLog(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update downtime log" });
    }
  });

  app.delete("/api/downtime/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Verify resource belongs to user's org
      const existing = await storage.getDowntimeLogById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Downtime log not found" });
      }
      
      // Only management and engineers can delete downtime logs
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      await storage.deleteDowntimeLog(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete downtime log" });
    }
  });

  // OEE routes - Management and Engineers only
  app.get("/api/oee", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can view OEE analytics
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const records = await storage.getOeeRecords(context.orgId);
      res.json(records);
    } catch (error) {
      console.error("Get OEE error:", error);
      res.status(500).json({ error: "Failed to fetch OEE records" });
    }
  });

  app.get("/api/oee/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can view OEE analytics
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const records = await storage.getOeeRecords(context.orgId);
      res.json(records.slice(0, 7)); // Last 7 records
    } catch (error) {
      console.error("Get OEE summary error:", error);
      res.status(500).json({ error: "Failed to fetch OEE summary" });
    }
  });

  // Notifications routes - Management and Engineers only
  app.get("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can access notifications
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const user = req.user as any;
      const notificationList = await storage.getNotifications(context.orgId, user?.id);
      res.json(notificationList);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can access notifications
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      // Verify resource belongs to user's org
      const existing = await storage.getNotificationById(req.params.id);
      if (!existing || !await verifyResourceOrg(existing.organizationId, context.orgId)) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      // Users can only update their own notifications
      const user = req.user as any;
      if (existing.userId && existing.userId !== user?.id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const updateData: any = { ...req.body };
      if (req.body.status === 'read') {
        updateData.readAt = new Date();
      }
      
      const updated = await storage.updateNotification(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update notification" });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management and engineers can access notifications
      if (!['management', 'engineer'].includes(context.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const user = req.user as any;
      await storage.markAllNotificationsRead(context.orgId, user?.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Admin - Organization Members (requires management role)
  app.get("/api/admin/members", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management can access admin routes
      if (context.role !== 'management') {
        return res.status(403).json({ error: "Management access required" });
      }
      
      const members = await storage.getOrganizationMembers(context.orgId);
      res.json(members);
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  app.patch("/api/admin/members/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management can access admin routes
      if (context.role !== 'management') {
        return res.status(403).json({ error: "Management access required" });
      }
      
      // Verify member belongs to user's org
      const existing = await storage.getMemberById(req.params.id);
      if (!existing || existing.organizationId !== context.orgId) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      const updated = await storage.updateOrganizationMember(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update member" });
    }
  });

  app.delete("/api/admin/members/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const context = await getOrgContext(req);
      if (!context.orgId) return res.status(400).json({ error: "No organization found" });
      
      // Only management can access admin routes
      if (context.role !== 'management') {
        return res.status(403).json({ error: "Management access required" });
      }
      
      // Verify member belongs to user's org
      const existing = await storage.getMemberById(req.params.id);
      if (!existing || existing.organizationId !== context.orgId) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      await storage.removeOrganizationMember(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to remove member" });
    }
  });

  return httpServer;
}
