
import React from 'react';
import { X, GitCommit, Sparkles, Zap, Image as ImageIcon, Shield } from 'lucide-react';

interface ChangelogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HISTORY = [
  {
    version: '1.2.0',
    date: 'Current',
    title: 'Visual Identity & Speed',
    changes: [
      { type: 'new', text: 'Global Visual Identity System: Automatically extracts color/mood from source images to unify generated assets.' },
      { type: 'perf', text: 'Parallel Processing: NLP, Structure, and Image Analysis now run simultaneously.' },
      { type: 'fix', text: 'SVG Support: Added auto-conversion for SVG images in Gemini Vision analysis.' },
      { type: 'new', text: 'Visual Asset Manager: "Insert at Cursor" and "Auto Place" modes.' }
    ]
  },
  {
    version: '1.1.5',
    date: '2024-05-21',
    title: 'RAG & Sanitization',
    changes: [
      { type: 'new', text: 'Knowledge Base RAG: Upload branding docs for agentic context retrieval per section.' },
      { type: 'imp', text: 'Competitor Sanitization: Auto-detects and rewrites competitor brand mentions.' },
      { type: 'new', text: 'Zen Mode: Toggleable sidebars for distraction-free writing.' }
    ]
  },
  {
    version: '1.1.0',
    date: '2024-05-20',
    title: 'Nano Banana Pro',
    changes: [
      { type: 'imp', text: 'Upgraded to gemini-3-pro-image-preview for high-fidelity rendering.' },
      { type: 'new', text: 'Image Understanding: Analyze source visuals to generate context-aware prompts.' },
      { type: 'fix', text: 'Dropdown Save: Fixed profile persistence issues.' }
    ]
  },
  {
    version: '1.0.0',
    date: 'Initial',
    title: 'Ai Text Writer Pro Launch',
    changes: [
      { type: 'new', text: 'Core "Analyze-Plan-Write" Architecture.' },
      { type: 'new', text: 'Deep Structure Extraction & Authority Mapping.' }
    ]
  }
];

export const Changelog: React.FC<ChangelogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
            <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <GitCommit className="w-5 h-5 text-blue-600" />
                    Changelog
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Version History & Updates</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {HISTORY.map((item, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-gray-100 group">
                    <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    
                    <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-bold ${idx === 0 ? 'text-blue-700' : 'text-gray-700'}`}>v{item.version}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{item.date}</span>
                            {idx === 0 && <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">LATEST</span>}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                    </div>

                    <ul className="space-y-2.5">
                        {item.changes.map((change, cIdx) => (
                            <li key={cIdx} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                                <span className="mt-0.5 flex-shrink-0">
                                    {change.type === 'new' && <Sparkles className="w-3 h-3 text-purple-500" />}
                                    {change.type === 'fix' && <Shield className="w-3 h-3 text-emerald-500" />}
                                    {change.type === 'imp' && <Zap className="w-3 h-3 text-amber-500" />}
                                    {change.type === 'perf' && <Zap className="w-3 h-3 text-blue-500" />}
                                </span>
                                <span>{change.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                <p className="text-[10px] text-gray-400 italic">
                    Building the future of AI editorial content.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
