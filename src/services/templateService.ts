import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp, writeBatch, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ProjectTemplate, Task, Editor } from '../types';

export const DEFAULT_BLUEPRINT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-royal-wedding',
    name: 'Grand Royal 3-Day Wedding Suite',
    description: 'Comprehensive luxury wedding film blueprint including multi-cam sync, Sangeet cut, trailer, cinematic reels & 4K master grade.',
    eventType: 'Wedding Film',
    priority: 'high',
    defaultTurnaroundDays: 30,
    estimatedDataSize: '2.5 TB',
    deliverables: [
      'Full Wedding Film (45-60 min)',
      'Cinematic Teaser (1 min)',
      'Highlight Montage (5-7 min)',
      '5x Instagram 9:16 Reels',
      'Sangeet Night Extended Cut',
      'Master Raw Footage Hard Disk'
    ],
    milestones: [
      'Footage Ingest, Proxy & Multi-cam Setup',
      'Audio Cleaning & Speech Enhancement',
      'Sangeet & Haldi Ceremony Assembly',
      'Teaser & 60-Sec Highlight Trailer',
      'Rough Cut / First Assembly Review',
      'Main Feature Film Editing Pass',
      'Cinematic Color Grading & 4K Master Export',
      'Sound Design & Foley Balancing',
      'Final Quality Control & Cloud Link Delivery'
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Footage Ingestion, Proxies & Multi-Cam Sync',
        description: 'Organize raw card footage, generate ProRes proxies, and sync ceremonial multi-camera audio tracks.',
        daysFromShoot: 2,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-2',
        title: 'Audio Speech Enhancement & Noise Removal',
        description: 'Clean up priest mantras, couple vows, and stage mic audio in Adobe Audition / iZotope RX.',
        daysFromShoot: 4,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-3',
        title: 'Sangeet & Haldi Extended Ceremony Cut',
        description: 'Edit full performance dances, family reactions, and energetic choreography.',
        daysFromShoot: 8,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-4',
        title: '60-Sec Cinematic Teaser & 3x Vertical Reels',
        description: 'High-energy social media teaser with custom sound design and vertical framing.',
        daysFromShoot: 12,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-5',
        title: 'Main Feature Film Storyline Assembly',
        description: 'Draft the 45-minute comprehensive wedding feature film following narrative emotional arc.',
        daysFromShoot: 18,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-6',
        title: 'Cinematic 4K Color Grading & Film LUT Pass',
        description: 'Apply signature warm gold wedding LUTs, balance skin tones, and match multi-camera profiles.',
        daysFromShoot: 24,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-7',
        title: 'Soundtrack Licensing, Foley & Final Audio Mastering',
        description: 'Balance dialogue, ambient room tone, custom Foley effects, and licensed background score.',
        daysFromShoot: 27,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-8',
        title: 'Final Quality Check & Cloud Drive Handover',
        description: 'Render master ProRes and H.264 exports, verify Google Drive upload links, and deliver to studio.',
        daysFromShoot: 30,
        assignedRole: 'primary_editor'
      }
    ],
    defaultProjectAmount: 150000,
    defaultEditorPayment: 35000,
    defaultOtherExpenses: 5000,
    defaultAdvancePercentage: 40,
    isSplitProject: false,
    notes: 'Luxury 4K Master Delivery. Includes 5 Instagram Reels, original raw files hard disk backup, and Google Drive download link.',
    isDefault: true
  },
  {
    id: 'tpl-pre-wedding',
    name: 'Cinematic Pre-Wedding Story',
    description: 'Romantic stylized story edit with custom music sync, warm cinematic color palette, and vertical social cuts.',
    eventType: 'Pre-Wedding Film',
    priority: 'medium',
    defaultTurnaroundDays: 14,
    estimatedDataSize: '800 GB',
    deliverables: [
      'Pre-Wedding Story Film (3-5 min)',
      '3x Instagram Reels',
      'Teaser Poster Graphic'
    ],
    milestones: [
      'Song Selection & Audio Licensing',
      'Storyline & Pace Assembly Cut',
      'Warm Cinematic Color Grading',
      'Animated Titles & Typography Pass',
      '4K Master Render & Vertical Reels Cut'
    ],
    tasks: [
      {
        id: 'task-pw-1',
        title: 'Song Selection & Emotional Beat Markers',
        description: 'Pick soundtrack, drop beat markers, and align romantic dialogue voiceovers.',
        daysFromShoot: 2,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-pw-2',
        title: 'Storyline & Pace Montage Assembly',
        description: 'Edit 3-5 minute narrative montage focusing on chemistry, candid glances, and scenic locations.',
        daysFromShoot: 6,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-pw-3',
        title: 'Warm Golden Hour Color Grade & LUT',
        description: 'Grade drone landscapes and sunset couple shots for a rich, filmic look.',
        daysFromShoot: 10,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-pw-4',
        title: '4K Master Export & 3x Vertical Reels',
        description: 'Export 4K widescreen master plus 3 vertical 9:16 cuts optimized for Instagram engagement.',
        daysFromShoot: 14,
        assignedRole: 'primary_editor'
      }
    ],
    defaultProjectAmount: 45000,
    defaultEditorPayment: 12000,
    defaultOtherExpenses: 2000,
    defaultAdvancePercentage: 50,
    isSplitProject: false,
    notes: 'Stylized warm cinematic look. Focus on song beat transitions and emotional couple storyline.',
    isDefault: true
  },
  {
    id: 'tpl-express-reels',
    name: 'Teaser & Reels Express 48H Sprint',
    description: 'Ultra fast-turnaround social media teaser package (48h delivery) with 3 vertical Instagram reels for rapid hype.',
    eventType: 'Cinematic Highlight',
    priority: 'urgent',
    defaultTurnaroundDays: 3,
    estimatedDataSize: '400 GB',
    deliverables: [
      '60-Second Express Teaser Trailer',
      '3x Vertical 9:16 Reels (Bride Entry, Vows, Sangeet Dance)',
      'Social Media Stills Package'
    ],
    milestones: [
      'Golden Moment Selection & Audio Sync',
      '60-Second Teaser Trailer Edit',
      '3x Vertical Reels Export',
      'Fast Color Grade & Punchy Audio Mix',
      'Express Delivery Upload'
    ],
    tasks: [
      {
        id: 'task-exp-1',
        title: 'Golden Moments Ingest & Fast Tagging',
        description: 'Instantly isolate bride entry, varmala exchange, and emotional crowd reactions.',
        daysFromShoot: 1,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-exp-2',
        title: '60-Sec High-Energy Teaser Cut',
        description: 'Cut rapid high-impact teaser with modern trending audio.',
        daysFromShoot: 2,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-exp-3',
        title: '3x Vertical 9:16 Reels & Express Upload',
        description: 'Crop 9:16 vertical reels with animated captions and deliver via Google Drive.',
        daysFromShoot: 3,
        assignedRole: 'primary_editor'
      }
    ],
    defaultProjectAmount: 30000,
    defaultEditorPayment: 9000,
    defaultOtherExpenses: 1000,
    defaultAdvancePercentage: 50,
    isSplitProject: false,
    notes: 'Express turnaround within 48-72 hours of ceremony completion for rapid social sharing.',
    isDefault: true
  },
  {
    id: 'tpl-traditional-wedding',
    name: 'Classic Traditional Ceremony & Reception',
    description: 'Full ritual coverage with multi-microphone audio mastering, family sequence coverage, and traditional highlight.',
    eventType: 'Wedding Film',
    priority: 'medium',
    defaultTurnaroundDays: 25,
    estimatedDataSize: '1.8 TB',
    deliverables: [
      'Full Rituals Extended Cut (90 min)',
      'Traditional Highlight Film (10 min)',
      'Family Blessing Interviews'
    ],
    milestones: [
      'Ceremony Sequence Multi-cam Sync',
      'Mantra & Speech Audio Enhancement',
      'Full Rituals Sequence Assembly',
      'Highlight Montage Cut',
      'Standard Color Balance',
      'Final Master Export'
    ],
    tasks: [
      {
        id: 'task-trad-1',
        title: 'Rituals Multi-Cam Ceremony Sync',
        description: 'Sync 3 cameras across Mandap, Hawan, and Stage ceremonies with uninterrupted audio.',
        daysFromShoot: 3,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-trad-2',
        title: 'Mantra & Speech Audio Enhancement',
        description: 'Remove background chatter and boost Vedic chants and family speeches.',
        daysFromShoot: 7,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-trad-3',
        title: 'Full Rituals Sequence Assembly',
        description: 'Edit full chronological coverage ensuring every family elder has adequate presence.',
        daysFromShoot: 15,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-trad-4',
        title: 'Traditional Highlight Montage Polish',
        description: 'Craft 10-minute traditional highlight set to classical and devotional soundtrack.',
        daysFromShoot: 20,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-trad-5',
        title: 'Color Balancing & Master USB Export',
        description: 'Clean natural color balance and prepare final master files.',
        daysFromShoot: 25,
        assignedRole: 'primary_editor'
      }
    ],
    defaultProjectAmount: 85000,
    defaultEditorPayment: 20000,
    defaultOtherExpenses: 3000,
    defaultAdvancePercentage: 30,
    isSplitProject: false,
    notes: 'Ensure all traditional rituals and key family members are given prominent screen time.',
    isDefault: true
  },
  {
    id: 'tpl-split-luxury',
    name: 'Collaborative 2-Editor Luxury Production',
    description: 'Dual-editor workflow for large destination weddings: Lead Editor cuts cinematic film & teaser; Second Editor handles Sangeet & Full Rituals.',
    eventType: 'Wedding Film',
    priority: 'urgent',
    defaultTurnaroundDays: 30,
    estimatedDataSize: '3.5 TB',
    deliverables: [
      'Main Feature Film (Lead Editor)',
      'Cinematic Teaser & 5x Reels (Lead Editor)',
      'Sangeet Night Extended (2nd Editor)',
      'Full Rituals & Stage Cut (2nd Editor)',
      'Raw Footage Cloud Archive'
    ],
    milestones: [
      'Master Footage Ingestion & Dual Drive Cloning',
      'Timeline Splitting & Asset Handoff',
      'Lead: Teaser & Highlight First Cut',
      'Second: Sangeet & Ceremony Assembly',
      'Unified Color Grading Pass',
      'Final Master Delivery & Archive'
    ],
    tasks: [
      {
        id: 'task-split-1',
        title: 'Master Ingestion & Project File Distribution',
        description: 'Create standardized Premiere Pro / DaVinci Resolve production folder structure and clone footage.',
        daysFromShoot: 2,
        assignedRole: 'lead'
      },
      {
        id: 'task-split-2',
        title: 'Lead: Cinematic Teaser & Story Highlight',
        description: 'Lead editor crafts high-end 60s teaser and 5-min feature trailer.',
        daysFromShoot: 10,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-split-3',
        title: '2nd Editor: Sangeet Dances & Haldi Cut',
        description: 'Second editor cuts complete multi-cam Sangeet performances with multi-track audio.',
        daysFromShoot: 14,
        assignedRole: 'second_editor'
      },
      {
        id: 'task-split-4',
        title: 'Lead: Main Feature Film Assembly',
        description: 'Lead editor assemblies 35-min feature film with narrative vows and emotional scoring.',
        daysFromShoot: 20,
        assignedRole: 'primary_editor'
      },
      {
        id: 'task-split-5',
        title: '2nd Editor: Full Ceremony & Reception Cut',
        description: 'Second editor finishes uninterrupted ritual sequences and stage guest greetings.',
        daysFromShoot: 22,
        assignedRole: 'second_editor'
      },
      {
        id: 'task-split-6',
        title: 'Unified Master Color Grade & Final QA',
        description: 'Lead colorist matches color profiles across all timeline exports and completes delivery.',
        daysFromShoot: 30,
        assignedRole: 'lead'
      }
    ],
    defaultProjectAmount: 180000,
    defaultEditorPayment: 50000,
    defaultOtherExpenses: 8000,
    defaultAdvancePercentage: 40,
    isSplitProject: true,
    defaultFirstEditorShare: 30000,
    defaultSecondEditorShare: 20000,
    notes: 'Split production workflow. Requires 2 synced hard drives and collaborative project file sync.',
    isDefault: true
  }
];

const LOCAL_STORAGE_KEY = 'theframecuts_project_templates_v2';

/**
 * Fetch all templates from Firestore with fallback to LocalStorage & defaults
 */
export async function getTemplatesFromFirestore(): Promise<ProjectTemplate[]> {
  try {
    const colRef = collection(db, 'project_templates');
    const snap = await getDocs(colRef);
    
    if (!snap.empty) {
      const list: ProjectTemplate[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as ProjectTemplate);
      });
      // Cache to local storage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (err) {
    console.warn("Could not load templates from Firestore, using local fallback:", err);
  }

  // Fallback to local storage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return DEFAULT_BLUEPRINT_TEMPLATES;
}

/**
 * Save or update a project template in Firestore & local storage
 */
export async function saveTemplateToFirestore(template: ProjectTemplate): Promise<void> {
  try {
    const docRef = doc(db, 'project_templates', template.id);
    await setDoc(docRef, {
      ...template,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Failed to save template to Firestore:", err);
  }

  // Update local storage
  try {
    const existing = await getTemplatesFromFirestore();
    const index = existing.findIndex(t => t.id === template.id);
    let updated: ProjectTemplate[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = template;
    } else {
      updated = [template, ...existing];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
}

/**
 * Delete a template from Firestore & local storage
 */
export async function deleteTemplateFromFirestore(templateId: string): Promise<void> {
  try {
    const docRef = doc(db, 'project_templates', templateId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Failed to delete template from Firestore:", err);
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: ProjectTemplate[] = JSON.parse(saved);
      const filtered = parsed.filter(t => t.id !== templateId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}
}

/**
 * Automatically create Task documents in Firestore for a newly instantiated project based on the template's standard tasks.
 */
export async function createProjectTasksFromTemplate(
  projectId: string,
  projectCoupleName: string,
  template: ProjectTemplate,
  shootDateStr: string,
  primaryEditorId?: string,
  secondEditorId?: string
): Promise<number> {
  if (!template.tasks || template.tasks.length === 0) {
    return 0;
  }

  try {
    const batch = writeBatch(db);
    const baseDate = shootDateStr ? new Date(shootDateStr) : new Date();
    let tasksCreatedCount = 0;

    for (let i = 0; i < template.tasks.length; i++) {
      const tTask = template.tasks[i];
      const taskId = `task-${projectId}-${i + 1}-${Date.now()}`;
      
      // Calculate due date based on daysFromShoot
      const dueDate = new Date(baseDate);
      const offsetDays = tTask.daysFromShoot !== undefined ? tTask.daysFromShoot : (i + 1) * 3;
      dueDate.setDate(dueDate.getDate() + offsetDays);
      const dueDateStr = dueDate.toISOString().slice(0, 10);

      // Determine assignee based on role
      let assignedTo = primaryEditorId || 'unassigned';
      if (tTask.assignedRole === 'second_editor' && secondEditorId) {
        assignedTo = secondEditorId;
      } else if (tTask.defaultAssignedEditorId) {
        assignedTo = tTask.defaultAssignedEditorId;
      }

      const taskDoc: Task = {
        id: taskId,
        projectId,
        projectCoupleName,
        title: tTask.title,
        description: tTask.description || `Standard milestone task from template: ${template.name}`,
        assignedTo,
        dueDate: dueDateStr,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const taskRef = doc(db, 'tasks', taskId);
      batch.set(taskRef, taskDoc);
      tasksCreatedCount++;
    }

    await batch.commit();
    console.log(`Created ${tasksCreatedCount} workflow tasks for project ${projectId} from blueprint "${template.name}".`);
    return tasksCreatedCount;
  } catch (err) {
    console.error("Failed to batch create tasks from template:", err);
    return 0;
  }
}
