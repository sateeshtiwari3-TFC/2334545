export interface ProjectTagStyle {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  glow?: string;
  iconName: 'AlertTriangle' | 'FileEdit' | 'HardDrive' | 'Eye' | 'Music' | 'Sparkles' | 'CheckCircle2' | 'Clock' | 'Sparkle' | 'Camera' | 'Tag';
}

export const PREDEFINED_PROJECT_TAGS: { id: string; label: string; style: ProjectTagStyle; description: string }[] = [
  {
    id: 'Urgent',
    label: 'Urgent',
    description: 'Critical deadline or expedited client priority',
    style: {
      label: 'Urgent',
      color: 'text-rose-300',
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/50',
      dot: 'bg-rose-400',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/30',
      iconName: 'AlertTriangle'
    }
  },
  {
    id: 'Revision',
    label: 'Revision',
    description: 'Active client notes or re-editing pass required',
    style: {
      label: 'Revision',
      color: 'text-amber-300',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      dot: 'bg-amber-400',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      iconName: 'FileEdit'
    }
  },
  {
    id: 'Awaiting Data',
    label: 'Awaiting Data',
    description: 'Pending raw footage, HDD transfer, or cloud upload',
    style: {
      label: 'Awaiting Data',
      color: 'text-sky-300',
      bg: 'bg-sky-500/20',
      border: 'border-sky-500/50',
      dot: 'bg-sky-400',
      glow: 'shadow-[0_0_12px_rgba(14,165,233,0.25)]',
      iconName: 'HardDrive'
    }
  },
  {
    id: 'Ready for Review',
    label: 'Ready for Review',
    description: 'Export draft uploaded and waiting for studio/couple approval',
    style: {
      label: 'Ready for Review',
      color: 'text-purple-300',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/50',
      dot: 'bg-purple-400',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]',
      iconName: 'Eye'
    }
  },
  {
    id: 'Audio Pending',
    label: 'Audio Pending',
    description: 'Song selection, master sync, or audio clean-up pending',
    style: {
      label: 'Audio Pending',
      color: 'text-pink-300',
      bg: 'bg-pink-500/20',
      border: 'border-pink-500/50',
      dot: 'bg-pink-400',
      glow: 'shadow-[0_0_12px_rgba(236,72,153,0.25)]',
      iconName: 'Music'
    }
  },
  {
    id: 'Color Grading',
    label: 'Color Grading',
    description: 'Cinematic LUT application and skin tone matching in progress',
    style: {
      label: 'Color Grading',
      color: 'text-teal-300',
      bg: 'bg-teal-500/20',
      border: 'border-teal-500/50',
      dot: 'bg-teal-400',
      glow: 'shadow-[0_0_12px_rgba(20,184,166,0.25)]',
      iconName: 'Sparkles'
    }
  },
  {
    id: 'Teaser Delivered',
    label: 'Teaser Delivered',
    description: '60s Instagram reel or teaser delivered to client',
    style: {
      label: 'Teaser Delivered',
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      dot: 'bg-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      iconName: 'CheckCircle2'
    }
  },
  {
    id: 'Drone Pending',
    label: 'Drone Pending',
    description: 'Waiting for aerial drone footage integration',
    style: {
      label: 'Drone Pending',
      color: 'text-indigo-300',
      bg: 'bg-indigo-500/20',
      border: 'border-indigo-500/50',
      dot: 'bg-indigo-400',
      glow: 'shadow-[0_0_12px_rgba(99,102,241,0.25)]',
      iconName: 'Camera'
    }
  },
  {
    id: 'VIP Client',
    label: 'VIP Client',
    description: 'High-profile luxury wedding assignment',
    style: {
      label: 'VIP Client',
      color: 'text-gold-300',
      bg: 'bg-gold-500/20',
      border: 'border-gold-500/50',
      dot: 'bg-gold-400',
      glow: 'shadow-[0_0_14px_rgba(234,179,8,0.35)] ring-1 ring-gold-400/30',
      iconName: 'Sparkle'
    }
  },
  {
    id: 'On Hold',
    label: 'On Hold',
    description: 'Temporarily paused per client or studio instructions',
    style: {
      label: 'On Hold',
      color: 'text-slate-300',
      bg: 'bg-slate-700/40',
      border: 'border-slate-600/50',
      dot: 'bg-slate-400',
      glow: 'shadow-[0_0_8px_rgba(148,163,184,0.15)]',
      iconName: 'Clock'
    }
  }
];

// Fallback palette for custom user tags
const CUSTOM_PALETTES: Array<Omit<ProjectTagStyle, 'label' | 'iconName'>> = [
  {
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/40',
    dot: 'bg-cyan-400',
    glow: 'shadow-[0_0_10px_rgba(6,182,212,0.25)]'
  },
  {
    color: 'text-violet-300',
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/40',
    dot: 'bg-violet-400',
    glow: 'shadow-[0_0_10px_rgba(139,92,246,0.25)]'
  },
  {
    color: 'text-orange-300',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    dot: 'bg-orange-400',
    glow: 'shadow-[0_0_10px_rgba(249,115,22,0.25)]'
  },
  {
    color: 'text-fuchsia-300',
    bg: 'bg-fuchsia-500/20',
    border: 'border-fuchsia-500/40',
    dot: 'bg-fuchsia-400',
    glow: 'shadow-[0_0_10px_rgba(217,70,239,0.25)]'
  },
  {
    color: 'text-lime-300',
    bg: 'bg-lime-500/20',
    border: 'border-lime-500/40',
    dot: 'bg-lime-400',
    glow: 'shadow-[0_0_10px_rgba(132,204,22,0.25)]'
  }
];

/**
 * Returns the exact color-coded styling configuration for any tag name.
 */
export function getProjectTagStyle(tagName: string): ProjectTagStyle {
  if (!tagName) {
    return {
      label: 'Tag',
      color: 'text-gray-300',
      bg: 'bg-gray-800/40',
      border: 'border-gray-700',
      dot: 'bg-gray-400',
      iconName: 'Tag'
    };
  }

  const normalized = tagName.trim().toLowerCase();
  const match = PREDEFINED_PROJECT_TAGS.find(
    t => t.id.toLowerCase() === normalized || t.label.toLowerCase() === normalized
  );

  if (match) {
    return match.style;
  }

  // Deterministic palette hash for custom tags
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const paletteIndex = Math.abs(hash) % CUSTOM_PALETTES.length;
  const palette = CUSTOM_PALETTES[paletteIndex];

  return {
    label: tagName.trim(),
    color: palette.color,
    bg: palette.bg,
    border: palette.border,
    dot: palette.dot,
    glow: palette.glow,
    iconName: 'Tag'
  };
}
