
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ChevronDown, ChevronRight, Wand2, Loader2, RefreshCw } from 'lucide-react';
import { useGenerationStore } from '../store/useGenerationStore';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { refineHeadings } from '../services/generation/headingRefinerService';
import { cleanHeadingText } from '../utils/textUtils';
import { HeadingResult } from '../types';

interface HeadingOptimizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (newContent: string) => void;
}

export const HeadingOptimizerModal: React.FC<HeadingOptimizerModalProps> = ({
    isOpen,
    onClose,
    onApply
}) => {
    const { content } = useGenerationStore();
    const { targetAudience, articleTitle, headingOptimizations, setHeadingOptimizations } = useAnalysisStore();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({}); // index -> selected text
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    // Parse current headings from content
    const extractHeadingsFromContent = (htmlContent: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        // Look for h2s. If not proper HTML, fallback to regex for markdown
        let h2s = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent?.trim() || '');

        if (h2s.length === 0) {
            // Try regex for markdown "## Title"
            const matches = htmlContent.match(/^##\s+(.+)$/gm);
            if (matches) {
                h2s = matches.map(m => m.replace(/^##\s+/, '').trim());
            }
        }
        return h2s.filter(Boolean);
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const currentHeadings = extractHeadingsFromContent(content);

        if (currentHeadings.length === 0) {
            alert("No H2 headings found in the content to optimize.");
            setIsAnalyzing(false);
            return;
        }

        try {
            const res = await refineHeadings(
                articleTitle || 'Article',
                currentHeadings,
                targetAudience
            );

            if (res.data) {
                // Map the result to our store format
                const newOptimizations = res.data.map((item: any, idx: number) => ({
                    h2_before: currentHeadings[idx] || item.h2_before,
                    h2_after: item.h2_after, // Default suggestion
                    h2_reason: item.h2_reason,
                    h2_options: item.h2_options,
                    h3: item.h3
                }));

                setHeadingOptimizations(newOptimizations);

                // Pre-select the AI's best choice (h2_after)
                const defaults: Record<number, string> = {};
                newOptimizations.forEach((opt: any, i: number) => {
                    defaults[i] = opt.h2_after;
                });
                setSelectedOptions(defaults);
            }
        } catch (error) {
            console.error("Failed to optimize headings", error);
            alert("Failed to optimize headings. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApply = () => {
        let newContent = content;

        // Naive replacement strategy:
        // We iterate through optimizations and replace the "h2_before" (or matched heading) with "selected text"
        // To avoid replacing the wrong thing if headings are duplicates, we should be careful.
        // For now, we'll try a sequential replacement if we can match context, or just global replace if unique.

        // A better approach for HTML content:
        // Parse -> Replace nodes -> Serialize

        // Let's assume content is HTML-ish (checking RichTextEditor usage)
        // If it's pure markdown, we use regex.

        headingOptimizations.forEach((opt, idx) => {
            const selectedText = selectedOptions[idx];
            if (!selectedText || selectedText === opt.h2_before) return;

            // Escape special regex chars in original heading
            const escapedOriginal = opt.h2_before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Try to match H2 tags first
            const regexHtml = new RegExp(`(<h2[^>]*>)\\s*${escapedOriginal}\\s*(<\\/h2>)`, 'i');
            if (regexHtml.test(newContent)) {
                newContent = newContent.replace(regexHtml, `$1${selectedText}$2`);
                return;
            }

            // Fallback to markdown style "## Title"
            const regexMd = new RegExp(`(##\\s+)${escapedOriginal}(\\n|$)`, 'i');
            if (regexMd.test(newContent)) {
                newContent = newContent.replace(regexMd, `$1${selectedText}$2`);
                return;
            }

            // Last resort: simple string replace (risky if heading words appear in text)
            // Ideally ensure it's a heading line
        });

        onApply(newContent);
        onClose();
    };

    // Initialize/Reset when opening
    useEffect(() => {
        if (isOpen && headingOptimizations.length === 0 && !isAnalyzing) {
            // Optionally auto-analyze if missing?
            // Let's let the user click "Analyze" to be explicit, showing the "Empty State" first.
        } else if (isOpen && headingOptimizations.length > 0) {
            // Restore selections or default to current optimized state
            const defaults: Record<number, string> = {};
            headingOptimizations.forEach((opt, i) => {
                defaults[i] = selectedOptions[i] || opt.h2_after;
            });
            setSelectedOptions(defaults);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Heading Optimizer</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered refinement for high-impact H2s</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">

                    {headingOptimizations.length === 0 && !isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <Wand2 className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Optimize?</h3>
                            <p className="text-gray-500 max-w-sm mb-6">
                                We will analyze your article's structure and suggest 5 variations for each H2 heading (Professional, Emotional, Viral, etc.).
                            </p>
                            <button
                                onClick={handleAnalyze}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-200 transition-all flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Suggestions
                            </button>
                        </div>
                    ) : isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Analyzing article structure...</p>
                            <p className="text-sm text-gray-400 mt-1">Generating high-converting headline variations</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {headingOptimizations.map((opt, idx) => {
                                const isExpanded = expandedIndex === idx;
                                const isSelectedChanged = selectedOptions[idx] !== opt.h2_before;

                                return (
                                    <div key={idx} className={`bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 ${isExpanded ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-gray-200 hover:border-blue-200'}`}>
                                        {/* Row Header */}
                                        <div
                                            className="flex items-center gap-4 p-4 cursor-pointer"
                                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                                        >
                                            <button className="p-1 text-gray-400 hover:text-gray-600">
                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>

                                            <div className="flex-1">
                                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Section {idx + 1}</div>
                                                <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                    {selectedOptions[idx] || opt.h2_before}
                                                    {isSelectedChanged && (
                                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded border border-green-200 font-bold">UPDATED</span>
                                                    )}
                                                </div>
                                            </div>

                                            {(!isExpanded && isSelectedChanged) && (
                                                <div className="text-xs text-gray-400 italic">
                                                    Original: {opt.h2_before}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded Options */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {/* Original Option */}
                                                    <label
                                                        className={`relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedOptions[idx] === opt.h2_before ? 'bg-white border-gray-400 ring-1 ring-gray-200' : 'bg-gray-50/50 border-transparent hover:bg-white hover:border-gray-200'}`}
                                                        onClick={() => setSelectedOptions(prev => ({ ...prev, [idx]: opt.h2_before }))}
                                                    >
                                                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${selectedOptions[idx] === opt.h2_before ? 'border-gray-600 bg-gray-600' : 'border-gray-300 bg-white'}`}>
                                                            {selectedOptions[idx] === opt.h2_before && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-700">Original</div>
                                                            <div className="text-sm text-gray-600 mt-0.5">{opt.h2_before}</div>
                                                        </div>
                                                    </label>

                                                    {/* AI Options */}
                                                    {opt.h2_options?.map((option, optIdx) => (
                                                        <label
                                                            key={optIdx}
                                                            className={`relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedOptions[idx] === option.text ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}
                                                            onClick={() => setSelectedOptions(prev => ({ ...prev, [idx]: option.text }))}
                                                        >
                                                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${selectedOptions[idx] === option.text ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}>
                                                                {selectedOptions[idx] === option.text && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm font-semibold text-gray-800">{option.text}</div>
                                                                    {option.score && (
                                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded px-1">Score: {option.score}</span>
                                                                    )}
                                                                </div>
                                                                {option.reason && (
                                                                    <div className="text-xs text-gray-500 mt-1 leading-snug">{option.reason}</div>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        {headingOptimizations.length > 0 && (
                            <button
                                onClick={handleAnalyze}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Re-analyze
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={headingOptimizations.length === 0}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Apply Selected Headings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
