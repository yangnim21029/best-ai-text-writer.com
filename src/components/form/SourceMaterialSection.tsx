import React, { useState } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';
import { ScrapedImage } from '../../types';
import {
  FileText,
  Link2,
  ChevronDown,
  LayoutTemplate,
  Database,
  RotateCw,
  Plus,
  Sparkles,
  Loader2,
  Globe,
} from 'lucide-react';
import { dedupeScrapedImages } from '../../utils/imageUtils';
import { LoadingButton } from '../LoadingButton';
import { UrlInputModal } from '../modals/UrlInputModal';
import { convertToMarkdownAction } from '@/app/actions/analysis';

interface SourceMaterialSectionProps {
  register: UseFormRegister<ArticleFormValues>;
  setValue: UseFormSetValue<ArticleFormValues>;
  content?: string;
  errors: any;
  // inputType prop is effectively deprecated but kept for compatibility if needed implicitly, 
  // though we mainly operate in 'text' mode now visually.
  inputType: 'text' | 'url';
  setInputType: (type: 'text' | 'url') => void;
  urlValue?: string;
  refWordCount: number;
  refCharCount: number;
  scrapedImages: ScrapedImage[];
  onFetchUrl: (url?: string) => Promise<void>;
  isFetchingUrl: boolean;
  onToggleScrapedImage?: (image: ScrapedImage) => void;
  onRequestSemanticFilter: () => void;
  canSemanticFilter: boolean;
  // Page Profile Props
  websiteType?: string;
  activePageId?: string;
  onCreatePage: (name: string) => void;
  activePageTitle?: string;
}

export const SourceMaterialSection: React.FC<SourceMaterialSectionProps> = ({
  register,
  setValue,
  content,
  errors,
  urlValue,
  refWordCount,
  scrapedImages,
  onFetchUrl,
  isFetchingUrl,
  onRequestSemanticFilter,
  canSemanticFilter,
  websiteType,
  activePageId,
  onCreatePage,
  activePageTitle,
}) => {
  const [isSourceInputOpen, setIsSourceInputOpen] = useState(true);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // We don't render tabs anymore. We always show the text input area.
  // The URL input is handled via the modal.

  const handleUrlConfirm = async (url: string) => {
    // onFetchUrl handles setting loading state in parent hook
    await onFetchUrl(url);
    // Modal closes automatically on success via its own logic or we close it here? 
    // UrlInputModal implementation closes on its own success if promises resolves.
    // Ensure we close it here to be safe if props passed differently? 
    // The Modal component I wrote: calls onConfirm, awaits, then calls onClose.
    // So we don't need to close it here explicitly, but we can.
    setIsUrlModalOpen(false);
  };

  const handleConvertToMarkdown = async () => {
    if (!content || !content.trim()) return;
    setIsConverting(true);
    try {
      const markdown = await convertToMarkdownAction(content);
      setValue('referenceContent', markdown, { shouldDirty: true, shouldValidate: true });
    } catch (e) {
      console.error(e);
      alert('Failed to convert to Markdown');
    } finally {
      setIsConverting(false);
    }
  };

  const PageCardContent = () => (
    <div className="flex items-center gap-3 w-full">
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
        <FileText className="w-4.5 h-4.5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[12px] font-black text-slate-800 tracking-tight truncate">
            {activePageTitle || 'Draft Content'}
          </h4>
          {activePageId ? (
            <div className="flex items-center gap-1 text-emerald-600">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
            </div>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Local
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <FileText className="w-3 h-3 text-slate-300" />
            {refWordCount} <span className="font-medium text-slate-400 lowercase">words</span>
          </div>
          {websiteType && (
            <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase tracking-tighter">
              <LayoutTemplate className="w-3 h-3 text-blue-300" />
              {websiteType}
            </div>
          )}
        </div>
      </div>



      <ChevronDown
        className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${isSourceInputOpen ? 'rotate-180' : ''}`}
      />
    </div>
  );

  const DefaultHeader = () => (
    <div className="flex justify-between items-center gap-3 w-full">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
          <Link2 className="w-3.5 h-3.5 text-blue-600" />
          Source Input
        </label>
        {isSourceInputOpen ? (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50 uppercase tracking-tighter flex-shrink-0">
            Required
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium italic truncate">
            {refWordCount > 0 ? `${refWordCount} words` : 'Empty'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0 ml-auto">
        {/* Header Tools */}
        {isSourceInputOpen && (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsUrlModalOpen(true)}
              className="h-7 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              Import URL
            </button>
          </div>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isSourceInputOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Header */}
        <div
          className="p-3 border-b border-gray-100 bg-gray-50/20 cursor-pointer hover:bg-gray-100/50 transition-colors"
          onClick={() => setIsSourceInputOpen(!isSourceInputOpen)}
        >
          {!isSourceInputOpen && activePageId ? <PageCardContent /> : <DefaultHeader />}
        </div>

        {/* Body */}
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isSourceInputOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="p-4 bg-white space-y-3">
              {/* Title Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Article Topic / Title (Required)"
                  className={`w-full h-10 px-4 py-2 bg-slate-50/50 rounded-xl border text-sm font-bold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all ${errors.title ? 'border-red-500' : 'border-slate-200'}`}
                />
                {errors.title && (
                  <p className="text-[10px] text-red-500 ml-1">{errors.title.message}</p>
                )}
              </div>

              {/* Content Area */}
              <div className="relative group">
                <textarea
                  {...register('referenceContent')}
                  placeholder="Paste your source text here or import from URL..."
                  className={`w-full h-64 px-4 py-3 bg-slate-50/30 rounded-xl border text-[13px] leading-relaxed font-medium text-slate-700 placeholder-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none resize-none custom-scrollbar transition-all ${errors.referenceContent ? 'border-red-500' : 'border-slate-200'}`}
                />

                {/* Floating AI Button inside/near Textarea */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {content && content.length > 50 && (
                    <div className="bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-100 p-0.5">
                      <LoadingButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToMarkdown();
                        }}
                        isLoading={isConverting}
                        icon={<Sparkles className="w-3 h-3" />}
                        className="h-6 px-2 text-[10px] text-purple-600 font-bold hover:bg-purple-50 rounded-md"
                      >
                        Auto-Markdown
                      </LoadingButton>
                    </div>
                  )}
                </div>

                {errors.referenceContent && (
                  <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.referenceContent.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold tracking-tight bg-slate-100/50 px-2 py-1.5 rounded-md">
                    {refWordCount} words
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onConfirm={handleUrlConfirm}
        isLoading={isFetchingUrl}
      />
    </div>
  );
};
