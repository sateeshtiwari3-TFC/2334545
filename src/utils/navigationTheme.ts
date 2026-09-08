export interface TabColorTheme {
  id: string;
  name: string;
  // Text styling
  text: string;
  textActive: string;
  // Icon styling
  iconActive: string;
  // Borders and background badges
  bgActive: string;
  bgMobileActive: string;
  borderActive: string;
  borderHover: string;
  // Desktop sidebar active pill classes
  pillGradient: string;
  pillBorder: string;
  // TopHeaderBar Icon container classes
  headerBadgeGradient: string;
  headerBadgeBorder: string;
  headerBadgeText: string;
  // Mobile bottom indicator and glow
  indicatorBar: string;
  indicatorShadow: string;
  subDot: string;
  glow: string;
}

const TAB_THEMES: Record<string, TabColorTheme> = {
  // Green for 'projects'
  projects: {
    id: 'projects',
    name: 'Projects Directory',
    text: 'text-emerald-400',
    textActive: 'text-emerald-300 font-semibold',
    iconActive: 'text-emerald-400 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    bgActive: 'bg-emerald-500/15',
    bgMobileActive: 'bg-gradient-to-b from-emerald-500/20 to-charcoal-950 text-emerald-400',
    borderActive: 'border-emerald-500/50',
    borderHover: 'hover:border-emerald-500/30',
    pillGradient: 'bg-gradient-to-r from-emerald-500/25 via-emerald-900/30 to-transparent',
    pillBorder: 'border-l-4 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-emerald-500/25 via-teal-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-emerald-500/40',
    headerBadgeText: 'text-emerald-400',
    indicatorBar: 'bg-emerald-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(52,211,153,0.9)]',
    subDot: 'bg-emerald-400',
    glow: 'shadow-emerald-500/10'
  },

  // Gold for 'financials' / payments
  payments: {
    id: 'payments',
    name: 'Payment Center & Financials',
    text: 'text-gold-400',
    textActive: 'text-gold-300 font-semibold',
    iconActive: 'text-gold-400 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.7)]',
    bgActive: 'bg-gold-500/15',
    bgMobileActive: 'bg-gradient-to-b from-gold-500/20 to-charcoal-950 text-gold-400',
    borderActive: 'border-gold-500/50',
    borderHover: 'hover:border-gold-500/30',
    pillGradient: 'bg-gradient-to-r from-gold-500/25 via-amber-900/30 to-transparent',
    pillBorder: 'border-l-4 border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-gold-500/25 via-amber-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-gold-500/40',
    headerBadgeText: 'text-gold-400',
    indicatorBar: 'bg-gold-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(212,175,55,0.9)]',
    subDot: 'bg-gold-400',
    glow: 'shadow-gold-500/10'
  },

  // Blue for 'registry' / New Project
  registry: {
    id: 'registry',
    name: 'New Project Registry',
    text: 'text-sky-400',
    textActive: 'text-sky-300 font-semibold',
    iconActive: 'text-sky-400 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]',
    bgActive: 'bg-sky-500/15',
    bgMobileActive: 'bg-gradient-to-b from-sky-500/20 to-charcoal-950 text-sky-400',
    borderActive: 'border-sky-500/50',
    borderHover: 'hover:border-sky-500/30',
    pillGradient: 'bg-gradient-to-r from-sky-500/25 via-blue-900/30 to-transparent',
    pillBorder: 'border-l-4 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-sky-500/25 via-blue-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-sky-500/40',
    headerBadgeText: 'text-sky-400',
    indicatorBar: 'bg-sky-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(56,189,248,0.9)]',
    subDot: 'bg-sky-400',
    glow: 'shadow-sky-500/10'
  },

  // Indigo / Purple for 'dashboard'
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    text: 'text-indigo-400',
    textActive: 'text-indigo-300 font-semibold',
    iconActive: 'text-indigo-400 filter drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]',
    bgActive: 'bg-indigo-500/15',
    bgMobileActive: 'bg-gradient-to-b from-indigo-500/20 to-charcoal-950 text-indigo-400',
    borderActive: 'border-indigo-500/50',
    borderHover: 'hover:border-indigo-500/30',
    pillGradient: 'bg-gradient-to-r from-indigo-500/25 via-indigo-900/30 to-transparent',
    pillBorder: 'border-l-4 border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-indigo-500/25 via-indigo-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-indigo-500/40',
    headerBadgeText: 'text-indigo-400',
    indicatorBar: 'bg-indigo-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(129,140,248,0.9)]',
    subDot: 'bg-indigo-400',
    glow: 'shadow-indigo-500/10'
  },

  // Teal / Cyan for 'invoice'
  invoice: {
    id: 'invoice',
    name: 'Invoice & GST Billing',
    text: 'text-teal-400',
    textActive: 'text-teal-300 font-semibold',
    iconActive: 'text-teal-400 filter drop-shadow-[0_0_8px_rgba(45,212,191,0.7)]',
    bgActive: 'bg-teal-500/15',
    bgMobileActive: 'bg-gradient-to-b from-teal-500/20 to-charcoal-950 text-teal-400',
    borderActive: 'border-teal-500/50',
    borderHover: 'hover:border-teal-500/30',
    pillGradient: 'bg-gradient-to-r from-teal-500/25 via-teal-900/30 to-transparent',
    pillBorder: 'border-l-4 border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-teal-500/25 via-teal-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-teal-500/40',
    headerBadgeText: 'text-teal-400',
    indicatorBar: 'bg-teal-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(45,212,191,0.9)]',
    subDot: 'bg-teal-400',
    glow: 'shadow-teal-500/10'
  },

  // Orange / Amber-Orange for 'studios'
  studios: {
    id: 'studios',
    name: 'Studios Directory',
    text: 'text-orange-400',
    textActive: 'text-orange-300 font-semibold',
    iconActive: 'text-orange-400 filter drop-shadow-[0_0_8px_rgba(251,146,60,0.7)]',
    bgActive: 'bg-orange-500/15',
    bgMobileActive: 'bg-gradient-to-b from-orange-500/20 to-charcoal-950 text-orange-400',
    borderActive: 'border-orange-500/50',
    borderHover: 'hover:border-orange-500/30',
    pillGradient: 'bg-gradient-to-r from-orange-500/25 via-orange-900/30 to-transparent',
    pillBorder: 'border-l-4 border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-orange-500/25 via-orange-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-orange-500/40',
    headerBadgeText: 'text-orange-400',
    indicatorBar: 'bg-orange-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(251,146,60,0.9)]',
    subDot: 'bg-orange-400',
    glow: 'shadow-orange-500/10'
  },

  // Cyan / Blue-Cyan for 'editors'
  editors: {
    id: 'editors',
    name: 'Editors Portal',
    text: 'text-cyan-400',
    textActive: 'text-cyan-300 font-semibold',
    iconActive: 'text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]',
    bgActive: 'bg-cyan-500/15',
    bgMobileActive: 'bg-gradient-to-b from-cyan-500/20 to-charcoal-950 text-cyan-400',
    borderActive: 'border-cyan-500/50',
    borderHover: 'hover:border-cyan-500/30',
    pillGradient: 'bg-gradient-to-r from-cyan-500/25 via-cyan-900/30 to-transparent',
    pillBorder: 'border-l-4 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-cyan-500/25 via-cyan-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-cyan-500/40',
    headerBadgeText: 'text-cyan-400',
    indicatorBar: 'bg-cyan-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(34,211,238,0.9)]',
    subDot: 'bg-cyan-400',
    glow: 'shadow-cyan-500/10'
  },

  // Violet / Purple for 'datamanager'
  datamanager: {
    id: 'datamanager',
    name: 'Data Manager',
    text: 'text-violet-400',
    textActive: 'text-violet-300 font-semibold',
    iconActive: 'text-violet-400 filter drop-shadow-[0_0_8px_rgba(167,139,250,0.7)]',
    bgActive: 'bg-violet-500/15',
    bgMobileActive: 'bg-gradient-to-b from-violet-500/20 to-charcoal-950 text-violet-400',
    borderActive: 'border-violet-500/50',
    borderHover: 'hover:border-violet-500/30',
    pillGradient: 'bg-gradient-to-r from-violet-500/25 via-violet-900/30 to-transparent',
    pillBorder: 'border-l-4 border-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-violet-500/25 via-violet-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-violet-500/40',
    headerBadgeText: 'text-violet-400',
    indicatorBar: 'bg-violet-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(167,139,250,0.9)]',
    subDot: 'bg-violet-400',
    glow: 'shadow-violet-500/10'
  },

  // Rose / Pink for 'calendar'
  calendar: {
    id: 'calendar',
    name: 'Studio Calendar',
    text: 'text-rose-400',
    textActive: 'text-rose-300 font-semibold',
    iconActive: 'text-rose-400 filter drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]',
    bgActive: 'bg-rose-500/15',
    bgMobileActive: 'bg-gradient-to-b from-rose-500/20 to-charcoal-950 text-rose-400',
    borderActive: 'border-rose-500/50',
    borderHover: 'hover:border-rose-500/30',
    pillGradient: 'bg-gradient-to-r from-rose-500/25 via-rose-900/30 to-transparent',
    pillBorder: 'border-l-4 border-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-rose-500/25 via-rose-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-rose-500/40',
    headerBadgeText: 'text-rose-400',
    indicatorBar: 'bg-rose-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(251,113,133,0.9)]',
    subDot: 'bg-rose-400',
    glow: 'shadow-rose-500/10'
  },

  // Fuchsia / Magenta for 'gemini' AI
  gemini: {
    id: 'gemini',
    name: 'Gemini AI Assistant',
    text: 'text-fuchsia-400',
    textActive: 'text-fuchsia-300 font-semibold',
    iconActive: 'text-fuchsia-400 filter drop-shadow-[0_0_8px_rgba(232,121,249,0.7)]',
    bgActive: 'bg-fuchsia-500/15',
    bgMobileActive: 'bg-gradient-to-b from-fuchsia-500/20 to-charcoal-950 text-fuchsia-400',
    borderActive: 'border-fuchsia-500/50',
    borderHover: 'hover:border-fuchsia-500/30',
    pillGradient: 'bg-gradient-to-r from-fuchsia-500/25 via-purple-900/30 to-transparent',
    pillBorder: 'border-l-4 border-fuchsia-400 shadow-[0_0_20px_rgba(232,121,249,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-fuchsia-500/25 via-purple-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-fuchsia-500/40',
    headerBadgeText: 'text-fuchsia-400',
    indicatorBar: 'bg-fuchsia-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(232,121,249,0.9)]',
    subDot: 'bg-fuchsia-400',
    glow: 'shadow-fuchsia-500/10'
  },

  // Slate / Blue-Gray for 'audit'
  audit: {
    id: 'audit',
    name: 'Audit & Revision Log',
    text: 'text-slate-300',
    textActive: 'text-slate-200 font-semibold',
    iconActive: 'text-slate-300 filter drop-shadow-[0_0_8px_rgba(203,213,225,0.7)]',
    bgActive: 'bg-slate-500/15',
    bgMobileActive: 'bg-gradient-to-b from-slate-500/20 to-charcoal-950 text-slate-300',
    borderActive: 'border-slate-400/50',
    borderHover: 'hover:border-slate-400/30',
    pillGradient: 'bg-gradient-to-r from-slate-500/25 via-slate-800/30 to-transparent',
    pillBorder: 'border-l-4 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-slate-500/25 via-slate-900/40 to-charcoal-900',
    headerBadgeBorder: 'border-slate-400/40',
    headerBadgeText: 'text-slate-300',
    indicatorBar: 'bg-slate-300',
    indicatorShadow: 'shadow-[0_0_10px_rgba(203,213,225,0.9)]',
    subDot: 'bg-slate-300',
    glow: 'shadow-slate-500/10'
  },

  // Lime / Yellow-Green for 'reports'
  reports: {
    id: 'reports',
    name: 'Reports & Audits',
    text: 'text-lime-400',
    textActive: 'text-lime-300 font-semibold',
    iconActive: 'text-lime-400 filter drop-shadow-[0_0_8px_rgba(163,230,53,0.7)]',
    bgActive: 'bg-lime-500/15',
    bgMobileActive: 'bg-gradient-to-b from-lime-500/20 to-charcoal-950 text-lime-400',
    borderActive: 'border-lime-500/50',
    borderHover: 'hover:border-lime-500/30',
    pillGradient: 'bg-gradient-to-r from-lime-500/25 via-lime-900/30 to-transparent',
    pillBorder: 'border-l-4 border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-lime-500/25 via-lime-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-lime-500/40',
    headerBadgeText: 'text-lime-400',
    indicatorBar: 'bg-lime-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(163,230,53,0.9)]',
    subDot: 'bg-lime-400',
    glow: 'shadow-lime-500/10'
  },

  // Amber for 'notifications'
  notifications: {
    id: 'notifications',
    name: 'Notifications Center',
    text: 'text-amber-400',
    textActive: 'text-amber-300 font-semibold',
    iconActive: 'text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]',
    bgActive: 'bg-amber-500/15',
    bgMobileActive: 'bg-gradient-to-b from-amber-500/20 to-charcoal-950 text-amber-400',
    borderActive: 'border-amber-500/50',
    borderHover: 'hover:border-amber-500/30',
    pillGradient: 'bg-gradient-to-r from-amber-500/25 via-amber-900/30 to-transparent',
    pillBorder: 'border-l-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-amber-500/25 via-amber-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-amber-500/40',
    headerBadgeText: 'text-amber-400',
    indicatorBar: 'bg-amber-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(251,191,36,0.9)]',
    subDot: 'bg-amber-400',
    glow: 'shadow-amber-500/10'
  },

  // Electric Amber / Gold for 'automation'
  automation: {
    id: 'automation',
    name: 'Studio Automations',
    text: 'text-amber-400',
    textActive: 'text-amber-300 font-semibold',
    iconActive: 'text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]',
    bgActive: 'bg-amber-500/20',
    bgMobileActive: 'bg-gradient-to-b from-amber-500/25 to-charcoal-950 text-amber-300',
    borderActive: 'border-amber-400/60',
    borderHover: 'hover:border-amber-400/40',
    pillGradient: 'bg-gradient-to-r from-amber-500/30 via-yellow-900/30 to-transparent',
    pillBorder: 'border-l-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
    headerBadgeGradient: 'bg-gradient-to-br from-amber-500/30 via-yellow-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-amber-500/50',
    headerBadgeText: 'text-amber-300',
    indicatorBar: 'bg-amber-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(251,191,36,0.9)]',
    subDot: 'bg-amber-400',
    glow: 'shadow-amber-500/20'
  },

  // Red / Crimson for 'recyclebin'
  recyclebin: {
    id: 'recyclebin',
    name: 'Recycle Bin & Safe Trash',
    text: 'text-red-400',
    textActive: 'text-red-300 font-semibold',
    iconActive: 'text-red-400 filter drop-shadow-[0_0_8px_rgba(248,113,113,0.7)]',
    bgActive: 'bg-red-500/15',
    bgMobileActive: 'bg-gradient-to-b from-red-500/20 to-charcoal-950 text-red-400',
    borderActive: 'border-red-500/50',
    borderHover: 'hover:border-red-500/30',
    pillGradient: 'bg-gradient-to-r from-red-500/25 via-red-950/30 to-transparent',
    pillBorder: 'border-l-4 border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-red-500/25 via-red-950/40 to-charcoal-900',
    headerBadgeBorder: 'border-red-500/40',
    headerBadgeText: 'text-red-400',
    indicatorBar: 'bg-red-400',
    indicatorShadow: 'shadow-[0_0_10px_rgba(248,113,113,0.9)]',
    subDot: 'bg-red-400',
    glow: 'shadow-red-500/10'
  },

  // Stone / Zinc for 'settings'
  settings: {
    id: 'settings',
    name: 'Studio Settings',
    text: 'text-zinc-300',
    textActive: 'text-zinc-200 font-semibold',
    iconActive: 'text-zinc-300 filter drop-shadow-[0_0_8px_rgba(212,212,216,0.7)]',
    bgActive: 'bg-zinc-500/15',
    bgMobileActive: 'bg-gradient-to-b from-zinc-500/20 to-charcoal-950 text-zinc-300',
    borderActive: 'border-zinc-400/50',
    borderHover: 'hover:border-zinc-400/30',
    pillGradient: 'bg-gradient-to-r from-zinc-500/25 via-zinc-800/30 to-transparent',
    pillBorder: 'border-l-4 border-zinc-300 shadow-[0_0_20px_rgba(212,212,216,0.25)]',
    headerBadgeGradient: 'bg-gradient-to-br from-zinc-500/25 via-zinc-900/40 to-charcoal-900',
    headerBadgeBorder: 'border-zinc-400/40',
    headerBadgeText: 'text-zinc-300',
    indicatorBar: 'bg-zinc-300',
    indicatorShadow: 'shadow-[0_0_10px_rgba(212,212,216,0.9)]',
    subDot: 'bg-zinc-300',
    glow: 'shadow-zinc-500/10'
  }
};

/**
 * Helper function to dynamically retrieve theme styling classes based on activeTab
 * e.g., green for 'projects', gold for 'financials/payments', blue for 'registry'
 */
export function getTabTheme(tabId: string): TabColorTheme {
  if (TAB_THEMES[tabId]) {
    return TAB_THEMES[tabId];
  }
  // Default fallback to Gold theme
  return TAB_THEMES.payments;
}
