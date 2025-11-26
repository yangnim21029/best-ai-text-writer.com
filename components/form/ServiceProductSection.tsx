import React, { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';
import { SavedProfile } from '../../types';
import { BookOpen, ChevronDown, Download, Edit2, Loader2, Plus, RotateCw, ShoppingBag, Sparkles } from 'lucide-react';

interface ServiceProductSectionProps {
    register: UseFormRegister<ArticleFormValues>;
    productMode: 'text' | 'url';
    setProductMode: (mode: 'text' | 'url') => void;
    productRawText?: string;
    isSummarizingProduct: boolean;
    canAnalyzeFromUrls: boolean;
    savedProfiles: SavedProfile[];
    activeProfile?: SavedProfile | null;
    onCreateProfile: (name: string) => SavedProfile | null;
    onUpdateProfile: () => SavedProfile | null;
    onLoadProductFromProfile: (profile: SavedProfile) => void;
    onAnalyzeFromUrls: () => Promise<void>;
}

export const ServiceProductSection: React.FC<ServiceProductSectionProps> = ({
    register,
    productMode,
    setProductMode,
    productRawText,
    isSummarizingProduct,
    canAnalyzeFromUrls,
    savedProfiles,
    activeProfile,
    onCreateProfile,
    onUpdateProfile,
    onLoadProductFromProfile,
    onAnalyzeFromUrls,
}) => {
    const [showProductBrief, setShowProductBrief] = useState(false);
    const [showProductLoadMenu, setShowProductLoadMenu] = useState(false);

    const handleAnalyzeUrls = async () => {
        await onAnalyzeFromUrls();
    };

    const handleCreateProfile = () => {
        const name = prompt('Profile name to save this service/product?');
        if (!name) return;
        const created = onCreateProfile(name);
        if (created) {
            alert(`Profile "${created.name}" saved!`);
            setShowProductLoadMenu(false);
        }
    };

    const handleUpdateProfile = () => {
        const updated = onUpdateProfile();
        if (updated) {
            alert('Profile Updated Successfully!');
            setShowProductLoadMenu(false);
        }
    };

    const handleLoadProduct = (profile: SavedProfile) => {
        onLoadProductFromProfile(profile);
        setProductMode('text');
        setShowProductLoadMenu(false);
    };

    return (
        <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-1 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> Our Service And Products
            </h3>

            <div className={`bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${showProductBrief ? 'ring-2 ring-emerald-50/50' : 'hover:shadow-md'}`}>

                <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                    onClick={() => setShowProductBrief(!showProductBrief)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800">Our Service & Product</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                {productRawText ? (
                                    <span className="truncate max-w-[180px] text-emerald-600 font-medium">
                                        {productRawText.substring(0, 30)}...
                                    </span>
                                ) : (
                                    <span className="text-gray-400">Not Configured</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showProductBrief ? 'rotate-180' : ''}`} />
                </div>

                {showProductBrief && (
                    <div className="p-4 pt-0 border-t border-gray-50 animate-in slide-in-from-top-1 fade-in duration-200 mt-3">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1 flex-1 p-1 bg-gray-50 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setProductMode('text')}
                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${productMode === 'text' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Edit2 className="w-3 h-3" /> Text Input
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProductMode('url')}
                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${productMode === 'url' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Download className="w-3 h-3" /> From URL
                                </button>
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowProductLoadMenu(!showProductLoadMenu)}
                                    className="h-full px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold hover:border-emerald-300 hover:text-emerald-600 transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Manage Service</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>

                                {showProductLoadMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-2 space-y-1 bg-gray-50/50 border-b border-gray-100">
                                            {activeProfile && (
                                                <button
                                                    type="button"
                                                    onClick={handleUpdateProfile}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                >
                                                    <RotateCw className="w-3 h-3" />
                                                    Update Service in "{activeProfile.name}"
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleCreateProfile}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Save Service as New Profile
                                            </button>
                                        </div>

                                        <div className="p-2 bg-gray-50 border-b border-gray-100 text-[9px] font-bold text-gray-400 uppercase">
                                            Load from Profile
                                        </div>
                                        <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                                            {savedProfiles.length === 0 ? (
                                                <p className="text-[10px] text-gray-400 p-2 text-center">No profiles found.</p>
                                            ) : (
                                                savedProfiles.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => handleLoadProduct(p)}
                                                        className="w-full text-left px-3 py-2 text-[10px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors truncate flex items-center justify-between"
                                                    >
                                                        <span>{p.name}</span>
                                                        {activeProfile?.id === p.id && <span className="text-[8px] bg-green-100 text-green-600 px-1 rounded">Active</span>}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {productMode === 'text' ? (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Our Service & Product Details</label>
                                <textarea
                                    {...register('productRawText')}
                                    className="w-full h-48 px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none custom-scrollbar"
                                    placeholder="Paste details about YOUR Service/Product here.&#10;e.g.&#10;Store: City Dental Clinic&#10;Service: Painless Implants&#10;Address: 123 Main St, Taipei&#10;Phone: 02-1234-5678&#10;USP: 20 years experience, 24hr emergency."
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Product / Service Page URLs</label>
                                    <textarea
                                        {...register('productUrlList')}
                                        className="w-full h-32 px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none custom-scrollbar font-mono"
                                        placeholder="https://example.com/product-a&#10;https://example.com/about-us"
                                    />
                                    <p className="text-[9px] text-gray-400">One URL per line. AI will summarize key services and contact info.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAnalyzeUrls}
                                    disabled={isSummarizingProduct || !canAnalyzeFromUrls}
                                    className="w-full py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSummarizingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    {isSummarizingProduct ? 'Analyzing...' : 'Analyze & Summarize'}
                                </button>
                            </div>
                        )}

                        <div className="text-[10px] text-gray-400 italic bg-gray-50 p-2 rounded flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            AI will extract OUR Brand info to replace competitors in the article.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
