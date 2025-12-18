import React, { useEffect, useMemo, useState } from 'react';
import { X, Layers, ListChecks, Sparkles, ArrowRight, CircleDot, Map, Target, Pencil, Ban, CheckSquare, RefreshCw, Languages, Settings2 } from 'lucide-react';
import { SectionAnalysis } from '../types';
import { ReplacementEditorModal, EditedReplacementItem, ReplacementItem } from './ReplacementEditorModal';

interface SectionPlanModalProps {
    open: boolean;
    onClose: () => void;
    sections: SectionAnalysis[];
    generalPlan?: string[];
    conversionPlan?: string[];
    regionalReplacements?: { original: string; replacement: string; reason?: string }[];
    // Localized versions (stored separately)
    localizedSections?: SectionAnalysis[];
    localizedGeneralPlan?: string[];
    localizedConversionPlan?: string[];
    isLocalizing?: boolean; // Loading state from parent
    onStartWriting?: (sections: SectionAnalysis[]) => void;
    onSavePlan?: (sections: SectionAnalysis[]) => void;
    onLocalizeAll?: () => Promise<void>; // Now just triggers parent to do AI localization
    onSaveReplacements?: (items: EditedReplacementItem[]) => void; // Callback to save edited replacements
}

type DraftSection = SectionAnalysis & {
    selected: boolean;
    narrativeText: string;
    keyFactsText: string;
    uspText: string;
    subheadingsText: string;
    logicalFlow: string;
    coreFocus: string;
};

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

const splitLines = (value: string) =>
    value
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

export const SectionPlanModal: React.FC<SectionPlanModalProps> = ({
    open,
    onClose,
    sections,
    generalPlan = [],
    conversionPlan = [],
    regionalReplacements = [],
    localizedSections,
    localizedGeneralPlan,
    localizedConversionPlan,
    isLocalizing = false,
    onStartWriting,
    onSavePlan,
    onLocalizeAll,
    onSaveReplacements,
}) => {
    const [drafts, setDrafts] = useState<DraftSection[]>([]);
    const [editingIds, setEditingIds] = useState<Set<number>>(new Set());
    const [useLocalizedPlan, setUseLocalizedPlan] = useState(false);
    const [showReplacementEditor, setShowReplacementEditor] = useState(false);

    // Determine if localized plan is available
    const hasLocalizedPlan = Boolean(localizedSections && localizedSections.length > 0);

    // Active data based on toggle
    const activeSections = useLocalizedPlan && hasLocalizedPlan ? localizedSections! : sections;
    const activeGeneralPlan = useLocalizedPlan && hasLocalizedPlan ? (localizedGeneralPlan || []) : generalPlan;
    const activeConversionPlan = useLocalizedPlan && hasLocalizedPlan ? (localizedConversionPlan || []) : conversionPlan;

    // Handle localize all plans - trigger parent to do AI localization
    const handleLocalizeAll = async () => {
        if (regionalReplacements.length === 0 || !onLocalizeAll) return;
        await onLocalizeAll();
        // Auto-switch to localized view after localizing
        setUseLocalizedPlan(true);
    };

    useEffect(() => {
        if (!open) return;
        const next = (activeSections || []).map((s) => ({
            ...s,
            selected: true,
            narrativeText: (s.narrativePlan || []).join('\n'),
            keyFactsText: (s.keyFacts || []).join('\n'),
            uspText: (s.uspNotes || []).join('\n'),
            subheadingsText: (s.subheadings || []).join('\n'),
            logicalFlow: s.logicalFlow || '',
            coreFocus: s.coreFocus || '',
        }));
        setDrafts(next);
        setEditingIds(new Set());
    }, [open, activeSections, useLocalizedPlan]);

    const allSelected = useMemo(() => drafts.length > 0 && drafts.every(d => d.selected), [drafts]);
    const canStart = useMemo(() => drafts.some(d => d.selected), [drafts]);

    const buildSections = (onlySelected = false) =>
        drafts
            .filter(d => (onlySelected ? d.selected : true))
            .map((d) => ({
                ...d,
                narrativePlan: splitLines(d.narrativeText),
                keyFacts: splitLines(d.keyFactsText),
                uspNotes: splitLines(d.uspText),
                subheadings: splitLines(d.subheadingsText),
                logicalFlow: d.logicalFlow,
                coreFocus: d.coreFocus,
            }) as SectionAnalysis);

    const handleToggleAll = () => {
        if (drafts.length === 0) return;
        const next = drafts.map(d => ({ ...d, selected: !allSelected }));
        setDrafts(next);
    };

    const handleSave = (shouldStart = false) => {
        const filtered = buildSections(shouldStart);
        const full = buildSections(false);
        if (onSavePlan) onSavePlan(full);
        if (shouldStart && onStartWriting) {
            onStartWriting(filtered);
        }
        if (!shouldStart) {
            onClose();
        }
    };

    const displaySections = useMemo(
        () =>
            drafts.map((d, idx) => ({
                data: {
                    ...d,
                    narrativePlan: splitLines(d.narrativeText),
                    keyFacts: splitLines(d.keyFactsText),
                    uspNotes: splitLines(d.uspText),
                    subheadings: splitLines(d.subheadingsText),
                } as SectionAnalysis,
                selected: d.selected,
                idx,
            })),
        [drafts]
    );

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
                            <p className="text-xs text-gray-500">可在寫作前調整段落內容與勾選要寫的段落。</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleAll}
                            className={`px-3 py-2 text-sm font-semibold rounded-lg border ${allSelected ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                        >
                            {allSelected ? '取消全選' : '全選'}
                        </button>
                        {/* Toggle between original and localized plan */}
                        {hasLocalizedPlan && (
                            <button
                                onClick={() => setUseLocalizedPlan(!useLocalizedPlan)}
                                className={`px-3 py-2 text-sm font-semibold rounded-lg border flex items-center gap-1.5 transition ${useLocalizedPlan
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}
                            >
                                <Languages className="w-4 h-4" />
                                {useLocalizedPlan ? '本地化版本 ✓' : '原版'}
                            </button>
                        )}
                        <button
                            onClick={() => handleSave(false)}
                            className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                            儲存計劃
                        </button>
                        <button
                            onClick={handleLocalizeAll}
                            className="px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5 disabled:opacity-50"
                            disabled={regionalReplacements.length === 0 || isLocalizing}
                        >
                            <Languages className="w-4 h-4" />
                            {isLocalizing ? '處理中...' : '全部段落本地化'}
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            className="px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:brightness-110 transition disabled:opacity-50"
                            disabled={!onStartWriting || !canStart}
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
                                {useLocalizedPlan && hasLocalizedPlan && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">本地化</span>
                                )}
                            </div>
                            {activeGeneralPlan.length > 0 ? (
                                <ul className="space-y-2">
                                    {activeGeneralPlan.map((item, idx) => (
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
                                    {useLocalizedPlan && hasLocalizedPlan && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">本地化</span>
                                    )}
                                </div>
                                {activeConversionPlan.length > 0 ? (
                                    <ul className="mt-2 space-y-2">
                                        {activeConversionPlan.map((item, idx) => (
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

                            {/* Regional Replacements */}
                            {regionalReplacements.length > 0 && (
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            <RefreshCw className="w-4 h-4 text-amber-600" />
                                            需要替換 ({regionalReplacements.length})
                                        </div>
                                        <button
                                            onClick={() => setShowReplacementEditor(true)}
                                            className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition flex items-center gap-1 text-xs font-semibold"
                                            title="編輯替換規則"
                                        >
                                            <Settings2 className="w-3.5 h-3.5" />
                                            編輯
                                        </button>
                                    </div>
                                    <ul className="mt-2 space-y-2">
                                        {regionalReplacements.map((item, idx) => (
                                            <li key={idx} className={`text-sm rounded p-2 border ${item.replacement ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'}`}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-red-500 line-through text-xs">{item.original}</span>
                                                    <span className="text-gray-400">→</span>
                                                    {item.replacement ? (
                                                        <span className="text-emerald-600 font-semibold text-xs">{item.replacement}</span>
                                                    ) : (
                                                        <span className="text-red-500 font-semibold italic text-xs">(刪除)</span>
                                                    )}
                                                </div>
                                                {item.reason && (
                                                    <p className="text-[10px] text-gray-500 mt-1">{item.reason}</p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        {drafts.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-gray-500">
                                尚未產生段落計劃，請先執行分析。
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {displaySections.map((section) => {
                                    const isEditing = editingIds.has(section.idx);
                                    return (
                                        <div
                                            key={`${section.data.title}-${section.idx}`}
                                            className="border border-gray-100 rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.03)] bg-white hover:shadow-md transition"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <label className="flex items-start gap-2 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={section.selected}
                                                            onChange={(e) =>
                                                                setDrafts((prev) =>
                                                                    prev.map((d, di) => di === section.idx ? { ...d, selected: e.target.checked } : d)
                                                                )
                                                            }
                                                        />
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                            {section.idx + 1}
                                                        </div>
                                                    </label>
                                                    <div className="flex-1">
                                                        {isEditing ? (
                                                            <>
                                                                <input
                                                                    value={section.data.title}
                                                                    onChange={(e) =>
                                                                        setDrafts((prev) =>
                                                                            prev.map((d, di) => di === section.idx ? { ...d, title: e.target.value } : d)
                                                                        )
                                                                    }
                                                                    className="text-base font-bold text-gray-900 leading-tight break-words w-full bg-white border border-gray-200 rounded-lg px-2 py-1"
                                                                />
                                                                <input
                                                                    value={section.data.coreQuestion || ''}
                                                                    onChange={(e) =>
                                                                        setDrafts((prev) =>
                                                                            prev.map((d, di) => di === section.idx ? { ...d, coreQuestion: e.target.value } : d)
                                                                        )
                                                                    }
                                                                    placeholder="Core question (可空白)"
                                                                    className="mt-1 text-xs text-gray-600 w-full bg-white border border-gray-200 rounded-lg px-2 py-1"
                                                                />
                                                                <input
                                                                    value={section.data.logicalFlow || ''}
                                                                    onChange={(e) =>
                                                                        setDrafts((prev) =>
                                                                            prev.map((d, di) => di === section.idx ? { ...d, logicalFlow: e.target.value } : d)
                                                                        )
                                                                    }
                                                                    placeholder="Logical Flow (e.g. Identify -> Mechanism -> Solution)"
                                                                    className="mt-1 text-xs text-blue-600 w-full bg-white border border-blue-200 rounded-lg px-2 py-1"
                                                                />
                                                                <input
                                                                    value={section.data.coreFocus || ''}
                                                                    onChange={(e) =>
                                                                        setDrafts((prev) =>
                                                                            prev.map((d, di) => di === section.idx ? { ...d, coreFocus: e.target.value } : d)
                                                                        )
                                                                    }
                                                                    placeholder="Core Focus (傳達之側重點/心理戰術)"
                                                                    className="mt-1 text-xs text-emerald-600 w-full bg-white border border-emerald-200 rounded-lg px-2 py-1"
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <h4 className="text-base font-bold text-gray-900 leading-tight break-words">
                                                                    {section.data.title}
                                                                </h4>
                                                                {section.data.coreQuestion ? (
                                                                    <p className="text-xs text-gray-500 mt-0.5 break-words italic">Q: {section.data.coreQuestion}</p>
                                                                ) : null}
                                                                {section.data.logicalFlow ? (
                                                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50 w-fit">
                                                                        <Map className="w-3 h-3 text-blue-400" />
                                                                        <span className="leading-none text-blue-700">邏輯鎖鍊：{section.data.logicalFlow}</span>
                                                                    </div>
                                                                ) : null}
                                                                {section.data.coreFocus ? (
                                                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100/50 w-fit">
                                                                        <Target className="w-3 h-3 text-emerald-400" />
                                                                        <span className="leading-none text-emerald-700">傳達側重：{section.data.coreFocus}</span>
                                                                    </div>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {section.data.isChecklist && (
                                                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full border bg-teal-50 text-teal-700 border-teal-100 flex items-center gap-1">
                                                            <CheckSquare className="w-3 h-3" />
                                                            Checklist
                                                        </span>
                                                    )}
                                                    {difficultyBadge(section.data.difficulty)}
                                                    <button
                                                        onClick={() =>
                                                            setEditingIds(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(section.idx)) next.delete(section.idx); else next.add(section.idx);
                                                                return next;
                                                            })
                                                        }
                                                        className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        {isEditing ? '完成' : '編輯'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide">
                                                    <Sparkles className="w-4 h-4" />
                                                    Narrative Plan
                                                </div>
                                                {isEditing ? (
                                                    <textarea
                                                        value={drafts[section.idx]?.narrativeText || ''}
                                                        onChange={(e) =>
                                                            setDrafts((prev) =>
                                                                prev.map((d, di) => di === section.idx ? { ...d, narrativeText: e.target.value } : d)
                                                            )
                                                        }
                                                        className="mt-2 w-full border border-blue-100 rounded-lg p-3 text-sm text-gray-700 bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        rows={3}
                                                        placeholder="每行一個重點"
                                                    />
                                                ) : (
                                                    <ul className="mt-2 space-y-1.5">
                                                        {(section.data.narrativePlan || []).map((p, pi) => (
                                                            <li key={pi} className="text-sm text-gray-700 leading-snug flex items-start gap-2">
                                                                <span className="text-blue-400 mt-1">•</span>
                                                                <span className="break-words">{p}</span>
                                                            </li>
                                                        ))}
                                                        {(section.data.narrativePlan || []).length === 0 && (
                                                            <li className="text-sm text-gray-400">未提供 narrative plan</li>
                                                        )}
                                                    </ul>
                                                )}
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/70">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                                                        <ListChecks className="w-4 h-4 text-gray-500" />
                                                        Key Facts
                                                    </div>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={drafts[section.idx]?.keyFactsText || ''}
                                                            onChange={(e) =>
                                                                setDrafts((prev) =>
                                                                    prev.map((d, di) => di === section.idx ? { ...d, keyFactsText: e.target.value } : d)
                                                                )
                                                            }
                                                            className="mt-2 w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 max-h-40 overflow-y-auto"
                                                            rows={4}
                                                            placeholder="每行一條 key fact"
                                                        />
                                                    ) : (
                                                        <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                                            {(section.data.keyFacts || []).map((fact, fi) => (
                                                                <li key={fi} className="text-sm text-gray-700 flex items-start gap-2 leading-snug">
                                                                    <span className="text-gray-400 mt-1">•</span>
                                                                    <span className="break-words">{fact}</span>
                                                                </li>
                                                            ))}
                                                            {(section.data.keyFacts || []).length === 0 && (
                                                                <li className="text-sm text-gray-400">未提供 key facts</li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>

                                                <div className="border border-purple-100 rounded-lg p-3 bg-purple-50/60">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wide">
                                                        <CircleDot className="w-4 h-4" />
                                                        USP / 賣點
                                                    </div>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={drafts[section.idx]?.uspText || ''}
                                                            onChange={(e) =>
                                                                setDrafts((prev) =>
                                                                    prev.map((d, di) => di === section.idx ? { ...d, uspText: e.target.value } : d)
                                                                )
                                                            }
                                                            className="mt-2 w-full border border-purple-100 rounded-lg p-2 text-sm text-purple-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                                                            rows={3}
                                                            placeholder="每行一個 USP"
                                                        />
                                                    ) : (
                                                        <ul className="mt-2 space-y-1">
                                                            {(section.data.uspNotes || []).map((usp, ui) => (
                                                                <li key={ui} className="text-sm text-purple-700 flex items-start gap-2 leading-snug">
                                                                    <span className="text-purple-300 mt-1">•</span>
                                                                    <span className="break-words">{usp}</span>
                                                                </li>
                                                            ))}
                                                            {(section.data.uspNotes || []).length === 0 && (
                                                                <li className="text-sm text-purple-400">未提供 USP</li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 p-3 rounded-lg border border-amber-100 bg-amber-50/60">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wide">
                                                    <ArrowRight className="w-4 h-4" />
                                                    建議子標題 (H3)
                                                </div>
                                                {isEditing ? (
                                                    <textarea
                                                        value={drafts[section.idx]?.subheadingsText || ''}
                                                        onChange={(e) =>
                                                            setDrafts((prev) =>
                                                                prev.map((d, di) => di === section.idx ? { ...d, subheadingsText: e.target.value } : d)
                                                            )
                                                        }
                                                        className="mt-2 w-full border border-amber-100 rounded-lg p-2 text-sm text-amber-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                                                        rows={2}
                                                        placeholder="每行一個 H3 建議"
                                                    />
                                                ) : (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {(section.data.subheadings || []).map((h3, hi) => (
                                                            <span key={hi} className="text-xs px-2.5 py-1 rounded-full bg-white border border-amber-200 text-amber-700 break-words">
                                                                {h3}
                                                            </span>
                                                        ))}
                                                        {(section.data.subheadings || []).length === 0 && (
                                                            <span className="text-xs text-amber-500">未提供 H3 建議</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Suppress (不應有) */}
                                            {section.data.suppress && section.data.suppress.length > 0 && (
                                                <div className="mt-3 p-3 rounded-lg border border-rose-100 bg-rose-50/60">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wide">
                                                        <Ban className="w-4 h-4" />
                                                        不應有 (Suppress)
                                                    </div>
                                                    <ul className="mt-2 space-y-1">
                                                        {section.data.suppress.map((item, si) => (
                                                            <li key={si} className="text-sm text-rose-700 flex items-start gap-2 leading-snug">
                                                                <span className="text-rose-300 mt-1">-</span>
                                                                <span className="break-words">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Replacement Editor Modal */}
            <ReplacementEditorModal
                open={showReplacementEditor}
                onClose={() => setShowReplacementEditor(false)}
                items={regionalReplacements}
                onSave={(items) => {
                    if (onSaveReplacements) {
                        onSaveReplacements(items);
                    }
                    setShowReplacementEditor(false);
                }}
            />
        </div>
    );
};
