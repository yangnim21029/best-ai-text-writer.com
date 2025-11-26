

import React, { useState, useEffect } from 'react';
import { ArticleConfig, TargetAudience, TokenUsage, CostBreakdown, GenerationStep, SavedProfile, ScrapedImage, ProductBrief } from '../types';
import { FileText, Briefcase, Save, ChevronDown, ChevronRight, Trash2, Link2, Download, Loader2, Sparkles, Globe, Settings2, LayoutTemplate, ImageIcon, ToggleLeft, ToggleRight, BookOpen, ShoppingBag, ArrowUpRight, Edit2, Plus, RotateCw, AlertTriangle, Eye, ExternalLink, Zap } from 'lucide-react';
import { fetchUrlContent } from '../services/webScraper';
import { extractWebsiteTypeAndTerm } from '../services/extractionService';
import { summarizeBrandContent } from '../services/productService';
// Removed analyzeImageWithAI import as it is now handled in App.tsx

interface InputFormProps {
  onGenerate: (config: ArticleConfig) => void;
  isGenerating: boolean;
  currentStep: GenerationStep;
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
  savedProfiles?: SavedProfile[];
  setSavedProfiles?: (profiles: SavedProfile[]) => void;
  activeProfile?: SavedProfile | null;
  onSetActiveProfile?: (profile: SavedProfile | null) => void; 
  inputType: 'text' | 'url';
  setInputType: (type: 'text' | 'url') => void;
  brandKnowledge?: string; // New Prop for saving state from sidebar
}

const STORAGE_KEY = 'pro_content_writer_inputs_simple_v4';

export const InputForm: React.FC<InputFormProps> = ({ 
    onGenerate, 
    isGenerating, 
    currentStep, 
    onAddCost,
    savedProfiles = [],
    setSavedProfiles,
    activeProfile,
    onSetActiveProfile,
    inputType,
    setInputType,
    brandKnowledge = ''
}) => {
  const getInitialState = () => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  };

  const initialState = getInitialState();

  const [title, setTitle] = useState(initialState.title || '');
  const [referenceContent, setReferenceContent] = useState(initialState.referenceContent || '');
  const [sampleOutline, setSampleOutline] = useState(initialState.sampleOutline || '');
  const [authorityTerms, setAuthorityTerms] = useState(initialState.authorityTerms || '');
  const [websiteType, setWebsiteType] = useState(initialState.websiteType || '');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(initialState.targetAudience || 'zh-TW');
  const [scrapedImages, setScrapedImages] = useState<ScrapedImage[]>(initialState.scrapedImages || []);
  const [useRag, setUseRag] = useState<boolean>(initialState.useRag ?? false);
  const [turboMode, setTurboMode] = useState<boolean>(initialState.turboMode ?? true); // Default to TRUE
  
  // NEW: Single Field Product Context
  const [productRawText, setProductRawText] = useState<string>(initialState.productRawText || '');

  // NEW: Product URL Import State
  const [productMode, setProductMode] = useState<'text' | 'url'>('text');
  const [productUrlList, setProductUrlList] = useState<string>('');
  const [isSummarizingProduct, setIsSummarizingProduct] = useState(false);
  const [showProductLoadMenu, setShowProductLoadMenu] = useState(false);

  // Profile Management State
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showBrandProfile, setShowBrandProfile] = useState(false); // Default false = Compact View
  const [showProductBrief, setShowProductBrief] = useState(false);

  // Text stats for reference content
  const [refCharCount, setRefCharCount] = useState(0);
  const [refWordCount, setRefWordCount] = useState(0);

  // Apply Active Profile when loaded from Dashboard
  useEffect(() => {
      if (activeProfile) {
          setWebsiteType(activeProfile.websiteType);
          setAuthorityTerms(activeProfile.authorityTerms);
          // brandKnowledge is loaded in App.tsx and passed to Sidebar
          setTargetAudience(activeProfile.targetAudience);
          if (activeProfile.useRag !== undefined) setUseRag(activeProfile.useRag);
          if (activeProfile.productRawText) setProductRawText(activeProfile.productRawText);
      }
  }, [activeProfile]);

  useEffect(() => {
    const data = { title, referenceContent, sampleOutline, authorityTerms, websiteType, targetAudience, scrapedImages, useRag, turboMode, productRawText };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Update stats (Hybrid Word Count)
    setRefCharCount(referenceContent.length);
    const cjkCount = (referenceContent.match(/[\u4e00-\u9fa5]/g) || []).length;
    const nonCjkText = referenceContent.replace(/[\u4e00-\u9fa5]/g, ' ');
    const englishWords = nonCjkText.trim().split(/\s+/).filter(w => w.length > 0);
    setRefWordCount(cjkCount + englishWords.length);

  }, [title, referenceContent, sampleOutline, authorityTerms, websiteType, targetAudience, scrapedImages, useRag, turboMode, productRawText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !referenceContent) return;
    
    onGenerate({ 
        title, 
        referenceContent, 
        sampleOutline, 
        authorityTerms, 
        brandKnowledge: undefined, // Handled by global state
        websiteType, 
        targetAudience,
        scrapedImages,
        useRag,
        turboMode,
        productRawText // Pass raw text, App.tsx will handle parsing
    });
  };

  const handleClear = () => {
    if(confirm('Clear all inputs?')) {
        setTitle('');
        setReferenceContent('');
        setSampleOutline('');
        setAuthorityTerms('');
        setWebsiteType('');
        setTargetAudience('zh-TW');
        setUrlInput('');
        setScrapedImages([]);
        setUseRag(false);
        setTurboMode(true);
        setProductRawText('');
    }
  };
  
  const handleCreateProfile = () => {
      if (!setSavedProfiles || !newProfileName.trim()) return;
      
      const newProfile: SavedProfile = {
          id: Date.now().toString(),
          name: newProfileName.trim(),
          websiteType,
          authorityTerms,
          brandKnowledge: brandKnowledge || '', // Use prop
          targetAudience,
          useRag,
          productRawText // Save raw input
      };
      
      setSavedProfiles([...savedProfiles, newProfile]);
      if (onSetActiveProfile) onSetActiveProfile(newProfile);
      
      // Reset & Close
      setNewProfileName('');
      setIsCreatingProfile(false);
      setShowProfileMenu(false);
      alert(`Profile "${newProfile.name}" saved!`);
  };

  const handleUpdateProfile = () => {
      if (!setSavedProfiles || !activeProfile) return;
      
      const shouldUpdate = confirm(`Update existing profile "${activeProfile.name}" with current settings?`);
      if (shouldUpdate) {
          const updatedProfiles = savedProfiles.map(p => 
              p.id === activeProfile.id 
              ? { 
                  ...p, 
                  websiteType, 
                  authorityTerms, 
                  targetAudience, 
                  useRag, 
                  productRawText,
                  brandKnowledge: brandKnowledge // Update with current KB
                } 
              : p
          );
          setSavedProfiles(updatedProfiles);
          // Manually update active profile state to reflect changes immediately
          const updatedActive = updatedProfiles.find(p => p.id === activeProfile.id);
          if (updatedActive && onSetActiveProfile) onSetActiveProfile(updatedActive);
          
          alert("Profile Updated Successfully!");
          setShowProfileMenu(false);
      }
  };

  const loadProfileLocal = (profile: SavedProfile) => {
      setWebsiteType(profile.websiteType);
      setAuthorityTerms(profile.authorityTerms);
      setTargetAudience(profile.targetAudience);
      if (profile.useRag !== undefined) setUseRag(profile.useRag);
      if (profile.productRawText) setProductRawText(profile.productRawText);
      else if (profile.productBrief) {
          // Backward compatibility: Convert obj to string
          setProductRawText(`${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`);
      }
      
      if (onSetActiveProfile) onSetActiveProfile(profile);
      setShowProfileMenu(false);
  };
  
  const loadProductFromProfile = (profile: SavedProfile) => {
      if (profile.productRawText) {
          setProductRawText(profile.productRawText);
          setProductMode('text');
      } else if (profile.productBrief) {
           setProductRawText(`${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`);
           setProductMode('text');
      } else {
          alert("This profile has no saved product/service details.");
      }
      setShowProductLoadMenu(false);
  };
  
  const deleteProfile = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!setSavedProfiles) return;
      if(confirm("Delete this profile?")) {
          setSavedProfiles(savedProfiles.filter(p => p.id !== id));
          if (activeProfile?.id === id && onSetActiveProfile) {
              onSetActiveProfile(null);
          }
      }
  };

  const handleFetchUrl = async () => {
      if (!urlInput) return;
      setIsFetchingUrl(true);
      try {
          const { title: fetchedTitle, content: cleanedContent, images } = await fetchUrlContent(urlInput);
          setReferenceContent(cleanedContent);
          setScrapedImages(images);
          if (fetchedTitle) setTitle(fetchedTitle);
          
          try {
             const brandRes = await extractWebsiteTypeAndTerm(cleanedContent);
             if (brandRes.data.websiteType) setWebsiteType(brandRes.data.websiteType);
             if (brandRes.data.authorityTerms) setAuthorityTerms(brandRes.data.authorityTerms);
             if (onAddCost) onAddCost(brandRes.cost, brandRes.usage);
          } catch (aiError) {
             console.warn("Failed to auto-extract brand info", aiError);
          }
          setInputType('text');
      } catch (e) {
          alert("Failed to fetch content from URL. The site might block bots.");
      } finally {
          setIsFetchingUrl(false);
      }
  };

  // Removed handleAnalyzeImages as it is moved to App.tsx loop

  const handleImportProductUrls = async () => {
      if (!productUrlList.trim()) return;
      setIsSummarizingProduct(true);
      try {
          const urls = productUrlList.split('\n').map(u => u.trim()).filter(u => u.length > 0);
          const res = await summarizeBrandContent(urls, targetAudience);
          
          setProductRawText(res.data);
          setProductMode('text'); // Switch back to text view to show result
          
          if (onAddCost) onAddCost(res.cost, res.usage);
          
          // Auto-save to active profile if exists
          if (activeProfile && setSavedProfiles) {
              const updated = savedProfiles.map(p => p.id === activeProfile.id ? { ...p, productRawText: res.data } : p);
              setSavedProfiles(updated);
          }
      } catch (e) {
          alert("Failed to summarize brand content.");
      } finally {
          setIsSummarizingProduct(false);
      }
  };

  const getStepLabel = (step: GenerationStep) => {
      switch(step) {
          case 'fetching_url': return 'Fetching URL Content...';
          case 'parsing_product': return 'Analyzing Product Context...';
          case 'nlp_analysis': return 'Running NLP Tokenization...';
          case 'extracting_structure': return 'Analyzing Deep Structure...';
          case 'analyzing_authority': return 'Strategizing Authority Terms...';
          case 'planning_keywords': return 'Extracting Contextual Usage...';
          case 'mapping_product': return 'Generating Problem-Product Map...';
          case 'writing_content': return 'Writing Article Sections...';
          case 'finalizing': return 'Finalizing Output...';
          default: return 'Processing...';
      }
  };

  const getRegionLabel = (code: TargetAudience) => {
      switch(code) {
          case 'zh-TW': return { flag: '🇹🇼', name: 'Taiwan' };
          case 'zh-HK': return { flag: '🇭🇰', name: 'Hong Kong' };
          case 'zh-MY': return { flag: '🇲🇾', name: 'Malaysia' };
          default: return { flag: '🌐', name: 'Global' };
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80 overflow-hidden font-sans">
      {/* Header Area */}
      <div className="p-4 pb-2 flex-shrink-0 border-b border-gray-100 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-800">
                <LayoutTemplate className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold tracking-tight">Writer Config</h2>
             </div>
             <button onClick={handleClear} className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-red-50 rounded">
                <Trash2 className="w-3 h-3" /> Clear
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 relative">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-24">
            
            {/* SECTION 1: WEBSITE PROFILE */}
            <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Website Profile
                    <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
                         <AlertTriangle className="w-3 h-3" />
                         BETA / UNSTABLE
                    </span>
                </h3>
                
                <div className={`bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${showBrandProfile ? 'ring-2 ring-indigo-50/50' : 'hover:shadow-md'}`}>
                    
                    {/* Header: Always visible, acts as Toggle */}
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
                                        {getRegionLabel(targetAudience).flag} {getRegionLabel(targetAudience).name}
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

                    {/* Expanded Content */}
                    {showBrandProfile && (
                        <div className="p-4 pt-0 border-t border-gray-50 animate-in slide-in-from-top-1 fade-in duration-200">
                            <div className="pt-3 space-y-4">
                                {/* Manage Profile Dropdown */}
                                <div className="relative">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowProfileMenu(!showProfileMenu);
                                            setIsCreatingProfile(false); // Reset on open
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
                                            
                                            {/* Actions Area */}
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
                                                
                                                {/* Inline Creation Form */}
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
                                                                onClick={handleCreateProfile}
                                                                className="flex-1 bg-indigo-600 text-white text-[10px] py-1 rounded hover:bg-indigo-700"
                                                            >
                                                                Save
                                                            </button>
                                                            <button 
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

                                            {/* Profile List */}
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase px-3 py-1">Existing Profiles</div>
                                                {savedProfiles.length === 0 ? (
                                                    <p className="text-[10px] text-gray-400 p-3 text-center italic">No saved profiles yet.</p>
                                                ) : (
                                                    savedProfiles.map(profile => (
                                                        <div key={profile.id} className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-3 py-2 group/item cursor-pointer" onClick={() => loadProfileLocal(profile)}>
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeProfile?.id === profile.id ? 'bg-green-500' : 'bg-indigo-300'}`}></div>
                                                                <span className={`text-xs font-medium truncate ${activeProfile?.id === profile.id ? 'text-indigo-700 font-bold' : 'text-gray-700'}`}>{profile.name}</span>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={(e) => deleteProfile(e, profile.id)}
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

                                {/* Inputs */}
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                            <Globe className="w-3 h-3" /> Target Region
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={targetAudience}
                                                onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
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
                                            <Settings2 className="w-3 h-3" /> Website Context
                                        </label>
                                        <input
                                            type="text"
                                            value={websiteType}
                                            onChange={(e) => setWebsiteType(e.target.value)}
                                            placeholder="e.g. High-End Skincare E-commerce..."
                                            className="w-full px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Authority Attribute Terms</label>
                                        <textarea
                                            value={authorityTerms}
                                            onChange={(e) => setAuthorityTerms(e.target.value)}
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

            {/* SECTION 2: OUR SERVICE AND PRODUCTS */}
            <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-1 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> Our Service And Products
                </h3>
                
                <div className={`bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${showProductBrief ? 'ring-2 ring-emerald-50/50' : 'hover:shadow-md'}`}>
                     
                     {/* Consistent Header UI with Website Profile */}
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
                             {/* Import Toolbar with Load Profile */}
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
                                 
                                 {/* Load / Manage Dropdown */}
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
                                             {/* Actions Area */}
                                             <div className="p-2 space-y-1 bg-gray-50/50 border-b border-gray-100">
                                                {activeProfile && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleUpdateProfile();
                                                            setShowProductLoadMenu(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                    >
                                                        <RotateCw className="w-3 h-3" />
                                                        Update Service in "{activeProfile.name}"
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleCreateProfile();
                                                        setShowProductLoadMenu(false);
                                                    }}
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
                                                             onClick={() => loadProductFromProfile(p)}
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
                                        value={productRawText}
                                        onChange={(e) => setProductRawText(e.target.value)}
                                        className="w-full h-48 px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none custom-scrollbar"
                                        placeholder="Paste details about YOUR Service/Product here.&#10;e.g.&#10;Store: City Dental Clinic&#10;Service: Painless Implants&#10;Address: 123 Main St, Taipei&#10;Phone: 02-1234-5678&#10;USP: 20 years experience, 24hr emergency."
                                     />
                                 </div>
                             ) : (
                                 <div className="space-y-2">
                                     <div className="space-y-1.5">
                                         <label className="text-[10px] font-bold text-gray-500 uppercase">Product / Service Page URLs</label>
                                         <textarea 
                                            value={productUrlList}
                                            onChange={(e) => setProductUrlList(e.target.value)}
                                            className="w-full h-32 px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-200 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none custom-scrollbar font-mono"
                                            placeholder="https://example.com/product-a&#10;https://example.com/about-us"
                                         />
                                         <p className="text-[9px] text-gray-400">One URL per line. AI will summarize key services and contact info.</p>
                                     </div>
                                     <button
                                         type="button"
                                         onClick={handleImportProductUrls}
                                         disabled={isSummarizingProduct || !productUrlList}
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

            {/* SECTION 3: SOURCE MATERIAL */}
            <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Source Material
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Article Topic</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Advanced React Patterns"
                            id="topic-input"
                            className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                Reference Content
                                {scrapedImages.length > 0 && (
                                    <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 text-[9px] flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3" /> {scrapedImages.length} Images
                                    </span>
                                )}
                                <span className="text-amber-500 bg-amber-50 px-1 rounded text-[9px] ml-auto border border-amber-100">Required</span>
                            </label>
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                <button 
                                    type="button"
                                    onClick={() => setInputType('text')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${inputType === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Paste Text
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setInputType('url')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${inputType === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    From URL
                                </button>
                             </div>
                        </div>

                        {inputType === 'text' ? (
                            <div className="relative group">
                                <textarea
                                    value={referenceContent}
                                    onChange={(e) => setReferenceContent(e.target.value)}
                                    placeholder="Paste your source text here..."
                                    className="w-full h-36 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs font-mono text-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none custom-scrollbar transition-all group-hover:bg-white"
                                    required
                                />
                                <div className="flex justify-end mt-1">
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {refWordCount} words | {refCharCount} chars
                                    </span>
                                </div>
                            </div>
                        ) : (
                             <div className="flex gap-2">
                                 <div className="relative flex-1">
                                     <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <Link2 className="w-3.5 h-3.5 text-gray-400" />
                                     </div>
                                     <input 
                                        type="url" 
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://example.com/article"
                                        className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        autoFocus
                                     />
                                 </div>
                                 <button 
                                    type="button"
                                    onClick={handleFetchUrl}
                                    disabled={isFetchingUrl || !urlInput}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[40px]"
                                 >
                                    {isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                 </button>
                             </div>
                        )}
                        
                        {/* Extracted Images Gallery */}
                        {scrapedImages.length > 0 && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                        <ImageIcon className="w-3 h-3" /> Extracted Visuals
                                    </h5>
                                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
                                        AI will analyze first 5 images during generation
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                    {scrapedImages.map((img, idx) => (
                                        <div key={idx} className="relative group rounded-md overflow-hidden bg-white border border-gray-200 aspect-square shadow-sm">
                                            {img.url ? (
                                                <img 
                                                    src={img.url} 
                                                    alt={img.altText} 
                                                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-mono">
                                                    No Img
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                                <a href={img.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-300" title="Open Original">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>

                                            {idx < 5 && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full border border-white" title="Queued for AI Analysis"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                     {/* Outline Accordion */}
                    <div className="pt-1 border-t border-gray-50 mt-2">
                        <button 
                            type="button" 
                            onClick={() => setShowOutline(!showOutline)}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400 hover:text-gray-600 transition-colors w-full py-2 justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showOutline ? 'rotate-90' : ''}`} />
                                Sample Outline (Optional)
                            </span>
                            {sampleOutline.length > 0 && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 rounded">Active</span>}
                        </button>
                        {showOutline && (
                            <div className="mt-1 animate-in slide-in-from-top-2 duration-200">
                                <textarea
                                    value={sampleOutline}
                                    onChange={(e) => setSampleOutline(e.target.value)}
                                    placeholder="One heading per line..."
                                    className="w-full h-24 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 focus:border-gray-400 outline-none resize-none custom-scrollbar"
                                />
                                <p className="text-[9px] text-gray-400 mt-1 italic">
                                    * If provided, this will <span className="font-bold text-gray-500">override</span> the AI-generated narrative structure.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* SECTION 4: ADVANCED SETTINGS */}
             <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3 flex flex-col gap-3">
                
                {/* RAG Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            Smart Context Filtering (RAG)
                        </span>
                        <span className="text-[9px] text-gray-400">
                            Agentic Retrieval: AI reads your Knowledge Base & filters data per section.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setUseRag(!useRag)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${useRag ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                        <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${useRag ? 'translate-x-4.5' : 'translate-x-1'}`}
                            style={{ transform: useRag ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                    </button>
                </div>

                {/* Turbo Mode Toggle */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Turbo Mode (Parallel Generation)
                        </span>
                        <span className="text-[9px] text-gray-400">
                            Writes all sections simultaneously. Faster, but flow may vary.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setTurboMode(!turboMode)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${turboMode ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                        <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${turboMode ? 'translate-x-4.5' : 'translate-x-1'}`}
                            style={{ transform: turboMode ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                    </button>
                </div>
            </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <button
            type="submit"
            disabled={isGenerating || !title || !referenceContent}
            className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg active:scale-[0.99] ${
                isGenerating || !title || !referenceContent
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/40'
            }`}
            >
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center w-full">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                    </div>
                    <span className="text-[10px] font-normal opacity-90 mt-0.5">
                        {getStepLabel(currentStep)}
                    </span>
                </div>
            ) : (
                <>
                <Sparkles className="w-4 h-4 fill-blue-200/30" />
                <span>Run NLP & Write</span>
                </>
            )}
            </button>
        </div>
      </form>
    </div>
  );
};