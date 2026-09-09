import { relations } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text, 
  integer, 
  timestamp, 
  boolean, 
  jsonb 
} from 'drizzle-orm/pg-core';

// Users table (Firebase Auth linked via uid)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('admin'), // admin, editor, studio
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Studios table
export const studios = pgTable('studios', {
  id: text('id').primaryKey(), // e.g. "studio-kk"
  name: text('name').notNull(),
  ownerName: text('owner_name'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  gstNumber: text('gst_number'),
  notes: text('notes'),
  logoUrl: text('logo_url'),
  upiId: text('upi_id'),
  tier: text('tier').default('standard'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Editors table
export const editors = pgTable('editors', {
  id: text('id').primaryKey(), // e.g. "editor-vansh"
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  photo: text('photo'),
  rating: text('rating').default('4.8'),
  joinedDate: text('joined_date'),
  notes: text('notes'),
  totalEarnings: integer('total_earnings').default(0),
  pendingPayments: integer('pending_payments').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects table (Main ERP core entity)
export const projects = pgTable('projects', {
  id: text('id').primaryKey(), // e.g. "PRJ-2026-001"
  projectName: text('project_name'),
  coupleName: text('couple_name').notNull(),
  brideName: text('bride_name'),
  groomName: text('groom_name'),
  clientPhone: text('client_phone'),
  clientEmail: text('client_email'),
  venue: text('venue'),
  couplePhoto: text('couple_photo'), // Image URL or Supabase/Storage URL
  studioId: text('studio_id').references(() => studios.id),
  studioName: text('studio_name'),
  eventType: text('event_type').notNull().default('Wedding Film'),
  shootDate: text('shoot_date'),
  deliveryDate: text('delivery_date'),
  assignedEditorId: text('assigned_editor_id').references(() => editors.id),
  assignedEditorName: text('assigned_editor_name'),
  isSplitProject: boolean('is_split_project').default(false),
  secondEditorId: text('second_editor_id'),
  secondEditorName: text('second_editor_name'),
  firstEditorShare: integer('first_editor_share').default(0),
  secondEditorShare: integer('second_editor_share').default(0),
  status: text('status').notNull().default('data_received'),
  priority: text('priority').notNull().default('medium'),
  tags: jsonb('tags').$type<string[]>(),
  projectAmount: integer('project_amount').default(0),
  editorPayment: integer('editor_payment').default(0),
  otherExpenses: integer('other_expenses').default(0),
  advancePayment: integer('advance_payment').default(0),
  paymentMode: text('payment_mode'),
  remainingBalance: integer('remaining_balance').default(0),
  paymentDueDate: text('payment_due_date'),
  notes: text('notes'),
  hardDiskName: text('hard_disk_name'),
  hardDriveNumber: text('hard_drive_number'),
  backupDriveNumber: text('backup_drive_number'),
  cloudDriveLink: text('cloud_drive_link'),
  dataSize: text('data_size'),
  backupStatus: text('backup_status').default('pending'),
  selectedFunctions: jsonb('selected_functions').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Image Uploads / Media Assets table
export const mediaUploads = pgTable('media_uploads', {
  id: text('id').primaryKey(), // e.g. "img-1234567890"
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  url: text('url').notNull(), // Storage or Supabase URL
  storageProvider: text('storage_provider').default('storage'), // 'storage', 'supabase'
  associatedType: text('associated_type').default('project_cover'), // 'project_cover', 'avatar', 'studio_logo', 'expense_receipt'
  associatedId: text('associated_id'), // ID of the project, editor, or studio
  uploadedBy: text('uploaded_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Expenses table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(),
  description: text('description'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Payments table (Transactions / Receipts)
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'studio_receipt' | 'editor_payout'
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  entityId: text('entity_id'),
  entityName: text('entity_name'),
  projectId: text('project_id'),
  projectCoupleName: text('project_couple_name'),
  paymentMode: text('payment_mode').default('UPI'),
  referenceNo: text('reference_no'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Calendar events table
export const calendarEvents = pgTable('calendar_events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  start: text('start').notNull(),
  type: text('type').default('delivery'),
  projectId: text('project_id'),
  coupleName: text('couple_name'),
  color: text('color').default('#EF4444'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit / Revision logs table
export const revisionHistory = pgTable('revision_history', {
  id: text('id').primaryKey(),
  projectId: text('project_id'),
  projectCoupleName: text('project_couple_name'),
  studioName: text('studio_name'),
  type: text('type').notNull(),
  category: text('category').notNull(),
  revisionNumber: integer('revision_number'),
  notes: text('notes').notNull(),
  date: text('date').notNull(),
  status: text('status').default('logged'),
  performedBy: text('performed_by'),
  performedByRole: text('performed_by_role'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({}) => ({}));

export const projectsRelations = relations(projects, ({ one }) => ({
  studio: one(studios, {
    fields: [projects.studioId],
    references: [studios.id],
  }),
  assignedEditor: one(editors, {
    fields: [projects.assignedEditorId],
    references: [editors.id],
  }),
}));
