
import React, { useState } from 'react';
import { BrainCircuit, Layers, Target, ShieldCheck, Database, ListChecks, Zap, Hash, BarChart2, FileSearch, BookOpen, UploadCloud, FileText, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { KeywordActionPlan, ReferenceAnalysis, AuthorityAnalysis, ProblemProductMapping, ProductBrief } from '../types';

interface SeoSidebarProps {
  keywordPlans: KeywordActionPlan[];
  referenceAnalysis: ReferenceAnalysis | null;
  authorityAnalysis: AuthorityAnalysis | null;
  productMapping?: ProblemProductMapping[];
  productBrief?: ProductBrief;
  isLoading: boolean;
  brandKnowledge: string;
  setBrandKnowledge: (kb: string) => void;
}

type Tab = 'analysis' | 'knowledge';

export const SeoSidebar: React.FC<SeoSidebarProps> = ({ 
    keywordPlans, 
    referenceAnalysis, 
    authorityAnalysis,
    productMapping = [],
    productBrief,
    isLoading,
    brandKnowledge,
    setBrandKnowledge
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

  const hasData = keywordPlans.length > 0 || referenceAnalysis !== null || authorityAnalysis !== null || productMapping.length > 0;
  const hasKnowledge = brandKnowledge && brandKnowledge.trim().length > 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
              const text = event.target.result as string;
              // Append to existing or replace? Let's append if existing, else replace.
              const newContent = brandKnowledge ? brandKnowledge + "\n\n" + text : text;
              setBrandKnowledge(newContent);
          }
      };
      reader.readAsText(file);
  };

  const AnalysisView = () => {
    if (isLoading) {
        return (
          <div className="flex flex-col h-full p-8 items-center justify-center bg-white/50 space-y-6">
              <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <BrainCircuit className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
              </div>
              <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-gray-800">Analyzing Content</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Extraction in progress...</p>
              </div>
          </div>
        );
    }

    if (!hasData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 rotate-3">
              <FileSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-base font-bold text-gray-700 mb-2">No Data Available</h4>
          <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
              Start a generation to see NLP insights, structural breakdown, and authority signals here.
          </p>
        </div>
      );
    }

    // Helper to find which section matches a mapping
    const getMatchingSections = (keywords: string[]) => {
        if (!referenceAnalysis?.structure) return [];
        return referenceAnalysis.structure.filter(s => 
            keywords.some(k => s.title.toLowerCase().includes(k.toLowerCase()))
        ).map(s => s.title);
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
             {/* NEW: Product & Conversion Strategy Card */}
             {productBrief && productBrief.productName && (
                 <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-emerald-50/80 to-white flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Service & Product Strategy</h4>
                    </div>
                    <div className="p-3 space-y-3">
                        {/* Product Summary */}
                        <div className="flex items-center justify-between text-[10px] bg-emerald-50/50 p-2 rounded border border-emerald-100">
                             <span className="font-bold text-emerald-700">{productBrief.productName}</span>
                             <span className="text-emerald-600/70 truncate max-w-[120px]">{productBrief.usp}</span>
                        </div>

                        {/* Mapping Strategy */}
                        <div className="space-y-2">
                             <h5 className="text-[9px] font-bold text-gray-400 uppercase">Injection Map</h5>
                             {productMapping.length === 0 ? (
                                 <p className="text-[10px] text-gray-400 italic">No specific mappings generated.</p>
                             ) : (
                                 productMapping.map((map, idx) => {
                                     const matchedSections = getMatchingSections(map.relevanceKeywords);
                                     return (
                                         <div key={idx} className="bg-gray-50 rounded p-2 border border-gray-100 flex flex-col gap-1.5">
                                             <div className="flex items-start gap-2">
                                                 <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" title="Pain Point"></div>
                                                 <span className="text-[10px] text-gray-700 leading-tight">
                                                     {map.painPoint}
                                                 </span>
                                             </div>
                                             <div className="flex items-center gap-2 pl-3.5">
                                                 <ArrowRight className="w-3 h-3 text-gray-300" />
                                                 <span className="text-[10px] font-bold text-emerald-600 leading-tight">
                                                     {map.productFeature}
                                                 </span>
                                             </div>
                                             {matchedSections.length > 0 && (
                                                 <div className="mt-1 pl-3.5 flex flex-wrap gap-1">
                                                     {matchedSections.map((s, si) => (
                                                         <span key={si} className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">
                                                             📍 {s.substring(0, 15)}...
                                                         </span>
                                                     ))}
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })
                             )}
                        </div>

                        {/* Replacement Rules */}
                        {referenceAnalysis?.replacementRules && referenceAnalysis.replacementRules.length > 0 && (
                             <div className="space-y-1 pt-2 border-t border-gray-100">
                                 <h5 className="text-[9px] font-bold text-gray-400 uppercase">Competitor Terms (To Be Replaced)</h5>
                                 <ul className="space-y-1">
                                     {referenceAnalysis.replacementRules.map((rule, ri) => (
                                         <li key={ri} className="text-[10px] text-gray-600 flex items-start gap-1">
                                             <span className="text-red-400 font-mono text-[9px]">[-]</span>
                                             {rule}
                                         </li>
                                     ))}
                                 </ul>
                             </div>
                        )}
                    </div>
                 </div>
             )}

             {/* Card 1: Voice & Strategy */}
             {referenceAnalysis && referenceAnalysis.generalPlan.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-purple-50/80 to-white flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-purple-600" />
                        <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Voice Strategy</h4>
                    </div>
                    <div className="p-3">
                        <div className="space-y-2">
                            {referenceAnalysis.generalPlan.map((point, idx) => (
                                <div key={idx} className="flex gap-2.5 items-start">
                                    <div className="w-1 h-1 mt-2 rounded-full bg-purple-400 flex-shrink-0"></div>
                                    <p className="text-[11px] text-gray-600 leading-relaxed">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             )}
    
             {/* Card 2: Authority Signals */}
             {authorityAnalysis && authorityAnalysis.relevantTerms.length > 0 && (
                 <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-teal-50/80 to-white flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Authority Signals</h4>
                    </div>
                    <div className="p-4 space-y-3">
                         <div className="flex flex-wrap gap-1.5">
                             {authorityAnalysis.relevantTerms.slice(0, 8).map((term, idx) => (
                                 <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[10px] font-semibold">
                                     {term}
                                 </span>
                             ))}
                             {authorityAnalysis.relevantTerms.length > 8 && (
                                 <span className="px-2 py-1 text-gray-400 text-[10px] font-medium bg-gray-50 rounded border border-gray-100">
                                     +{authorityAnalysis.relevantTerms.length - 8} more
                                 </span>
                             )}
                         </div>
                         
                         <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                             <h5 className="text-[9px] font-bold text-gray-400 mb-2 uppercase flex items-center gap-1">
                                 <Zap className="w-3 h-3 text-amber-400" /> Integration Plan
                             </h5>
                             <ul className="space-y-1.5">
                                 {authorityAnalysis.combinations.map((plan, idx) => (
                                     <li key={idx} className="text-[10px] text-gray-600 flex items-start gap-1.5 leading-snug">
                                         <span className="text-teal-400 mt-0.5">•</span>
                                         <span>{plan}</span>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                    </div>
                 </div>
             )}
    
             {/* Card 3: Information Density */}
             {referenceAnalysis && referenceAnalysis.keyInformationPoints && referenceAnalysis.keyInformationPoints.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-orange-50/80 to-white flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-orange-600" />
                        <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Key Facts</h4>
                    </div>
                    <div className="p-1">
                        <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                            {referenceAnalysis.keyInformationPoints.map((point, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 p-2 rounded hover:bg-orange-50 transition-colors">
                                    <div className="w-1 h-1 mt-1.5 rounded-full bg-orange-300 flex-shrink-0"></div>
                                    <span className="text-[10px] text-gray-600 leading-relaxed">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}
    
             {/* Card 4: Structure Map */}
             {referenceAnalysis && referenceAnalysis.structure.length > 0 && (
                 <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-blue-50/80 to-white flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Narrative Arc</h4>
                    </div>
                    <div className="relative py-2">
                        {/* Timeline Line */}
                        <div className="absolute left-5 top-4 bottom-4 w-px bg-gray-100"></div>
                        
                        <div className="relative z-10">
                            {referenceAnalysis.structure.map((section, idx) => (
                                <div key={idx} className="px-4 py-2 pl-10 relative hover:bg-blue-50/30 transition-colors group/item">
                                    <div className="absolute left-3 top-2.5 w-4 h-4 rounded-full border-2 border-white bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm text-[9px] font-bold z-10 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                                        {idx + 1}
                                    </div>
                                    <h5 className="text-[11px] font-bold text-gray-800 mb-0.5">{section.title}</h5>
                                    {section.narrativePlan && (
                                        <p className="text-[10px] text-gray-400 leading-normal">
                                            {section.narrativePlan[0]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}
    
             {/* Card 5: NLP Keywords */}
             {keywordPlans.length > 0 && (
                 <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-indigo-50/80 to-white flex items-center gap-2">
                        <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                        <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Semantic Keywords</h4>
                    </div>
                    <div className="p-3 space-y-3">
                        {keywordPlans.map((item, idx) => (
                            <div key={idx} className="bg-gray-50/50 rounded-lg p-2.5 border border-gray-100">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <Hash className="w-3 h-3 text-indigo-300" />
                                        <span className="text-[11px] font-bold text-gray-800">
                                            {item.word}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {item.plan.map((rule, rIdx) => (
                                        <div key={rIdx} className="text-[10px] text-gray-600 flex items-start gap-1.5">
                                            <span className="text-indigo-300 mt-px">•</span>
                                            <span className="leading-snug opacity-90">{rule}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}
        </div>
    );
  };

  const KnowledgeView = () => {
      return (
          <div className="flex flex-col h-full bg-slate-50/50">
              <div className="p-4 bg-white border-b border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                     <p className="text-xs text-gray-500">
                         Upload or paste Brand Guidelines, Product Specs, or Whitepapers here. 
                     </p>
                  </div>
                  
                  <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                          <input type="file" className="hidden" accept=".txt,.md,.json" onChange={handleFileUpload} />
                          <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                              <UploadCloud className="w-3.5 h-3.5" />
                              Load File
                          </div>
                      </label>
                      <button 
                        onClick={() => setBrandKnowledge('')}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
                        title="Clear Knowledge Base"
                      >
                          <X className="w-3.5 h-3.5" />
                      </button>
                  </div>
              </div>

              <div className="flex-1 p-0 relative group">
                  <textarea 
                    value={brandKnowledge}
                    onChange={(e) => setBrandKnowledge(e.target.value)}
                    placeholder="Paste heavy documentation here..."
                    className="w-full h-full p-4 bg-gray-50 resize-none outline-none text-xs font-mono text-gray-600 leading-relaxed focus:bg-white transition-colors custom-scrollbar"
                  />
                  {!brandKnowledge && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-300 p-8 text-center">
                          <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-sm font-bold">Knowledge Base Empty</p>
                          <p className="text-[10px] mt-1">This context is used by RAG to enhance section generation.</p>
                      </div>
                  )}
              </div>
              
              <div className="p-2 bg-white border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                  <span>{brandKnowledge.length} chars</span>
                  <span className={brandKnowledge.length > 0 ? "text-green-600 font-bold" : ""}>
                      {brandKnowledge.length > 0 ? "RAG Active" : "Inactive"}
                  </span>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/80 w-full border-l border-gray-200 font-sans">
      
      {/* Sidebar Header / Tabs */}
      <div className="flex items-center px-2 pt-2 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex-shrink-0 z-10">
        <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 pb-2 pt-1 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'analysis' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
            <BarChart2 className="w-3.5 h-3.5" />
            Analysis
        </button>
        <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 pb-2 pt-1 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors relative ${
                activeTab === 'knowledge' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge
            {hasKnowledge && (
                <span className="absolute top-1 right-6 w-1.5 h-1.5 bg-green-500 rounded-full ring-2 ring-white"></span>
            )}
        </button>
      </div>

      {activeTab === 'analysis' ? <AnalysisView /> : <KnowledgeView />}
    </div>
  );
};
