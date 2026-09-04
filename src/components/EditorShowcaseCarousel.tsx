import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Film, Eye, Maximize2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor, EditorShowcaseShot, Project } from '../types';

// Curated high-aesthetic cinematic wedding frames for fallback showcase
export const DEFAULT_WEDDING_SHOWCASES: EditorShowcaseShot[] = [
  {
    id: 'shot-1',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
    title: 'Royal Palace Sunset Teaser',
    coupleName: 'Aarav & Meera',
    category: 'Cinematic Teaser'
  },
  {
    id: 'shot-2',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
    title: 'Heritage Varmala Highlights',
    coupleName: 'Kabir & Ananya',
    category: 'Full Film'
  },
  {
    id: 'shot-3',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800',
    title: 'Lakeside Pre-Wedding Mood',
    coupleName: 'Rohan & Priya',
    category: 'Drone & Pre-Wedding'
  }
];

// Aesthetic project-to-showcase mapper
export const getEditorShowcaseShots = (editor: Editor, projects?: Project[]): EditorShowcaseShot[] => {
  // If custom showcase shots exist, return them
  if (editor.showcaseShots && editor.showcaseShots.length > 0) {
    return editor.showcaseShots.slice(0, 3);
  }

  // If editor has assigned completed or active projects with couple photos, extract them
  if (projects && projects.length > 0) {
    const editorProjs = projects.filter(
      p => (p.assignedEditorId === editor.id || p.secondEditorId === editor.id) && p.couplePhoto
    );

    if (editorProjs.length > 0) {
      const derived: EditorShowcaseShot[] = editorProjs.slice(0, 3).map((p, idx) => ({
        id: `proj-shot-${p.id}`,
        url: p.couplePhoto || DEFAULT_WEDDING_SHOWCASES[idx % DEFAULT_WEDDING_SHOWCASES.length].url,
        title: `${p.eventType || 'Wedding'} Master Cut`,
        coupleName: p.coupleName || `${p.brideName || 'Bride'} & ${p.groomName || 'Groom'}`,
        category: idx === 0 ? 'Cinematic Teaser' : idx === 1 ? 'Full Film' : 'Traditional Cut'
      }));

      // Pad with defaults if less than 3
      while (derived.length < 3) {
        const fallback = DEFAULT_WEDDING_SHOWCASES[derived.length];
        derived.push(fallback);
      }
      return derived;
    }
  }

  // Fallback distinct presets customized per editor index/hash
  const hash = (editor.name || 'Editor').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const PRESET_COLLECTION: EditorShowcaseShot[][] = [
    [
      {
        id: 'set1-1',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
        title: 'Golden Hour Cinematic Varmala',
        coupleName: 'Aditya & Rhea',
        category: 'Cinematic Teaser'
      },
      {
        id: 'set1-2',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
        title: 'Palace Mandap Drone Frame',
        coupleName: 'Sameer & Tanvi',
        category: 'Full Film'
      },
      {
        id: 'set1-3',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800',
        title: 'Udaipur Lakeside Story',
        coupleName: 'Vikram & Pooja',
        category: 'Drone & Pre-Wedding'
      }
    ],
    [
      {
        id: 'set2-1',
        url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800',
        title: 'Emotional Pheras & Saptapadi',
        coupleName: 'Arjun & Tara',
        category: 'Full Film'
      },
      {
        id: 'set2-2',
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800',
        title: 'Royal Sangeet High-Octane Cut',
        coupleName: 'Dev & Ishita',
        category: 'Cinematic Teaser'
      },
      {
        id: 'set2-3',
        url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&q=80&w=800',
        title: 'Vintage Film Haldi Reel',
        coupleName: 'Karan & Simran',
        category: 'Color Grading'
      }
    ],
    [
      {
        id: 'set3-1',
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800',
        title: 'Luxury Destination Entry',
        coupleName: 'Nikhil & Radhika',
        category: 'Cinematic Teaser'
      },
      {
        id: 'set3-2',
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800',
        title: 'Candid Veil & Bridal Portrait',
        coupleName: 'Manish & Shreya',
        category: 'Traditional Cut'
      },
      {
        id: 'set3-3',
        url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800',
        title: 'Starlit Reception Glow',
        coupleName: 'Varun & Natasha',
        category: 'Full Film'
      }
    ]
  ];

  return PRESET_COLLECTION[hash % PRESET_COLLECTION.length];
};

interface EditorShowcaseCarouselProps {
  editor: Editor;
  projects?: Project[];
  autoPlayInterval?: number;
  compact?: boolean;
}

export default function EditorShowcaseCarousel({
  editor,
  projects,
  autoPlayInterval = 4500,
  compact = true
}: EditorShowcaseCarouselProps) {
  const shots = getEditorShowcaseShots(editor, projects);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxShot, setLightboxShot] = useState<EditorShowcaseShot | null>(null);

  // Auto cycle carousel
  useEffect(() => {
    if (isHovered || shots.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % shots.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isHovered, shots.length, autoPlayInterval]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + shots.length) % shots.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % shots.length);
  };

  const currentShot = shots[currentIndex] || shots[0];

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden bg-charcoal-950/80 border border-gold-500/20 shadow-inner group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentShot.id + currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img
              src={currentShot.url}
              alt={currentShot.title}
              className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover/carousel:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-black/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Top Badges: Category & Index Indicator */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-gold-500/30 text-[9px] font-mono font-bold text-gold-300 shadow-md">
            <Sparkles className="w-2.5 h-2.5 text-gold-400" />
            <span>Top Wedding Shot #{currentIndex + 1}</span>
          </span>

          <span className="inline-block px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[9px] font-mono text-gray-300 shadow-md">
            {currentShot.category || 'Master Cut'}
          </span>
        </div>

        {/* Bottom Metadata Info Banner */}
        <div className="absolute bottom-2 left-2.5 right-2.5 z-10 pointer-events-none">
          <p className="text-[11px] font-bold text-white tracking-wide truncate drop-shadow-md">
            {currentShot.title}
          </p>
          {currentShot.coupleName && (
            <p className="text-[9px] font-mono text-gold-400/90 truncate flex items-center space-x-1 drop-shadow-sm">
              <Film className="w-2.5 h-2.5 shrink-0" />
              <span>{currentShot.coupleName}</span>
            </p>
          )}
        </div>

        {/* Navigation Arrows */}
        {shots.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/70 hover:bg-gold-500/90 hover:text-black text-white/90 flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all opacity-0 group-hover/carousel:opacity-100 z-20 cursor-pointer shadow-lg active:scale-95"
              title="Previous Shot"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/70 hover:bg-gold-500/90 hover:text-black text-white/90 flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all opacity-0 group-hover/carousel:opacity-100 z-20 cursor-pointer shadow-lg active:scale-95"
              title="Next Shot"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Quick View Fullscreen trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLightboxShot(currentShot);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black text-gray-300 hover:text-gold-400 flex items-center justify-center backdrop-blur-sm border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-20 cursor-pointer"
          title="Inspect Full Resolution"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Slide Navigation Pagination Dots */}
      <div className="flex items-center justify-center space-x-1.5 py-1.5 bg-charcoal-950/90 border-t border-white/5">
        {shots.map((shot, idx) => (
          <button
            key={shot.id + idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-4 h-1.5 bg-gradient-to-r from-gold-400 to-amber-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                : 'w-1.5 h-1.5 bg-gray-600/70 hover:bg-gray-400'
            }`}
            title={`View ${shot.title}`}
          />
        ))}
      </div>

      {/* High-Resolution Modal Lightbox */}
      <AnimatePresence>
        {lightboxShot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-md" 
              onClick={() => setLightboxShot(null)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative max-w-4xl w-full bg-charcoal-900 border border-gold-500/30 rounded-3xl overflow-hidden shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full">
                <img
                  src={lightboxShot.url}
                  alt={lightboxShot.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-5 flex items-center justify-between bg-charcoal-950 border-t border-white/10">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 font-mono text-[10px] font-bold">
                      {lightboxShot.category || 'Master Shot'}
                    </span>
                    <span className="text-white font-bold text-sm">{lightboxShot.title}</span>
                  </div>
                  {lightboxShot.coupleName && (
                    <p className="text-xs font-mono text-gray-400 mt-1">
                      Couple: <span className="text-gold-400">{lightboxShot.coupleName}</span> • Edited by {editor.name}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setLightboxShot(null)}
                  className="px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-white text-xs font-bold rounded-xl border border-white/10 cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
