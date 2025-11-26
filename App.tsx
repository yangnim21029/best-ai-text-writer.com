import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { Preview } from './components/Preview';
import { SeoSidebar } from './components/SeoSidebar';
import { Changelog } from './components/Changelog';
import { PasswordGate } from './components/PasswordGate';
import { useAppStore } from './store/useAppStore';
import { useProfileStore } from './store/useProfileStore';
import { useGeneration } from './hooks/useGeneration';
import { parseProductContext } from './services/productService';
import { SavedProfile } from './types';

const App: React.FC = () => {
    const passwordHash = useMemo(() => (import.meta.env.VITE_APP_GUARD_HASH as string) || '', []);
    // Global State
    const store = useAppStore();
    const profileStore = useProfileStore();
    const [isUnlocked, setIsUnlocked] = useState(false);

    // Logic Hooks
    const { generate, stop } = useGeneration();

    // --- Effects ---

    // Content Score Calculation (Variable Reward)
    useEffect(() => {
        if (!store.content || store.status === 'idle') {
            store.setContentScore({ value: 0, label: 'Start Writing', color: 'text-gray-300' });
            return;
        }

        let score = 0;
        let totalFactors = 0;

        // Factor 1: Keyword Usage (50 points)
        if (store.keywordPlans.length > 0) {
            const usedKeywords = store.keywordPlans.filter(k => store.content.toLowerCase().includes(k.word.toLowerCase()));
            const keywordRatio = usedKeywords.length / store.keywordPlans.length;
            score += keywordRatio * 50;
            totalFactors++;
        }

        // Factor 2: Key Points Coverage (50 points)
        if (store.refAnalysis?.keyInformationPoints && store.refAnalysis.keyInformationPoints.length > 0) {
            const pointRatio = store.coveredPoints.length / store.refAnalysis.keyInformationPoints.length;
            score += pointRatio * 50;
            totalFactors++;
        } else {
            score += 50;
        }

        if (store.keywordPlans.length === 0) score = score * 2;

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

        store.setContentScore({ value: score, label, color });

    }, [store.content, store.keywordPlans, store.coveredPoints, store.refAnalysis, store.status]);

    // --- Handlers ---

    const handleLoadProfile = async (profile: SavedProfile) => {
        profileStore.setActiveProfile(profile);
        store.setTargetAudience(profile.targetAudience);
        store.setBrandKnowledge(profile.brandKnowledge || '');

        // Parse product brief from profile immediately
        if (profile.productRawText) {
            const res = await parseProductContext(profile.productRawText);
            store.setActiveProductBrief(res.data);
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem('app_access_granted') === '1') {
            setIsUnlocked(true);
        }
    }, []);

    const handleUnlock = () => {
        sessionStorage.setItem('app_access_granted', '1');
        setIsUnlocked(true);
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
                sessionCost={store.sessionCost}
                sessionTokens={store.sessionTokens}
                showInput={store.showInput}
                showSidebar={store.showSidebar}
                onToggleInput={store.toggleInput}
                onToggleSidebar={store.toggleSidebar}
                onToggleChangelog={() => store.setShowChangelog(true)}
                contentScore={store.contentScore}
            />

            <Changelog isOpen={store.showChangelog} onClose={() => store.setShowChangelog(false)} />

            <main className="flex-1 flex flex-col lg:flex-row overflow-auto min-h-[calc(100vh-64px)] bg-gray-100 p-4 gap-4">

                {store.showInput && (
                    <section className="w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col overflow-auto z-20 transition-all duration-300">
                        <InputForm
                            onGenerate={generate}
                            isGenerating={store.status === 'analyzing' || store.status === 'streaming'}
                            currentStep={store.generationStep}
                            onAddCost={(cost, usage) => store.addCost(cost.totalCost, usage.totalTokens)}
                            savedProfiles={profileStore.savedProfiles}
                            setSavedProfiles={profileStore.setSavedProfiles}
                            activeProfile={profileStore.activeProfile}
                            onSetActiveProfile={profileStore.setActiveProfile}
                            inputType={store.inputType}
                            setInputType={store.setInputType}
                            brandKnowledge={store.brandKnowledge}
                        />
                    </section>
                )}

                <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col min-h-0 relative overflow-auto">
                    <Preview
                        content={store.content}
                        status={store.status}
                        error={store.error}
                        generationStep={store.generationStep}
                        onStop={stop}
                        keyInformationPoints={store.refAnalysis?.keyInformationPoints || []}
                        coveredPoints={store.coveredPoints}
                        targetAudience={store.targetAudience}
                        scrapedImages={store.scrapedImages}
                        visualStyle={store.visualStyle}
                        onTogglePoint={(point) => {
                            store.setCoveredPoints(prev =>
                                prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]
                            );
                        }}
                        onAddCost={(cost, usage) => store.addCost(cost.totalCost, usage.totalTokens)}
                        savedProfiles={profileStore.savedProfiles}
                        onLoadProfile={handleLoadProfile}
                        onRequestUrlMode={() => store.setInputType('url')}
                        productBrief={store.activeProductBrief}
                    />
                </section>

                {store.showSidebar && (
                    <section className="hidden xl:flex w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex-col overflow-auto z-10 transition-all duration-300">
                        <SeoSidebar
                            keywordPlans={store.keywordPlans}
                            referenceAnalysis={store.refAnalysis}
                            authorityAnalysis={store.authAnalysis}
                            productMapping={store.productMapping}
                            productBrief={store.activeProductBrief}
                            isLoading={store.status === 'analyzing'}
                            brandKnowledge={store.brandKnowledge}
                            setBrandKnowledge={store.setBrandKnowledge}
                        />
                    </section>
                )}
            </main>
        </Layout>
    );
};

export default App;
