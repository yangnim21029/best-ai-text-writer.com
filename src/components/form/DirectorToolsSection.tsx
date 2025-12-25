import React, { useState } from 'react';
import { Sparkles, Database, Globe, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingButton } from '../LoadingButton';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';

interface DirectorToolsSectionProps {
    onDirectorPlan?: () => void;
    isPlanning?: boolean;
    onSourcing?: () => void;
    isSourcing?: boolean;
    onDiscover?: () => void;
    isDiscovering?: boolean;
    register: UseFormRegister<ArticleFormValues>;
    setValue: UseFormSetValue<ArticleFormValues>;
    watchedValues: ArticleFormValues;
}

export const DirectorToolsSection: React.FC<DirectorToolsSectionProps> = ({
    onDirectorPlan,
    isPlanning,
    onSourcing,
    isSourcing,
    onDiscover,
    isDiscovering,
    register,
    setValue,
    watchedValues,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-indigo-50/30">
                <div
                    className="flex items-center justify-between cursor-pointer mb-3"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 uppercase cursor-pointer">
                        <BrainCircuit className="w-3.5 h-3.5" /> Director Tools
                    </label>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />}
                </div>

                {isExpanded && (
                    <div className="space-y-4 animate-in slide-in-from-top-1 fade-in duration-200">
                        {/* Director Context Input */}
                        <div className="space-y-1">
                            <textarea
                                {...register('directorContext')}
                                placeholder="Describe what you want the Director to plan (Optional). If empty, it will use the main content source."
                                className="w-full h-20 px-3 py-2 bg-white rounded-lg border border-indigo-100 text-xs text-slate-700 placeholder-indigo-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none shadow-sm transition-all"
                            />
                        </div>

                        {/* Target URLs Input */}
                        <div className="space-y-1">
                            <textarea
                                {...register('targetUrlList')}
                                placeholder="Paste specific URLs for Director to read (one per line)..."
                                className="w-full h-16 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none resize-none shadow-sm transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 gap-2 pt-1">
                            {onDirectorPlan && (
                                <LoadingButton
                                    type="button"
                                    onClick={onDirectorPlan}
                                    isLoading={isPlanning}
                                    icon={<Sparkles className="w-3.5 h-3.5" />}
                                    className="w-full justify-start h-8 px-3 text-[11px] bg-white border border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-50 hover:border-indigo-200 shadow-sm rounded-lg transition-all"
                                >
                                    Plan with Director
                                </LoadingButton>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                {onSourcing && (
                                    <LoadingButton
                                        type="button"
                                        onClick={onSourcing}
                                        isLoading={isSourcing}
                                        icon={<Database className="w-3.5 h-3.5" />}
                                        className="w-full justify-start h-8 px-3 text-[11px] bg-white border border-indigo-100 text-slate-600 font-bold hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 shadow-sm rounded-lg transition-all"
                                    >
                                        Source Keyfacts
                                    </LoadingButton>
                                )}

                                {onDiscover && (
                                    <LoadingButton
                                        type="button"
                                        onClick={onDiscover}
                                        isLoading={isDiscovering}
                                        icon={<Globe className="w-3.5 h-3.5" />}
                                        className="w-full justify-start h-8 px-3 text-[11px] bg-white border border-emerald-100 text-slate-600 font-bold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 shadow-sm rounded-lg transition-all"
                                    >
                                        Discover Refs
                                    </LoadingButton>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
