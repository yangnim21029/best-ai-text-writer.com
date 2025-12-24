'use client';

import React, { useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { InputForm } from '@/components/InputForm';
import { Preview } from '@/components/Preview';
import { SeoSidebar } from '@/components/SeoSidebar';
import { Changelog } from '@/components/Changelog';
import { PasswordGate } from '@/components/PasswordGate';
import { useGeneration } from '@/hooks/useGeneration';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
// Modular Stores
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useMetricsStore } from '@/store/useMetricsStore';

import { SectionPlanModal } from '@/components/SectionPlanModal';
import { SettingsModal } from '@/components/SettingsModal';
import { StreamingModal } from '@/components/StreamingModal';
import { useAppAccess } from '@/hooks/useAppAccess';
import { useContentScore } from '@/hooks/useContentScore';
import { useAppHydration } from '@/hooks/useAppHydration';
import { isAuthorizedAction } from '@/app/actions/auth';
import { useAlternativeSearch } from '@/hooks/useAlternativeSearch';
import { usePlanLocalization } from '@/hooks/usePlanLocalization';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { useAutoShowUI } from '@/hooks/useAutoShowUI';
import { GenerationOrchestrator } from '@/components/GenerationOrchestrator';

export default function AppPage() {
  // Modular Stores (Aggregated for backward compatibility in this component)
  const ui = useUIStore();
  const settings = useSettingsStore();
  const profiles = useProfileStore();
  const metrics = useMetricsStore();

  const app = useMemo(() => ({ ...ui, ...settings, ...profiles, ...metrics }), [ui, settings, profiles, metrics]);

  const generationStore = useGenerationStore();
  const analysisStore = useAnalysisStore();
  const { isUnlocked, unlock, lock } = useAppAccess();
  const { structurePoints } = useContentScore();
  const { generate, startWriting, stop } = useGeneration();
  useAppHydration();

  // Custom Business Logic Hooks
  const { isSearchingAlternatives, handleSearchLocalAlternatives } = useAlternativeSearch();
  const { isLocalizingPlan, handleLocalizePlan } = usePlanLocalization();
  const { handleLoadProfile, handleRemoveScrapedImage } = useProfileManagement();
  useAutoShowUI();

  // Sync server session with client local storage state
  useEffect(() => {
    isAuthorizedAction().then((isAuth) => {
      if (isAuth && !isUnlocked) {
        unlock();
      } else if (!isAuth && isUnlocked) {
        lock();
      }
    });
  }, [isUnlocked, unlock, lock]);

  if (!isUnlocked) {
    return <PasswordGate onUnlock={unlock} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        sessionCost={app.sessionCost}
        sessionTokens={app.sessionTokens}
        showInput={app.showInput}
        showSidebar={app.showSidebar}
        onToggleInput={app.toggleInput}
        onToggleSidebar={app.toggleSidebar}
        onToggleChangelog={() => app.setShowChangelog(true)}
        onToggleSettings={() => app.setShowSettings(true)}
        contentScore={app.contentScore}
        displayScale={app.displayScale}
        onDisplayScaleChange={app.setDisplayScale}
      />

      <Changelog isOpen={app.showChangelog} onClose={() => app.setShowChangelog(false)} />
      <SettingsModal open={app.showSettings} onClose={() => app.setShowSettings(false)} />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)] min-h-0 bg-gray-100 p-4 gap-4">
        {app.showInput && (
          <section className="w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col overflow-auto z-20 transition-all duration-300">
            <InputForm
              onGenerate={generate}
              onGenerateSections={startWriting}
              isGenerating={
                generationStore.status === 'analyzing' || generationStore.status === 'streaming'
              }
              isWriting={generationStore.status === 'streaming'}
              canGenerateSections={generationStore.status === 'analysis_ready'}
              currentStep={generationStore.generationStep}
              onAddCost={(cost, usage) => app.addCost(cost.totalCost, usage.totalTokens)}
              savedProfiles={app.savedProfiles}
              setSavedProfiles={app.setSavedProfiles}
              activeProfile={app.activeProfile}
              onSetActiveProfile={app.setActiveProfile}
              savedPages={app.savedPages}
              setSavedPages={app.setSavedPages}
              activePageId={app.activePageId}
              onSetActivePageId={app.setActivePageId}
              inputType={app.inputType}
              setInputType={app.setInputType}
              brandKnowledge={analysisStore.brandKnowledge}
              onShowPlan={() => app.setShowPlanModal(true)}
              hasPlan={Boolean(analysisStore.refAnalysis?.structure?.length)}
            />
          </section>
        )}

        <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col min-h-0 relative overflow-hidden">
          <Preview
            content={generationStore.content}
            status={generationStore.status}
            error={generationStore.error}
            generationStep={generationStore.generationStep}
            coveredPoints={analysisStore.coveredPoints}
            targetAudience={analysisStore.targetAudience}
            scrapedImages={analysisStore.scrapedImages}
            visualStyle={analysisStore.visualStyle}
            onRemoveScrapedImage={handleRemoveScrapedImage}
            onTogglePoint={(point) => {
              analysisStore.setCoveredPoints((prev) =>
                prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point]
              );
            }}
            onAddCost={(cost, usage) => app.addCost(cost.totalCost, usage.totalTokens)}
            savedProfiles={app.savedProfiles}
            onLoadProfile={handleLoadProfile}
            onRequestUrlMode={() => app.setInputType('url')}
            productBrief={analysisStore.activeProductBrief}
            displayScale={app.displayScale}
            articleTitle={analysisStore.articleTitle}
            onTitleChange={analysisStore.setArticleTitle}
            outlineSections={analysisStore.refAnalysis?.structure?.map((s) => s.title) || []}
            keyInformationPoints={structurePoints.general}
            brandExclusivePoints={structurePoints.brand}
          />
        </section>

        {app.showSidebar && (
          <section className="hidden lg:flex w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex-col overflow-auto z-10 transition-all duration-300">
            <SeoSidebar
              keywordPlans={analysisStore.keywordPlans}
              referenceAnalysis={analysisStore.refAnalysis}
              authorityAnalysis={analysisStore.authAnalysis}
              productMapping={analysisStore.productMapping}
              productBrief={analysisStore.activeProductBrief}
              headingOptimizations={analysisStore.headingOptimizations}
              targetAudience={analysisStore.targetAudience}
              languageInstruction={analysisStore.languageInstruction}
              isLoading={generationStore.status === 'analyzing'}
              status={generationStore.status}
              onStop={stop}
              displayScale={app.displayScale}
              onSearchLocalAlternatives={handleSearchLocalAlternatives}
              isSearchingAlternatives={isSearchingAlternatives}
            />
          </section>
        )}
      </main>

      <SectionPlanModal
        open={app.showPlanModal}
        onClose={() => app.setShowPlanModal(false)}
        sections={analysisStore.refAnalysis?.structure || []}
        generalPlan={analysisStore.refAnalysis?.generalPlan}
        conversionPlan={analysisStore.refAnalysis?.conversionPlan}
        regionalReplacements={analysisStore.refAnalysis?.regionalReplacements}
        localizedSections={analysisStore.localizedRefAnalysis?.structure}
        localizedGeneralPlan={analysisStore.localizedRefAnalysis?.generalPlan}
        localizedConversionPlan={analysisStore.localizedRefAnalysis?.conversionPlan}
        onSavePlan={(updated) => {
          const current = analysisStore.refAnalysis;
          if (!current) return;
          analysisStore.setRefAnalysis({ ...current, structure: updated });
        }}
        onSearchLocalAlternatives={handleSearchLocalAlternatives}
        isSearchingAlternatives={isSearchingAlternatives}
        humanWritingVoice={analysisStore.refAnalysis?.humanWritingVoice}
        localizedHumanWritingVoice={analysisStore.localizedRefAnalysis?.humanWritingVoice}
        onLocalizeAll={handleLocalizePlan}
        isLocalizing={isLocalizingPlan}
        onStartWriting={(selected) => {
          const current = analysisStore.refAnalysis;
          if (current) analysisStore.setRefAnalysis({ ...current, structure: selected });
          app.setShowPlanModal(false);
          startWriting();
        }}
        onSaveReplacements={(editedItems) => {
          const current = analysisStore.refAnalysis;
          if (!current) return;
          analysisStore.setRefAnalysis({
            ...current,
            regionalReplacements: editedItems
              .filter((i) => i.action !== 'keep')
              .map((i) => ({
                original: i.original,
                replacement: i.action === 'delete' ? '' : i.customReplacement || i.replacement,
                reason: i.reason,
              })),
          });
        }}
        isSynthesis={analysisStore.refAnalysis?.isSynthesis}
        sourceCount={analysisStore.refAnalysis?.sourceCount}
      />

      <StreamingModal
        isOpen={generationStore.status === 'streaming'}
        content={generationStore.content}
        step={generationStore.generationStep || 'writing_content'}
      />

      <GenerationOrchestrator />
    </div>
  );
}
