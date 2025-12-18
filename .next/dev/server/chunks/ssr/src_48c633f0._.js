module.exports = [
"[project]/src/config/constants.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AI_DEFAULTS",
    ()=>AI_DEFAULTS,
    "EMBED_MODEL_ID",
    ()=>EMBED_MODEL_ID,
    "KEYWORD_CHAR_DIVISOR",
    ()=>KEYWORD_CHAR_DIVISOR,
    "MIN_KEYWORDS",
    ()=>MIN_KEYWORDS,
    "MODEL",
    ()=>MODEL,
    "PRICING",
    ()=>PRICING,
    "SEMANTIC_KEYWORD_LIMIT",
    ()=>SEMANTIC_KEYWORD_LIMIT
]);
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("src/config/constants.ts")}`;
    }
};
const env = ("TURBOPACK compile-time value", "object") !== 'undefined' && __TURBOPACK__import$2e$meta__.env ? __TURBOPACK__import$2e$meta__.env : process.env;
const MODEL = {
    FLASH: 'gemini-3-flash-preview',
    IMAGE_PREVIEW: 'google/gemini-2.5-flash-image'
};
const EMBED_MODEL_ID = env?.VITE_EMBED_MODEL_ID || env?.VITE_AI_EMBED_MODEL_ID || env?.AI_EMBED_MODEL_ID || 'gemini-embedding-001';
const PRICING = {
    FLASH: {
        input: 0.30 / 1000000,
        output: 0.30 / 1000000
    },
    IMAGE_PREVIEW: {
        input: 0.30 / 1000000,
        output: 30.00 / 1000000
    },
    IMAGE_GEN: {
        input: 0.30 / 1000000,
        output: 30.00 / 1000000
    }
};
const AI_DEFAULTS = {
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY_MS: 300,
    // Longer timeout to accommodate heavy multimodal/long-context calls
    TIMEOUT_MS: 120000
};
const SEMANTIC_KEYWORD_LIMIT = 30;
const KEYWORD_CHAR_DIVISOR = 200;
const MIN_KEYWORDS = 10;
}),
"[project]/src/store/useAppStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppStore",
    ()=>useAppStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
;
;
;
const useAppStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        // Defaults
        showInput: true,
        showSidebar: true,
        showChangelog: false,
        showPlanModal: false,
        showSettings: false,
        inputType: 'url',
        displayScale: 1.1,
        contentScore: {
            value: 0,
            label: 'Start Writing',
            color: 'text-gray-400'
        },
        sessionCost: 0,
        sessionTokens: 0,
        modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
        modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
        keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
        minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
        maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"],
        savedProfiles: [],
        activeProfile: null,
        // Actions
        toggleInput: ()=>set((state)=>({
                    showInput: !state.showInput
                })),
        toggleSidebar: ()=>set((state)=>({
                    showSidebar: !state.showSidebar
                })),
        setShowSidebar: (show)=>set({
                showSidebar: show
            }),
        setShowChangelog: (show)=>set({
                showChangelog: show
            }),
        setShowPlanModal: (show)=>set({
                showPlanModal: show
            }),
        setShowSettings: (show)=>set({
                showSettings: show
            }),
        setInputType: (type)=>set({
                inputType: type
            }),
        setDisplayScale: (scale)=>set({
                displayScale: scale
            }),
        setContentScore: (score)=>set({
                contentScore: score
            }),
        addCost: (cost, tokens)=>set((state)=>({
                    sessionCost: Number(state.sessionCost || 0) + Number(cost || 0),
                    sessionTokens: Number(state.sessionTokens || 0) + Number(tokens || 0)
                })),
        resetSessionStats: ()=>set({
                sessionCost: 0,
                sessionTokens: 0
            }),
        setModelFlash: (model)=>set({
                modelFlash: model
            }),
        setModelImage: (model)=>set({
                modelImage: model
            }),
        setKeywordCharDivisor: (divisor)=>set({
                keywordCharDivisor: divisor
            }),
        setMinKeywords: (min)=>set({
                minKeywords: min
            }),
        setMaxKeywords: (max)=>set({
                maxKeywords: max
            }),
        resetSettings: ()=>set({
                modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
                modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
                keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
                minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
                maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"]
            }),
        setSavedProfiles: (profiles)=>set({
                savedProfiles: profiles
            }),
        setActiveProfile: (profile)=>set({
                activeProfile: profile
            }),
        addProfile: (profile)=>set((state)=>({
                    savedProfiles: [
                        ...state.savedProfiles,
                        profile
                    ],
                    activeProfile: profile
                })),
        updateProfile: (updatedProfile)=>set((state)=>({
                    savedProfiles: state.savedProfiles.map((p)=>p.id === updatedProfile.id ? updatedProfile : p),
                    activeProfile: state.activeProfile?.id === updatedProfile.id ? updatedProfile : state.activeProfile
                })),
        deleteProfile: (id)=>set((state)=>({
                    savedProfiles: state.savedProfiles.filter((p)=>p.id !== id),
                    activeProfile: state.activeProfile?.id === id ? null : state.activeProfile
                }))
    }), {
    name: 'pro_content_writer_app_v1',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage)
}));
}),
"[project]/src/store/useSettingsStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSettingsStore",
    ()=>useSettingsStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
;
;
;
const useSettingsStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
        modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
        keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
        minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
        maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"],
        setModelFlash: (model)=>set({
                modelFlash: model
            }),
        setModelImage: (model)=>set({
                modelImage: model
            }),
        setKeywordCharDivisor: (divisor)=>set({
                keywordCharDivisor: divisor
            }),
        setMinKeywords: (min)=>set({
                minKeywords: min
            }),
        setMaxKeywords: (max)=>set({
                maxKeywords: max
            }),
        resetToDefaults: ()=>set({
                modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
                modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
                keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
                minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
                maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"]
            })
    }), {
    name: 'pro_content_writer_settings',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage)
}));
}),
"[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGenerationStore",
    ()=>useGenerationStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const useGenerationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        content: '',
        status: 'idle',
        generationStep: 'idle',
        error: null,
        isStopped: false,
        analysisResults: null,
        lastConfig: null,
        setContent: (content)=>set((state)=>({
                    content: typeof content === 'function' ? content(state.content) : content
                })),
        setStatus: (status)=>set({
                status
            }),
        setGenerationStep: (step)=>set({
                generationStep: step
            }),
        setError: (error)=>set({
                error
            }),
        setAnalysisResults: (results)=>set({
                analysisResults: results
            }),
        setLastConfig: (config)=>set({
                lastConfig: config
            }),
        stopGeneration: ()=>set({
                isStopped: true,
                status: 'completed',
                generationStep: 'idle'
            }),
        resetGeneration: ()=>set({
                content: '',
                status: 'idle',
                generationStep: 'idle',
                error: null,
                isStopped: false,
                analysisResults: null,
                lastConfig: null
            })
    }), {
    name: 'pro_content_writer_generation',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    partialize: (state)=>({
            content: state.content
        })
}));
}),
"[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAnalysisStore",
    ()=>useAnalysisStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const useAnalysisStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        keywordPlans: [],
        refAnalysis: null,
        authAnalysis: null,
        scrapedImages: [],
        visualStyle: '',
        brandKnowledge: '',
        coveredPoints: [],
        targetAudience: 'zh-TW',
        productMapping: [],
        activeProductBrief: undefined,
        articleTitle: '',
        headingOptimizations: [],
        languageInstruction: '',
        hkGroundingResult: null,
        pendingGroundingResult: null,
        showGroundingModal: false,
        localizedRefAnalysis: null,
        setKeywordPlans: (plans)=>set({
                keywordPlans: plans
            }),
        setRefAnalysis: (analysis)=>set({
                refAnalysis: analysis
            }),
        setAuthAnalysis: (analysis)=>set({
                authAnalysis: analysis
            }),
        setScrapedImages: (images)=>set({
                scrapedImages: images
            }),
        setVisualStyle: (style)=>set({
                visualStyle: style
            }),
        setBrandKnowledge: (knowledge)=>set({
                brandKnowledge: knowledge
            }),
        setCoveredPoints: (points)=>set((state)=>({
                    coveredPoints: typeof points === 'function' ? points(state.coveredPoints) : points
                })),
        setTargetAudience: (audience)=>set({
                targetAudience: audience
            }),
        setProductMapping: (mapping)=>set({
                productMapping: mapping
            }),
        setActiveProductBrief: (brief)=>set({
                activeProductBrief: brief
            }),
        setArticleTitle: (title)=>set({
                articleTitle: title
            }),
        setHeadingOptimizations: (items)=>set({
                headingOptimizations: items
            }),
        setLanguageInstruction: (instruction)=>set({
                languageInstruction: instruction
            }),
        setHKGroundingResult: (result)=>set({
                hkGroundingResult: result
            }),
        setPendingGroundingResult: (result)=>set({
                pendingGroundingResult: result
            }),
        setShowGroundingModal: (show)=>set({
                showGroundingModal: show
            }),
        toggleGroundingIssueSelection: (index)=>set((state)=>{
                if (!state.pendingGroundingResult) return state;
                const newIssues = state.pendingGroundingResult.issues.map((issue, i)=>i === index ? {
                        ...issue,
                        selected: !issue.selected
                    } : issue);
                return {
                    pendingGroundingResult: {
                        ...state.pendingGroundingResult,
                        issues: newIssues
                    }
                };
            }),
        setLocalizedRefAnalysis: (analysis)=>set({
                localizedRefAnalysis: analysis
            }),
        reset: ()=>set({
                keywordPlans: [],
                refAnalysis: null,
                authAnalysis: null,
                scrapedImages: [],
                visualStyle: '',
                brandKnowledge: '',
                coveredPoints: [],
                targetAudience: 'zh-TW',
                productMapping: [],
                activeProductBrief: undefined,
                articleTitle: '',
                headingOptimizations: [],
                languageInstruction: '',
                hkGroundingResult: null,
                pendingGroundingResult: null,
                showGroundingModal: false,
                localizedRefAnalysis: null
            })
    }), {
    name: 'pro_content_writer_analysis',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    partialize: (state)=>({
            keywordPlans: state.keywordPlans,
            refAnalysis: state.refAnalysis,
            authAnalysis: state.authAnalysis,
            scrapedImages: state.scrapedImages,
            visualStyle: state.visualStyle,
            brandKnowledge: state.brandKnowledge,
            coveredPoints: state.coveredPoints,
            targetAudience: state.targetAudience,
            articleTitle: state.articleTitle,
            headingOptimizations: state.headingOptimizations,
            languageInstruction: state.languageInstruction,
            productMapping: state.productMapping,
            activeProductBrief: state.activeProductBrief,
            localizedRefAnalysis: state.localizedRefAnalysis
        })
}));
}),
"[project]/src/store/useMetricsStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMetricsStore",
    ()=>useMetricsStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const useMetricsStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        contentScore: {
            value: 0,
            label: 'Start Writing',
            color: 'text-gray-400'
        },
        sessionCost: 0,
        sessionTokens: 0,
        setContentScore: (score)=>set({
                contentScore: score
            }),
        addCost: (cost, tokens)=>set((state)=>({
                    sessionCost: Number(state.sessionCost || 0) + Number(cost || 0),
                    sessionTokens: Number(state.sessionTokens || 0) + Number(tokens || 0)
                })),
        resetSessionStats: ()=>set({
                sessionCost: 0,
                sessionTokens: 0
            })
    }), {
    name: 'pro_content_writer_metrics',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    merge: (persisted, current)=>{
        const typed = persisted;
        return {
            ...current,
            ...typed,
            sessionCost: Number(typed?.sessionCost ?? current.sessionCost ?? 0),
            sessionTokens: Number(typed?.sessionTokens ?? current.sessionTokens ?? 0)
        };
    },
    partialize: (state)=>({
            sessionCost: state.sessionCost,
            sessionTokens: state.sessionTokens
        })
}));
}),
"[project]/src/store/useUiStore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUiStore",
    ()=>useUiStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const useUiStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        showInput: true,
        showSidebar: true,
        showChangelog: false,
        showPlanModal: false,
        showSettings: false,
        inputType: 'url',
        displayScale: 1.1,
        toggleInput: ()=>set((state)=>({
                    showInput: !state.showInput
                })),
        toggleSidebar: ()=>set((state)=>({
                    showSidebar: !state.showSidebar
                })),
        setShowSidebar: (show)=>set({
                showSidebar: show
            }),
        setShowChangelog: (show)=>set({
                showChangelog: show
            }),
        setShowPlanModal: (show)=>set({
                showPlanModal: show
            }),
        setShowSettings: (show)=>set({
                showSettings: show
            }),
        setInputType: (type)=>set({
                inputType: type
            }),
        setDisplayScale: (scale)=>set({
                displayScale: scale
            })
    }), {
    name: 'pro_content_writer_ui',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    partialize: (state)=>({
            showInput: state.showInput,
            showSidebar: state.showSidebar,
            inputType: state.inputType,
            displayScale: state.displayScale
        })
}));
}),
"[project]/src/store/resetGenerationState.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resetGenerationState",
    ()=>resetGenerationState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useMetricsStore.ts [app-ssr] (ecmascript)");
;
;
;
const resetGenerationState = ()=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().resetGeneration();
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMetricsStore"].getState().resetSessionStats();
    // Clear editor autosave so a fresh analysis doesn't resurrect stale drafts
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const analysis = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState();
    analysis.setKeywordPlans([]);
    analysis.setRefAnalysis(null);
    analysis.setAuthAnalysis(null);
    analysis.setScrapedImages([]);
    analysis.setVisualStyle('');
    analysis.setCoveredPoints([]);
    analysis.setProductMapping([]);
    analysis.setActiveProductBrief(undefined);
    analysis.setArticleTitle('');
    analysis.setHeadingOptimizations([]);
};
}),
"[project]/src/utils/imageUtils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "dedupeScrapedImages",
    ()=>dedupeScrapedImages,
    "getActiveImages",
    ()=>getActiveImages,
    "toggleImage",
    ()=>toggleImage
]);
const toggleImage = (images, imageToToggle)=>{
    const keyToMatch = imageToToggle.id || imageToToggle.url || imageToToggle.altText;
    return images.map((img, idx)=>{
        const key = img.id || img.url || img.altText || `${idx}`;
        if (key !== keyToMatch) return img;
        return {
            ...img,
            ignored: !img.ignored
        };
    });
};
const getActiveImages = (images)=>{
    return images.filter((img)=>!img.ignored);
};
const buildKey = (img, idx)=>{
    if (img.url?.trim()) return `url:${img.url.trim()}`;
    if (img.altText?.trim()) return `alt:${img.altText.trim()}`;
    return `idx:${idx}`;
};
const dedupeScrapedImages = (images)=>{
    const seen = new Set();
    return images.filter((img, idx)=>{
        const key = buildKey(img, idx);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};
}),
"[project]/src/utils/cn.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
const cn = (...inputs)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}),
"[project]/src/utils/logger.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logger",
    ()=>logger
]);
class Logger {
    listeners = [];
    subscribe(listener) {
        this.listeners.push(listener);
        return ()=>{
            this.listeners = this.listeners.filter((l)=>l !== listener);
        };
    }
    log(stage, msg, meta, duration) {
        const entry = {
            stage,
            msg,
            meta,
            duration
        };
        // Console output
        const durationStr = duration ? ` (${duration}ms)` : '';
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        console.log(`[${stage}] ${msg}${durationStr}${metaStr}`);
        // Notify listeners (e.g., UI)
        this.listeners.forEach((l)=>l(entry));
    }
    warn(stage, msg, error) {
        console.warn(`[${stage}] ${msg}`, error);
        this.listeners.forEach((l)=>l({
                stage,
                msg: `WARNING: ${msg}`,
                meta: {
                    error
                }
            }));
    }
    error(stage, msg, error) {
        console.error(`[${stage}] ${msg}`, error);
        this.listeners.forEach((l)=>l({
                stage,
                msg: `ERROR: ${msg}`,
                meta: {
                    error
                }
            }));
    }
}
const logger = new Logger();
}),
"[project]/src/utils/textUtils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cleanHeadingText",
    ()=>cleanHeadingText,
    "stripLeadingHeading",
    ()=>stripLeadingHeading
]);
const cleanHeadingText = (value)=>{
    return (value || '').replace(/^#+\s*/, '').replace(/["“”]/g, '').trim();
};
const stripLeadingHeading = (content)=>{
    if (!content) return '';
    // Remove a leading H1/H2/H3 tag or markdown heading to avoid duplicates after we inject headings ourselves.
    const withoutHtmlHeading = content.replace(/^\s*<h[1-6][^>]*>.*?<\/h[1-6]>\s*/i, '');
    const withoutMdHeading = withoutHtmlHeading.replace(/^\s*#{1,6}\s.*(\r?\n|$)/, '');
    return withoutMdHeading.trim();
};
}),
"[project]/src/schemas/formSchema.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "articleFormSchema",
    ()=>articleFormSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-ssr] (ecmascript) <export * as z>");
;
const articleFormSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Topic is required"),
    referenceContent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(50, "Reference content must be at least 50 characters"),
    sampleOutline: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    authorityTerms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    websiteType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    targetAudience: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'zh-TW',
        'zh-HK',
        'zh-MY'
    ]),
    useRag: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    autoImagePlan: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    productRawText: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // UI-only fields that might need validation if used
    urlInput: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url("Invalid URL").optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
    productUrlList: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
}),
"[project]/src/hooks/useUrlScraper.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUrlScraper",
    ()=>useUrlScraper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$webScraper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/webScraper.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/referenceAnalysisService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$imageUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/imageUtils.ts [app-ssr] (ecmascript)");
;
;
;
;
;
const useUrlScraper = ({ setValue, onAddCost, setInputType })=>{
    const [scrapedImages, setScrapedImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const mutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: async (url)=>{
            if (!url) throw new Error('URL is required');
            const { title, content, images } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$webScraper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchUrlContent"])(url);
            return {
                title,
                content,
                images
            };
        },
        onSuccess: async ({ title, content, images })=>{
            setValue('referenceContent', content);
            setScrapedImages((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$imageUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dedupeScrapedImages"])(images));
            if (title) setValue('title', title);
            try {
                const brandRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractWebsiteTypeAndTerm"])(content);
                if (brandRes.data.websiteType) setValue('websiteType', brandRes.data.websiteType);
                if (brandRes.data.authorityTerms) setValue('authorityTerms', brandRes.data.authorityTerms);
                if (onAddCost) onAddCost(brandRes.cost, brandRes.usage);
            } catch (aiError) {
                console.warn('Failed to auto-extract brand info', aiError);
            }
            setInputType('text');
        },
        onError: ()=>{
            alert('Failed to fetch content from URL. The site might block bots.');
        }
    });
    const fetchAndPopulate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (url)=>{
        await mutation.mutateAsync(url);
    }, [
        mutation
    ]);
    return {
        scrapedImages,
        setScrapedImages,
        isFetchingUrl: mutation.isPending,
        fetchAndPopulate
    };
};
}),
"[project]/src/hooks/useProfileManager.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProfileManager",
    ()=>useProfileManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
const useProfileManager = ({ savedProfiles = [], setSavedProfiles, activeProfile, onSetActiveProfile, brandKnowledge, setValue })=>{
    const createProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((name, values)=>{
        if (!setSavedProfiles || !name.trim()) return null;
        const newProfile = {
            id: Date.now().toString(),
            name: name.trim(),
            websiteType: values.websiteType || '',
            authorityTerms: values.authorityTerms || '',
            brandKnowledge: brandKnowledge || '',
            targetAudience: values.targetAudience,
            useRag: values.useRag,
            productRawText: values.productRawText
        };
        const updated = [
            ...savedProfiles,
            newProfile
        ];
        setSavedProfiles(updated);
        onSetActiveProfile?.(newProfile);
        return newProfile;
    }, [
        brandKnowledge,
        onSetActiveProfile,
        savedProfiles,
        setSavedProfiles
    ]);
    const updateProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((values)=>{
        if (!setSavedProfiles || !activeProfile) return null;
        const updatedProfiles = savedProfiles.map((p)=>p.id === activeProfile.id ? {
                ...p,
                websiteType: values.websiteType || '',
                authorityTerms: values.authorityTerms || '',
                targetAudience: values.targetAudience,
                useRag: values.useRag,
                productRawText: values.productRawText,
                brandKnowledge: brandKnowledge
            } : p);
        setSavedProfiles(updatedProfiles);
        const updatedActive = updatedProfiles.find((p)=>p.id === activeProfile.id) || null;
        onSetActiveProfile?.(updatedActive);
        return updatedActive;
    }, [
        activeProfile,
        brandKnowledge,
        onSetActiveProfile,
        savedProfiles,
        setSavedProfiles
    ]);
    const deleteProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id)=>{
        if (!setSavedProfiles) return;
        const updatedProfiles = savedProfiles.filter((p)=>p.id !== id);
        setSavedProfiles(updatedProfiles);
        if (activeProfile?.id === id) {
            onSetActiveProfile?.(null);
        }
    }, [
        activeProfile?.id,
        onSetActiveProfile,
        savedProfiles,
        setSavedProfiles
    ]);
    const applyProfileToForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((profile)=>{
        setValue('websiteType', profile.websiteType);
        setValue('authorityTerms', profile.authorityTerms);
        setValue('targetAudience', profile.targetAudience);
        if (profile.useRag !== undefined) setValue('useRag', profile.useRag);
        if (profile.productRawText) {
            setValue('productRawText', profile.productRawText);
        } else if (profile.productBrief) {
            setValue('productRawText', `${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`);
        }
        onSetActiveProfile?.(profile);
    }, [
        onSetActiveProfile,
        setValue
    ]);
    const loadProductFromProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((profile)=>{
        if (profile.productRawText) {
            setValue('productRawText', profile.productRawText);
        } else if (profile.productBrief) {
            setValue('productRawText', `${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`);
        } else {
            alert('This profile has no saved product/service details.');
        }
    }, [
        setValue
    ]);
    return {
        createProfile,
        updateProfile,
        deleteProfile,
        applyProfileToForm,
        loadProductFromProfile
    };
};
}),
"[project]/src/hooks/useStorageReset.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStorageReset",
    ()=>useStorageReset
]);
const CLEAR_KEYS = [
    'pro_content_writer_analysis',
    'pro_content_writer_generation',
    'ai_writer_editor_autosave_v1'
];
const useStorageReset = ()=>{
    const clearAll = ({ reload = true, includeForm = true } = {})=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    };
    return {
        clearAll
    };
};
}),
"[project]/src/hooks/useArticleForm.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useArticleForm",
    ()=>useArticleForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hook-form/dist/index.esm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@hookform/resolvers/zod/dist/zod.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$schemas$2f$formSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/schemas/formSchema.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUrlScraper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useUrlScraper.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProfileManager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useProfileManager.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStorageReset$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useStorageReset.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$imageUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/imageUtils.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
const STORAGE_KEY = 'pro_content_writer_inputs_simple_v4';
const useArticleForm = ({ brandKnowledge = '', savedProfiles = [], setSavedProfiles, activeProfile, onSetActiveProfile, setInputType })=>{
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useForm"])({
        resolver: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["zodResolver"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$schemas$2f$formSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["articleFormSchema"]),
        defaultValues: {
            title: '',
            referenceContent: '',
            sampleOutline: '',
            authorityTerms: '',
            websiteType: '',
            targetAudience: 'zh-TW',
            useRag: false,
            autoImagePlan: false,
            productRawText: '',
            urlInput: '',
            productUrlList: ''
        }
    });
    const watchedValues = watch();
    const [productMode, setProductMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('text');
    const [isSummarizingProduct, setIsSummarizingProduct] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [refCharCount, setRefCharCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [refWordCount, setRefWordCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const { clearAll } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStorageReset$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useStorageReset"])();
    const { scrapedImages, setScrapedImages, isFetchingUrl, fetchAndPopulate } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUrlScraper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUrlScraper"])({
        setValue,
        setInputType
    });
    const { createProfile, updateProfile, deleteProfile, applyProfileToForm, loadProductFromProfile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProfileManager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProfileManager"])({
        savedProfiles,
        setSavedProfiles,
        activeProfile,
        onSetActiveProfile,
        brandKnowledge,
        setValue
    });
    // Restore persisted form
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const saved = undefined;
    }, [
        setScrapedImages,
        setValue
    ]);
    // Persist + counts
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const subscription = watch((values)=>{
            const dataToSave = {
                ...values,
                scrapedImages
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            const content = values.referenceContent || '';
            setRefCharCount(content.length);
            const cjkCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
            const nonCjkText = content.replace(/[\u4e00-\u9fa5]/g, ' ');
            const englishWords = nonCjkText.trim().split(/\s+/).filter((w)=>w.length > 0);
            setRefWordCount(cjkCount + englishWords.length);
        });
        return ()=>subscription.unsubscribe();
    }, [
        scrapedImages,
        watch
    ]);
    // Apply active profile
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (activeProfile) {
            applyProfileToForm(activeProfile);
        }
    }, [
        activeProfile,
        applyProfileToForm
    ]);
    const usableImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>scrapedImages.filter((img)=>!img.ignored), [
        scrapedImages
    ]);
    const handleClear = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, [
        clearAll,
        reset,
        setScrapedImages,
        setValue
    ]);
    return {
        register,
        handleSubmit,
        setValue,
        watchedValues,
        errors,
        productMode,
        setProductMode,
        isSummarizingProduct,
        setIsSummarizingProduct,
        refCharCount,
        refWordCount,
        scrapedImages,
        setScrapedImages,
        isFetchingUrl,
        fetchAndPopulate,
        createProfile,
        updateProfile,
        deleteProfile,
        applyProfileToForm,
        loadProductFromProfile,
        usableImages,
        handleClear
    };
};
}),
"[project]/src/hooks/useSemanticFilter.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSemanticFilter",
    ()=>useSemanticFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/embeddingService.ts [app-ssr] (ecmascript)");
;
;
const DEFAULT_SEMANTIC_THRESHOLD = 0.79;
const splitIntoBlankLineChunks = (content)=>content.split(/\n\s*\n+/).map((chunk)=>chunk.trim()).filter(Boolean);
const useSemanticFilter = ()=>{
    const [isChunkModalOpen, setIsChunkModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [chunkPreview, setChunkPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isFilteringChunks, setIsFilteringChunks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [filterError, setFilterError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [chunkScores, setChunkScores] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isScoringChunks, setIsScoringChunks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [manualKeep, setManualKeep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [semanticThreshold, setSemanticThreshold] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_SEMANTIC_THRESHOLD);
    const [semanticThresholdInput, setSemanticThresholdInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_SEMANTIC_THRESHOLD.toString());
    const commitSemanticThreshold = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((raw)=>{
        const candidate = (typeof raw === 'string' ? raw : semanticThresholdInput).trim();
        if (candidate === '') {
            setSemanticThresholdInput(semanticThreshold.toString());
            return semanticThreshold;
        }
        const parsed = parseFloat(candidate);
        if (Number.isNaN(parsed)) {
            setSemanticThresholdInput(semanticThreshold.toString());
            return semanticThreshold;
        }
        const clamped = Math.min(1, Math.max(0, parsed));
        const normalized = Math.round(clamped * 100) / 100;
        setSemanticThreshold(normalized);
        setSemanticThresholdInput(normalized.toString());
        return normalized;
    }, [
        semanticThresholdInput,
        semanticThreshold
    ]);
    const scoreChunks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (chunks, title)=>{
        if (!title) {
            setFilterError('請先填寫標題，再計算語意距離。');
            return null;
        }
        setIsScoringChunks(true);
        setFilterError(null);
        try {
            const [titleEmbeddings, chunkEmbeddings] = await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["embedTexts"])([
                    title
                ]),
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["embedTexts"])(chunks)
            ]);
            const titleEmbedding = titleEmbeddings[0];
            if (!titleEmbedding?.length) {
                throw new Error('無法取得標題向量，請稍後再試。');
            }
            const similarities = chunks.map((chunk, idx)=>{
                const chunkEmbedding = chunkEmbeddings[idx];
                if (!chunkEmbedding?.length) return 1;
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cosineSimilarity"])(titleEmbedding, chunkEmbedding);
            });
            setChunkScores(similarities);
            return similarities;
        } catch (error) {
            setFilterError(error?.message || '語意過濾失敗，請稍後再試。');
            return null;
        } finally{
            setIsScoringChunks(false);
        }
    }, []);
    const openFilterModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((content, title)=>{
        const chunks = splitIntoBlankLineChunks(content);
        if (!chunks.length) {
            alert('找不到可以分段的內容（需有空白行分隔）。');
            return;
        }
        setChunkPreview(chunks);
        setFilterError(null);
        setChunkScores([]);
        setManualKeep({});
        setIsChunkModalOpen(true);
        void scoreChunks(chunks, title);
    }, [
        scoreChunks
    ]);
    const applyFilter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (content, title)=>{
        const chunks = chunkPreview.length ? chunkPreview : splitIntoBlankLineChunks(content);
        if (!chunks.length) {
            setFilterError('找不到可用的段落。');
            return null;
        }
        setIsFilteringChunks(true);
        setFilterError(null);
        try {
            const existingScores = chunkScores.length === chunks.length ? chunkScores : null;
            const computedScores = existingScores || await scoreChunks(chunks, title) || [];
            if (!computedScores.length) {
                setFilterError('無法取得語意距離，請確認標題與 API 設定。');
                return null;
            }
            const keptChunks = chunks.filter((chunk, idx)=>{
                const similarity = computedScores[idx] ?? 1;
                const forcedKeep = manualKeep[idx];
                return forcedKeep || similarity >= semanticThreshold;
            });
            const filteredContent = keptChunks.join('\n\n').trim();
            setIsChunkModalOpen(false);
            return filteredContent;
        } catch (error) {
            setFilterError(error?.message || '語意過濾失敗，請稍後再試。');
            return null;
        } finally{
            setIsFilteringChunks(false);
        }
    }, [
        chunkPreview,
        chunkScores,
        manualKeep,
        scoreChunks,
        semanticThreshold
    ]);
    return {
        isChunkModalOpen,
        setIsChunkModalOpen,
        chunkPreview,
        chunkScores,
        isScoringChunks,
        isFilteringChunks,
        filterError,
        manualKeep,
        setManualKeep,
        openFilterModal,
        applyFilter,
        semanticThreshold,
        semanticThresholdInput,
        setSemanticThresholdInput,
        commitSemanticThreshold,
        DEFAULT_SEMANTIC_THRESHOLD
    };
};
}),
"[project]/src/hooks/useImageEditor.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useImageEditor",
    ()=>useImageEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/imageService.ts [app-ssr] (ecmascript)");
;
;
const useImageEditor = ({ editorRef, tiptapApi, imageContainerRef, targetAudience, visualStyle, scrapedImages, onAddCost, handleInput, saveSelection, restoreSelection })=>{
    const [showImageModal, setShowImageModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imagePrompt, setImagePrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [isImageLoading, setIsImageLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isDownloadingImages, setIsDownloadingImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imagePlans, setImagePlans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isPlanning, setIsPlanning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isBatchProcessing, setIsBatchProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const openImageModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        saveSelection();
        setShowImageModal(true);
        setIsImageLoading(true);
        setImagePrompt('Analyzing context...');
        let contextText = '';
        if (tiptapApi?.getPlainText) {
            const text = tiptapApi.getPlainText();
            contextText = text.substring(0, 200);
        } else if (editorRef.current) {
            const fullText = editorRef.current.innerText;
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(editorRef.current);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                const startOffset = preCaretRange.toString().length;
                const start = Math.max(0, startOffset - 100);
                const end = Math.min(fullText.length, startOffset + 100);
                contextText = fullText.substring(start, end);
            } else {
                contextText = fullText.substring(0, 200);
            }
        }
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateImagePromptFromContext"])(contextText, targetAudience, visualStyle || '');
            setImagePrompt(res.data);
            onAddCost?.(res.cost, res.usage);
        } catch (e) {
            setImagePrompt('Create a realistic image relevant to this article.');
        } finally{
            setIsImageLoading(false);
        }
    }, [
        editorRef,
        onAddCost,
        saveSelection,
        targetAudience,
        visualStyle
    ]);
    const generateImageFromPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (prompt)=>{
        if (!prompt) return;
        setIsImageLoading(true);
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateImage"])(prompt);
            if (res.data) {
                const imgHtml = `<img src="${res.data}" alt="${prompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" /><br/>`;
                if (tiptapApi) {
                    tiptapApi.insertImage(res.data, prompt);
                } else {
                    restoreSelection();
                    document.execCommand('insertHTML', false, imgHtml);
                    if (editorRef.current) handleInput({
                        currentTarget: editorRef.current
                    });
                }
                onAddCost?.(res.cost, res.usage);
                setShowImageModal(false);
            } else {
                alert('Image generation returned no data.');
            }
        } catch (e) {
            console.error('Image generation error', e);
            alert('Failed to generate image.');
        } finally{
            setIsImageLoading(false);
        }
    }, [
        editorRef,
        handleInput,
        onAddCost,
        restoreSelection
    ]);
    const downloadImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const container = imageContainerRef?.current || editorRef.current || document.body;
        const images = container.querySelectorAll('img');
        if (images.length === 0) {
            alert('No images found in the editor to download.');
            return;
        }
        if (!confirm(`Found ${images.length} images in the article. Download them now?`)) return;
        setIsDownloadingImages(true);
        const downloadLink = document.createElement('a');
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        try {
            for(let i = 0; i < images.length; i++){
                const img = images[i];
                const src = img.src;
                const ext = src.includes('image/jpeg') ? 'jpg' : 'png';
                const filename = `article-image-${Date.now()}-${i + 1}.${ext}`;
                if (src.startsWith('data:')) {
                    downloadLink.href = src;
                    downloadLink.download = filename;
                    downloadLink.click();
                } else {
                    try {
                        const response = await fetch(src);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        downloadLink.href = url;
                        downloadLink.download = filename;
                        downloadLink.click();
                        URL.revokeObjectURL(url);
                    } catch (err) {
                        console.warn(`Failed to download ${src}, opening in new tab instead.`);
                        window.open(src, '_blank');
                    }
                }
                await new Promise((r)=>setTimeout(r, 200));
            }
        } catch (e) {
            console.error('Download failed', e);
            alert('Some images could not be downloaded.');
        } finally{
            document.body.removeChild(downloadLink);
            setIsDownloadingImages(false);
        }
    }, [
        editorRef
    ]);
    const updatePlanPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id, newPrompt)=>{
        setImagePlans((prev)=>prev.map((p)=>p.id === id ? {
                    ...p,
                    generatedPrompt: newPrompt
                } : p));
    }, []);
    const injectImageIntoEditor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((plan, method = 'auto')=>{
        if (!plan.url) return;
        const imgHtml = `<img src="${plan.url}" alt="${plan.generatedPrompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;
        const anchorText = plan.insertAfter?.trim() || '';
        const tryInjectByAnchor = (html, replaceFn)=>{
            const insertAt = (target)=>{
                if (!target || !html.includes(target)) return false;
                replaceFn(html.replace(target, `${target}<br/>${imgHtml}`));
                return true;
            };
            if (insertAt(anchorText)) return true;
            const chunks = anchorText.split(/[，,。.\n\t\s、：:]+/).filter((c)=>c.length >= 4).sort((a, b)=>b.length - a.length);
            for (const chunk of chunks){
                if (insertAt(chunk)) return true;
            }
            return false;
        };
        if (tiptapApi) {
            const insertAtSelection = ()=>tiptapApi.insertImage(plan.url, plan.generatedPrompt);
            if (method === 'cursor' || !anchorText || !tiptapApi.getHtml || !tiptapApi.setHtml) {
                insertAtSelection();
                return;
            }
            const html = tiptapApi.getHtml();
            const injected = tryInjectByAnchor(html, (nextHtml)=>tiptapApi.setHtml(nextHtml));
            if (!injected) {
                insertAtSelection();
            }
            return;
        }
        if (!editorRef.current) return;
        if (method === 'cursor') {
            restoreSelection();
            document.execCommand('insertHTML', false, imgHtml);
            handleInput({
                currentTarget: editorRef.current
            });
            return;
        }
        const currentHtml = editorRef.current.innerHTML;
        const injected = tryInjectByAnchor(currentHtml, (nextHtml)=>{
            editorRef.current.innerHTML = nextHtml;
            handleInput({
                currentTarget: editorRef.current
            });
        });
        if (!injected) {
            alert(`Could not find anchor: "...${anchorText.substring(0, 15)}...". \n\nPlease place your cursor in the text and click the "Cursor" button to insert manually.`);
        }
    }, [
        editorRef,
        handleInput,
        restoreSelection,
        tiptapApi
    ]);
    const generateSinglePlan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (plan)=>{
        if (plan.status === 'generating') return;
        setImagePlans((prev)=>prev.map((p)=>p.id === plan.id ? {
                    ...p,
                    status: 'generating'
                } : p));
        try {
            const imgRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateImage"])(plan.generatedPrompt);
            if (imgRes.data) {
                const updatedPlan = {
                    ...plan,
                    status: 'done',
                    url: imgRes.data || undefined
                };
                setImagePlans((prev)=>prev.map((p)=>p.id === plan.id ? updatedPlan : p));
                onAddCost?.(imgRes.cost, imgRes.usage);
            } else {
                setImagePlans((prev)=>prev.map((p)=>p.id === plan.id ? {
                            ...p,
                            status: 'error'
                        } : p));
            }
        } catch (e) {
            console.error('Single generation failed', e);
            setImagePlans((prev)=>prev.map((p)=>p.id === plan.id ? {
                        ...p,
                        status: 'error'
                    } : p));
        }
    }, [
        onAddCost
    ]);
    const handleBatchProcess = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (isBatchProcessing) return;
        setIsBatchProcessing(true);
        const plansToProcess = imagePlans.filter((p)=>p.status !== 'done');
        const promises = plansToProcess.map((plan)=>generateSinglePlan(plan));
        await Promise.all(promises);
        setIsBatchProcessing(false);
    }, [
        generateSinglePlan,
        imagePlans,
        isBatchProcessing
    ]);
    const autoPlanImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const getContent = ()=>{
            if (tiptapApi?.getPlainText) return tiptapApi.getPlainText();
            return editorRef.current?.innerText || '';
        };
        if (isPlanning) return;
        setIsPlanning(true);
        try {
            const content = getContent();
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["planImagesForArticle"])(content, scrapedImages, targetAudience, visualStyle || '');
            setImagePlans(res.data);
            onAddCost?.(res.cost, res.usage);
        } catch (e) {
            console.error('Auto-plan failed', e);
            alert('Failed to plan images.');
        } finally{
            setIsPlanning(false);
        }
    }, [
        editorRef,
        onAddCost,
        scrapedImages,
        targetAudience,
        visualStyle,
        isPlanning
    ]);
    return {
        showImageModal,
        setShowImageModal,
        imagePrompt,
        setImagePrompt,
        isImageLoading,
        isDownloadingImages,
        imagePlans,
        isPlanning,
        isBatchProcessing,
        openImageModal,
        generateImageFromPrompt,
        downloadImages,
        autoPlanImages,
        updatePlanPrompt,
        injectImageIntoEditor,
        generateSinglePlan,
        handleBatchProcess
    };
};
}),
"[project]/src/hooks/useMetaGenerator.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMetaGenerator",
    ()=>useMetaGenerator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentGenerationService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
;
;
;
;
const useMetaGenerator = ({ editorRef, tiptapApi, targetAudience, context, onAddCost, onMetaGenerated })=>{
    const [metaTitle, setMetaTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [metaDescription, setMetaDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [urlSlug, setUrlSlug] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [isMetaLoading, setIsMetaLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const generateMeta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setIsMetaLoading(true);
        try {
            const articleText = (tiptapApi?.getPlainText ? tiptapApi.getPlainText() : editorRef.current?.innerText || '').slice(0, 1000);
            const contextLines = [];
            if (context.keyPoints.length > 0) contextLines.push(`Key Points: ${context.keyPoints.slice(0, 6).join('; ')} `);
            if (context.brandExclusivePoints.length > 0) contextLines.push(`Brand USPs: ${context.brandExclusivePoints.slice(0, 4).join('; ')} `);
            if (context.productBrief?.brandName || context.productBrief?.productName) {
                contextLines.push(`Brand: ${context.productBrief?.brandName || ''} Product: ${context.productBrief?.productName || ''} USP: ${context.productBrief?.usp || ''} `);
            }
            if (context.visualStyle) contextLines.push(`Visual Style: ${context.visualStyle} `);
            if (context.outlineSections && context.outlineSections.length > 0) {
                const outlinePreview = context.outlineSections.slice(0, 8).join(' > ');
                contextLines.push(`Outline: ${outlinePreview} `);
            }
            const metaPrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].metaSeo({
                targetAudience,
                contextLines,
                articlePreview: articleText
            });
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateSnippet"])(metaPrompt, targetAudience, {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                    properties: {
                        title: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        },
                        description: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        },
                        slug: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    }
                },
                // Force JSON and minimal verbosity
                generationConfig: {
                    response_mime_type: 'application/json'
                }
            });
            const parsed = JSON.parse(res.data || '{}');
            const title = parsed.title || metaTitle || '';
            const description = parsed.description || metaDescription || '';
            const slug = parsed.slug || metaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
            setMetaTitle(title);
            setMetaDescription(description);
            setUrlSlug(slug);
            onMetaGenerated?.({
                title,
                description,
                slug
            });
            onAddCost?.(res.cost, res.usage);
        } catch (err) {
            console.error('Meta generation failed', err);
            alert('Failed to generate meta info. Please try again.');
        } finally{
            setIsMetaLoading(false);
        }
    }, [
        context.brandExclusivePoints,
        context.keyPoints,
        context.productBrief,
        context.visualStyle,
        context.outlineSections,
        editorRef,
        onAddCost,
        onMetaGenerated,
        targetAudience
    ]);
    return {
        metaTitle,
        metaDescription,
        urlSlug,
        setMetaTitle,
        setMetaDescription,
        setUrlSlug,
        isMetaLoading,
        generateMeta
    };
};
}),
"[project]/src/hooks/useAskAi.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAskAi",
    ()=>useAskAi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$marked$2f$lib$2f$marked$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/marked/lib/marked.esm.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentGenerationService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
;
;
;
;
const useAskAi = ({ tiptapApi, targetAudience, onAddCost, setIsAiLoading, updateCountsFromText, onChange })=>{
    const askAiRangesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])({});
    const lastRangeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastActionModeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pendingCountRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const clearAskAiState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        // Keep other task highlights; only clear generic marks if no task is specified.
        lastActionModeRef.current = null;
    }, [
        tiptapApi
    ]);
    const buildAskAiPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((input, text)=>{
        const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
        if (input.mode === 'format') {
            let task = '';
            switch(input.preset){
                case 'bullet':
                    task = 'Convert to a bullet list.';
                    break;
                case 'ordered':
                    task = 'Convert to an ordered (numbered) list.';
                    break;
                case 'table-2':
                    task = 'Present as a 2-column table (Header + Row values).';
                    break;
                case 'table-3':
                    task = 'Present as a 3-column table (Header + Row values).';
                    break;
                case 'checklist':
                    task = 'Convert to a checklist with unchecked boxes.';
                    break;
                case 'quote':
                    task = 'Wrap as a highlighted quote block.';
                    break;
                case 'markdown-clean':
                    task = 'Clean up Markdown/HTML, fix nesting, and keep structure minimal.';
                    break;
                default:
                    task = 'Reformat cleanly.';
            }
            return `TARGET CONTENT: """${text}"""\nTASK: ${task} Return ONLY the formatted HTML/Markdown.\n\n${languageInstruction}`;
        }
        const presetInstruction = (()=>{
            switch(input.preset){
                case 'rephrase':
                    return 'Rephrase for clarity while keeping meaning. Ensure the tone is natural and professional.';
                case 'shorten':
                    return 'CRITICAL: Condense the text by 30-50%. Remove all fluff, redundancy, and filler words. Keep ONLY the core message.';
                case 'elaborate':
                    return 'Expand with 1-2 concise sentences to add clarity.';
                case 'formal':
                    return 'Rewrite in a more formal tone.';
                case 'casual':
                    return 'Rewrite in a friendlier, more casual tone.';
                case 'bulletise':
                    return 'Convert into concise bullet points.';
                case 'summarise':
                    return 'Summarise into a brief paragraph or 2 bullets.';
                default:
                    return input.prompt || 'Improve the text with better flow.';
            }
        })();
        return `TARGET TEXT: """${text}"""\nINSTRUCTION: ${presetInstruction}${input.prompt ? `\nCUSTOM PROMPT: ${input.prompt}` : ''}\n\n${languageInstruction}\n\nTASK: Return ONLY the rewritten result in HTML/Markdown.`;
    }, [
        targetAudience
    ]);
    const lockAskAiRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((taskId)=>{
        if (!tiptapApi) return null;
        const selectionRange = tiptapApi.getSelectionRange?.() || null;
        if (selectionRange) {
            lastRangeRef.current = selectionRange;
            if (taskId) {
                askAiRangesRef.current[taskId] = selectionRange;
                tiptapApi.markAskAiRange?.(selectionRange, taskId);
            }
        }
        return selectionRange;
    }, [
        tiptapApi
    ]);
    const runAskAiAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (input)=>{
        if (!tiptapApi) {
            alert('Editor not ready.');
            throw new Error('Editor not ready');
        }
        const selectionRange = (input.taskId ? tiptapApi.findAskAiRange?.(input.taskId) : null) || (input.taskId ? askAiRangesRef.current[input.taskId] : null) || lastRangeRef.current || tiptapApi.getSelectionRange?.() || null;
        lastActionModeRef.current = input.mode;
        if (selectionRange) {
            lastRangeRef.current = selectionRange;
            if (input.taskId) {
                askAiRangesRef.current[input.taskId] = selectionRange;
            }
        }
        const selectedText = (input.selectedText || tiptapApi.getSelectedText?.() || '').trim();
        if (!selectedText) {
            alert('請先選取要調整的文字。');
            throw new Error('No selection');
        }
        if (selectionRange && input.taskId) {
            tiptapApi.markAskAiRange?.(selectionRange, input.taskId);
        }
        const promptToSend = buildAskAiPrompt(input, selectedText);
        pendingCountRef.current += 1;
        setIsAiLoading(true);
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateSnippet"])(promptToSend, targetAudience);
            const htmlSnippet = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$marked$2f$lib$2f$marked$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["marked"].parse(res.data || '', {
                async: false
            });
            onAddCost?.(res.cost, res.usage);
            return htmlSnippet;
        } catch (error) {
            console.error("AI Edit failed", error);
            alert("Failed to generate content. Please try again.");
            throw error;
        } finally{
            pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
            setIsAiLoading(pendingCountRef.current > 0);
        }
    }, [
        buildAskAiPrompt,
        onAddCost,
        setIsAiLoading,
        targetAudience,
        tiptapApi
    ]);
    const handleAskAiInsert = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((html, taskId)=>{
        if (!tiptapApi) return;
        const selectionRange = (taskId ? tiptapApi.findAskAiRange?.(taskId) : null) || (taskId ? askAiRangesRef.current[taskId] : null) || lastRangeRef.current || tiptapApi.getSelectionRange?.();
        const mode = lastActionModeRef.current;
        if (selectionRange) {
            tiptapApi.replaceRange(selectionRange, html);
        } else {
            tiptapApi.insertHtml(html);
        }
        if (taskId) {
            delete askAiRangesRef.current[taskId];
            tiptapApi.clearAskAiMarks?.(taskId);
        }
        clearAskAiState();
        const updatedText = tiptapApi.getPlainText();
        updateCountsFromText(updatedText);
        onChange?.(tiptapApi.getHtml());
    }, [
        clearAskAiState,
        onChange,
        tiptapApi,
        updateCountsFromText
    ]);
    return {
        runAskAiAction,
        handleAskAiInsert,
        clearAskAiState,
        lockAskAiRange,
        highlightAskAiTarget: (taskId)=>{
            const range = tiptapApi?.findAskAiRange?.(taskId);
            if (range) {
                tiptapApi?.markAskAiRange?.(range, taskId);
            }
        }
    };
};
}),
"[project]/src/hooks/useEditorAutosave.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useEditorAutosave",
    ()=>useEditorAutosave
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
const useEditorAutosave = ({ storageKey = 'ai_writer_editor_autosave_v1', debounceMs = 3000 })=>{
    const autosaveTimerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const latestHtmlRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])('');
    const latestMetaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])({});
    const pendingRestoreRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastSavedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(''); // cache serialized payload to avoid redundant writes
    // Load saved draft on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, [
        storageKey
    ]);
    const queueAutosave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, [
        debounceMs,
        storageKey
    ]);
    const recordHtml = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((html)=>{
        latestHtmlRef.current = html || '';
        queueAutosave();
    }, [
        queueAutosave
    ]);
    const recordMeta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((meta)=>{
        latestMetaRef.current = {
            ...latestMetaRef.current,
            ...meta
        };
        queueAutosave();
    }, [
        queueAutosave
    ]);
    const consumeDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const saved = pendingRestoreRef.current;
        pendingRestoreRef.current = null;
        return saved;
    }, []);
    return {
        recordHtml,
        recordMeta,
        consumeDraft
    };
};
}),
"[project]/src/hooks/generation/generationLogger.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appendAnalysisLog",
    ()=>appendAnalysisLog,
    "summarizeList",
    ()=>summarizeList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
;
const appendAnalysisLog = (msg)=>{
    const store = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    // Only append logs to content during the analysis phase
    if (store.status === 'analyzing') {
        // store.setContent(prev => {
        //     const next = typeof prev === 'string' ? prev : '';
        //     return next ? `${next}\n${msg}` : msg;
        // });
        console.log(`[Analysis Log]: ${msg}`);
    } else {
        console.log(`[Background Log]: ${msg}`);
    }
};
const summarizeList = (items, max = 5)=>{
    const slice = items.slice(0, max);
    const more = items.length > max ? ` +${items.length - max}` : '';
    return slice.join(', ') + more;
};
}),
"[project]/src/hooks/generation/useAnalysisPipeline.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runAnalysisPipeline",
    ()=>runAnalysisPipeline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useMetricsStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/productFeatureToPainPointMapper.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$nlpService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/nlpService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$termUsagePlanner$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/termUsagePlanner.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useSettingsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useSettingsStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/referenceAnalysisService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$authorityService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/authorityService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/imageService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/generationLogger.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionalAnalysisService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/regionalAnalysisService.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
const isStopped = ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().isStopped;
const audienceLabel = (aud)=>{
    switch(aud){
        case 'zh-HK':
            return '繁體中文（香港）';
        case 'zh-MY':
            return '簡體中文（馬來西亞）';
        case 'zh-TW':
        default:
            return '繁體中文（台灣）';
    }
};
const runAnalysisPipeline = async (config)=>{
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    const analysisStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState();
    const metricsStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMetricsStore"].getState();
    // Reset State for Analysis
    generationStore.setStatus('analyzing');
    analysisStore.setScrapedImages(config.scrapedImages || []);
    analysisStore.setTargetAudience(config.targetAudience);
    analysisStore.setArticleTitle(config.title || '');
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(config.targetAudience);
    analysisStore.setLanguageInstruction(languageInstruction);
    console.info('[LangConfig]', {
        targetAudience: config.targetAudience,
        languageInstruction
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`語言設定：${audienceLabel(config.targetAudience)}（${config.targetAudience}）`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Starting analysis...');
    const fullConfig = {
        ...config,
        brandKnowledge: analysisStore.brandKnowledge
    };
    // Task 1: Product Context
    const productTask = async ()=>{
        let parsedProductBrief = config.productBrief;
        let generatedMapping = [];
        if (!parsedProductBrief && config.productRawText && config.productRawText.length > 5) {
            if (isStopped()) return {
                mapping: []
            };
            generationStore.setGenerationStep('parsing_product');
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Parsing product brief and CTA...');
            const parseRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseProductContext"])(config.productRawText);
            console.log(`[Timer] Product Context Parse: ${parseRes.duration}ms`);
            parsedProductBrief = parseRes.data;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Product brief parsed.');
            metricsStore.addCost(parseRes.cost.totalCost, parseRes.usage.totalTokens);
        }
        if (parsedProductBrief && parsedProductBrief.productName) {
            if (isStopped()) return {
                brief: parsedProductBrief,
                mapping: []
            };
            generationStore.setGenerationStep('mapping_product');
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Mapping pain points to product features...');
            const mapRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateProblemProductMapping"])(parsedProductBrief, fullConfig.targetAudience);
            console.log(`[Timer] Product Mapping: ${mapRes.duration}ms`);
            generatedMapping = mapRes.data;
            analysisStore.setProductMapping(generatedMapping);
            if (generatedMapping.length > 0) {
                const example = generatedMapping[0];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Product-feature mapping ready (${generatedMapping.length}). e.g., ${example.painPoint} → ${example.productFeature}`);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Product-feature mapping ready (no matches found).');
            }
            metricsStore.addCost(mapRes.cost.totalCost, mapRes.usage.totalTokens);
        }
        analysisStore.setActiveProductBrief(parsedProductBrief);
        return {
            brief: parsedProductBrief,
            mapping: generatedMapping
        };
    };
    // Task 1.5: Heading refinement for preview (uses extracted structure titles)
    // Task 2: NLP & Keyword Planning
    const keywordTask = async ()=>{
        if (isStopped()) return;
        generationStore.setGenerationStep('nlp_analysis');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Running NLP keyword scan...');
        const keywords = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$nlpService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeText"])(fullConfig.referenceContent);
        // DYNAMIC LIMIT CALCULATION:
        const settings = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useSettingsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSettingsStore"].getState();
        const contentLen = fullConfig.referenceContent.length;
        const calculatedLimit = Math.floor(contentLen / settings.keywordCharDivisor);
        const finalLimit = Math.max(settings.minKeywords, Math.min(settings.maxKeywords, calculatedLimit));
        const keywordPlanCandidates = keywords.slice(0, finalLimit);
        const topTokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["summarizeList"])(keywordPlanCandidates.map((k)=>k.token), 6);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`NLP scan found ${keywords.length} keywords. Using top ${keywordPlanCandidates.length} (Ratio: 1/${settings.keywordCharDivisor}, Min: ${settings.minKeywords}): ${topTokens}`);
        if (keywordPlanCandidates.length > 0 && !isStopped()) {
            generationStore.setGenerationStep('planning_keywords');
            try {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Planning keyword strategy (top ${keywordPlanCandidates.length})...`);
                const planRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$termUsagePlanner$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractSemanticKeywordsAnalysis"])(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                console.log(`[Timer] Keyword Action Plan: ${planRes.duration}ms`);
                console.log(`[SemanticKeywords] Final aggregated plans: ${planRes.data.length} / ${keywordPlanCandidates.length}`);
                analysisStore.setKeywordPlans(planRes.data);
                const planWords = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["summarizeList"])(planRes.data.map((p)=>p.word), 6);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Keyword plan ready (${planRes.data.length}). Focus: ${planWords}`);
                metricsStore.addCost(planRes.cost.totalCost, planRes.usage.totalTokens);
            } catch (e) {
                console.warn("Action Plan extraction failed", e);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Keyword planning failed (continuing).');
            }
        }
    };
    // Task 3: Structure & Authority (run concurrently)
    const structureTask = async ()=>{
        if (isStopped()) return;
        generationStore.setGenerationStep('extracting_structure');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Extracting reference structure and authority signals...');
        const [structRes, authRes] = await Promise.all([
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeReferenceStructure"])(fullConfig.referenceContent, fullConfig.targetAudience),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$authorityService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeAuthorityTerms"])(fullConfig.authorityTerms || '', fullConfig.title, fullConfig.websiteType || 'General Professional Website', fullConfig.targetAudience)
        ]);
        console.log(`[Timer] Narrative Structure (Outline): ${structRes.duration}ms`);
        console.log(`[Timer] Authority Analysis: ${authRes.duration}ms`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Structure extracted (${structRes.data?.structure?.length || 0} sections).`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Authority terms mapped.');
        if (structRes.data?.structure?.length) {
            const sectionTitles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["summarizeList"])(structRes.data.structure.map((s)=>s.title), 6);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Sections: ${sectionTitles}`);
        }
        if (authRes.data?.relevantTerms?.length) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Authority terms: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["summarizeList"])(authRes.data.relevantTerms, 6)}`);
        }
        metricsStore.addCost(structRes.cost.totalCost, structRes.usage.totalTokens);
        metricsStore.addCost(authRes.cost.totalCost, authRes.usage.totalTokens);
        analysisStore.setRefAnalysis(structRes.data);
        analysisStore.setAuthAnalysis(authRes.data);
        return {
            structRes,
            authRes
        };
    };
    // Task 4: Image Analysis & Visual Style
    const visualTask = async ()=>{
        if (isStopped()) return;
        generationStore.setGenerationStep('analyzing_visuals');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Analyzing source images and visual identity...');
        const initialImages = config.scrapedImages || [];
        const imagesToAnalyze = initialImages.slice(0, 5);
        let analyzedImages = [
            ...initialImages
        ];
        if (imagesToAnalyze.length > 0) {
            for(let i = 0; i < imagesToAnalyze.length; i++){
                if (isStopped()) break;
                const img = imagesToAnalyze[i];
                if (img.url) {
                    try {
                        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeImageWithAI"])(img.url);
                        analyzedImages[i] = {
                            ...analyzedImages[i],
                            aiDescription: res.data
                        };
                        metricsStore.addCost(res.cost.totalCost, res.usage.totalTokens);
                    } catch (e) {
                        console.warn(`Failed to analyze image ${img.url}`, e);
                    }
                }
            }
            analysisStore.setScrapedImages(analyzedImages);
        }
        try {
            const styleRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeVisualStyle"])(analyzedImages, fullConfig.websiteType || "Modern Business");
            analysisStore.setVisualStyle(styleRes.data);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`✓ Visual style extracted: ${styleRes.data}`);
            metricsStore.addCost(styleRes.cost.totalCost, styleRes.usage.totalTokens);
        } catch (e) {
            console.warn("Failed to extract visual style", e);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Visual style extraction skipped.');
        }
    };
    // Task 5: Regional Analysis (NEW)
    const regionalTask = async ()=>{
        if (isStopped()) return;
        generationStore.setGenerationStep('localizing_hk'); // Reuse step label or create new 'analyzing_region'
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Analyzing regional terminology & brand grounding...');
        try {
            const regionRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionalAnalysisService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["analyzeRegionalTerms"])(fullConfig.referenceContent, fullConfig.targetAudience);
            console.log(`[Timer] Regional Analysis: ${regionRes.duration}ms`);
            if (regionRes.data && regionRes.data.length > 0) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Regional analysis found ${regionRes.data.length} terms to correct.`);
                // Store in refAnalysis (requires refAnalysis to be initialized first, or return it)
                return regionRes.data;
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Regional analysis: No major issues found.');
                return [];
            }
        } catch (e) {
            console.warn("Regional analysis failed", e);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Regional analysis failed (continuing).');
            return [];
        }
    };
    // --- EXECUTE ALL TASKS WITH STAGGERING ---
    // Burst protection: Start each major task 1 second apart to prevent proxy/backend overload
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Dispatching analysis tasks with burst protection...');
    const productResult = await productTask();
    await new Promise((r)=>setTimeout(r, 1000));
    const [structureResult, visualResultsPromise, regionalResult, keywordResult] = await Promise.all([
        structureTask(),
        (async ()=>{
            await new Promise((r)=>setTimeout(r, 1000));
            return visualTask();
        })(),
        (async ()=>{
            await new Promise((r)=>setTimeout(r, 2000));
            return regionalTask();
        })(),
        (async ()=>{
            await new Promise((r)=>setTimeout(r, 3000));
            return keywordTask();
        })()
    ]);
    // Merge regional result into structureResult if available
    if (structureResult?.structRes?.data) {
        structureResult.structRes.data.regionalReplacements = regionalResult;
        if (analysisStore.refAnalysis) {
            analysisStore.setRefAnalysis({
                ...analysisStore.refAnalysis,
                regionalReplacements: regionalResult
            });
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('All analysis tasks completed. Preparing to write...');
    generationStore.setGenerationStep('idle');
    return {
        productResult,
        structureResult,
        keywordPromise: Promise.resolve(keywordResult),
        visualPromise: Promise.resolve(visualResultsPromise),
        regionalPromise: Promise.resolve(regionalResult)
    };
};
}),
"[project]/src/hooks/generation/useContentGenerator.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runContentGeneration",
    ()=>runContentGeneration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useMetricsStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentGenerationService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentDisplayService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentDisplayService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/textUtils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/imageService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/generationLogger.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
const isStopped = ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().isStopped;
const runContentGeneration = async (config, analysisResults)=>{
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    const analysisStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState();
    const metricsStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMetricsStore"].getState();
    const { productResult, structureResult } = analysisResults;
    const parsedProductBrief = productResult?.brief;
    const productMappingData = productResult?.mapping || [];
    const refAnalysisData = structureResult?.structRes.data;
    const authAnalysisData = structureResult?.authRes.data;
    // 1. Determine Sections
    let sectionsToGenerate = [];
    let isUsingCustomOutline = false;
    if (config.sampleOutline && config.sampleOutline.trim().length > 0) {
        const lines = config.sampleOutline.split('\n').map((line)=>line.trim()).filter((line)=>line.length > 0);
        sectionsToGenerate = lines.map((title)=>({
                title
            }));
        isUsingCustomOutline = true;
    } else if (refAnalysisData?.structure && refAnalysisData.structure.length > 0) {
        sectionsToGenerate = [
            ...refAnalysisData.structure
        ]; // Clone to avoid mutating original
        // Inject Introduction if available
        if (refAnalysisData.introText && refAnalysisData.introText.trim().length > 0) {
            sectionsToGenerate.unshift({
                title: "前言",
                narrativePlan: [
                    refAnalysisData.introText
                ],
                subheadings: [],
                difficulty: 'easy'
            });
        }
        isUsingCustomOutline = false;
    } else {
        sectionsToGenerate = [
            {
                title: "Introduction"
            },
            {
                title: "Core Concepts"
            },
            {
                title: "Benefits"
            },
            {
                title: "Applications"
            },
            {
                title: "Conclusion"
            }
        ];
    }
    generationStore.setStatus('streaming');
    generationStore.setGenerationStep('writing_content');
    generationStore.setContent('');
    const headingOptimizations = analysisStore.headingOptimizations || [];
    const shouldUseHeadingAnalysis = !isUsingCustomOutline && headingOptimizations.length > 0;
    const resolveHeadingFromOptimizer = (title)=>{
        const normalizedTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHeadingText"])(title);
        if (!shouldUseHeadingAnalysis) return normalizedTitle;
        const candidate = headingOptimizations.find((opt)=>{
            const before = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHeadingText"])(opt.h2_before);
            const after = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHeadingText"])(opt.h2_after);
            return before === normalizedTitle || after === normalizedTitle;
        });
        if (!candidate) return normalizedTitle;
        // Pick the highest scoring option from the optimizer; fallback to the suggested H2.
        const scoredOptions = (candidate.h2_options || []).map((opt)=>({
                text: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHeadingText"])(opt.text || ''),
                score: typeof opt.score === 'number' ? opt.score : undefined
            })).filter((opt)=>opt.text && typeof opt.score === 'number').sort((a, b)=>(b.score ?? -Infinity) - (a.score ?? -Infinity));
        const fallback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHeadingText"])(candidate.h2_after || candidate.h2_before || normalizedTitle);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHeadingText"])(scoredOptions[0]?.text || fallback || normalizedTitle);
    };
    const sectionBodies = new Array(sectionsToGenerate.length).fill("");
    const sectionHeadings = sectionsToGenerate.map((s)=>resolveHeadingFromOptimizer(s.title));
    const legacyKeyPoints = [
        ...Array.isArray(refAnalysisData?.keyInformationPoints) ? refAnalysisData.keyInformationPoints : [],
        ...Array.isArray(refAnalysisData?.brandExclusivePoints) ? refAnalysisData.brandExclusivePoints : []
    ];
    const structuredKeyPoints = (refAnalysisData?.structure || []).flatMap((s)=>[
            ...Array.isArray(s?.keyFacts) ? s.keyFacts : [],
            ...Array.isArray(s?.uspNotes) ? s.uspNotes : []
        ]).filter(Boolean);
    const allKeyPoints = Array.from(new Set([
        ...structuredKeyPoints,
        ...legacyKeyPoints
    ])).filter(Boolean);
    const generatorConfig = {
        ...config,
        productBrief: parsedProductBrief,
        referenceAnalysis: refAnalysisData,
        authorityAnalysis: authAnalysisData
    };
    const shouldAutoPlanImages = Boolean(config.autoImagePlan);
    const getHeading = (idx)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHeadingText"])(sectionHeadings[idx] || sectionsToGenerate[idx]?.title || `Section ${idx + 1}`);
    const renderSectionBlock = (idx, bodyOverride)=>{
        const heading = getHeading(idx);
        const body = typeof bodyOverride === 'string' ? bodyOverride : sectionBodies[idx];
        if (body) return `## ${heading}\n\n${body}`;
        return `## ${heading}\n\n_(Writing...)_`;
    };
    const renderTurboSections = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentDisplayService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mergeTurboSections"])(sectionsToGenerate, sectionBodies.map((body, idx)=>body ? renderSectionBlock(idx, body) : ""));
    const renderProgressSections = ()=>sectionBodies.map((_, idx)=>renderSectionBlock(idx)).join('\n\n');
    const getKeywordPlans = ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState().keywordPlans || [];
    const outlineSourceLabel = isUsingCustomOutline ? `**User Custom Outline**` : `**AI Narrative Structure (Outline)**`;
    const initialDisplay = `> 📑 **Active Blueprint:** ${outlineSourceLabel}\n\n`;
    generationStore.setContent(initialDisplay);
    const promises = sectionsToGenerate.map(async (section, i)=>{
        if (isStopped()) return;
        const allTitles = sectionsToGenerate.map((s)=>s.title);
        const futureTitles = allTitles.slice(i + 1);
        const analysisPlan = refAnalysisData?.structure.find((s)=>s.title === section.title)?.narrativePlan;
        const specificPlan = section.specificPlan || analysisPlan;
        const sectionData = refAnalysisData?.structure.find((s)=>s.title === section.title);
        const sectionPoints = Array.from(new Set([
            ...Array.isArray(section.keyFacts) ? section.keyFacts : [],
            ...Array.isArray(section.uspNotes) ? section.uspNotes : [],
            ...Array.isArray(sectionData?.keyFacts) ? sectionData.keyFacts : [],
            ...Array.isArray(sectionData?.uspNotes) ? sectionData.uspNotes : [],
            ...allKeyPoints
        ])).filter(Boolean);
        const loopConfig = {
            ...generatorConfig,
            productMapping: productMappingData
        };
        const dummyPreviousContent = i > 0 ? [
            `[Preceding Section: ${allTitles[i - 1]}]`
        ] : [];
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateSectionContent"])(loopConfig, section.title, specificPlan, refAnalysisData?.generalPlan, getKeywordPlans(), dummyPreviousContent, futureTitles, authAnalysisData, sectionPoints, [], 0, section);
            if (!isStopped()) {
                sectionBodies[i] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripLeadingHeading"])(res.data.content);
                console.log(`[Timer - Turbo] Section '${section.title}': ${res.duration}ms`);
                generationStore.setContent(renderTurboSections());
                metricsStore.addCost(res.cost.totalCost, res.usage.totalTokens);
                if (res.data.usedPoints && res.data.usedPoints.length > 0) {
                    analysisStore.setCoveredPoints((prev)=>{
                        const newUnique = res.data.usedPoints.filter((p)=>!prev.includes(p));
                        return [
                            ...prev,
                            ...newUnique
                        ];
                    });
                }
            }
        } catch (err) {
            console.error(`Parallel gen error for ${section.title}`, err);
            sectionBodies[i] = ''; // Suppress error message in content
            generationStore.setContent(renderTurboSections());
        }
    });
    await Promise.all(promises);
    if (!isStopped()) {
        generationStore.setContent(renderProgressSections());
    // Auto-heading refinement disabled in favor of manual toolbar tool
    }
    if (!isStopped()) {
        if (shouldAutoPlanImages) {
            // --- IMAGE GENERATION PHASE ---
            generationStore.setGenerationStep('generating_images');
            const fullContent = sectionBodies.join('\n\n');
            try {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Planning visual assets...');
                const imagePlans = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["planImagesForArticle"])(fullContent, analysisStore.scrapedImages, config.targetAudience, analysisStore.visualStyle);
                console.log(`[Images] Planned ${imagePlans.data.length} images`);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Visual plan ready: ${imagePlans.data.length} images.`);
                metricsStore.addCost(imagePlans.cost.totalCost, imagePlans.usage.totalTokens);
                // Generate images in parallel (limit concurrency if needed, but for now all at once is fine for small batches)
                const imagePromises = imagePlans.data.map(async (plan)=>{
                    if (isStopped()) return;
                    try {
                        const label = plan.category || plan.insertAfter || plan.id;
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Generating image: ${label}...`);
                        const imgRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateImage"])(plan.generatedPrompt);
                        if (imgRes.data) {
                            // In a real app, you'd save this to a store or insert it into the content.
                            // For now, we'll just log it and maybe append it to the end or store it.
                            // TODO: Store generated images in a store for the UI to display or insert.
                            console.log(`[Images] Generated: ${plan.id}`);
                            metricsStore.addCost(imgRes.cost.totalCost, imgRes.usage.totalTokens);
                        }
                    } catch (e) {
                        console.error(`Failed to generate image ${plan.id}`, e);
                    }
                });
                await Promise.all(imagePromises);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Image generation completed.');
            } catch (e) {
                console.error("Image generation phase failed", e);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Image generation failed.');
            }
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Skipping auto image planning (manual only).');
        }
        // --- REGION LOCALIZATION skipped as requested ---
        generationStore.setGenerationStep('finalizing');
        // FIX: Ensure immediate completion so the content is visible under the modal
        generationStore.setStatus('completed');
        generationStore.setGenerationStep('idle');
    }
};
}),
"[project]/src/hooks/useGeneration.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGeneration",
    ()=>useGeneration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$resetGenerationState$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/resetGenerationState.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useAnalysisPipeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/useAnalysisPipeline.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useContentGenerator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/useContentGenerator.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
const runAnalysisOnly = async (config)=>{
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    // Reset State
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$resetGenerationState$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resetGenerationState"])();
    generationStore.setError(null);
    generationStore.setLastConfig(config);
    try {
        // 1. Analysis Phase
        const analysisResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useAnalysisPipeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["runAnalysisPipeline"])(config);
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().isStopped) return;
        generationStore.setAnalysisResults(analysisResults);
        generationStore.setStatus('analysis_ready');
        generationStore.setGenerationStep('idle');
    } catch (err) {
        console.error(err);
        generationStore.setError(err.message || "An unexpected error occurred during generation.");
        generationStore.setStatus('error');
        generationStore.setGenerationStep('idle');
    }
};
const runWritingPhase = async ()=>{
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    const analysisResults = generationStore.analysisResults;
    const config = generationStore.lastConfig;
    if (!analysisResults || !config) {
        generationStore.setError('尚未完成分析，無法生成段落。請先執行分析。');
        generationStore.setStatus('error');
        return;
    }
    // Check for accumulated analysis errors
    const missingData = [];
    if (!analysisResults.structureResult?.structRes?.data?.structure?.length) missingData.push('文章架構 (Structure)');
    if (!analysisResults.structureResult?.authRes?.data) missingData.push('權威分析 (Authority)');
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState().keywordPlans?.length) missingData.push('關鍵字規劃 (Keywords)');
    if (missingData.length > 0) {
        const confirmMsg = `偵測到部分分析資料缺失：\n${missingData.map((s)=>`- ${s}`).join('\n')}\n\n是否仍要嘗試生成？(選擇「取消」將重新執行分析)`;
        if (!window.confirm(confirmMsg)) {
            // User chose to retry analysis
            // We need to trigger analysis again. Since we can't easily call the mutation from here without passing it in,
            // we'll throw a special error or handle it in the component.
            // Ideally, we should just return here and let the user click "Generate" again, 
            // but to be helpful we can reset the status so they can click "Generate" immediately.
            generationStore.setStatus('idle');
            return;
        }
    }
    generationStore.setError(null);
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useContentGenerator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["runContentGeneration"])(config, analysisResults);
    } catch (err) {
        console.error(err);
        generationStore.setError(err?.message || '生成段落時發生錯誤，請重試。');
        generationStore.setStatus('error');
        generationStore.setGenerationStep('idle');
    }
};
const useGeneration = ()=>{
    const mutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: (config)=>runAnalysisOnly(config)
    });
    const writeMutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: ()=>runWritingPhase()
    });
    const generate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (config)=>{
        const genState = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
        const hasExistingAnalysis = !!genState.analysisResults;
        const hasExistingContent = (genState.content || '').trim().length > 0;
        if (hasExistingAnalysis || hasExistingContent) {
            const confirmed = window.confirm('已經有分析結果或內容，重新分析會覆蓋目前的資料，確定要繼續嗎？');
            if (!confirmed) return;
        }
        await mutation.mutateAsync(config);
    }, [
        mutation
    ]);
    const startWriting = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        await writeMutation.mutateAsync();
    }, [
        writeMutation
    ]);
    const stop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().stopGeneration();
    }, []);
    return {
        generate,
        startWriting,
        stop,
        status: mutation.status
    };
};
}),
"[project]/src/hooks/useAppAccess.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppAccess",
    ()=>useAppAccess
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
const ACCESS_KEY = 'app_access_granted';
const ACCESS_TS_KEY = 'app_access_granted_at';
const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
function useAppAccess() {
    const [isUnlocked, setIsUnlocked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const stored = undefined;
        const tsRaw = undefined;
    }, []);
    const unlock = ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        setIsUnlocked(true);
    };
    return {
        isUnlocked,
        unlock
    };
}
}),
"[project]/src/hooks/useContentScore.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useContentScore",
    ()=>useContentScore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAppStore.ts [app-ssr] (ecmascript)");
;
;
;
;
function useContentScore() {
    const generationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"])();
    const analysisStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"])();
    const { contentScore, setContentScore } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppStore"])();
    const structurePoints = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const structure = analysisStore.refAnalysis?.structure || [];
        const general = new Set();
        const brand = new Set();
        const legacyGeneral = Array.isArray(analysisStore.refAnalysis?.keyInformationPoints) ? analysisStore.refAnalysis?.keyInformationPoints : [];
        const legacyBrand = Array.isArray(analysisStore.refAnalysis?.brandExclusivePoints) ? analysisStore.refAnalysis?.brandExclusivePoints : [];
        legacyGeneral.forEach((p)=>{
            if (p) general.add(p);
        });
        legacyBrand.forEach((p)=>{
            if (p) brand.add(p);
        });
        structure.forEach((s)=>{
            (Array.isArray(s?.keyFacts) ? s.keyFacts : []).forEach((p)=>{
                if (p) general.add(p);
            });
            (Array.isArray(s?.uspNotes) ? s.uspNotes : []).forEach((p)=>{
                if (p) brand.add(p);
            });
        });
        return {
            general: Array.from(general),
            brand: Array.from(brand)
        };
    }, [
        analysisStore.refAnalysis
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!generationStore.content || generationStore.status === 'idle') {
            const baseScore = {
                value: 0,
                label: 'Start Writing',
                color: 'text-gray-300'
            };
            if (contentScore.value !== baseScore.value) {
                setContentScore(baseScore);
            }
            return;
        }
        let score = 0;
        let totalFactors = 0;
        if (analysisStore.keywordPlans.length > 0) {
            const contentLower = (generationStore.content || '').toLowerCase();
            const usedKeywords = analysisStore.keywordPlans.filter((k)=>k.word && contentLower.includes(k.word.toLowerCase()));
            const keywordRatio = usedKeywords.length / analysisStore.keywordPlans.length;
            score += keywordRatio * 50;
            totalFactors++;
        }
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
        const nextScore = {
            value: score,
            label,
            color
        };
        if (contentScore.value !== nextScore.value || contentScore.label !== nextScore.label) {
            setContentScore(nextScore);
        }
    }, [
        generationStore.content,
        analysisStore.keywordPlans,
        analysisStore.coveredPoints,
        analysisStore.refAnalysis,
        structurePoints,
        generationStore.status,
        contentScore.value,
        contentScore.label,
        setContentScore
    ]);
    return {
        structurePoints
    };
}
}),
"[project]/src/hooks/useAppHydration.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppHydration",
    ()=>useAppHydration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)");
;
;
;
function useAppHydration() {
    const generationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"])();
    const analysisStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"])();
    const restorePromptedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const hydratedAnalysisRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const persistedKeys = undefined;
        const hasPersisted = undefined;
        const shouldRestore = undefined;
    }, [
        analysisStore,
        generationStore
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const hasAnalysisState = undefined;
        const savedRaw = undefined;
        let saved;
        const title = undefined;
        const referenceContent = undefined;
        const restoredConfig = undefined;
    }, [
        analysisStore,
        generationStore
    ]);
}
}),
"[project]/src/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AppPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$InputForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/InputForm.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Preview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Preview.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SeoSidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SeoSidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Changelog$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Changelog.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PasswordGate$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PasswordGate.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useGeneration$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useGeneration.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/productFeatureToPainPointMapper.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionGroundingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/regionGroundingService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAppStore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SectionPlanModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SectionPlanModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SettingsModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SettingsModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppAccess$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAppAccess.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContentScore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useContentScore.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppHydration$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAppHydration.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
function AppPage() {
    const passwordHash = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>("TURBOPACK compile-time value", "8549a21a0ae3c2595e3736d2f90ac96ec0d2a390d6eacac74fa2c6ae1c40ea4f") || '', []);
    // Store & Hooks
    const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppStore"])();
    const generationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGenerationStore"])();
    const analysisStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAnalysisStore"])();
    const { isUnlocked, unlock } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppAccess$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppAccess"])();
    const { structurePoints } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContentScore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContentScore"])();
    const { generate, startWriting, stop } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useGeneration$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGeneration"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppHydration$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppHydration"])();
    const [isSearchingAlternatives, setIsSearchingAlternatives] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLocalizingPlan, setIsLocalizingPlan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Sidebar Auto-show
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (generationStore.status === 'analyzing' && !app.showSidebar) {
            app.setShowSidebar(true);
        }
    }, [
        generationStore.status,
        app
    ]);
    // Plan Modal Auto-show
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const hasStructure = Boolean(analysisStore.refAnalysis?.structure?.length);
        if (generationStore.status === 'analysis_ready' && hasStructure && !app.showPlanModal) {
            // Only show if we just finished analysis
            if (generationStore.generationStep === 'idle') {
                app.setShowPlanModal(true);
            }
        }
    }, [
        generationStore.status,
        generationStore.generationStep,
        analysisStore.refAnalysis?.structure,
        app
    ]);
    const handleLoadProfile = async (profile)=>{
        app.setActiveProfile(profile);
        analysisStore.setTargetAudience(profile.targetAudience);
        analysisStore.setBrandKnowledge(profile.brandKnowledge || '');
        if (profile.productRawText) {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseProductContext"])(profile.productRawText);
            analysisStore.setActiveProductBrief(res.data);
        }
    };
    const handleRemoveScrapedImage = (image)=>{
        const keyToMatch = image.id || image.url || image.altText;
        if (!keyToMatch) return;
        const updated = analysisStore.scrapedImages.map((img, idx)=>{
            const key = img.id || img.url || img.altText || `${idx}`;
            if (key !== keyToMatch) return img;
            return {
                ...img,
                ignored: !img.ignored
            };
        });
        analysisStore.setScrapedImages(updated);
    };
    const handleSearchLocalAlternatives = async ()=>{
        const refAnalysis = analysisStore.refAnalysis;
        if (!refAnalysis) return;
        const entities = [
            ...(refAnalysis.competitorBrands || []).map((b)=>({
                    text: b,
                    type: 'brand',
                    region: 'OTHER'
                })),
            ...(refAnalysis.competitorProducts || []).map((p)=>({
                    text: p,
                    type: 'service',
                    region: 'OTHER'
                }))
        ];
        if (entities.length === 0) return;
        setIsSearchingAlternatives(true);
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionGroundingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findRegionEquivalents"])(entities, analysisStore.targetAudience);
            app.addCost(result.cost.totalCost, result.usage.totalTokens);
            if (result.mappings.length > 0) {
                const existingReplacements = refAnalysis.regionalReplacements || [];
                const newReplacements = result.mappings.map((m)=>({
                        original: m.original,
                        replacement: m.regionEquivalent,
                        reason: m.context
                    }));
                const mergedReplacements = [
                    ...existingReplacements
                ];
                newReplacements.forEach((nr)=>{
                    if (!mergedReplacements.some((er)=>er.original === nr.original)) {
                        mergedReplacements.push(nr);
                    }
                });
                analysisStore.setRefAnalysis({
                    ...refAnalysis,
                    regionalReplacements: mergedReplacements
                });
            }
        } catch (error) {
            console.error('[App] Search local alternatives failed', error);
        } finally{
            setIsSearchingAlternatives(false);
        }
    };
    if (!isUnlocked) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PasswordGate$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PasswordGate"], {
            passwordHash: passwordHash,
            onUnlock: unlock
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 119,
            columnNumber: 16
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-screen overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Header"], {
                sessionCost: app.sessionCost,
                sessionTokens: app.sessionTokens,
                showInput: app.showInput,
                showSidebar: app.showSidebar,
                onToggleInput: app.toggleInput,
                onToggleSidebar: app.toggleSidebar,
                onToggleChangelog: ()=>app.setShowChangelog(true),
                onToggleSettings: ()=>app.setShowSettings(true),
                contentScore: app.contentScore,
                displayScale: app.displayScale,
                onDisplayScaleChange: app.setDisplayScale
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 124,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Changelog$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Changelog"], {
                isOpen: app.showChangelog,
                onClose: ()=>app.setShowChangelog(false)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 138,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SettingsModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SettingsModal"], {
                open: app.showSettings,
                onClose: ()=>app.setShowSettings(false)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 139,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)] min-h-0 bg-gray-100 p-4 gap-4",
                children: [
                    app.showInput && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col overflow-auto z-20 transition-all duration-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$InputForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InputForm"], {
                            onGenerate: generate,
                            onGenerateSections: startWriting,
                            isGenerating: generationStore.status === 'analyzing' || generationStore.status === 'streaming',
                            isWriting: generationStore.status === 'streaming',
                            canGenerateSections: generationStore.status === 'analysis_ready',
                            currentStep: generationStore.generationStep,
                            onAddCost: (cost, usage)=>app.addCost(cost.totalCost, usage.totalTokens),
                            savedProfiles: app.savedProfiles,
                            setSavedProfiles: app.setSavedProfiles,
                            activeProfile: app.activeProfile,
                            onSetActiveProfile: app.setActiveProfile,
                            inputType: app.inputType,
                            setInputType: app.setInputType,
                            brandKnowledge: analysisStore.brandKnowledge,
                            onShowPlan: ()=>app.setShowPlanModal(true),
                            hasPlan: Boolean(analysisStore.refAnalysis?.structure?.length)
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 144,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 143,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col min-h-0 relative overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Preview$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Preview"], {
                            content: generationStore.content,
                            status: generationStore.status,
                            error: generationStore.error,
                            generationStep: generationStore.generationStep,
                            coveredPoints: analysisStore.coveredPoints,
                            targetAudience: analysisStore.targetAudience,
                            scrapedImages: analysisStore.scrapedImages,
                            visualStyle: analysisStore.visualStyle,
                            onRemoveScrapedImage: handleRemoveScrapedImage,
                            onTogglePoint: (point)=>{
                                analysisStore.setCoveredPoints((prev)=>prev.includes(point) ? prev.filter((p)=>p !== point) : [
                                        ...prev,
                                        point
                                    ]);
                            },
                            onAddCost: (cost, usage)=>app.addCost(cost.totalCost, usage.totalTokens),
                            savedProfiles: app.savedProfiles,
                            onLoadProfile: handleLoadProfile,
                            onRequestUrlMode: ()=>app.setInputType('url'),
                            productBrief: analysisStore.activeProductBrief,
                            displayScale: app.displayScale,
                            articleTitle: analysisStore.articleTitle,
                            onTitleChange: analysisStore.setArticleTitle,
                            outlineSections: analysisStore.refAnalysis?.structure?.map((s)=>s.title) || [],
                            keyInformationPoints: structurePoints.general,
                            brandExclusivePoints: structurePoints.brand
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 166,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 165,
                        columnNumber: 17
                    }, this),
                    app.showSidebar && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "hidden lg:flex w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex-col overflow-auto z-10 transition-all duration-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SeoSidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SeoSidebar"], {
                            keywordPlans: analysisStore.keywordPlans,
                            referenceAnalysis: analysisStore.refAnalysis,
                            authorityAnalysis: analysisStore.authAnalysis,
                            productMapping: analysisStore.productMapping,
                            productBrief: analysisStore.activeProductBrief,
                            headingOptimizations: analysisStore.headingOptimizations,
                            targetAudience: analysisStore.targetAudience,
                            languageInstruction: analysisStore.languageInstruction,
                            isLoading: generationStore.status === 'analyzing',
                            status: generationStore.status,
                            onStop: stop,
                            brandKnowledge: analysisStore.brandKnowledge,
                            setBrandKnowledge: analysisStore.setBrandKnowledge,
                            displayScale: app.displayScale,
                            onSearchLocalAlternatives: handleSearchLocalAlternatives,
                            isSearchingAlternatives: isSearchingAlternatives
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 197,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 196,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 141,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SectionPlanModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SectionPlanModal"], {
                open: app.showPlanModal,
                onClose: ()=>app.setShowPlanModal(false),
                sections: analysisStore.refAnalysis?.structure || [],
                generalPlan: analysisStore.refAnalysis?.generalPlan,
                conversionPlan: analysisStore.refAnalysis?.conversionPlan,
                regionalReplacements: analysisStore.refAnalysis?.regionalReplacements,
                localizedSections: analysisStore.localizedRefAnalysis?.structure,
                localizedGeneralPlan: analysisStore.localizedRefAnalysis?.generalPlan,
                localizedConversionPlan: analysisStore.localizedRefAnalysis?.conversionPlan,
                onSavePlan: (updated)=>{
                    const current = analysisStore.refAnalysis;
                    if (!current) return;
                    analysisStore.setRefAnalysis({
                        ...current,
                        structure: updated
                    });
                },
                onLocalizeAll: async ()=>{
                    const current = analysisStore.refAnalysis;
                    if (!current || !current.regionalReplacements?.length) return;
                    setIsLocalizingPlan(true);
                    try {
                        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionGroundingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localizePlanWithAI"])({
                            generalPlan: current.generalPlan || [],
                            conversionPlan: current.conversionPlan || [],
                            sections: current.structure.map((s)=>({
                                    title: s.title,
                                    narrativePlan: s.narrativePlan,
                                    keyFacts: s.keyFacts,
                                    uspNotes: s.uspNotes,
                                    subheadings: s.subheadings
                                }))
                        }, current.regionalReplacements, analysisStore.targetAudience);
                        app.addCost(result.cost.totalCost, result.usage.totalTokens);
                        const localizedStructure = current.structure.map((original, idx)=>({
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
                            conversionPlan: result.localizedConversionPlan
                        });
                    } catch (error) {
                        console.error('[App] AI Plan localization failed', error);
                    } finally{
                        setIsLocalizingPlan(false);
                    }
                },
                isLocalizing: isLocalizingPlan,
                onStartWriting: (selected)=>{
                    const current = analysisStore.refAnalysis;
                    if (current) analysisStore.setRefAnalysis({
                        ...current,
                        structure: selected
                    });
                    app.setShowPlanModal(false);
                    startWriting();
                },
                onSaveReplacements: (editedItems)=>{
                    const current = analysisStore.refAnalysis;
                    if (!current) return;
                    analysisStore.setRefAnalysis({
                        ...current,
                        regionalReplacements: editedItems.filter((i)=>i.action !== 'keep').map((i)=>({
                                original: i.original,
                                replacement: i.action === 'delete' ? '' : i.customReplacement || i.replacement,
                                reason: i.reason
                            }))
                    });
                }
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 219,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 123,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=src_48c633f0._.js.map