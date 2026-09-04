import React from 'react';
import { Film, CheckSquare, Plus, Trash2, FileText, CheckCircle2, Square, Sparkles } from 'lucide-react';

interface IntakeTabDeliverablesProps {
  availableFunctions: string[];
  selectedFunctions: string[];
  setSelectedFunctions: (val: string[]) => void;
  customFunctionInput: string;
  setCustomFunctionInput: (val: string) => void;
  handleAddCustomFunction: () => void;
  customMilestones: { id: string; label: string; completed: boolean }[];
  setCustomMilestones: (val: { id: string; label: string; completed: boolean }[]) => void;
  newMilestoneInput: string;
  setNewMilestoneInput: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  onClearError: () => void;
}

export default function IntakeTabDeliverables({
  availableFunctions,
  selectedFunctions,
  setSelectedFunctions,
  customFunctionInput,
  setCustomFunctionInput,
  handleAddCustomFunction,
  customMilestones,
  setCustomMilestones,
  newMilestoneInput,
  setNewMilestoneInput,
  notes,
  setNotes,
  onClearError
}: IntakeTabDeliverablesProps) {

  const toggleFunction = (func: string) => {
    if (selectedFunctions.includes(func)) {
      setSelectedFunctions(selectedFunctions.filter(f => f !== func));
    } else {
      setSelectedFunctions([...selectedFunctions, func]);
    }
    onClearError();
  };

  const handleAddMilestone = () => {
    if (newMilestoneInput.trim()) {
      setCustomMilestones([
        ...customMilestones,
        {
          id: `milestone-${Date.now()}`,
          label: newMilestoneInput.trim(),
          completed: false
        }
      ]);
      setNewMilestoneInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
            🎞️
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">Step 4: Deliverables, Milestones & Notes</h4>
            <p className="text-xs text-gray-400 font-mono">Select video outputs to produce, customize stage milestones, and append special editing directions.</p>
          </div>
        </div>
      </div>

      {/* Deliverables Selection */}
      <div className="p-5 bg-charcoal-900/60 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">
            Cinematic Deliverables ({selectedFunctions.length} Selected)
          </label>
          <span className="text-[11px] font-mono text-gold-400">Click deliverables to toggle</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableFunctions.map((func) => {
            const isSelected = selectedFunctions.includes(func);
            return (
              <button
                key={func}
                type="button"
                onClick={() => toggleFunction(func)}
                className={`flex items-center justify-between p-3.5 px-4 rounded-xl border cursor-pointer select-none transition-all text-left ${
                  isSelected 
                    ? 'bg-gold-500/15 border-gold-500/40 text-gold-200 font-bold shadow-md' 
                    : 'bg-charcoal-950/80 border-white/5 text-gray-400 hover:border-white/15 hover:text-white'
                }`}
              >
                <span className="text-xs md:text-sm truncate font-medium">{func}</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ml-1.5 ${
                  isSelected ? 'bg-gold-500 border-gold-500 text-charcoal-950 font-bold' : 'border-gray-600'
                }`}>
                  {isSelected ? "✓" : "+"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Add Customized Deliverable */}
        <div className="flex items-center bg-charcoal-950 rounded-xl border border-white/10 p-1.5 pl-4 focus-within:border-gold-500/40 transition-colors">
          <input 
            type="text" 
            placeholder="Add customized deliverable (e.g. Drone Montage, Parents Interview)..." 
            value={customFunctionInput} 
            onChange={(e) => setCustomFunctionInput(e.target.value)} 
            className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-white py-1.5 placeholder-gray-600 font-mono" 
            onKeyDown={(e) => { 
              if (e.key === 'Enter') { 
                e.preventDefault(); 
                e.stopPropagation();
                handleAddCustomFunction(); 
              } 
            }} 
          />
          <button 
            type="button" 
            onClick={handleAddCustomFunction} 
            className="px-4 py-2 bg-charcoal-800 hover:bg-gold-500 hover:text-charcoal-950 border border-white/10 hover:border-gold-500 text-gray-200 text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 font-mono"
          >
            + Add Deliverable
          </button>
        </div>
      </div>

      {/* Custom Milestones Roadmap */}
      <div className="p-5 bg-charcoal-900/60 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">
              Project Milestone Checklist ({customMilestones.length} Stages)
            </h5>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">Toggle initial completed states, append custom steps, or delete unneeded steps.</p>
          </div>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {customMilestones.map((m, idx) => (
            <div 
              key={m.id} 
              className="flex items-center justify-between p-3 px-4 rounded-xl border border-white/5 bg-charcoal-950/80 hover:bg-charcoal-950 transition-all text-xs md:text-sm text-white"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <span className="w-5 h-5 rounded bg-charcoal-800 text-gold-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                  {idx + 1}
                </span>
                <input 
                  type="checkbox" 
                  checked={m.completed} 
                  onChange={() => {
                    setCustomMilestones(customMilestones.map(item => item.id === m.id ? { ...item, completed: !item.completed } : item));
                  }}
                  className="w-4 h-4 rounded border-white/10 text-gold-500 bg-charcoal-900 focus:ring-0 cursor-pointer focus:border-gold-500"
                />
                <span className={`truncate font-mono ${m.completed ? 'line-through text-gray-500' : 'font-medium text-gray-200'}`}>
                  {m.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomMilestones(customMilestones.filter(item => item.id !== m.id));
                }}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold font-mono hover:underline ml-2 shrink-0 cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Add Step */}
        <div className="flex items-center bg-charcoal-950 rounded-xl border border-white/10 p-1.5 pl-4 focus-within:border-gold-500/40 transition-colors">
          <input 
            type="text" 
            placeholder="Add custom milestone step (e.g. Teaser First Draft Approved)..." 
            value={newMilestoneInput} 
            onChange={(e) => setNewMilestoneInput(e.target.value)} 
            className="flex-1 bg-transparent border-0 outline-none text-xs md:text-sm text-white py-1.5 placeholder-gray-600 font-mono" 
            onKeyDown={(e) => { 
              if (e.key === 'Enter') { 
                e.preventDefault(); 
                e.stopPropagation();
                handleAddMilestone();
              } 
            }} 
          />
          <button 
            type="button" 
            onClick={handleAddMilestone} 
            className="px-4 py-2 bg-charcoal-800 hover:bg-gold-500 hover:text-charcoal-950 border border-white/10 hover:border-gold-500 text-gray-200 text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 font-mono"
          >
            + Add Step
          </button>
        </div>
      </div>

      {/* Production Notes */}
      <div className="p-5 bg-charcoal-900/60 rounded-2xl border border-white/10 space-y-2">
        <label className="block text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">
          Special Directions, Client Preferences & Production Notes
        </label>
        <textarea 
          rows={3}
          placeholder="Enter specific editing instructions, reference songs, color grading LUT preferences, special family members to feature, or client notes..." 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gold-500/50 transition-all font-mono leading-relaxed" 
        />
      </div>
    </div>
  );
}
