import React, { useMemo, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';
import { SavedProfile, TargetAudience } from '../../types';
import { AlertTriangle, Briefcase, ChevronDown, Globe, Plus, RotateCw, Trash2 } from 'lucide-react';

interface WebsiteProfileSectionProps {
    register: UseFormRegister<ArticleFormValues>;
    targetAudience: TargetAudience;
    websiteType: string;
    authorityTerms: string;
    savedProfiles: SavedProfile[];
    activeProfile?: SavedProfile | null;
    brandKnowledge?: string;
    onCreateProfile: (name: string) => SavedProfile | null;
    onUpdateProfile: () => SavedProfile | null;
    onDeleteProfile: (id: string) => void;
    onLoadProfile: (profile: SavedProfile) => void;
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
    register,
    targetAudience,
    websiteType,
    authorityTerms,
    savedProfiles,
    activeProfile,
    brandKnowledge,
    onCreateProfile,
    onUpdateProfile,
    onDeleteProfile,
    onLoadProfile,
}) => {
    const [showBrandProfile, setShowBrandProfile] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    const regionLabel = useMemo(() => getRegionLabel(targetAudience), [targetAudience]);

    const handleCreateProfile = () => {
        const created = onCreateProfile(newProfileName);
        if (created) {
            setNewProfileName('');
            setIsCreatingProfile(false);
            setShowProfileMenu(false);
            alert(`Profile "${created.name}" saved!`);
        }
    };

    const handleUpdateProfile = () => {
        const updated = onUpdateProfile();
        if (updated) {
            alert('Profile Updated Successfully!');
            setShowProfileMenu(false);
        }
    };

    const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this profile?')) {
            onDeleteProfile(id);
        }
    };

    const handleLoadProfile = (profile: SavedProfile) => {
        onLoadProfile(profile);
        setShowProfileMenu(false);
        setShowBrandProfile(true);
    };

    return (
        <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Website Profile
                <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    BETA / UNSTABLE
                </span>
            </h3>

            <div className={`bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${showBrandProfile ? 'ring-2 ring-indigo-50/50' : 'hover:shadow-md'}`}>

                <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                    onClick={() => setShowBrandProfile(!showBrandProfile)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <span className="text-sm font-bold text-indigo-600">
                                {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate max-w-[180px]">
                                {activeProfile ? activeProfile.name : 'Unsaved Profile'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1 bg-gray-100 px-1.5 rounded text-gray-600">
                                    {regionLabel.flag} {regionLabel.name}
                                </span>
                                {!showBrandProfile && websiteType && (
                                    <span className="truncate max-w-[100px] border-l border-gray-200 pl-2">
                                        {websiteType}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button type="button" className="text-gray-400 p-1 rounded hover:bg-gray-200/50 transition-colors">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showBrandProfile ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showBrandProfile && (
                    <div className="p-4 pt-0 border-t border-gray-50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="pt-3 space-y-4">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProfileMenu(!showProfileMenu);
                                        setIsCreatingProfile(false);
                                        setNewProfileName('');
                                    }}
                                    className="w-full text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors flex items-center justify-between border border-indigo-100"
                                >
                                    <span className="flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        Manage Profiles
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                        <div className="p-2 space-y-1 bg-gray-50/50 border-b border-gray-100">
                                            {activeProfile && (
                                                <button
                                                    type="button"
                                                    onClick={handleUpdateProfile}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                >
                                                    <RotateCw className="w-3 h-3" />
                                                    Update "{activeProfile.name}"
                                                </button>
                                            )}

                                            {isCreatingProfile ? (
                                                <div className="p-1 space-y-2 bg-white rounded border border-gray-200">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={newProfileName}
                                                        onChange={(e) => setNewProfileName(e.target.value)}
                                                        placeholder="New Profile Name..."
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                                                    />
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={handleCreateProfile}
                                                            className="flex-1 bg-indigo-600 text-white text-[10px] py-1 rounded hover:bg-indigo-700"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCreatingProfile(false)}
                                                            className="flex-1 bg-gray-100 text-gray-600 text-[10px] py-1 rounded hover:bg-gray-200"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreatingProfile(true)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Save as New Profile
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                            <div className="text-[9px] font-bold text-gray-400 uppercase px-3 py-1">Existing Profiles</div>
                                            {savedProfiles.length === 0 ? (
                                                <p className="text-[10px] text-gray-400 p-3 text-center italic">No saved profiles yet.</p>
                                            ) : (
                                                savedProfiles.map(profile => (
                                                    <div key={profile.id} className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-3 py-2 group/item cursor-pointer" onClick={() => handleLoadProfile(profile)}>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeProfile?.id === profile.id ? 'bg-green-500' : 'bg-indigo-300'}`}></div>
                                                            <span className={`text-xs font-medium truncate ${activeProfile?.id === profile.id ? 'text-indigo-700 font-bold' : 'text-gray-700'}`}>{profile.name}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteProfile(e, profile.id)}
                                                            className="text-gray-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-all opacity-0 group-hover/item:opacity-100"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                        <Globe className="w-3 h-3" /> Target Region
                                    </label>
                                    <div className="relative">
                                        <select
                                            {...register('targetAudience')}
                                            className="w-full pl-3 pr-8 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all cursor-pointer hover:bg-gray-50"
                                        >
                                            <option value="zh-TW">🇹🇼 Taiwan (Traditional)</option>
                                            <option value="zh-HK">🇭🇰 Hong Kong (Traditional)</option>
                                            <option value="zh-MY">🇲🇾 Malaysia (Simplified)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                        Website Context
                                    </label>
                                    <input
                                        type="text"
                                        {...register('websiteType')}
                                        placeholder="e.g. High-End Skincare E-commerce..."
                                        className="w-full px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Authority Attribute Terms</label>
                                    <textarea
                                        {...register('authorityTerms')}
                                        placeholder="Brand attributes, ingredients, certifications..."
                                        className="w-full h-20 px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-y custom-scrollbar transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
