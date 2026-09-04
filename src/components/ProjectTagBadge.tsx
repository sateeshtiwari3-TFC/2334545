import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  FileEdit,
  HardDrive,
  Eye,
  Music,
  Sparkles,
  CheckCircle2,
  Clock,
  Sparkle,
  Camera,
  Tag as TagIcon,
  X,
  Plus,
  Check
} from 'lucide-react';
import { getProjectTagStyle, PREDEFINED_PROJECT_TAGS, ProjectTagStyle } from '../projectTags';

interface ProjectTagBadgeProps {
  tag: string;
  size?: 'xs' | 'sm' | 'md';
  onRemove?: (tag: string, e: React.MouseEvent) => void;
  onClick?: (tag: string, e: React.MouseEvent) => void;
  className?: string;
  interactive?: boolean;
}

const renderTagIcon = (iconName: ProjectTagStyle['iconName'], className: string) => {
  switch (iconName) {
    case 'AlertTriangle':
      return <AlertTriangle className={className} />;
    case 'FileEdit':
      return <FileEdit className={className} />;
    case 'HardDrive':
      return <HardDrive className={className} />;
    case 'Eye':
      return <Eye className={className} />;
    case 'Music':
      return <Music className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'Sparkle':
      return <Sparkle className={className} />;
    case 'Camera':
      return <Camera className={className} />;
    case 'Tag':
    default:
      return <TagIcon className={className} />;
  }
};

export const ProjectTagBadge: React.FC<ProjectTagBadgeProps> = ({
  tag,
  size = 'xs',
  onRemove,
  onClick,
  className = '',
  interactive = false
}) => {
  const style = getProjectTagStyle(tag);

  const sizeClasses = {
    xs: 'text-[9px] px-2 py-0.5 gap-1',
    sm: 'text-[10px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-2'
  }[size];

  const iconSizeClasses = {
    xs: 'w-2.5 h-2.5 shrink-0',
    sm: 'w-3 h-3 shrink-0',
    md: 'w-3.5 h-3.5 shrink-0'
  }[size];

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5 shrink-0',
    sm: 'w-1.5 h-1.5 shrink-0',
    md: 'w-2 h-2 shrink-0'
  }[size];

  return (
    <span
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(tag, e);
        }
      }}
      className={`inline-flex items-center font-mono font-bold rounded-full border transition-all duration-200 backdrop-blur-md select-none ${style.bg} ${style.color} ${style.border} ${style.glow || 'shadow-sm'} ${sizeClasses} ${
        interactive ? 'hover:scale-105 cursor-pointer' : ''
      } ${className}`}
      title={`Project Tag: ${style.label}`}
    >
      <span className={`rounded-full ${style.dot} ${dotSizeClasses}`} />
      {renderTagIcon(style.iconName, iconSizeClasses)}
      <span className="truncate max-w-[130px] uppercase tracking-wider">{style.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag, e);
          }}
          className="ml-0.5 p-0.5 hover:bg-black/30 rounded-full text-current hover:text-white transition-colors cursor-pointer"
          title={`Remove tag "${style.label}"`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
};

interface ProjectTagPickerPopoverProps {
  selectedTags: string[];
  onToggleTag: (tag: string, e: React.MouseEvent) => void;
  onAddCustomTag?: (tag: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export const ProjectTagPickerPopover: React.FC<ProjectTagPickerPopoverProps> = ({
  selectedTags = [],
  onToggleTag,
  onAddCustomTag,
  onClose
}) => {
  const [customTagInput, setCustomTagInput] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [onClose]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (onAddCustomTag) {
      onAddCustomTag(trimmed);
    } else {
      onToggleTag(trimmed, e as any);
    }
    setCustomTagInput('');
  };

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-50 right-0 top-full mt-2 w-72 p-3 bg-charcoal-950/95 backdrop-blur-xl border border-gold-500/30 rounded-2xl shadow-2xl space-y-3 font-sans text-left animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <div className="flex items-center space-x-1.5 text-gold-400 font-mono text-[11px] font-bold uppercase tracking-wider">
          <TagIcon className="w-3.5 h-3.5 text-gold-400" />
          <span>Project Labels & Tags</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        <span className="text-[9px] uppercase font-mono text-gray-400 block tracking-wider">
          Quick Preset Labels:
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {PREDEFINED_PROJECT_TAGS.map((preset) => {
            const isSelected = selectedTags.includes(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={(e) => onToggleTag(preset.id, e)}
                className={`flex items-center justify-between p-1.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${preset.style.bg} ${preset.style.border} ${preset.style.color} font-bold shadow-sm`
                    : 'bg-charcoal-900/60 border-white/5 text-gray-400 hover:bg-charcoal-900 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${preset.style.dot}`} />
                  {renderTagIcon(preset.style.iconName, 'w-3 h-3')}
                  <span className="text-[11px] font-mono">{preset.label}</span>
                </div>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-current shrink-0" />
                ) : (
                  <span className="text-[10px] text-gray-600 font-mono">+ Add</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Tag Input */}
      <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-white/10">
        <span className="text-[9px] uppercase font-mono text-gray-400 block tracking-wider mb-1">
          Add Custom Tag:
        </span>
        <div className="flex items-center bg-charcoal-900 border border-white/10 rounded-xl p-1 focus-within:border-gold-500/40">
          <input
            type="text"
            placeholder="Type tag name & press Enter..."
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-xs text-white px-2 py-1 placeholder-gray-500 font-mono"
          />
          <button
            type="submit"
            disabled={!customTagInput.trim()}
            className="px-2.5 py-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-charcoal-950 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-colors"
          >
            + Add
          </button>
        </div>
      </form>
    </div>
  );
};

interface ProjectTagListProps {
  tags?: string[];
  projectId?: string;
  size?: 'xs' | 'sm' | 'md';
  maxVisible?: number;
  showAddButton?: boolean;
  onToggleTag?: (tag: string, e: React.MouseEvent) => void;
  onRemoveTag?: (tag: string, e: React.MouseEvent) => void;
  onTagClick?: (tag: string, e: React.MouseEvent) => void;
  className?: string;
}

export const ProjectTagList: React.FC<ProjectTagListProps> = ({
  tags = [],
  projectId,
  size = 'xs',
  maxVisible = 3,
  showAddButton = false,
  onToggleTag,
  onRemoveTag,
  onTagClick,
  className = ''
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={`relative flex items-center flex-wrap gap-1.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      {visibleTags.map((tag) => (
        <ProjectTagBadge
          key={tag}
          tag={tag}
          size={size}
          onRemove={onRemoveTag ? (t, e) => onRemoveTag(t, e) : undefined}
          onClick={onTagClick ? (t, e) => onTagClick(t, e) : undefined}
          interactive={!!onTagClick}
        />
      ))}

      {remainingCount > 0 && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-charcoal-950 text-gold-400 border border-gold-500/20"
          title={`+${remainingCount} more tags: ${tags.slice(maxVisible).join(', ')}`}
        >
          +{remainingCount}
        </span>
      )}

      {showAddButton && onToggleTag && (
        <div className="relative inline-block">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPickerOpen(!isPickerOpen);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono text-gray-400 hover:text-gold-400 bg-charcoal-950/80 hover:bg-charcoal-900 border border-dashed border-white/10 hover:border-gold-500/40 transition-colors cursor-pointer"
            title="Add or Manage Project Tags"
          >
            <Plus className="w-2.5 h-2.5 text-gold-400" />
            <span>Tag</span>
          </button>

          {isPickerOpen && (
            <ProjectTagPickerPopover
              selectedTags={tags}
              onToggleTag={(t, e) => {
                onToggleTag(t, e);
              }}
              onClose={() => setIsPickerOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
