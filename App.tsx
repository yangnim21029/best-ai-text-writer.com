import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { Preview } from './components/Preview';
import { SeoSidebar } from './components/SeoSidebar';
import { Changelog } from './components/Changelog';
import { PasswordGate } from './components/PasswordGate';
import { useProfileStore } from './store/useProfileStore';
import { useGeneration } from './hooks/useGeneration';
import { parseProductContext } from './services/productService';
import { SavedProfile, ScrapedImage } from './types';
import { useGenerationStore } from './store/useGenerationStore';
import { useAnalysisStore } from './store/useAnalysisStore';
import { useMetricsStore } from './store/useMetricsStore';
import { useUiStore } from './store/useUiStore';

const App: React.FC = () => {
    const passwordHash = useMemo(() => (import.meta.env.VITE_APP_GUARD_HASH as string) || '', []);
    const ACCESS_KEY = 'app_access_granted';
    const ACCESS_TS_KEY = 'app_access_granted_at';
    const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    // Global State
    const generationStore = useGenerationStore();
    const analysisStore = useAnalysisStore();
    const metricsStore = useMetricsStore();
    const uiStore = useUiStore();
    const profileStore = useProfileStore();
    const structurePoints = useMemo(() => {
        const structure = analysisStore.refAnalysis?.structure || [];
        const general = new Set<string>();
        const brand = new Set<string>();
        const legacyGeneral = Array.isArray(analysisStore.refAnalysis?.keyInformationPoints)
            ? analysisStore.refAnalysis?.keyInformationPoints
            : [];
        const legacyBrand = Array.isArray(analysisStore.refAnalysis?.brandExclusivePoints)
            ? analysisStore.refAnalysis?.brandExclusivePoints
            : [];

        legacyGeneral.forEach(p => {
            if (p) general.add(p);
        });
        legacyBrand.forEach(p => {
            if (p) brand.add(p);
        });
        structure.forEach((s: any) => {
            (Array.isArray(s?.keyFacts) ? s.keyFacts : []).forEach((p: string) => {
                if (p) general.add(p);
            });
            (Array.isArray(s?.uspNotes) ? s.uspNotes : []).forEach((p: string) => {
                if (p) brand.add(p);
            });
        });
        return {
            general: Array.from(general),
            brand: Array.from(brand),
        };
    }, [analysisStore.refAnalysis]);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const restorePromptedRef = useRef(false);
    const hydratedAnalysisRef = useRef(false);

    // Logic Hooks
    const { generate, startWriting, stop } = useGeneration();

    // --- Effects ---

    useEffect(() => {
        if (generationStore.status === 'analyzing' && !uiStore.showSidebar) {
            uiStore.setShowSidebar(true);
        }
    }, [generationStore.status, uiStore.showSidebar, uiStore.setShowSidebar]);

    // Content Score Calculation (Variable Reward)
    useEffect(() => {
        if (!generationStore.content || generationStore.status === 'idle') {
            const baseScore = { value: 0, label: 'Start Writing', color: 'text-gray-300' };
            const current = metricsStore.contentScore;
            if (
                current.value !== baseScore.value ||
                current.label !== baseScore.label ||
                current.color !== baseScore.color
            ) {
                metricsStore.setContentScore(baseScore);
            }
            return;
        }

        let score = 0;
        let totalFactors = 0;

        // Factor 1: Keyword Usage (50 points)
        if (analysisStore.keywordPlans.length > 0) {
            const contentLower = (generationStore.content || '').toLowerCase();
            const usedKeywords = analysisStore.keywordPlans.filter(k => k.word && contentLower.includes(k.word.toLowerCase()));
            const keywordRatio = usedKeywords.length / analysisStore.keywordPlans.length;
            score += keywordRatio * 50;
            totalFactors++;
        }

        // Factor 2: Key Points Coverage (50 points) - based on outline keyFacts/uspNotes
        const totalPointCount = structurePoints.general.length + structurePoints.brand.length;
        if (totalPointCount > 0) {
            const pointRatio = analysisStore.coveredPoints.length / totalPointCount;
            score += pointRatio * 50;
            totalFactors++;
        } else {
            score += 50;
        }

        if (analysisStore.keywordPlans.length === 0) score = score * 2;

        score = Math.min(100, Math.round(score));

        let label = 'Needs Work';
        let color = 'text-red-500';
        if (score >= 80) {
            label = 'Excellent';
            color = 'text-emerald-500';
        } else if (score >= 50) {
            label = 'Good';
            color = 'text-amber-500';
        }

        const nextScore = { value: score, label, color };
        const current = metricsStore.contentScore;
        if (
            current.value !== nextScore.value ||
            current.label !== nextScore.label ||
            current.color !== nextScore.color
        ) {
            metricsStore.setContentScore(nextScore);
        }

    }, [
        generationStore.content,
        analysisStore.keywordPlans,
        analysisStore.coveredPoints,
        analysisStore.refAnalysis,
        structurePoints,
        generationStore.status,
        metricsStore.contentScore
    ]);

    // --- Handlers ---

    useEffect(() => {
        document.body.setAttribute('data-display-scale', uiStore.displayScale.toString());
    }, [uiStore.displayScale]);

    const handleDisplayScaleChange = (scale: number) => {
        const clamped = Math.min(1.25, Math.max(0.9, Number(scale.toFixed(2))));
        uiStore.setDisplayScale(clamped);
    };

    const handleLoadProfile = async (profile: SavedProfile) => {
        profileStore.setActiveProfile(profile);
        analysisStore.setTargetAudience(profile.targetAudience);
        analysisStore.setBrandKnowledge(profile.brandKnowledge || '');

        // Parse product brief from profile immediately
        if (profile.productRawText) {
            const res = await parseProductContext(profile.productRawText);
            analysisStore.setActiveProductBrief(res.data);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem(ACCESS_KEY);
        const tsRaw = localStorage.getItem(ACCESS_TS_KEY);

        if (stored === '1' && tsRaw) {
            const ts = Number(tsRaw);
            if (!Number.isNaN(ts) && Date.now() - ts < ACCESS_TTL_MS) {
                setIsUnlocked(true);
                return;
            }
        }

        // Expired or missing -> clean up
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(ACCESS_TS_KEY);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUnlock = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ACCESS_KEY, '1');
            localStorage.setItem(ACCESS_TS_KEY, Date.now().toString());
        }
        setIsUnlocked(true);
    };

    // Prompt to restore persisted analysis/content; allow clearing on reload
    useEffect(() => {
        if (restorePromptedRef.current) return;
        if (typeof window === 'undefined') return;
        const persistedKeys = [
            'pro_content_writer_analysis',
            'pro_content_writer_generation',
            'pro_content_writer_inputs_simple_v4',
            'ai_writer_editor_autosave_v1'
        ];
        const hasPersisted = persistedKeys.some(k => localStorage.getItem(k));

        if (!hasPersisted) return;
        restorePromptedRef.current = true;
        const shouldRestore = window.confirm('偵測到上次的資料，是否恢復? 選擇「取消」將清空並重新開始。');
        if (!shouldRestore) {
            persistedKeys.forEach(k => localStorage.removeItem(k));
            analysisStore.reset();
            generationStore.resetGeneration();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Rehydrate generation status when analysis data was restored from localStorage
    useEffect(() => {
        if (hydratedAnalysisRef.current) return;
        if (generationStore.status !== 'idle') return;
        if (generationStore.analysisResults) return;
        if (typeof window === 'undefined') return;

        const hasAnalysisState =
            Boolean(analysisStore.refAnalysis?.structure?.length) ||
            Boolean(analysisStore.keywordPlans.length) ||
            Boolean(analysisStore.authAnalysis);

        if (!hasAnalysisState) return;

        const savedRaw = localStorage.getItem('pro_content_writer_inputs_simple_v4');
        if (!savedRaw) return;

        let saved: any;
        try {
            saved = JSON.parse(savedRaw);
        } catch (e) {
            return;
        }

        const title = (saved?.title || analysisStore.articleTitle || '').trim();
        const referenceContent = (saved?.referenceContent || '').trim();
        if (!title || !referenceContent) return;

        const restoredConfig = {
            title,
            referenceContent,
            sampleOutline: saved?.sampleOutline || '',
            authorityTerms: saved?.authorityTerms || '',
            websiteType: saved?.websiteType || '',
            targetAudience: saved?.targetAudience || analysisStore.targetAudience || 'zh-TW',
            useRag: !!saved?.useRag,
            autoImagePlan: !!saved?.autoImagePlan,
            productRawText: saved?.productRawText || '',
            scrapedImages: saved?.scrapedImages || analysisStore.scrapedImages || [],
            brandKnowledge: analysisStore.brandKnowledge,
        };

        const needsProductData = Boolean((restoredConfig.productRawText || '').trim());
        const hasProductBrief = Boolean(analysisStore.activeProductBrief?.productName);
        if (needsProductData && !hasProductBrief) {
            // Missing product brief after restore; require fresh analysis instead of marking ready.
            return;
        }

        generationStore.setLastConfig(restoredConfig);
        generationStore.setAnalysisResults({
            productResult: { brief: analysisStore.activeProductBrief, mapping: analysisStore.productMapping },
            structureResult: {
                structRes: { data: analysisStore.refAnalysis },
                authRes: { data: analysisStore.authAnalysis },
            }
        });
        generationStore.setStatus('analysis_ready');
        generationStore.setGenerationStep('idle');
        generationStore.setError(null);
        hydratedAnalysisRef.current = true;
    }, [
        analysisStore.refAnalysis,
        analysisStore.keywordPlans,
        analysisStore.authAnalysis,
        analysisStore.productMapping,
        analysisStore.activeProductBrief,
        analysisStore.scrapedImages,
        analysisStore.articleTitle,
        analysisStore.targetAudience,
        analysisStore.brandKnowledge,
        generationStore.status,
        generationStore.analysisResults
    ]);

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

    if (!isUnlocked) {
        return (
            <PasswordGate
                passwordHash={passwordHash}
                onUnlock={handleUnlock}
            />
        );
    }

    return (
        <Layout>
            <Header
                sessionCost={metricsStore.sessionCost}
                sessionTokens={metricsStore.sessionTokens}
                showInput={uiStore.showInput}
                showSidebar={uiStore.showSidebar}
                onToggleInput={uiStore.toggleInput}
                onToggleSidebar={uiStore.toggleSidebar}
                onToggleChangelog={() => uiStore.setShowChangelog(true)}
                contentScore={metricsStore.contentScore}
                displayScale={uiStore.displayScale}
                onDisplayScaleChange={handleDisplayScaleChange}
            />

            <Changelog isOpen={uiStore.showChangelog} onClose={() => uiStore.setShowChangelog(false)} />

            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)] min-h-0 bg-gray-100 p-4 gap-4">

                {uiStore.showInput && (
                    <section className="w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col overflow-auto z-20 transition-all duration-300">
                        <InputForm
                            onGenerate={generate}
                            onGenerateSections={startWriting}
                            isGenerating={generationStore.status === 'analyzing' || generationStore.status === 'streaming'}
                            isWriting={generationStore.status === 'streaming'}
                            canGenerateSections={generationStore.status === 'analysis_ready'}
                            currentStep={generationStore.generationStep}
                            onAddCost={(cost, usage) => metricsStore.addCost(cost.totalCost, usage.totalTokens)}
                            savedProfiles={profileStore.savedProfiles}
                            setSavedProfiles={profileStore.setSavedProfiles}
                            activeProfile={profileStore.activeProfile}
                            onSetActiveProfile={profileStore.setActiveProfile}
                            inputType={uiStore.inputType}
                            setInputType={uiStore.setInputType}
                            brandKnowledge={analysisStore.brandKnowledge}
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
                        onAddCost={(cost, usage) => metricsStore.addCost(cost.totalCost, usage.totalTokens)}
                        savedProfiles={profileStore.savedProfiles}
                        onLoadProfile={handleLoadProfile}
                        onRequestUrlMode={() => uiStore.setInputType('url')}
                        productBrief={analysisStore.activeProductBrief}
                        displayScale={uiStore.displayScale}
                        articleTitle={analysisStore.articleTitle}
                        onTitleChange={analysisStore.setArticleTitle}
                        outlineSections={analysisStore.refAnalysis?.structure?.map(s => s.title) || []}
                        keyInformationPoints={structurePoints.general}
                        brandExclusivePoints={structurePoints.brand}
                    />
                </section>

                {uiStore.showSidebar && (
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
                            displayScale={uiStore.displayScale}
                        />
                    </section>
                )}
            </main>
        </Layout>
    );
};

export default App;
