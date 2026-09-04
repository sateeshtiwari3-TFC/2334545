import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, Sparkles, ChevronDown } from 'lucide-react';

export type AppTheme = 'luxury-green' | 'midnight-gold' | 'royal-sapphire';

interface ThemeToggleProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  compact?: boolean;
}

export const THEME_CONFIGS: Record<AppTheme, {
  id: AppTheme;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  borderGlow: string;
  bgGradient: string;
  previewDots: string[];
}> = {
  'luxury-green': {
    id: 'luxury-green',
    name: 'Luxury Green',
    tagline: 'Emerald & Gold Signature',
    primaryColor: '#3c8f78',
    accentColor: '#d4af37',
    borderGlow: 'border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(60,143,120,0.3)]',
    bgGradient: 'from-emerald-950/80 via-charcoal-900 to-charcoal-950',
    previewDots: ['#0c2b23', '#3c8f78', '#d4af37']
  },
  'midnight-gold': {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    tagline: 'Warm Obsidian & Rich Gold',
    primaryColor: '#d4af37',
    accentColor: '#f59e0b',
    borderGlow: 'border-gold-500/40 text-gold-400 shadow-[0_0_12px_rgba(212,175,55,0.3)]',
    bgGradient: 'from-amber-950/80 via-charcoal-900 to-charcoal-950',
    previewDots: ['#16130e', '#8c711f', '#d4af37']
  },
  'royal-sapphire': {
    id: 'royal-sapphire',
    name: 'Royal Sapphire',
    tagline: 'Regal Navy & Sapphire Blue',
    primaryColor: '#2563eb',
    accentColor: '#60a5fa',
    borderGlow: 'border-blue-500/40 text-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.3)]',
    bgGradient: 'from-blue-950/80 via-charcoal-900 to-charcoal-950',
    previewDots: ['#0d152e', '#2563eb', '#60a5fa']
  }
};

export default function ThemeToggle({ theme, onThemeChange, compact = false }: ThemeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['luxury-green'];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (newTheme: AppTheme) => {
    onThemeChange(newTheme);
    setIsOpen(false);
  };

  const handleCycleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    const themes: AppTheme[] = ['luxury-green', 'midnight-gold', 'royal-sapphire'];
    const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
    onThemeChange(themes[nextIdx]);
  };

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl bg-charcoal-900/90 border transition-all duration-200 flex items-center justify-center cursor-pointer ${currentConfig.borderGlow}`}
          title={`Active Theme: ${currentConfig.name} (Click to switch)`}
        >
          <Palette className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-charcoal-950/95 border border-white/10 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1 font-mono text-xs"
            >
              <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3 text-gold-400" /> Switch Theme
                </span>
                <span className="text-gold-400">3 Options</span>
              </div>

              {Object.values(THEME_CONFIGS).map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white font-bold border border-white/15'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="flex -space-x-1">
                        {t.previewDots.map((c, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-charcoal-950 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-xs">{t.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-gold-400" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Prominent Header Theme Toggle Pill */}
      <div className="flex items-center bg-charcoal-900/90 border border-white/10 rounded-2xl p-1 shadow-lg backdrop-blur-md hover:border-gold-500/40 transition-all">
        {/* Main Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all text-xs font-mono cursor-pointer"
        >
          {/* Palette Icon with Active Color Glow */}
          <div
            className="p-1 rounded-lg flex items-center justify-center transition-all"
            style={{ backgroundColor: `${currentConfig.primaryColor}25`, color: currentConfig.primaryColor }}
          >
            <Palette className="w-3.5 h-3.5" />
          </div>

          {/* Theme Color Dots Preview */}
          <div className="flex items-center -space-x-1.5">
            {currentConfig.previewDots.map((dot, idx) => (
              <span
                key={idx}
                className="w-3 h-3 rounded-full border border-charcoal-950 shadow-md transform hover:scale-110 transition-transform"
                style={{ backgroundColor: dot }}
              />
            ))}
          </div>

          <span className="font-bold text-white tracking-wide hidden sm:inline-block">
            {currentConfig.name}
          </span>

          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* 1-Click Quick Cycle Button */}
        <button
          type="button"
          onClick={handleCycleTheme}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all border border-white/5 ml-1 cursor-pointer"
          title="Quick Cycle Theme (1-Click Switch)"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
        </button>
      </div>

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2.5 w-72 rounded-2xl bg-charcoal-900/95 border border-gold-500/30 p-2.5 shadow-2xl backdrop-blur-2xl z-50 space-y-1.5 font-mono gold-glow"
          >
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-gold-400" /> Workspace Brand Themes
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30">
                Quick Switch
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {Object.values(THEME_CONFIGS).map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left border ${
                      isActive
                        ? 'bg-gradient-to-r from-gold-500/20 via-white/5 to-transparent border-gold-400/50 text-white shadow-md'
                        : 'bg-charcoal-950/50 border-white/5 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Color Palette Swatch Circle */}
                      <div className="flex -space-x-1.5 p-1 rounded-lg bg-charcoal-950 border border-white/10">
                        {t.previewDots.map((c, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-charcoal-950 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      <div>
                        <span className={`text-xs font-bold block ${isActive ? 'text-gold-300' : 'text-gray-200'}`}>
                          {t.name}
                        </span>
                        <span className="text-[9px] text-gray-400 block font-sans">
                          {t.tagline}
                        </span>
                      </div>
                    </div>

                    {isActive ? (
                      <div className="w-5 h-5 rounded-full bg-gold-500 text-charcoal-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider group-hover:text-gray-300">
                        Select
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
