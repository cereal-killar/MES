import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth schema
export * from "./models/auth";

// Enums
export const userRoleEnum = pgEnum("user_role", ["management", "engineer", "quality", "operator"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "in_progress", "completed", "on_hold", "cancelled"]);
export const downtimeReasonEnum = pgEnum("downtime_reason", [
  "planned_maintenance",
  "unplanned_breakdown",
  "changeover",
  "material_shortage",
  "quality_issue",
  "operator_break",
  "waiting_for_approval",
  "other"
]);
export const notificationTypeEnum = pgEnum("notification_type", ["info", "warning", "critical", "success"]);
export const notificationStatusEnum = pgEnum("notification_status", ["unread", "read", "dismissed"]);

// Organizations (Tenants) - for multi-tenancy
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  tier: varchar("tier", { length: 50 }).notNull().default("basic"), // basic, professional, enterprise
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Members - links users to organizations with roles
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  role: userRoleEnum("role").notNull().default("operator"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("org_member_org_idx").on(table.organizationId),
  index("org_member_user_idx").on(table.userId),
]);

// Equipment/Machines
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  plannedCycleTime: decimal("planned_cycle_time", { precision: 10, scale: 2 }), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("equipment_org_idx").on(table.organizationId),
]);

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  description: text("description"),
  standardCycleTime: decimal("standard_cycle_time", { precision: 10, scale: 2 }), // in seconds per unit
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("products_org_idx").on(table.organizationId),
]);

// Production Orders
export const productionOrders = pgTable("production_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  productId: varchar("product_id").references(() => products.id),
  equipmentId: varchar("equipment_id").references(() => equipment.id),
  targetQuantity: integer("target_quantity").notNull(),
  producedQuantity: integer("produced_quantity").notNull().default(0),
  goodQuantity: integer("good_quantity").notNull().default(0),
  rejectedQuantity: integer("rejected_quantity").notNull().default(0),
  status: orderStatusEnum("status").notNull().default("pending"),
  priority: integer("priority").notNull().default(1), // 1=low, 2=medium, 3=high
  plannedStart: timestamp("planned_start"),
  plannedEnd: timestamp("planned_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("orders_org_idx").on(table.organizationId),
  index("orders_status_idx").on(table.status),
]);

// Timesheets (Manual time capture)
export const timesheets = pgTable("timesheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  productionOrderId: varchar("production_order_id").references(() => productionOrders.id, { onDelete: "cascade" }),
  equipmentId: varchar("equipment_id").references(() => equipment.id),
  operatorId: varchar("operator_id").notNull(),
  shiftDate: timestamp("shift_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  breakDuration: integer("break_duration").default(0), // in minutes
  producedQuantity: integer("produced_quantity").default(0),
  goodQuantity: integer("good_quantity").default(0),
  rejectedQuantity: integer("rejected_quantity").default(0),
  notes: text("notes"),
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("timesheets_org_idx").on(table.organizationId),
  index("timesheets_operator_idx").on(table.operatorId),
  index("timesheets_order_idx").on(table.productionOrderId),
]);

// Downtime Logs
export const downtimeLogs = pgTable("downtime_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  productionOrderId: varchar("production_order_id").references(() => productionOrders.id),
  equipmentId: varchar("equipment_id").references(() => equipment.id),
  operatorId: varchar("operator_id").notNull(),
  reason: downtimeReasonEnum("reason").notNull(),
  customReason: text("custom_reason"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  isPlanned: boolean("is_planned").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("downtime_org_idx").on(table.organizationId),
  index("downtime_equipment_idx").on(table.equipmentId),
]);

// OEE Records (Calculated metrics)
export const oeeRecords = pgTable("oee_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  equipmentId: varchar("equipment_id").references(() => equipment.id),
  recordDate: timestamp("record_date").notNull(),
  shiftNumber: integer("shift_number").default(1),
  plannedProductionTime: decimal("planned_production_time", { precision: 10, scale: 2 }), // in minutes
  actualRunTime: decimal("actual_run_time", { precision: 10, scale: 2 }), // in minutes
  totalDowntime: decimal("total_downtime", { precision: 10, scale: 2 }), // in minutes
  idealCycleTime: decimal("ideal_cycle_time", { precision: 10, scale: 4 }), // in seconds per unit
  totalProduced: integer("total_produced").default(0),
  goodUnits: integer("good_units").default(0),
  defectUnits: integer("defect_units").default(0),
  availability: decimal("availability", { precision: 5, scale: 2 }), // percentage
  performance: decimal("performance", { precision: 5, scale: 2 }), // percentage
  quality: decimal("quality", { precision: 5, scale: 2 }), // percentage
  oee: decimal("oee", { precision: 5, scale: 2 }), // percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("oee_org_idx").on(table.organizationId),
  index("oee_equipment_idx").on(table.equipmentId),
  index("oee_date_idx").on(table.recordDate),
]);

// Notifications/Alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id"),
  type: notificationTypeEnum("type").notNull().default("info"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").notNull().default("unread"),
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // order, equipment, etc.
  relatedEntityId: varchar("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (table) => [
  index("notifications_org_idx").on(table.organizationId),
  index("notifications_user_idx").on(table.userId),
  index("notifications_status_idx").on(table.status),
]);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  equipment: many(equipment),
  products: many(products),
  productionOrders: many(productionOrders),
  timesheets: many(timesheets),
  downtimeLogs: many(downtimeLogs),
  oeeRecords: many(oeeRecords),
  notifications: many(notifications),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [equipment.organizationId],
    references: [organizations.id],
  }),
  productionOrders: many(productionOrders),
  timesheets: many(timesheets),
  downtimeLogs: many(downtimeLogs),
  oeeRecords: many(oeeRecords),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  productionOrders: many(productionOrders),
}));

export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [productionOrders.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [productionOrders.productId],
    references: [products.id],
  }),
  equipment: one(equipment, {
    fields: [productionOrders.equipmentId],
    references: [equipment.id],
  }),
  timesheets: many(timesheets),
  downtimeLogs: many(downtimeLogs),
}));

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  organization: one(organizations, {
    fields: [timesheets.organizationId],
    references: [organizations.id],
  }),
  productionOrder: one(productionOrders, {
    fields: [timesheets.productionOrderId],
    references: [productionOrders.id],
  }),
  equipment: one(equipment, {
    fields: [timesheets.equipmentId],
    references: [equipment.id],
  }),
}));

export const downtimeLogsRelations = relations(downtimeLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [downtimeLogs.organizationId],
    references: [organizations.id],
  }),
  productionOrder: one(productionOrders, {
    fields: [downtimeLogs.productionOrderId],
    references: [productionOrders.id],
  }),
  equipment: one(equipment, {
    fields: [downtimeLogs.equipmentId],
    references: [equipment.id],
  }),
}));

export const oeeRecordsRelations = relations(oeeRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [oeeRecords.organizationId],
    references: [organizations.id],
  }),
  equipment: one(equipment, {
    fields: [oeeRecords.equipmentId],
    references: [equipment.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}));

// Insert Schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductionOrderSchema = createInsertSchema(productionOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimesheetSchema = createInsertSchema(timesheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDowntimeLogSchema = createInsertSchema(downtimeLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOeeRecordSchema = createInsertSchema(oeeRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

// Types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;

export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type ProductionOrder = typeof productionOrders.$inferSelect;

export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheets.$inferSelect;

export type InsertDowntimeLog = z.infer<typeof insertDowntimeLogSchema>;
export type DowntimeLog = typeof downtimeLogs.$inferSelect;

export type InsertOeeRecord = z.infer<typeof insertOeeRecordSchema>;
export type OeeRecord = typeof oeeRecords.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// User Role Type
export type UserRole = "management" | "engineer" | "quality" | "operator";

// Helper types for frontend
export type OrderStatus = "pending" | "in_progress" | "completed" | "on_hold" | "cancelled";
export type DowntimeReason = "planned_maintenance" | "unplanned_breakdown" | "changeover" | "material_shortage" | "quality_issue" | "operator_break" | "waiting_for_approval" | "other";
export type NotificationType = "info" | "warning" | "critical" | "success";
export type NotificationStatus = "unread" | "read" | "dismissed";
