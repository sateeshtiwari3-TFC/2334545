export interface CategoryPrediction {
  category: string;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords?: string[];
  reasoning?: string;
}

export const EXPENSE_CATEGORIES = [
  'Equipment / Hard Disk',
  'Travel & Conveyance',
  'Editor Payouts',
  'Office & Rent',
  'Software / Tools',
  'Miscellaneous'
] as const;

export type ExpenseCategoryType = typeof EXPENSE_CATEGORIES[number];

export interface CommonCategoryMeta {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  keywords: string[];
  description: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    activeBg: string;
  };
}

export const COMMON_EXPENSE_CATEGORIES: CommonCategoryMeta[] = [
  {
    id: 'Travel',
    name: 'Travel',
    shortLabel: 'Travel',
    icon: 'Plane',
    keywords: [
      'travel', 'flight', 'flight ticket', 'indigo', 'air india', 'vistara', 'air',
      'train', 'irctc', 'rail', 'cab', 'taxi', 'uber', 'ola', 'auto', 'rickshaw',
      'fuel', 'petrol', 'diesel', 'cng', 'toll', 'fastag', 'hotel', 'stay',
      'resort', 'airbnb', 'conveyance', 'commute', 'transport', 'outstation',
      'bus', 'parking', 'destination', 'vehicle', 'mileage', 'shoot commute'
    ],
    description: 'Flights, cabs, train tickets, fuel, toll, and outstation stays',
    colorScheme: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20'
    }
  },
  {
    id: 'Equipment',
    name: 'Equipment',
    shortLabel: 'Equipment',
    icon: 'Camera',
    keywords: [
      'equipment', 'gear', 'camera', 'lens', 'sony', 'canon', 'nikon', 'fuji',
      'panasonic', 'hard disk', 'harddisk', 'hdd', 'ssd', 'sandisk', 'seagate',
      'wd', 'western digital', 'samsung t7', 'storage', 'drive', 'sd card',
      'cfexpress', 'memory card', 'battery', 'v-mount', 'charger', 'cable',
      'hdmi', 'monitor', 'gimbal', 'dji', 'ronin', 'tripod', 'monopod', 'stand',
      'lighting', 'light', 'godox', 'aputure', 'nanlite', 'softbox', 'reflector',
      'rig', 'cage', 'mic', 'rode', 'wireless go', 'audio recorder', 'zoom h6',
      'boom mic', 'lapel', 'transmitter', 'receiver', 'nd filter', 'matte box'
    ],
    description: 'Cameras, lenses, SSDs, hard drives, lighting, audio gear & rigs',
    colorScheme: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      activeBg: 'bg-blue-500/20'
    }
  },
  {
    id: 'Freelance Pay',
    name: 'Freelance Pay',
    shortLabel: 'Freelance Pay',
    icon: 'Users',
    keywords: [
      'freelance', 'freelancer', 'freelance pay', 'freelancer pay', 'editor', 'editing',
      'cut', 'pay', 'payout', 'remuneration', 'salary', 'stipend', 'contractor',
      'fee', 'wages', 'labor', 'colorist', 'color grading', 'sound designer',
      'sound design', 'audio mix', 'dubbing', 'voiceover', 'teaser edit',
      'highlight edit', 'reel edit', 'cinematographer', 'cameraman', 'photographer',
      'assistant', 'second shooter', 'crew', 'drone pilot', 'vansh', 'satish',
      'amit', 'rahul', 'designer'
    ],
    description: 'Freelance editors, colorists, sound designers & assistant crew payouts',
    colorScheme: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      activeBg: 'bg-purple-500/20'
    }
  },
  {
    id: 'Software & Licenses',
    name: 'Software & Licenses',
    shortLabel: 'Software',
    icon: 'Laptop',
    keywords: [
      'software', 'license', 'licenses', 'adobe', 'creative cloud', 'premiere',
      'after effects', 'photoshop', 'lightroom', 'davinci', 'resolve', 'envato',
      'elements', 'artlist', 'musicbed', 'epidemic sound', 'soundstripe',
      'google drive', 'google one', 'dropbox', 'icloud', 'one drive', 'plugin',
      'motion array', 'lut', 'luts', 'topaz', 'chatgpt', 'gemini', 'canva',
      'domain', 'hosting', 'zoom', 'subscription'
    ],
    description: 'Adobe Creative Cloud, DaVinci, cloud storage, music & plugin licenses',
    colorScheme: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      activeBg: 'bg-amber-500/20'
    }
  },
  {
    id: 'Studio Rent & Utilities',
    name: 'Studio Rent & Utilities',
    shortLabel: 'Studio Rent',
    icon: 'Building2',
    keywords: [
      'rent', 'office', 'studio rent', 'electricity', 'power bill', 'electric',
      'water', 'maintenance', 'cleaning', 'ac repair', 'air conditioner',
      'broadband', 'wifi', 'internet', 'fiber', 'furniture', 'desk', 'chair',
      'office supplies', 'stationery', 'landlord', 'lease', 'utility', 'utilities'
    ],
    description: 'Studio lease, electricity bills, high-speed broadband & upkeep',
    colorScheme: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      activeBg: 'bg-rose-500/20'
    }
  },
  {
    id: 'Food & Refreshments',
    name: 'Food & Refreshments',
    shortLabel: 'Refreshments',
    icon: 'Coffee',
    keywords: [
      'food', 'tea', 'coffee', 'chai', 'snacks', 'lunch', 'dinner', 'breakfast',
      'meal', 'meals', 'refreshment', 'refreshments', 'swiggy', 'zomato',
      'catering', 'water bottle', 'beverage', 'nashta', 'groceries'
    ],
    description: 'Shoot meals, client catering, studio tea/coffee & snacks',
    colorScheme: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      activeBg: 'bg-orange-500/20'
    }
  },
  {
    id: 'Miscellaneous',
    name: 'Miscellaneous',
    shortLabel: 'Misc',
    icon: 'HelpCircle',
    keywords: [
      'misc', 'miscellaneous', 'courier', 'parcel', 'speed post', 'print',
      'printing', 'xerox', 'stationery', 'pen', 'paper', 'bank fee', 'charges',
      'gst', 'tax', 'legal', 'accounting', 'other', 'general'
    ],
    description: 'Courier, printing, legal, bank charges, taxes & general overheads',
    colorScheme: {
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      activeBg: 'bg-gray-500/20'
    }
  }
];

/**
 * Normalizes any category string (from legacy or variations) into one of the canonical categories.
 */
export function normalizeExpenseCategory(cat?: string): string {
  if (!cat) return 'Miscellaneous';
  const c = cat.toLowerCase().trim();

  if (c === 'travel' || c.includes('travel') || c.includes('commute') || c.includes('conveyance') || c.includes('cab') || c.includes('flight')) {
    return 'Travel';
  }
  if (c === 'equipment' || c.includes('equipment') || c.includes('hardware') || c.includes('gear') || c.includes('hard disk') || c.includes('ssd') || c.includes('camera')) {
    return 'Equipment';
  }
  if (c === 'freelance pay' || c.includes('freelance') || c.includes('editor') || c.includes('payout') || c.includes('remuneration') || c.includes('contractor')) {
    return 'Freelance Pay';
  }
  if (c === 'software & licenses' || c.includes('software') || c.includes('license') || c.includes('tool') || c.includes('adobe') || c.includes('cloud')) {
    return 'Software & Licenses';
  }
  if (c === 'studio rent & utilities' || c.includes('rent') || c.includes('operating') || c.includes('utility') || c.includes('utilities') || c.includes('electricity') || c.includes('office')) {
    return 'Studio Rent & Utilities';
  }
  if (c === 'food & refreshments' || c.includes('food') || c.includes('refreshment') || c.includes('meal') || c.includes('tea') || c.includes('coffee') || c.includes('snacks')) {
    return 'Food & Refreshments';
  }
  return 'Miscellaneous';
}

export interface SuggestedCategoryResult {
  category: string;
  matchedKeyword: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Suggests common categories (e.g., 'Travel', 'Equipment', 'Freelance Pay')
 * dynamically based on the title/description entered.
 */
export function suggestCategoriesFromTitle(
  title: string,
  payee = ''
): {
  primary: SuggestedCategoryResult | null;
  suggestions: SuggestedCategoryResult[];
} {
  const text = `${title} ${payee}`.toLowerCase().trim();
  if (!text || text.length < 2) {
    return { primary: null, suggestions: [] };
  }

  const results: SuggestedCategoryResult[] = [];

  for (const cat of COMMON_EXPENSE_CATEGORIES) {
    let bestScore = 0;
    let matchedKw = '';

    for (const kw of cat.keywords) {
      if (text.includes(kw)) {
        // Base score higher for longer keywords
        let kwScore = kw.length > 5 ? 3 : 2;

        // Exact whole-word boundary bonus
        const wordBoundaryRegex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (wordBoundaryRegex.test(text)) {
          kwScore += 3;
        }

        // Title begins with keyword bonus
        if (text.startsWith(kw)) {
          kwScore += 2;
        }

        if (kwScore > bestScore) {
          bestScore = kwScore;
          matchedKw = kw;
        }
      }
    }

    if (bestScore > 0) {
      const confidence: 'high' | 'medium' | 'low' =
        bestScore >= 6 ? 'high' : bestScore >= 3 ? 'medium' : 'low';
      results.push({
        category: cat.id,
        matchedKeyword: matchedKw,
        score: bestScore,
        confidence
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return {
    primary: results[0] || null,
    suggestions: results
  };
}

export interface CategoryMonthlySpendSummary {
  monthKey: string; // 'YYYY-MM'
  monthLabel: string; // 'September 2026'
  totalMonthSpend: number;
  byCategory: Record<
    string,
    {
      categoryId: string;
      total: number;
      count: number;
      percentage: number;
    }
  >;
}

/**
 * Calculates real-time total monthly spend per category for the current or reference month.
 */
export function calculateMonthlySpendByCategory(
  expenses: any[] = [],
  referenceDate: string | Date = new Date()
): CategoryMonthlySpendSummary {
  let dateObj: Date;
  if (typeof referenceDate === 'string') {
    dateObj = new Date(referenceDate);
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
  } else {
    dateObj = referenceDate;
  }

  const year = dateObj.getFullYear();
  const monthIndex = dateObj.getMonth();
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const monthLabel = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const categoryTotals: Record<string, { total: number; count: number }> = {};
  COMMON_EXPENSE_CATEGORIES.forEach((cat) => {
    categoryTotals[cat.id] = { total: 0, count: 0 };
  });

  let totalMonthSpend = 0;

  (expenses || []).forEach((exp) => {
    if (!exp) return;
    const expDateStr = String(exp.date || '');
    let isSameMonth = false;

    if (expDateStr.startsWith(monthKey)) {
      isSameMonth = true;
    } else if (expDateStr) {
      const parsed = new Date(expDateStr);
      if (!isNaN(parsed.getTime())) {
        if (parsed.getFullYear() === year && parsed.getMonth() === monthIndex) {
          isSameMonth = true;
        }
      }
    }

    if (isSameMonth) {
      const amt = Number(exp.amount) || 0;
      const normalized = normalizeExpenseCategory(exp.category);
      if (!categoryTotals[normalized]) {
        categoryTotals[normalized] = { total: 0, count: 0 };
      }
      categoryTotals[normalized].total += amt;
      categoryTotals[normalized].count += 1;
      totalMonthSpend += amt;
    }
  });

  const byCategory: Record<string, { categoryId: string; total: number; count: number; percentage: number }> = {};
  COMMON_EXPENSE_CATEGORIES.forEach((cat) => {
    const data = categoryTotals[cat.id] || { total: 0, count: 0 };
    byCategory[cat.id] = {
      categoryId: cat.id,
      total: data.total,
      count: data.count,
      percentage: totalMonthSpend > 0 ? Math.round((data.total / totalMonthSpend) * 100) : 0
    };
  });

  return {
    monthKey,
    monthLabel,
    totalMonthSpend,
    byCategory
  };
}

const CATEGORY_RULES: { category: ExpenseCategoryType; keywords: string[]; weight: number }[] = [
  {
    category: 'Equipment / Hard Disk',
    keywords: [
      'disk', 'hard disk', 'hdd', 'ssd', 'sandisk', 'seagate', 'western digital', 'wd', 'samsung t7', 
      'camera', 'lens', 'sony', 'canon', 'sd card', 'cfexpress', 'memory card', 'battery', 'v-mount',
      'cable', 'hdmi', 'monitor', 'gimbal', 'dji', 'tripod', 'lighting', 'godox', 'aputure', 'rig',
      'mic', 'rode', 'audio recorder', 'zoom h6', 'storage', 'harddrive'
    ],
    weight: 1.2
  },
  {
    category: 'Travel & Conveyance',
    keywords: [
      'travel', 'cab', 'taxi', 'uber', 'ola', 'flight', 'indigo', 'air india', 'train', 'irctc',
      'fuel', 'petrol', 'diesel', 'cng', 'toll', 'fastag', 'hotel', 'stay', 'airbnb', 'auto',
      'conveyance', 'destination', 'bus', 'parking', 'food on shoot', 'meals', 'venue commute'
    ],
    weight: 1.1
  },
  {
    category: 'Editor Payouts',
    keywords: [
      'editor', 'editing', 'cut', 'freelancer', 'contractor', 'stipend', 'salary', 'remuneration',
      'vansh', 'satish', 'colorist', 'grading', 'sound designer', 'dubbing', 'teaser edit',
      'highlight edit', 'reel edit', 'cinematographer payment', 'assistant', 'payout'
    ],
    weight: 1.2
  },
  {
    category: 'Office & Rent',
    keywords: [
      'rent', 'office', 'studio rent', 'electricity', 'power bill', 'water', 'maintenance',
      'cleaning', 'tea', 'coffee', 'snacks', 'air conditioner', 'ac repair', 'desk', 'chair',
      'office supplies', 'stationery', 'landlord', 'lease'
    ],
    weight: 1.0
  },
  {
    category: 'Software / Tools',
    keywords: [
      'software', 'adobe', 'premiere', 'after effects', 'davinci', 'resolve', 'envato',
      'artlist', 'musicbed', 'epidemic sound', 'soundstripe', 'google drive', 'google one',
      'dropbox', 'icloud', 'plugin', 'motion array', 'lut', 'luts', 'topaz', 'chatgpt',
      'gemini', 'canva', 'domain', 'hosting', 'zoom subscription', 'internet', 'broadband', 'wifi'
    ],
    weight: 1.1
  }
];

/**
 * Predicts expense category instantly from text, payee, and optional project name using keyword heuristic.
 */
export function predictExpenseCategory(
  titleOrDescription: string,
  payee = '',
  projectName = ''
): CategoryPrediction | null {
  const combined = `${titleOrDescription} ${payee} ${projectName}`.toLowerCase().trim();
  if (!combined) return null;

  let bestMatch: ExpenseCategoryType | null = null;
  let highestScore = 0;
  let matchedList: string[] = [];

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    const currentMatches: string[] = [];

    for (const kw of rule.keywords) {
      if (combined.includes(kw)) {
        score += kw.length > 5 ? 2.5 : 1.5;
        currentMatches.push(kw);
      }
    }

    score *= rule.weight;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule.category;
      matchedList = currentMatches;
    }
  }

  if (!bestMatch || highestScore < 1.5) {
    return null;
  }

  const confidence = highestScore >= 4 ? 'high' : highestScore >= 2 ? 'medium' : 'low';

  return {
    category: bestMatch,
    confidence,
    matchedKeywords: matchedList,
    reasoning: `Matched keywords: "${matchedList.join(', ')}"`
  };
}

/**
 * Calls Gemini server endpoint for AI-powered category prediction or verification.
 */
export async function predictCategoryWithAI(
  title: string,
  description = '',
  payee = '',
  projectName = ''
): Promise<CategoryPrediction | null> {
  try {
    const res = await fetch('/api/gemini/predict-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, payee, projectName })
    });

    if (!res.ok) {
      // Fallback to local heuristic
      return predictExpenseCategory(`${title} ${description}`, payee, projectName);
    }

    const json = await res.json();
    if (json.success && json.data) {
      return {
        category: json.data.category || 'Miscellaneous',
        confidence: (json.data.confidence?.toLowerCase() as any) || 'medium',
        reasoning: json.data.reasoning || 'Gemini AI prediction'
      };
    }
    return predictExpenseCategory(`${title} ${description}`, payee, projectName);
  } catch (err) {
    console.warn('AI Category prediction fallback to local:', err);
    return predictExpenseCategory(`${title} ${description}`, payee, projectName);
  }
}

/**
 * Scans a pasted text receipt or image description with the Gemini API.
 */
export async function scanReceiptWithGemini(params: {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<{
  success: boolean;
  data?: {
    amount: number;
    date: string;
    category: string;
    title: string;
    payee?: string;
    paymentMode?: string;
    confidence?: string;
    notes?: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch('/api/gemini/scan-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to parse receipt.');
    }

    return {
      success: true,
      data: json.data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error communicating with Gemini receipt scanner.'
    };
  }
}
