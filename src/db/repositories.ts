import { db } from './index.ts';
import { 
  projects, 
  studios, 
  editors, 
  expenses, 
  payments, 
  calendarEvents, 
  revisionHistory, 
  mediaUploads 
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// Projects
export async function getSqlProjects() {
  try {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  } catch (error) {
    console.error("Failed to query SQL projects:", error);
    throw new Error("Failed to query SQL projects.", { cause: error });
  }
}

export async function upsertSqlProject(data: any) {
  try {
    const { createdAt, updatedAt, ...rest } = data;
    const result = await db.insert(projects)
      .values({
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          ...rest,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to upsert SQL project:", error);
    throw new Error("Failed to save project to SQL database.", { cause: error });
  }
}

export async function deleteSqlProject(id: string) {
  try {
    await db.delete(projects).where(eq(projects.id, id));
    return { success: true, id };
  } catch (error) {
    console.error("Failed to delete SQL project:", error);
    throw new Error("Failed to delete project from SQL database.", { cause: error });
  }
}

// Media Uploads
export async function recordMediaUpload(data: {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  storageProvider?: string;
  associatedType?: string;
  associatedId?: string;
  uploadedBy?: string;
}) {
  try {
    const result = await db.insert(mediaUploads)
      .values({
        ...data,
        storageProvider: data.storageProvider || 'storage',
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to record media upload in SQL:", error);
    throw new Error("Failed to record media upload in SQL database.", { cause: error });
  }
}

export async function getMediaUploads() {
  try {
    return await db.select().from(mediaUploads).orderBy(desc(mediaUploads.createdAt));
  } catch (error) {
    console.error("Failed to get media uploads from SQL:", error);
    throw new Error("Failed to retrieve media uploads from SQL database.", { cause: error });
  }
}

// Studios
export async function upsertSqlStudio(data: any) {
  try {
    const { createdAt, updatedAt, ...rest } = data;
    const result = await db.insert(studios)
      .values({
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: studios.id,
        set: {
          ...rest,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to upsert SQL studio:", error);
    throw new Error("Failed to save studio to SQL database.", { cause: error });
  }
}

// Editors
export async function upsertSqlEditor(data: any) {
  try {
    const { createdAt, updatedAt, ...rest } = data;
    const result = await db.insert(editors)
      .values({
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: editors.id,
        set: {
          ...rest,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to upsert SQL editor:", error);
    throw new Error("Failed to save editor to SQL database.", { cause: error });
  }
}

// Expenses
export async function upsertSqlExpense(data: any) {
  try {
    const { createdAt, ...rest } = data;
    const result = await db.insert(expenses)
      .values({
        ...rest,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: expenses.id,
        set: rest,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to upsert SQL expense:", error);
    throw new Error("Failed to save expense to SQL database.", { cause: error });
  }
}

// Payments
export async function upsertSqlPayment(data: any) {
  try {
    const { createdAt, ...rest } = data;
    const result = await db.insert(payments)
      .values({
        ...rest,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: payments.id,
        set: rest,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to upsert SQL payment:", error);
    throw new Error("Failed to save payment to SQL database.", { cause: error });
  }
}
