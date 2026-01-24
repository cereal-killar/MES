import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  organizations,
  organizationMembers,
  equipment,
  products,
  productionOrders,
  timesheets,
  downtimeLogs,
  oeeRecords,
  notifications,
  type Organization,
  type InsertOrganization,
  type OrganizationMember,
  type InsertOrganizationMember,
  type Equipment,
  type InsertEquipment,
  type Product,
  type InsertProduct,
  type ProductionOrder,
  type InsertProductionOrder,
  type Timesheet,
  type InsertTimesheet,
  type DowntimeLog,
  type InsertDowntimeLog,
  type OeeRecord,
  type InsertOeeRecord,
  type Notification,
  type InsertNotification,
} from "@shared/schema";

export interface IStorage {
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined>;

  // Organization Members
  getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]>;
  getMembershipsByUserId(userId: string): Promise<OrganizationMember[]>;
  getMemberByUserId(userId: string, organizationId: string): Promise<OrganizationMember | undefined>;
  getMemberById(id: string): Promise<OrganizationMember | undefined>;
  addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  updateOrganizationMember(id: string, data: Partial<InsertOrganizationMember>): Promise<OrganizationMember | undefined>;
  removeOrganizationMember(id: string): Promise<void>;

  // Equipment
  getEquipment(organizationId: string): Promise<Equipment[]>;
  getEquipmentById(id: string): Promise<Equipment | undefined>;
  createEquipment(equip: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, data: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<void>;

  // Products
  getProducts(organizationId: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Production Orders
  getProductionOrders(organizationId: string): Promise<ProductionOrder[]>;
  getProductionOrderById(id: string): Promise<ProductionOrder | undefined>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;
  updateProductionOrder(id: string, data: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined>;
  deleteProductionOrder(id: string): Promise<void>;

  // Timesheets
  getTimesheets(organizationId: string): Promise<Timesheet[]>;
  getTimesheetById(id: string): Promise<Timesheet | undefined>;
  getTimesheetsByOperator(organizationId: string, operatorId: string): Promise<Timesheet[]>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  updateTimesheet(id: string, data: Partial<InsertTimesheet>): Promise<Timesheet | undefined>;
  deleteTimesheet(id: string): Promise<void>;

  // Downtime Logs
  getDowntimeLogs(organizationId: string): Promise<DowntimeLog[]>;
  getDowntimeLogById(id: string): Promise<DowntimeLog | undefined>;
  createDowntimeLog(log: InsertDowntimeLog): Promise<DowntimeLog>;
  updateDowntimeLog(id: string, data: Partial<InsertDowntimeLog>): Promise<DowntimeLog | undefined>;
  deleteDowntimeLog(id: string): Promise<void>;

  // OEE Records
  getOeeRecords(organizationId: string): Promise<OeeRecord[]>;
  getOeeRecordById(id: string): Promise<OeeRecord | undefined>;
  createOeeRecord(record: InsertOeeRecord): Promise<OeeRecord>;
  updateOeeRecord(id: string, data: Partial<InsertOeeRecord>): Promise<OeeRecord | undefined>;

  // Notifications
  getNotifications(organizationId: string, userId?: string): Promise<Notification[]>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, data: Partial<InsertNotification>): Promise<Notification | undefined>;
  markAllNotificationsRead(organizationId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  async updateOrganization(id: string, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations).set({ ...data, updatedAt: new Date() }).where(eq(organizations.id, id)).returning();
    return updated;
  }

  // Organization Members
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    return db.select().from(organizationMembers).where(eq(organizationMembers.organizationId, organizationId));
  }

  async getMembershipsByUserId(userId: string): Promise<OrganizationMember[]> {
    return db.select().from(organizationMembers).where(eq(organizationMembers.userId, userId));
  }

  async getMemberByUserId(userId: string, organizationId: string): Promise<OrganizationMember | undefined> {
    const [member] = await db.select().from(organizationMembers).where(
      and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId))
    );
    return member;
  }

  async getMemberById(id: string): Promise<OrganizationMember | undefined> {
    const [member] = await db.select().from(organizationMembers).where(eq(organizationMembers.id, id));
    return member;
  }

  async addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember> {
    const [created] = await db.insert(organizationMembers).values(member).returning();
    return created;
  }

  async updateOrganizationMember(id: string, data: Partial<InsertOrganizationMember>): Promise<OrganizationMember | undefined> {
    const [updated] = await db.update(organizationMembers).set({ ...data, updatedAt: new Date() }).where(eq(organizationMembers.id, id)).returning();
    return updated;
  }

  async removeOrganizationMember(id: string): Promise<void> {
    await db.delete(organizationMembers).where(eq(organizationMembers.id, id));
  }

  // Equipment
  async getEquipment(organizationId: string): Promise<Equipment[]> {
    return db.select().from(equipment).where(eq(equipment.organizationId, organizationId)).orderBy(desc(equipment.createdAt));
  }

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    const [equip] = await db.select().from(equipment).where(eq(equipment.id, id));
    return equip;
  }

  async createEquipment(equip: InsertEquipment): Promise<Equipment> {
    const [created] = await db.insert(equipment).values(equip).returning();
    return created;
  }

  async updateEquipment(id: string, data: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const [updated] = await db.update(equipment).set({ ...data, updatedAt: new Date() }).where(eq(equipment.id, id)).returning();
    return updated;
  }

  async deleteEquipment(id: string): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  // Products
  async getProducts(organizationId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.organizationId, organizationId)).orderBy(desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Production Orders
  async getProductionOrders(organizationId: string): Promise<ProductionOrder[]> {
    return db.select().from(productionOrders).where(eq(productionOrders.organizationId, organizationId)).orderBy(desc(productionOrders.createdAt));
  }

  async getProductionOrderById(id: string): Promise<ProductionOrder | undefined> {
    const [order] = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return order;
  }

  async createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder> {
    const [created] = await db.insert(productionOrders).values(order).returning();
    return created;
  }

  async updateProductionOrder(id: string, data: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined> {
    const [updated] = await db.update(productionOrders).set({ ...data, updatedAt: new Date() }).where(eq(productionOrders.id, id)).returning();
    return updated;
  }

  async deleteProductionOrder(id: string): Promise<void> {
    await db.delete(productionOrders).where(eq(productionOrders.id, id));
  }

  // Timesheets
  async getTimesheets(organizationId: string): Promise<Timesheet[]> {
    return db.select().from(timesheets).where(eq(timesheets.organizationId, organizationId)).orderBy(desc(timesheets.createdAt));
  }

  async getTimesheetById(id: string): Promise<Timesheet | undefined> {
    const [ts] = await db.select().from(timesheets).where(eq(timesheets.id, id));
    return ts;
  }

  async getTimesheetsByOperator(organizationId: string, operatorId: string): Promise<Timesheet[]> {
    return db.select().from(timesheets)
      .where(and(eq(timesheets.organizationId, organizationId), eq(timesheets.operatorId, operatorId)))
      .orderBy(desc(timesheets.createdAt));
  }

  async createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet> {
    const [created] = await db.insert(timesheets).values(timesheet).returning();
    return created;
  }

  async updateTimesheet(id: string, data: Partial<InsertTimesheet>): Promise<Timesheet | undefined> {
    const [updated] = await db.update(timesheets).set({ ...data, updatedAt: new Date() }).where(eq(timesheets.id, id)).returning();
    return updated;
  }

  async deleteTimesheet(id: string): Promise<void> {
    await db.delete(timesheets).where(eq(timesheets.id, id));
  }

  // Downtime Logs
  async getDowntimeLogs(organizationId: string): Promise<DowntimeLog[]> {
    return db.select().from(downtimeLogs).where(eq(downtimeLogs.organizationId, organizationId)).orderBy(desc(downtimeLogs.createdAt));
  }

  async getDowntimeLogById(id: string): Promise<DowntimeLog | undefined> {
    const [log] = await db.select().from(downtimeLogs).where(eq(downtimeLogs.id, id));
    return log;
  }

  async createDowntimeLog(log: InsertDowntimeLog): Promise<DowntimeLog> {
    const [created] = await db.insert(downtimeLogs).values(log).returning();
    return created;
  }

  async updateDowntimeLog(id: string, data: Partial<InsertDowntimeLog>): Promise<DowntimeLog | undefined> {
    const [updated] = await db.update(downtimeLogs).set({ ...data, updatedAt: new Date() }).where(eq(downtimeLogs.id, id)).returning();
    return updated;
  }

  async deleteDowntimeLog(id: string): Promise<void> {
    await db.delete(downtimeLogs).where(eq(downtimeLogs.id, id));
  }

  // OEE Records
  async getOeeRecords(organizationId: string): Promise<OeeRecord[]> {
    return db.select().from(oeeRecords).where(eq(oeeRecords.organizationId, organizationId)).orderBy(desc(oeeRecords.recordDate));
  }

  async getOeeRecordById(id: string): Promise<OeeRecord | undefined> {
    const [record] = await db.select().from(oeeRecords).where(eq(oeeRecords.id, id));
    return record;
  }

  async createOeeRecord(record: InsertOeeRecord): Promise<OeeRecord> {
    const [created] = await db.insert(oeeRecords).values(record).returning();
    return created;
  }

  async updateOeeRecord(id: string, data: Partial<InsertOeeRecord>): Promise<OeeRecord | undefined> {
    const [updated] = await db.update(oeeRecords).set({ ...data, updatedAt: new Date() }).where(eq(oeeRecords.id, id)).returning();
    return updated;
  }

  // Notifications
  async getNotifications(organizationId: string, userId?: string): Promise<Notification[]> {
    if (userId) {
      return db.select().from(notifications)
        .where(and(eq(notifications.organizationId, organizationId), eq(notifications.userId, userId)))
        .orderBy(desc(notifications.createdAt));
    }
    return db.select().from(notifications).where(eq(notifications.organizationId, organizationId)).orderBy(desc(notifications.createdAt));
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async updateNotification(id: string, data: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsRead(organizationId: string, userId: string): Promise<void> {
    await db.update(notifications)
      .set({ status: "read", readAt: new Date() })
      .where(and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
        eq(notifications.status, "unread")
      ));
  }
}

export const storage = new DatabaseStorage();
