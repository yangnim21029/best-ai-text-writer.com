(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/config/constants.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("src/config/constants.ts")}`;
    }
};
const env = ("TURBOPACK compile-time value", "object") !== 'undefined' && __TURBOPACK__import$2e$meta__.env ? __TURBOPACK__import$2e$meta__.env : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env;
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useAppStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppStore",
    ()=>useAppStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-client] (ecmascript)");
;
;
;
const useAppStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
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
        modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
        modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
        keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
        minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
        maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"],
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
                modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
                modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
                keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
                minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
                maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"]
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
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage)
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useSettingsStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSettingsStore",
    ()=>useSettingsStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-client] (ecmascript)");
;
;
;
const useSettingsStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
        modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
        keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
        minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
        maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"],
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
                modelFlash: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].FLASH,
                modelImage: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
                keywordCharDivisor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KEYWORD_CHAR_DIVISOR"],
                minKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MIN_KEYWORDS"],
                maxKeywords: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"]
            })
    }), {
    name: 'pro_content_writer_settings',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage)
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useGenerationStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGenerationStore",
    ()=>useGenerationStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const useGenerationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
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
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    partialize: (state)=>({
            content: state.content
        })
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useAnalysisStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAnalysisStore",
    ()=>useAnalysisStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const useAnalysisStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
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
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useMetricsStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMetricsStore",
    ()=>useMetricsStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const useMetricsStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
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
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useUiStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUiStore",
    ()=>useUiStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
const useUiStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
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
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    partialize: (state)=>({
            showInput: state.showInput,
            showSidebar: state.showSidebar,
            inputType: state.inputType,
            displayScale: state.displayScale
        })
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/resetGenerationState.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resetGenerationState",
    ()=>resetGenerationState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useMetricsStore.ts [app-client] (ecmascript)");
;
;
;
const resetGenerationState = ()=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().resetGeneration();
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMetricsStore"].getState().resetSessionStats();
    // Clear editor autosave so a fresh analysis doesn't resurrect stale drafts
    if ("TURBOPACK compile-time truthy", 1) {
        try {
            localStorage.removeItem('ai_writer_editor_autosave_v1');
        } catch (e) {
            console.warn('Failed to clear editor autosave', e);
        }
    }
    const analysis = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState();
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/imageUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/cn.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
const cn = (...inputs)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/logger.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/textUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/schemas/formSchema.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "articleFormSchema",
    ()=>articleFormSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
;
const articleFormSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Topic is required"),
    referenceContent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(50, "Reference content must be at least 50 characters"),
    sampleOutline: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    authorityTerms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    websiteType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    targetAudience: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'zh-TW',
        'zh-HK',
        'zh-MY'
    ]),
    useRag: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    autoImagePlan: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    productRawText: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // UI-only fields that might need validation if used
    urlInput: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url("Invalid URL").optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
    productUrlList: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AppPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Header.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$InputForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/InputForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Preview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Preview.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SeoSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SeoSidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Changelog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Changelog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PasswordGate$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PasswordGate.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useGeneration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useGeneration.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/productFeatureToPainPointMapper.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionGroundingService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/regionGroundingService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAppStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SectionPlanModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SectionPlanModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SettingsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SettingsModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppAccess$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAppAccess.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContentScore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useContentScore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppHydration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAppHydration.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
function AppPage() {
    _s();
    const passwordHash = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AppPage.useMemo[passwordHash]": ()=>("TURBOPACK compile-time value", "8549a21a0ae3c2595e3736d2f90ac96ec0d2a390d6eacac74fa2c6ae1c40ea4f") || ''
    }["AppPage.useMemo[passwordHash]"], []);
    // Store & Hooks
    const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"])();
    const generationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"])();
    const analysisStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalysisStore"])();
    const { isUnlocked, unlock } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppAccess$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppAccess"])();
    const { structurePoints } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContentScore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContentScore"])();
    const { generate, startWriting, stop } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useGeneration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGeneration"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppHydration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppHydration"])();
    const [isSearchingAlternatives, setIsSearchingAlternatives] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLocalizingPlan, setIsLocalizingPlan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Sidebar Auto-show
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppPage.useEffect": ()=>{
            if (generationStore.status === 'analyzing' && !app.showSidebar) {
                app.setShowSidebar(true);
            }
        }
    }["AppPage.useEffect"], [
        generationStore.status,
        app
    ]);
    // Plan Modal Auto-show
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppPage.useEffect": ()=>{
            const hasStructure = Boolean(analysisStore.refAnalysis?.structure?.length);
            if (generationStore.status === 'analysis_ready' && hasStructure && !app.showPlanModal) {
                // Only show if we just finished analysis
                if (generationStore.generationStep === 'idle') {
                    app.setShowPlanModal(true);
                }
            }
        }
    }["AppPage.useEffect"], [
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
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseProductContext"])(profile.productRawText);
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
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionGroundingService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findRegionEquivalents"])(entities, analysisStore.targetAudience);
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PasswordGate$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PasswordGate"], {
            passwordHash: passwordHash,
            onUnlock: unlock
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 119,
            columnNumber: 16
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-screen overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Header"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Changelog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Changelog"], {
                isOpen: app.showChangelog,
                onClose: ()=>app.setShowChangelog(false)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 138,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SettingsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SettingsModal"], {
                open: app.showSettings,
                onClose: ()=>app.setShowSettings(false)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 139,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)] min-h-0 bg-gray-100 p-4 gap-4",
                children: [
                    app.showInput && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col overflow-auto z-20 transition-all duration-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$InputForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InputForm"], {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col min-h-0 relative overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Preview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Preview"], {
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
                    app.showSidebar && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "hidden lg:flex w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex-col overflow-auto z-10 transition-all duration-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SeoSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SeoSidebar"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SectionPlanModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SectionPlanModal"], {
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
                        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionGroundingService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localizePlanWithAI"])({
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
_s(AppPage, "3oktCGdgfS1cQx4lUouGknZYtEw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalysisStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppAccess$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppAccess"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useContentScore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContentScore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useGeneration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGeneration"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAppHydration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppHydration"]
    ];
});
_c = AppPage;
var _c;
__turbopack_context__.k.register(_c, "AppPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_c6fe0786._.js.map