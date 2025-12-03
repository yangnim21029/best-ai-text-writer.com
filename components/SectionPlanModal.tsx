import React from 'react';
import { X, Layers, ListChecks, Sparkles, ArrowRight, CircleDot, Map, Target, Zap } from 'lucide-react';
import { SectionAnalysis } from '../types';

interface SectionPlanModalProps {
    open: boolean;
    onClose: () => void;
    sections: SectionAnalysis[];
    generalPlan?: string[];
    conversionPlan?: string[];
    onStartWriting?: () => void;
}

const difficultyBadge = (value?: SectionAnalysis['difficulty']) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
        easy: { label: 'Easy', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
        medium: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
        unclear: { label: 'Unclear', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
    };
    const variant = map[value || 'easy'] || map.easy;
    return (
        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${variant.bg} ${variant.text} ${variant.border}`}>
            {variant.label}
        </span>
    );
};

export const SectionPlanModal: React.FC<SectionPlanModalProps> = ({
    open,
    onClose,
    sections,
    generalPlan = [],
    conversionPlan = [],
    onStartWriting,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">段落計劃預覽</h3>
                            <p className="text-xs text-gray-500">檢視每個段落的 narrative plan、USP、重點清單，再決定是否開始寫作。</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onStartWriting}
                            className="px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:brightness-110 transition disabled:opacity-50"
                            disabled={!onStartWriting}
                        >
                            立即開始寫作
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                            aria-label="Close plan modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <aside className="w-full lg:w-72 border-r border-gray-100 bg-white/80">
                        <div className="p-4 space-y-3 h-full overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                <Map className="w-4 h-4 text-blue-600" />
                                Global Plan
                            </div>
                            {generalPlan.length > 0 ? (
                                <ul className="space-y-2">
                                    {generalPlan.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-blue-400 mt-1">•</span>
                                            <span className="leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400">尚未有全域寫作規則。</p>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <Target className="w-4 h-4 text-emerald-600" />
                                    Conversion Plan
                                </div>
                                {conversionPlan.length > 0 ? (
                                    <ul className="mt-2 space-y-2">
                                        {conversionPlan.map((item, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                <span className="text-emerald-400 mt-1">•</span>
                                                <span className="leading-snug">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400">尚未有轉換策略。</p>
                                )}
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        {sections.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-gray-500">
                                尚未產生段落計劃，請先執行分析。
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {sections.map((section, idx) => (
                                    <div
                                        key={`${section.title}-${idx}`}
                                        className="border border-gray-100 rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.03)] bg-white hover:shadow-md transition"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-gray-900 leading-tight break-words">
                                                        {section.title}
                                                    </h4>
                                                    {section.coreQuestion && (
                                                        <p className="text-xs text-gray-500 mt-0.5 break-words">Q: {section.coreQuestion}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {difficultyBadge(section.difficulty)}
                                        </div>

                                        {section.narrativePlan && section.narrativePlan.length > 0 && (
                                            <div className="mt-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                                                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide">
                                                    <Sparkles className="w-4 h-4" />
                                                    Narrative Plan
                                                </div>
                                                <ul className="mt-2 space-y-1.5">
                                                    {section.narrativePlan.map((p, pi) => (
                                                        <li key={pi} className="text-sm text-gray-700 leading-snug flex items-start gap-2">
                                                            <span className="text-blue-400 mt-1">•</span>
                                                            <span className="break-words">{p}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {section.keyFacts && section.keyFacts.length > 0 && (
                                                <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/70">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                                                        <ListChecks className="w-4 h-4 text-gray-500" />
                                                        Key Facts
                                                    </div>
                                                    <ul className="mt-2 space-y-1">
                                                        {section.keyFacts.map((fact, fi) => (
                                                            <li key={fi} className="text-sm text-gray-700 flex items-start gap-2 leading-snug">
                                                                <span className="text-gray-400 mt-1">•</span>
                                                                <span className="break-words">{fact}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {section.uspNotes && section.uspNotes.length > 0 && (
                                                <div className="border border-purple-100 rounded-lg p-3 bg-purple-50/60">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wide">
                                                        <CircleDot className="w-4 h-4" />
                                                        USP / 賣點
                                                    </div>
                                                    <ul className="mt-2 space-y-1">
                                                        {section.uspNotes.map((usp, ui) => (
                                                            <li key={ui} className="text-sm text-purple-700 flex items-start gap-2 leading-snug">
                                                                <span className="text-purple-300 mt-1">•</span>
                                                                <span className="break-words">{usp}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {section.subheadings && section.subheadings.length > 0 && (
                                            <div className="mt-3 p-3 rounded-lg border border-amber-100 bg-amber-50/60">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wide">
                                                    <ArrowRight className="w-4 h-4" />
                                                    建議子標題 (H3)
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {section.subheadings.map((h3, hi) => (
                                                        <span key={hi} className="text-xs px-2.5 py-1 rounded-full bg-white border border-amber-200 text-amber-700 break-words">
                                                            {h3}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {section.shiftPlan && section.shiftPlan.length > 0 && (
                                            <div className="mt-3 p-3 rounded-lg border border-indigo-100 bg-indigo-50/60">
                                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wide">
                                                    <Zap className="w-4 h-4" />
                                                    Shift Plan
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    {section.shiftPlan.slice(0, 3).map((sp, si) => {
                                                        const parts = [sp.from ? `from: ${sp.from}` : '', sp.to ? `to: ${sp.to}` : '', sp.reason ? `why: ${sp.reason}` : '']
                                                            .filter(Boolean)
                                                            .join(' | ');
                                                        return (
                                                            <div key={si} className="text-sm text-indigo-700 flex items-start gap-2 leading-snug break-words">
                                                                <span className="text-indigo-300 mt-1">•</span>
                                                                <span>{parts || '調整排序/內容'}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {section.shiftPlan.length > 3 && (
                                                        <div className="text-[11px] text-indigo-400">+{section.shiftPlan.length - 3} more</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
