import React, { useState } from 'react';
import { 
  Share2, 
  Sparkles, 
  Copy, 
  Check, 
  Instagram, 
  Youtube, 
  MessageSquare, 
  Hash, 
  Sliders, 
  Film, 
  Send,
  Layers,
  Heart,
  TrendingUp,
  Award
} from 'lucide-react';
import { Project, WeddingCaptionResult } from '../../types';

interface ReelsCaptionGeneratorProps {
  projects: Project[];
  preselectedProjectId?: string;
}

const DELIVERABLE_TYPES = [
  "30s-60s Instagram Reel",
  "Cinematic Teaser",
  "3-5 Min Highlight Film",
  "Full YouTube Wedding Film",
  "Save The Date / Pre-Wedding"
];

const TONES = [
  { id: "Cinematic & Poetic", label: "🎬 Cinematic & Poetic", desc: "Soulful storytelling, timeless phrasing, high aesthetic" },
  { id: "Viral & Trendy Gen-Z", label: "⚡ Viral & Trendy", desc: "Relatable hooks, audio-trend references, high shareability" },
  { id: "Emotional & Heartfelt", label: "❤️ Emotional & Tearful", desc: "Family tears, emotional vows, deep love and promises" },
  { id: "Royal & Majestic", label: "👑 Royal & Majestic", desc: "Heritage royalty, grand celebration, regal palace vibe" },
  { id: "Fun, Quirky & Energetic", label: "🎉 Fun & Playful", desc: "Sangeet madness, friends banter, dancing celebration" }
];

export const ReelsCaptionGenerator: React.FC<ReelsCaptionGeneratorProps> = ({
  projects,
  preselectedProjectId
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId || "");
  const [coupleNames, setCoupleNames] = useState<string>("Rahul & Priya");
  const [weddingStyle, setWeddingStyle] = useState<string>("Royal Palace Celebration");
  const [deliverablesType, setDeliverablesType] = useState<string>("30s-60s Instagram Reel");
  const [tone, setTone] = useState<string>("Cinematic & Poetic");
  const [location, setLocation] = useState<string>("Udaipur, Rajasthan");
  const [studioName, setStudioName] = useState<string>("The Frame Cut Studio");
  const [editorName, setEditorName] = useState<string>("Vansh Tiwari");
  const [customNotes, setCustomNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeddingCaptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<"reels" | "youtube" | "whatsapp">("reels");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-fill from project selection
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;

    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setCoupleNames(proj.coupleName || `${proj.brideName} & ${proj.groomName}`);
      if (proj.studioName) setStudioName(proj.studioName);
      if (proj.assignedEditorName) setEditorName(proj.assignedEditorName);
      if (proj.venue) setLocation(proj.venue);
      if (proj.eventType) setWeddingStyle(proj.eventType);
      if (proj.notes) setCustomNotes(proj.notes);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupleNames,
          weddingStyle,
          eventType: weddingStyle,
          deliverablesType,
          tone,
          location,
          studioName,
          editorName,
          customNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate captions.");
      }

      setResult(data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while communicating with Gemini AI.");
    } finally {
      setLoading(false);
    }
  };

  const triggerCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyFullSocialKit = () => {
    if (!result) return;
    const lines = [
      `📱 COMPLETE SOCIAL DISTRIBUTION KIT - ${coupleNames.toUpperCase()}`,
      `Deliverable: ${deliverablesType} | Tone: ${tone}`,
      `Studio: ${studioName} | Location: ${location}`,
      "",
      "========================================",
      "📸 INSTAGRAM REELS (3 VARIATIONS)",
      "========================================",
      ...result.instagramReels.map((reel, idx) => 
        `\n--- REEL OPTION ${idx + 1} ---\n[ON-SCREEN HOOK]: ${reel.hookLine}\n\n[CAPTION]:\n${reel.caption}\n\n[HASHTAGS]:\n${reel.hashtags.join(" ")}\n\n[CALL TO ACTION]: ${reel.callToAction}\n`
      ),
      "",
      "========================================",
      "🎥 YOUTUBE MASTER PACKAGE",
      "========================================",
      "TITLES:",
      ...result.youtube.titleOptions.map((t, i) => `${i + 1}. ${t}`),
      "\nDESCRIPTION:\n" + result.youtube.description,
      "\nCHAPTERS:\n" + result.youtube.chapterTemplate,
      "\nTAGS:\n" + result.youtube.tags.join(", "),
      "",
      "========================================",
      "💬 WHATSAPP BROADCAST ANNOUNCEMENT",
      "========================================",
      result.whatsappStatusBlurb,
      "",
      "--- INSTAGRAM STORY TEASER ---",
      result.storyPostText
    ].join("\n");

    triggerCopy(lines, "full_kit");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-charcoal-900 via-luxury-green-950/60 to-charcoal-900 border border-luxury-green-800/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-[11px] font-mono font-medium">
              <Share2 className="w-3.5 h-3.5" />
              <span>AI Social Content Strategist</span>
            </div>
            <h3 className="text-xl font-bold text-white font-display">Reels & YouTube Caption Generator</h3>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              1-Click generate scroll-stopping hooks, high-engagement Instagram Reels captions, trending hashtags, high-CTR YouTube video descriptions, and client WhatsApp release blurbs.
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

      {/* Grid: Form & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-5 space-y-5 bg-charcoal-900/90 p-5 rounded-2xl border border-luxury-green-800/20">
          <div className="flex items-center justify-between pb-3 border-b border-luxury-green-800/15">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Content Configuration
            </h4>
            <span className="text-[10px] text-gray-500">Gemini 3.8 Flash</span>
          </div>

          {/* Couple & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Couple Names</label>
              <input
                type="text"
                value={coupleNames}
                onChange={(e) => setCoupleNames(e.target.value)}
                placeholder="e.g. Rahul & Priya"
                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Destination / Venue</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. The Leela Palace, Udaipur"
                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Deliverable Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Target Deliverable</label>
            <select
              value={deliverablesType}
              onChange={(e) => setDeliverablesType(e.target.value)}
              className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-500 focus:outline-none"
            >
              {DELIVERABLE_TYPES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Caption Tone & Vibe</label>
            <div className="space-y-1.5">
              {TONES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    tone === t.id
                      ? "bg-gold-500/10 border-gold-500 text-gold-400"
                      : "bg-charcoal-950/60 border-luxury-green-800/20 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{t.label}</span>
                    <span className="text-[10px] text-gray-500 block">{t.desc}</span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    tone === t.id ? "border-gold-500 bg-gold-500 text-charcoal-950" : "border-gray-600"
                  }`}>
                    {tone === t.id && <Check className="w-2.5 h-2.5 text-charcoal-950 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Studio Brand</label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="The Frame Cut Studio"
                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Lead Editor</label>
              <input
                type="text"
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                placeholder="Vansh Tiwari"
                className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Story Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Special Moments / Story Keywords</label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. 10-year childhood sweethearts, rainy day pheras, surprise flashmob by groom squad"
              className="w-full bg-charcoal-950 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-gold-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs font-display flex items-center justify-center space-x-2 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Crafting Viral Hooks & Captions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Complete Social Media Kit</span>
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <span className="font-bold block mb-1">Generation Error</span>
              {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="h-full min-h-[420px] rounded-2xl border border-dashed border-luxury-green-800/20 bg-charcoal-900/30 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-luxury-green-950/60 border border-luxury-green-800/30 flex items-center justify-center text-gold-400">
                <Share2 className="w-8 h-8 opacity-70" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-sm font-bold text-white">No Captions Generated Yet</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Enter or select a couple's wedding details, set your desired tone, and let Gemini generate customized Instagram Reels hooks, YouTube descriptions, tags, and WhatsApp announcement blurbs.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[10px] bg-charcoal-950 border border-luxury-green-800/20 text-gray-400 px-2.5 py-1 rounded-full">🎣 High-CTR Hooks</span>
                <span className="text-[10px] bg-charcoal-950 border border-luxury-green-800/20 text-gray-400 px-2.5 py-1 rounded-full">#️⃣ Trending Hashtags</span>
                <span className="text-[10px] bg-charcoal-950 border border-luxury-green-800/20 text-gray-400 px-2.5 py-1 rounded-full">📺 YouTube Chapters</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[420px] rounded-2xl border border-luxury-green-800/20 bg-charcoal-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-white">Generating Multi-Platform Kit...</h4>
                <p className="text-xs text-gray-400">
                  Formulating hooks, analyzing wedding hashtags for {location}, and assembling YouTube chapter timestamps.
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Output Sub-Tabs */}
              <div className="flex items-center justify-between bg-charcoal-900 p-1.5 rounded-2xl border border-luxury-green-800/20">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveOutputTab("reels")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                      activeOutputTab === "reels"
                        ? "bg-gold-500 text-charcoal-950 font-bold shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram Reels ({result.instagramReels.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveOutputTab("youtube")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                      activeOutputTab === "youtube"
                        ? "bg-gold-500 text-charcoal-950 font-bold shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>YouTube Package</span>
                  </button>

                  <button
                    onClick={() => setActiveOutputTab("whatsapp")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                      activeOutputTab === "whatsapp"
                        ? "bg-gold-500 text-charcoal-950 font-bold shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp & Stories</span>
                  </button>
                </div>

                <button
                  onClick={copyFullSocialKit}
                  className="px-3 py-1.5 rounded-xl bg-luxury-green-950 border border-luxury-green-800/30 hover:border-gold-500/50 text-xs text-gold-400 font-medium flex items-center space-x-1.5 transition-all shrink-0"
                >
                  {copiedKey === "full_kit" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "full_kit" ? "Kit Copied!" : "Copy Full Kit"}</span>
                </button>
              </div>

              {/* TAB 1: INSTAGRAM REELS */}
              {activeOutputTab === "reels" && (
                <div className="space-y-4">
                  {result.instagramReels.map((reel, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-4 hover:border-luxury-green-800/40 transition-all"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-luxury-green-800/10">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 text-[11px] font-mono font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white font-display">
                            {idx === 0 ? "⚡ Hook-First Viral Style" : idx === 1 ? "🎬 Poetic & Cinematic Love Story" : "🎉 Modern High-Energy Style"}
                          </span>
                        </div>
                        <button
                          onClick={() => triggerCopy(`${reel.caption}\n\n${reel.hashtags.join(" ")}`, `reel_${idx}`)}
                          className="inline-flex items-center space-x-1 text-xs text-gold-400 hover:text-gold-300 font-medium bg-charcoal-950 px-2.5 py-1 rounded-lg border border-luxury-green-800/30"
                        >
                          {copiedKey === `reel_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === `reel_${idx}` ? "Copied!" : "Copy Caption"}</span>
                        </button>
                      </div>

                      {/* On-screen text hook */}
                      <div className="p-3 rounded-xl bg-charcoal-950 border border-luxury-green-800/20 flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wide">
                            🎥 On-Screen Hook (First 3 Seconds)
                          </span>
                          <p className="text-xs text-white font-medium">"{reel.hookLine}"</p>
                        </div>
                        <button
                          onClick={() => triggerCopy(reel.hookLine, `hook_${idx}`)}
                          className="p-1 rounded-md text-gray-400 hover:text-gold-400 shrink-0"
                          title="Copy hook only"
                        >
                          {copiedKey === `hook_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Caption Body */}
                      <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-charcoal-950/40 p-3 rounded-xl border border-luxury-green-800/10">
                        {reel.caption}
                      </div>

                      {/* Hashtags & CTA */}
                      <div className="space-y-2 pt-1 border-t border-luxury-green-800/10 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-gray-500 uppercase">Hashtag Cloud ({reel.hashtags.length})</span>
                          <button
                            onClick={() => triggerCopy(reel.hashtags.join(" "), `tags_${idx}`)}
                            className="text-[11px] text-gold-400 hover:underline flex items-center space-x-1"
                          >
                            {copiedKey === `tags_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy Hashtags</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                          {reel.hashtags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[10px] text-gray-400 bg-charcoal-950 px-2 py-0.5 rounded border border-luxury-green-800/20 font-mono">
                              {tag.startsWith("#") ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: YOUTUBE MASTER PACKAGE */}
              {activeOutputTab === "youtube" && (
                <div className="space-y-4">
                  {/* High-CTR Titles */}
                  <div className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-luxury-green-800/10">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        High-CTR Video Title Options
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {result.youtube.titleOptions.map((title, tIdx) => (
                        <div
                          key={tIdx}
                          className="p-3 rounded-xl bg-charcoal-950 border border-luxury-green-800/20 flex items-center justify-between gap-3 text-xs text-white group hover:border-gold-500/30 transition-all"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gold-400 font-bold">{tIdx + 1}.</span>
                            <span>{title}</span>
                          </div>
                          <button
                            onClick={() => triggerCopy(title, `yt_title_${tIdx}`)}
                            className="p-1 rounded-md text-gray-400 hover:text-gold-400 shrink-0"
                            title="Copy title"
                          >
                            {copiedKey === `yt_title_${tIdx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* YouTube Description */}
                  <div className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-luxury-green-800/10">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        SEO YouTube Description & Credits
                      </h4>
                      <button
                        onClick={() => triggerCopy(result.youtube.description, "yt_desc")}
                        className="inline-flex items-center space-x-1 text-xs text-gold-400 hover:text-gold-300 font-medium bg-charcoal-950 px-2.5 py-1 rounded-lg border border-luxury-green-800/30"
                      >
                        {copiedKey === "yt_desc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Description</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-charcoal-950 p-4 rounded-xl border border-luxury-green-800/20 max-h-72 overflow-y-auto font-mono text-[11px]">
                      {result.youtube.description}
                    </div>
                  </div>

                  {/* Chapter Timestamps & Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono uppercase">Chapter Timestamps</span>
                        <button
                          onClick={() => triggerCopy(result.youtube.chapterTemplate, "yt_chap")}
                          className="text-[11px] text-gold-400 hover:underline flex items-center space-x-1"
                        >
                          {copiedKey === "yt_chap" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy Chapters</span>
                        </button>
                      </div>
                      <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed bg-charcoal-950 p-3 rounded-xl border border-luxury-green-800/20 font-mono text-[11px]">
                        {result.youtube.chapterTemplate}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono uppercase">Search Tags ({result.youtube.tags.length})</span>
                        <button
                          onClick={() => triggerCopy(result.youtube.tags.join(", "), "yt_tags")}
                          className="text-[11px] text-gold-400 hover:underline flex items-center space-x-1"
                        >
                          {copiedKey === "yt_tags" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy Tags</span>
                        </button>
                      </div>
                      <div className="text-xs text-gray-300 bg-charcoal-950 p-3 rounded-xl border border-luxury-green-800/20 font-mono text-[11px] max-h-36 overflow-y-auto">
                        {result.youtube.tags.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WHATSAPP & INSTAGRAM STORIES */}
              {activeOutputTab === "whatsapp" && (
                <div className="space-y-4">
                  {/* WhatsApp Release Blurb */}
                  <div className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-luxury-green-800/10">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          WhatsApp Client Announcement Blurb
                        </h4>
                      </div>
                      <button
                        onClick={() => triggerCopy(result.whatsappStatusBlurb, "wa_blurb")}
                        className="inline-flex items-center space-x-1 text-xs text-gold-400 hover:text-gold-300 font-medium bg-charcoal-950 px-2.5 py-1 rounded-lg border border-luxury-green-800/30"
                      >
                        {copiedKey === "wa_blurb" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy for WhatsApp</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Send directly to the couple and families on WhatsApp to announce their video release:
                    </p>
                    <div className="text-xs text-gray-200 whitespace-pre-line leading-relaxed bg-charcoal-950 p-4 rounded-xl border border-luxury-green-800/20 border-l-4 border-l-emerald-500">
                      {result.whatsappStatusBlurb}
                    </div>
                  </div>

                  {/* 24-hr Instagram Story Teaser */}
                  <div className="p-5 rounded-2xl bg-charcoal-900 border border-luxury-green-800/20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-luxury-green-800/10">
                      <div className="flex items-center space-x-2">
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          24-Hour Instagram Story Teaser Text
                        </h4>
                      </div>
                      <button
                        onClick={() => triggerCopy(result.storyPostText, "story_teaser")}
                        className="inline-flex items-center space-x-1 text-xs text-gold-400 hover:text-gold-300 font-medium bg-charcoal-950 px-2.5 py-1 rounded-lg border border-luxury-green-800/30"
                      >
                        {copiedKey === "story_teaser" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Story Text</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-200 bg-charcoal-950 p-4 rounded-xl border border-luxury-green-800/20 border-l-4 border-l-pink-500">
                      {result.storyPostText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
