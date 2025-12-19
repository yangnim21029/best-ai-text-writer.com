import React, { useMemo } from 'react';
import { SavedProfile, TargetAudience } from '../../types';
import { Briefcase, ChevronDown, Globe, LayoutTemplate, Info, Settings2, Plus, RotateCw } from 'lucide-react';

interface WebsiteProfileSectionProps {
    savedProfiles: SavedProfile[];
    activeProfile?: SavedProfile | null;
    onOpenLibrary: () => void;
}

const getRegionLabel = (code: TargetAudience) => {
    switch (code) {
        case 'zh-TW': return { flag: '🇹🇼', name: 'Taiwan' };
        case 'zh-HK': return { flag: '🇭🇰', name: 'Hong Kong' };
        case 'zh-MY': return { flag: '🇲🇾', name: 'Malaysia' };
        default: return { flag: '🌐', name: 'Global' };
    }
};

export const WebsiteProfileSection: React.FC<WebsiteProfileSectionProps> = ({
    activeProfile,
    onOpenLibrary,
}) => {
    const [showDetails, setShowDetails] = React.useState(false);

    const regionLabel = useMemo(() =>
        getRegionLabel(activeProfile?.targetAudience || 'zh-TW'),
        [activeProfile?.targetAudience]);

    return (
        <div className={`bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${showDetails ? 'ring-2 ring-blue-50/50' : 'hover:shadow-md'}`}>
            <div
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => setShowDetails(!showDetails)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0 group-hover:bg-blue-100/50 transition-colors">
                        <Briefcase className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-[12px] font-black text-slate-800 truncate max-w-[150px] tracking-tight">
                                {activeProfile ? activeProfile.name : 'Select Website Profile'}
                            </p>
                            {activeProfile && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black border border-blue-100/50 uppercase tracking-widest">
                                    {regionLabel.flag}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                            {activeProfile?.websiteType || 'Identity not set'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenLibrary();
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                        title="Manage Library"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {showDetails && activeProfile && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                    <div className="pt-3 space-y-3 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Globe className="w-3 h-3 text-blue-400" /> Region
                            </span>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/30">
                                {regionLabel.name}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <LayoutTemplate className="w-3 h-3 text-blue-400" /> Context
                            </label>
                            <p className="text-[11px] text-slate-600 font-medium bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                {activeProfile.websiteType || 'Not specified'}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Info className="w-3 h-3 text-blue-400" /> Authority Keywords
                            </label>
                            <p className="text-[11px] text-slate-500 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 line-clamp-3">
                                {activeProfile.authorityTerms || 'No keywords set'}
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onOpenLibrary}
                                className="flex-1 h-8 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Briefcase className="w-3 h-3" />
                                Library
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const event = new CustomEvent('updateActiveProfile');
                                    window.dispatchEvent(event);
                                }}
                                className="flex-1 h-8 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                                title="Sync with current form"
                            >
                                <RotateCw className="w-3 h-3" />
                                Sync
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDetails && !activeProfile && (
                <div className="px-4 pb-4">
                    <button
                        type="button"
                        onClick={onOpenLibrary}
                        className="w-full py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-2 group/add"
                    >
                        <Plus className="w-5 h-5 group-hover/add:scale-110 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Select from Library</span>
                    </button>
                </div>
            )}
        </div>
    );
};
