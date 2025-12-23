import React from 'react';
import { Bookmark, ArrowRight, Quote, Zap, ListChecks } from 'lucide-react';
import { SectionAnalysis } from '@/types';

interface SectionItemProps {
  section: SectionAnalysis;
  index: number;
}

const difficultyBadge = (value?: string) => {
  const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
    easy: {
      label: 'Easy',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    unclear: {
      label: 'Unclear',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
    },
  };
  const variant = map[value || 'easy'] || map.easy;
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${variant.bg} ${variant.text} ${variant.border}`}
    >
      {variant.label}
    </span>
  );
};

export const SectionItem: React.FC<SectionItemProps> = ({ section, index }) => (
  <div className="relative pl-10 pr-2 group/s pb-4 mb-4 border-b border-gray-50 last:border-0 last:mb-0">
    {/* Index Circle */}
    <div className="absolute left-1 top-0 w-6 h-6 rounded-full bg-white border-2 border-blue-100 text-[11px] font-black text-blue-400 flex items-center justify-center group-hover/s:border-blue-600 group-hover/s:text-blue-600 transition-all z-10 shadow-sm">
      {index + 1}
    </div>

    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h5 className="text-[12px] font-black text-gray-800 leading-snug group-hover/s:text-blue-600 transition-colors">
          {section.title}
        </h5>
        <div className="flex items-center gap-1">
          {section.writingMode && (
            <span
              className={`px-2 py-0.5 text-[9px] font-black rounded-full border border-dashed ${
                section.writingMode === 'direct'
                  ? 'bg-indigo-50 text-blue-600 border-blue-200'
                  : 'bg-purple-50 text-purple-600 border-purple-200'
              }`}
            >
              {section.writingMode.toUpperCase()}
            </span>
          )}
          {difficultyBadge(section.difficulty)}
        </div>
      </div>

      {section.coreFocus && (
        <div className="flex gap-2 items-start">
          <Bookmark className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[10px] font-bold text-blue-600 leading-tight">
            Focus: {section.coreFocus}
          </p>
        </div>
      )}

      {section.logicalFlow && (
        <div className="flex gap-2 items-start mt-1">
          <ArrowRight className="w-3 h-3 text-indigo-300 mt-0.5 shrink-0" />
          <p className="text-[10px] text-gray-500 italic leading-snug">
            Arc: {section.logicalFlow}
          </p>
        </div>
      )}

      {section.coreQuestion && (
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 relative group/q">
          <Quote className="absolute -left-1 -top-1 w-3 h-3 text-slate-200 group-hover/q:text-blue-200" />
          <p className="text-[11px] text-gray-600 leading-relaxed italic pr-2 font-medium">
            "{section.coreQuestion}"
          </p>
        </div>
      )}

      {section.solutionAngles && section.solutionAngles.length > 0 && (
        <div className="space-y-1 bg-blue-50/30 p-2 rounded-lg border border-blue-100/50">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
            Solution Angles
          </p>
          {section.solutionAngles.map((angle, aIdx) => (
            <div
              key={aIdx}
              className="text-[10px] text-blue-700 flex items-center gap-1.5 font-bold"
            >
              <Zap className="w-2.5 h-2.5 text-blue-300" />
              <span>{angle}</span>
            </div>
          ))}
        </div>
      )}

      {section.narrativePlan && section.narrativePlan.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Narrative Action
          </p>
          {section.narrativePlan.map((plan, pIdx) => (
            <div key={pIdx} className="flex gap-2 text-[11px] text-gray-600 leading-relaxed pl-1">
              <span className="text-indigo-300">•</span>
              <span>{plan}</span>
            </div>
          ))}
        </div>
      )}

      {section.uspNotes && section.uspNotes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {section.isChecklist && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black uppercase tracking-tighter">
              LISTICLE MODE
            </span>
          )}
          {section.uspNotes.map((usp, uIdx) => (
            <span
              key={uIdx}
              className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[9px] font-black uppercase tracking-tighter"
            >
              USP: {usp}
            </span>
          ))}
        </div>
      )}

      {/* Subsections with Key Facts (New Granular Mode) */}
      {section.subsections && section.subsections.length > 0 ? (
        <div className="pl-3 border-l-2 border-slate-100 space-y-3 mt-2">
          <p className="text-[9px] font-black text-gray-300 uppercase">H3 Structure & Facts</p>
          {section.subsections.map((sub, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="text-[10px] text-gray-600 flex items-center gap-1.5 font-bold">
                <ArrowRight className="w-2.5 h-2.5 text-amber-500" />
                <span>{sub.title}</span>
              </div>
              {sub.keyFacts && sub.keyFacts.length > 0 && (
                <div className="pl-4 space-y-1">
                  {sub.keyFacts.map((fact, fIdx) => (
                    <div key={fIdx} className="flex gap-1.5 text-[9px] text-gray-500 leading-snug">
                      <span className="text-emerald-300">•</span>
                      <span className="break-words">{fact}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Fallback to legacy flat H3s */
        section.subheadings &&
        section.subheadings.length > 0 && (
          <div className="pl-3 border-l-2 border-slate-100 space-y-1 mt-2">
            <p className="text-[9px] font-black text-gray-300 uppercase">Subtitles (H3s)</p>
            {section.subheadings.map((sub, sIdx) => (
              <div
                key={sIdx}
                className="text-[10px] text-gray-500 flex items-center gap-1.5 font-medium"
              >
                <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                <span>{sub}</span>
              </div>
            ))}
          </div>
        )
      )}

      {section.keyFacts && section.keyFacts.length > 0 && (
        <div className="bg-emerald-50/30 p-2 rounded-xl border border-emerald-100/50 space-y-1.5 mt-2">
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <ListChecks className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase">Grounding Facts</span>
          </div>
          {section.keyFacts.map((fact, fIdx) => (
            <div key={fIdx} className="flex gap-2 text-[10px] text-emerald-800/80 leading-relaxed px-1">
              <span className="text-emerald-300">✓</span>
              <span>{fact}</span>
            </div>
          ))}
        </div>
      )}

      {section.sentenceStartFeatures && section.sentenceStartFeatures.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {section.sentenceStartFeatures.map((feat, idx) => (
            <span
              key={idx}
              className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-bold tracking-tighter"
            >
              Start: {feat}
            </span>
          ))}
        </div>
      )}

      {section.sentenceEndFeatures && section.sentenceEndFeatures.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {section.sentenceEndFeatures.map((feat, idx) => (
            <span
              key={idx}
              className="text-[8px] bg-pink-50 text-pink-500 px-1.5 py-0.5 rounded border border-pink-100 font-bold tracking-tighter"
            >
              End: {feat}
            </span>
          ))}
        </div>
      )}

      {((section.suppress?.length ?? 0) > 0 || (section.augment?.length ?? 0) > 0) && (
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
          {(section.suppress?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[8px] font-black text-rose-400 uppercase">Suppress</p>
              {section.suppress?.map((s, i) => (
                <div key={i} className="text-[9px] text-rose-600 leading-tight flex gap-1 items-start">
                  <span className="shrink-0 text-[10px] mt-[-1px]">×</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
          {(section.augment?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="text-[8px] font-black text-blue-400 uppercase">Augment</p>
              {section.augment?.map((a, i) => (
                <div key={i} className="text-[9px] text-blue-600 leading-tight flex gap-1 items-start">
                  <span className="shrink-0 text-[10px] mt-[-1px]">+</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
