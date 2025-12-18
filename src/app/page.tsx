'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { InputForm } from '@/components/InputForm';
import { Preview } from '@/components/Preview';
import { SeoSidebar } from '@/components/SeoSidebar';
import { Changelog } from '@/components/Changelog';
import { PasswordGate } from '@/components/PasswordGate';
import { useGeneration } from '@/hooks/useGeneration';
import { parseProductContext } from '@/services/research/productFeatureToPainPointMapper';
import { findRegionEquivalents, localizePlanWithAI } from '@/services/research/regionGroundingService';
import { SavedProfile, ScrapedImage } from '@/types';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { SectionPlanModal } from '@/components/SectionPlanModal';
import { SettingsModal } from '@/components/SettingsModal';
import { useAppAccess } from '@/hooks/useAppAccess';
import { useContentScore } from '@/hooks/useContentScore';
import { useAppHydration } from '@/hooks/useAppHydration';

export default function AppPage() {
    const passwordHash = useMemo(() => (process.env.NEXT_PUBLIC_APP_GUARD_HASH as string) || '', []);

    // Store & Hooks
    const app = useAppStore();
    const generationStore = useGenerationStore();
    const analysisStore = useAnalysisStore();
    const { isUnlocked, unlock } = useAppAccess();
    const { structurePoints } = useContentScore();
    const { generate, startWriting, stop } = useGeneration();
    useAppHydration();

    const [isSearchingAlternatives, setIsSearchingAlternatives] = useState(false);
    const [isLocalizingPlan, setIsLocalizingPlan] = useState(false);

    // Sidebar Auto-show
    useEffect(() => {
        if (generationStore.status === 'analyzing' && !app.showSidebar) {
            app.setShowSidebar(true);
        }
    }, [generationStore.status, app]);

    // Plan Modal Auto-show
    useEffect(() => {
        const hasStructure = Boolean(analysisStore.refAnalysis?.structure?.length);
        if (generationStore.status === 'analysis_ready' && hasStructure && !app.showPlanModal) {
            // Only show if we just finished analysis
            if (generationStore.generationStep === 'idle') {
                app.setShowPlanModal(true);
            }
        }
    }, [generationStore.status, generationStore.generationStep, analysisStore.refAnalysis?.structure, app]);

    const handleLoadProfile = async (profile: SavedProfile) => {
        app.setActiveProfile(profile);
        analysisStore.setTargetAudience(profile.targetAudience);
        analysisStore.setBrandKnowledge(profile.brandKnowledge || '');

        if (profile.productRawText) {
            const res = await parseProductContext(profile.productRawText);
            analysisStore.setActiveProductBrief(res.data);
        }
    };

    const handleRemoveScrapedImage = (image: ScrapedImage) => {
        const keyToMatch = image.id || image.url || image.altText;
        if (!keyToMatch) return;
        const updated = analysisStore.scrapedImages.map((img, idx) => {
            const key = img.id || img.url || img.altText || `${idx}`;
            if (key !== keyToMatch) return img;
            return { ...img, ignored: !img.ignored };
        });
        analysisStore.setScrapedImages(updated);
    };

    const handleSearchLocalAlternatives = async () => {
        const refAnalysis = analysisStore.refAnalysis;
        if (!refAnalysis) return;

        const entities = [
            ...(refAnalysis.competitorBrands || []).map(b => ({ text: b, type: 'brand' as const, region: 'OTHER' })),
            ...(refAnalysis.competitorProducts || []).map(p => ({ text: p, type: 'service' as const, region: 'OTHER' }))
        ];

        if (entities.length === 0) return;

        setIsSearchingAlternatives(true);
        try {
            const result = await findRegionEquivalents(entities, analysisStore.targetAudience);
            app.addCost(result.cost.totalCost, result.usage.totalTokens);

            if (result.mappings.length > 0) {
                const existingReplacements = refAnalysis.regionalReplacements || [];
                const newReplacements = result.mappings.map(m => ({
                    original: m.original,
                    replacement: m.regionEquivalent,
                    reason: m.context
                }));

                const mergedReplacements = [...existingReplacements];
                newReplacements.forEach(nr => {
                    if (!mergedReplacements.some(er => er.original === nr.original)) {
                        mergedReplacements.push(nr);
                    }
                });

                analysisStore.setRefAnalysis({ ...refAnalysis, regionalReplacements: mergedReplacements });
            }
        } catch (error) {
            console.error('[App] Search local alternatives failed', error);
        } finally {
            setIsSearchingAlternatives(false);
        }
    };

    if (!isUnlocked) {
        return <PasswordGate passwordHash={passwordHash} onUnlock={unlock} />;
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
                            isGenerating={generationStore.status === 'analyzing' || generationStore.status === 'streaming'}
                            isWriting={generationStore.status === 'streaming'}
                            canGenerateSections={generationStore.status === 'analysis_ready'}
                            currentStep={generationStore.generationStep}
                            onAddCost={(cost, usage) => app.addCost(cost.totalCost, usage.totalTokens)}
                            savedProfiles={app.savedProfiles}
                            setSavedProfiles={app.setSavedProfiles}
                            activeProfile={app.activeProfile}
                            onSetActiveProfile={app.setActiveProfile}
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
                            analysisStore.setCoveredPoints(prev =>
                                prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]
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
                        outlineSections={analysisStore.refAnalysis?.structure?.map(s => s.title) || []}
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
                            brandKnowledge={analysisStore.brandKnowledge}
                            setBrandKnowledge={analysisStore.setBrandKnowledge}
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
                onLocalizeAll={async () => {
                    const current = analysisStore.refAnalysis;
                    if (!current || !current.regionalReplacements?.length) return;

                    setIsLocalizingPlan(true);
                    try {
                        const result = await localizePlanWithAI(
                            {
                                generalPlan: current.generalPlan || [],
                                conversionPlan: current.conversionPlan || [],
                                sections: current.structure.map(s => ({
                                    title: s.title,
                                    narrativePlan: s.narrativePlan,
                                    keyFacts: s.keyFacts,
                                    uspNotes: s.uspNotes,
                                    subheadings: s.subheadings
                                }))
                            },
                            current.regionalReplacements,
                            analysisStore.targetAudience
                        );

                        app.addCost(result.cost.totalCost, result.usage.totalTokens);

                        const localizedStructure = current.structure.map((original, idx) => ({
                            ...original,
                            title: result.localizedSections[idx]?.title || original.title,
                            narrativePlan: result.localizedSections[idx]?.narrativePlan || original.narrativePlan,
                            keyFacts: result.localizedSections[idx]?.keyFacts || original.keyFacts,
                            uspNotes: result.localizedSections[idx]?.uspNotes || original.uspNotes,
                            subheadings: result.localizedSections[idx]?.subheadings || original.subheadings
                        }));

                        analysisStore.setLocalizedRefAnalysis({
                            ...current,
                            structure: localizedStructure,
                            generalPlan: result.localizedGeneralPlan,
                            conversionPlan: result.localizedConversionPlan,
                        });
                    } catch (error) {
                        console.error('[App] AI Plan localization failed', error);
                    } finally {
                        setIsLocalizingPlan(false);
                    }
                }}
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
                            .filter(i => i.action !== 'keep')
                            .map(i => ({
                                original: i.original,
                                replacement: i.action === 'delete' ? '' : (i.customReplacement || i.replacement),
                                reason: i.reason
                            }))
                    });
                }}
            />
        </div>
    );
}
