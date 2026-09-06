import React, { useState } from 'react';
import { 
  Music, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Sliders, 
  Headphones, 
  Clock, 
  Palette, 
  Volume2, 
  FileText,
  RotateCcw,
  Film
} from 'lucide-react';
import { Project, SoundtrackRecommendation, WeddingSoundtrackResult } from '../../types';

interface WeddingSoundtrackSuggesterProps {
  projects: Project[];
  preselectedProjectId?: string;
}

const WEDDING_STYLES = [
  { id: "Royal Rajasthani", label: "🏰 Royal Rajasthani", desc: "Palace grandeur, heritage folk & majestic shehnai" },
  { id: "Modern Punjabi", label: "🔥 Modern Punjabi", desc: "Anand Karaj soulfulness + high-energy dhol & bhangra" },
  { id: "Beach & Coastal", label: "🏖️ Beach & Coastal", desc: "Goa/destination sunset, tropical romance & acoustic chill" },
  { id: "Elegant Christian", label: "🕊️ Elegant Christian", desc: "Cathedral aisle walk, piano chords & timeless vows" },
  { id: "South Indian Traditional", label: "🪔 South Indian", desc: "Muhurtham sacred nadaswaram, violin & classical fusion" },
  { id: "Bollywood Luxury Glam", label: "✨ Bollywood Glam", desc: "High-fashion cocktail, sangeet mashup & blockbuster energy" },
  { id: "Intimate Mountain / Hill", label: "🏔️ Intimate Mountain", desc: "Cozy hills, indie acoustic guitar & scenic cinematic drone" },
  { id: "Cross-Cultural Fusion", label: "🌏 Cross-Cultural", desc: "East-meets-West harmonies & multi-tradition storytelling" }
];

const CEREMONIES = [
  { id: "Full Wedding Film Arc", label: "Full Film Soundtrack Arc (5-7 tracks across whole film)" },
  { id: "60-sec Teaser / Reel", label: "60-Sec Cinematic Teaser (Fast-building drops)" },
  { id: "Bridal Entry & Varmala", label: "Bridal Entry & Varmala (Emotional crescendo)" },
  { id: "Sangeet & Cocktail Night", label: "Sangeet & Cocktail (Dance bangers & mashup)" },
  { id: "Pheras & Sacred Vows", label: "Pheras & Sacred Vows (Devotional / Ambient)" },
  { id: "Emotional Bidaai / Send-off", label: "Emotional Bidaai (Tear-jerker / Heartfelt)" },
  { id: "Haldi & Mehndi Madness", label: "Haldi & Mehndi (Playful, colorful & energetic)" }
];

const MOODS = [
  "Royal & Grandeur",
  "Deeply Emotional & Tear-jerker",
  "Romantic & Dreamy Acoustic",
  "Modern High-Energy & Euphoric",
  "Sufi & Soulful Devotional",
  "Fun, Playful & Celebratory"
];

const LANGUAGES = [
  "Hindi / Bollywood & Indie",
  "Punjabi Pop & Folk",
  "Sufi & Coke Studio",
  "Instrumental / Shehnai / Flute / Sitar Fusion",
  "English Acoustic & Cinematic Indie",
  "Bilingual / Multi-language Blend"
];

export const WeddingSoundtrackSuggester: React.FC<WeddingSoundtrackSuggesterProps> = ({
  projects,
  preselectedProjectId
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId || "");
  const [coupleNames, setCoupleNames] = useState<string>("Rahul & Priya");
  const [weddingStyle, setWeddingStyle] = useState<string>("Royal Rajasthani");
  const [ceremony, setCeremony] = useState<string>("Full Wedding Film Arc");
  const [mood, setMood] = useState<string>("Royal & Grandeur");
  const [languagePreference, setLanguagePreference] = useState<string>("Hindi / Bollywood & Indie");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeddingSoundtrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracklist, setCopiedTracklist] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Sync when project dropdown changes
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;

    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setCoupleNames(proj.coupleName || `${proj.brideName} & ${proj.groomName}`);
      if (proj.venue?.toLowerCase().includes("beach") || proj.venue?.toLowerCase().includes("goa")) {
        setWeddingStyle("Beach & Coastal");
      } else if (proj.venue?.toLowerCase().includes("palace") || proj.venue?.toLowerCase().includes("udaipur") || proj.venue?.toLowerCase().includes("jaipur")) {
        setWeddingStyle("Royal Rajasthani");
      } else if (proj.eventType?.toLowerCase().includes("punjabi")) {
        setWeddingStyle("Modern Punjabi");
      } else if (proj.eventType?.toLowerCase().includes("christian") || proj.eventType?.toLowerCase().includes("church")) {
        setWeddingStyle("Elegant Christian");
      }
      if (proj.notes) {
        setNotes(proj.notes);
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini/suggest-soundtrack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingStyle,
          ceremony,
          mood,
          languagePreference,
          coupleNames,
          notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to curate soundtrack.");
      }

      setResult(data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while communicating with Gemini AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFullTracklist = () => {
    if (!result) return;
    const lines = [
      `🎵 SOUNDTRACK CURATION - ${coupleNames.toUpperCase()}`,
      `Aesthetic: ${weddingStyle} | Mood: ${mood}`,
      `Vibe: ${result.weddingThemeVibe}`,
      "",
      "--- TRACKLIST FOR EDITOR TIMELINE ---",
      ...result.soundtracks.map((t, i) => 
        `${i + 1}. [${t.segment}] "${t.songTitle}" by ${t.artist}\n   Tempo: ${t.tempoBpm} | Mood: ${t.mood}\n   Cut Tip: ${t.editingTip}\n   Search: ${t.searchQuery}\n`
      ),
      "--- AUDIO MIXING DIRECTIVES ---",
      ...result.mixingTips.map(tip => `• ${tip}`),
      "",
      "Curated with Frame Cut Studio AI Sound Supervisor"
    ].join("\n");

    navigator.clipboard.writeText(lines);
    setCopiedTracklist(true);
    setTimeout(() => setCopiedTracklist(false), 2500);
  };

  const handleCopySingleTrack = (track: SoundtrackRecommendation, idx: number) => {
    const text = `[${track.segment}] "${track.songTitle}" - ${track.artist} (${track.tempoBpm}) | Cut Tip: ${track.editingTip}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-charcoal-900 via-luxury-green-950/60 to-charcoal-900 border border-luxury-green-800/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-[11px] font-mono font-medium">
              <Headphones className="w-3.5 h-3.5" />
              <span>AI Wedding Sound Designer</span>
            </div>
            <h3 className="text-xl font-bold text-white font-display">Soundtrack & Audio Suggester</h3>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              Eliminate hours of music browsing. Curate culturally resonant, trending tracks mapped to your wedding video's exact emotional arc, tempo BPM, and editing transitions.
            </p>
          </div>

          {projects.length > 0 && (
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs text-gray-400">Load Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="bg-charcoal-950 border border-luxury-green-800/30 text-xs text-white rounded-xl px-3 py-2 focus:border-gold-500 focus:outline-none max-w-[220px]"
              >
                <option value="">Custom / Manual Input</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.coupleName || `${p.brideName} & ${p.groomName}`} ({p.studioName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Input Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-5 bg-charcoal-900/90 p-5 rounded-2xl border border-luxury-green-800/20">
          <div className="flex items-center justify-between pb-3 border-b border-luxury-green-800/15">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Production Parameters
            </h4>
            <span className="text-[10px] text-gray-500">Gemini 3.8 Flash</span>
          </div>

          {/* Couple Names */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Couple Names / Wedding Title</label>
            <input
              type="text"
              value={coupleNames}
              onChange={(e) => setCoupleNames(e.target.value)}
              placeholder="e.g. Rahul & Priya / Virushka"
              className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-gold-500 focus:outline-none"
            />
          </div>

          {/* Wedding Style selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Wedding Style & Aesthetic</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEDDING_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setWeddingStyle(style.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    weddingStyle === style.id
                      ? "bg-gold-500/10 border-gold-500 text-gold-400 shadow-sm shadow-gold-500/10"
                      : "bg-charcoal-950/60 border-luxury-green-800/20 text-gray-400 hover:text-gray-200 hover:border-luxury-green-800/40"
                  }`}
                >
                  <span className="text-xs font-bold block">{style.label}</span>
                  <span className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ceremony Deliverable */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Film Deliverable / Ceremony Focus</label>
            <select
              value={ceremony}
              onChange={(e) => setCeremony(e.target.value)}
              className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-gold-500 focus:outline-none"
            >
              {CEREMONIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Mood & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Emotional Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-500 focus:outline-none"
              >
                {MOODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Language / Genre</label>
              <select
                value={languagePreference}
                onChange={(e) => setLanguagePreference(e.target.value)}
                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-500 focus:outline-none"
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Editor Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Couple requested slow-motion flute entry, upbeat dhol at sangeet"
              className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-gold-500 focus:outline-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs font-display flex items-center justify-center space-x-2 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Auditioning & Matching Soundtracks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Curated Soundtrack Sequence</span>
              </>
            )}
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <span className="font-bold block mb-1">Curation Error</span>
              {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="h-full min-h-[420px] rounded-2xl border border-dashed border-luxury-green-800/20 bg-charcoal-900/30 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-luxury-green-950/60 border border-luxury-green-800/30 flex items-center justify-center text-gold-400">
                <Music className="w-8 h-8 opacity-70" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-sm font-bold text-white">No Soundtrack Generated Yet</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Select your wedding aesthetic, mood, and ceremony deliverable on the left, then click <strong className="text-gold-400">Generate</strong> to get an AI-curated tracklist with tempo markings and video cut suggestions.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[10px] bg-charcoal-950 border border-luxury-green-800/20 text-gray-400 px-2.5 py-1 rounded-full">✨ Auto BPM Tempo</span>
                <span className="text-[10px] bg-charcoal-950 border border-luxury-green-800/20 text-gray-400 px-2.5 py-1 rounded-full">🎬 Video Transition Tips</span>
                <span className="text-[10px] bg-charcoal-950 border border-luxury-green-800/20 text-gray-400 px-2.5 py-1 rounded-full">🔗 1-Click Search Links</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[420px] rounded-2xl border border-luxury-green-800/20 bg-charcoal-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
                <Music className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-white">Analyzing Wedding Rhythm & Emotion...</h4>
                <p className="text-xs text-gray-400">
                  Selecting tracks with matching emotional arcs for {weddingStyle} styling. Generating Premiere / DaVinci editing cues.
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Aesthetic Vibe Card */}
              <div className="p-4 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-gold-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Theme Identity</span>
                  </div>
                  <button
                    onClick={handleCopyFullTracklist}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-luxury-green-950 border border-luxury-green-800/30 hover:border-gold-500/50 rounded-xl text-xs text-gold-400 hover:text-gold-300 font-medium transition-all"
                  >
                    {copiedTracklist ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTracklist ? "Tracklist Copied!" : "Copy Full Tracklist"}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{result.weddingThemeVibe}"
                </p>
                {result.colorPaletteSuggestion && (
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[10px] text-gray-500 font-mono uppercase">Suggested Grade Palette:</span>
                    <span className="text-[11px] text-gold-400 font-medium">{result.colorPaletteSuggestion}</span>
                  </div>
                )}
              </div>

              {/* Tracks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>Timeline Sequence ({result.soundtracks.length} tracks)</span>
                  <span className="text-[11px] font-mono text-gold-400">Tempo & Cut Guidelines</span>
                </div>

                {result.soundtracks.map((track, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 hover:border-luxury-green-800/40 transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-bold">
                            {idx + 1}. {track.segment}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-charcoal-950 text-emerald-400 border border-emerald-500/20">
                            {track.tempoBpm}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-charcoal-950 text-gray-400 border border-luxury-green-800/20">
                            {track.genre}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
                          <span>{track.songTitle}</span>
                          <span className="text-xs text-gray-400 font-normal">by {track.artist}</span>
                        </h4>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleCopySingleTrack(track, idx)}
                          title="Copy track info"
                          className="p-1.5 rounded-lg bg-charcoal-950 border border-luxury-green-800/30 text-gray-400 hover:text-gold-400 transition-colors"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(track.searchQuery)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Listen on YouTube"
                          className="p-1.5 rounded-lg bg-charcoal-950 border border-luxury-green-800/30 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-luxury-green-800/10">
                      <div className="text-gray-300">
                        <span className="text-gold-400 font-medium">Why It Fits: </span>
                        {track.whyItFits}
                      </div>
                      <div className="text-gray-300 bg-charcoal-950/60 p-2 rounded-xl border border-luxury-green-800/15">
                        <span className="text-emerald-400 font-medium">✂️ Editor Cut Cue: </span>
                        {track.editingTip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mixing Directives */}
              {result.mixingTips && result.mixingTips.length > 0 && (
                <div className="p-4 rounded-2xl bg-luxury-green-950/40 border border-luxury-green-800/30 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
                    <Volume2 className="w-4 h-4 text-gold-400" />
                    <span>Sound Engineer Audio Directives</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.mixingTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-gray-300 flex items-start space-x-2">
                        <span className="text-gold-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
