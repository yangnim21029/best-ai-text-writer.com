(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/hooks/useUrlScraper.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUrlScraper",
    ()=>useUrlScraper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$webScraper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/webScraper.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/referenceAnalysisService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$imageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/imageUtils.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
const useUrlScraper = ({ setValue, onAddCost, setInputType })=>{
    _s();
    const [scrapedImages, setScrapedImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const mutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useUrlScraper.useMutation[mutation]": async (url)=>{
                if (!url) throw new Error('URL is required');
                const { title, content, images } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$webScraper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchUrlContent"])(url);
                return {
                    title,
                    content,
                    images
                };
            }
        }["useUrlScraper.useMutation[mutation]"],
        onSuccess: {
            "useUrlScraper.useMutation[mutation]": async ({ title, content, images })=>{
                setValue('referenceContent', content);
                setScrapedImages((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$imageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dedupeScrapedImages"])(images));
                if (title) setValue('title', title);
                try {
                    const brandRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractWebsiteTypeAndTerm"])(content);
                    if (brandRes.data.websiteType) setValue('websiteType', brandRes.data.websiteType);
                    if (brandRes.data.authorityTerms) setValue('authorityTerms', brandRes.data.authorityTerms);
                    if (onAddCost) onAddCost(brandRes.cost, brandRes.usage);
                } catch (aiError) {
                    console.warn('Failed to auto-extract brand info', aiError);
                }
                setInputType('text');
            }
        }["useUrlScraper.useMutation[mutation]"],
        onError: {
            "useUrlScraper.useMutation[mutation]": ()=>{
                alert('Failed to fetch content from URL. The site might block bots.');
            }
        }["useUrlScraper.useMutation[mutation]"]
    });
    const fetchAndPopulate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useUrlScraper.useCallback[fetchAndPopulate]": async (url)=>{
            await mutation.mutateAsync(url);
        }
    }["useUrlScraper.useCallback[fetchAndPopulate]"], [
        mutation
    ]);
    return {
        scrapedImages,
        setScrapedImages,
        isFetchingUrl: mutation.isPending,
        fetchAndPopulate
    };
};
_s(useUrlScraper, "TSJvN/brxLsdVBGvszfPTOnG9Ec=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useProfileManager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProfileManager",
    ()=>useProfileManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const useProfileManager = ({ savedProfiles = [], setSavedProfiles, activeProfile, onSetActiveProfile, brandKnowledge, setValue })=>{
    _s();
    const createProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileManager.useCallback[createProfile]": (name, values)=>{
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
        }
    }["useProfileManager.useCallback[createProfile]"], [
        brandKnowledge,
        onSetActiveProfile,
        savedProfiles,
        setSavedProfiles
    ]);
    const updateProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileManager.useCallback[updateProfile]": (values)=>{
            if (!setSavedProfiles || !activeProfile) return null;
            const updatedProfiles = savedProfiles.map({
                "useProfileManager.useCallback[updateProfile].updatedProfiles": (p)=>p.id === activeProfile.id ? {
                        ...p,
                        websiteType: values.websiteType || '',
                        authorityTerms: values.authorityTerms || '',
                        targetAudience: values.targetAudience,
                        useRag: values.useRag,
                        productRawText: values.productRawText,
                        brandKnowledge: brandKnowledge
                    } : p
            }["useProfileManager.useCallback[updateProfile].updatedProfiles"]);
            setSavedProfiles(updatedProfiles);
            const updatedActive = updatedProfiles.find({
                "useProfileManager.useCallback[updateProfile]": (p)=>p.id === activeProfile.id
            }["useProfileManager.useCallback[updateProfile]"]) || null;
            onSetActiveProfile?.(updatedActive);
            return updatedActive;
        }
    }["useProfileManager.useCallback[updateProfile]"], [
        activeProfile,
        brandKnowledge,
        onSetActiveProfile,
        savedProfiles,
        setSavedProfiles
    ]);
    const deleteProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileManager.useCallback[deleteProfile]": (id)=>{
            if (!setSavedProfiles) return;
            const updatedProfiles = savedProfiles.filter({
                "useProfileManager.useCallback[deleteProfile].updatedProfiles": (p)=>p.id !== id
            }["useProfileManager.useCallback[deleteProfile].updatedProfiles"]);
            setSavedProfiles(updatedProfiles);
            if (activeProfile?.id === id) {
                onSetActiveProfile?.(null);
            }
        }
    }["useProfileManager.useCallback[deleteProfile]"], [
        activeProfile?.id,
        onSetActiveProfile,
        savedProfiles,
        setSavedProfiles
    ]);
    const applyProfileToForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileManager.useCallback[applyProfileToForm]": (profile)=>{
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
        }
    }["useProfileManager.useCallback[applyProfileToForm]"], [
        onSetActiveProfile,
        setValue
    ]);
    const loadProductFromProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useProfileManager.useCallback[loadProductFromProfile]": (profile)=>{
            if (profile.productRawText) {
                setValue('productRawText', profile.productRawText);
            } else if (profile.productBrief) {
                setValue('productRawText', `${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`);
            } else {
                alert('This profile has no saved product/service details.');
            }
        }
    }["useProfileManager.useCallback[loadProductFromProfile]"], [
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
_s(useProfileManager, "p4JIC/BonLf8bDUOcP0Eji2Ck2k=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useStorageReset.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            const keys = [
                ...CLEAR_KEYS
            ];
            if (includeForm) keys.push('pro_content_writer_inputs_simple_v4');
            keys.forEach((k)=>localStorage.removeItem(k));
            sessionStorage.removeItem('autosave_restore_decision');
        } catch (e) {
            console.warn('Failed to clear storage', e);
        }
        if (reload) window.location.reload();
    };
    return {
        clearAll
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useArticleForm.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useArticleForm",
    ()=>useArticleForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hook-form/dist/index.esm.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@hookform/resolvers/zod/dist/zod.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$schemas$2f$formSchema$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/schemas/formSchema.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUrlScraper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useUrlScraper.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProfileManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useProfileManager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStorageReset$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useStorageReset.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$imageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/imageUtils.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
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
    _s();
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useForm"])({
        resolver: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["zodResolver"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$schemas$2f$formSchema$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["articleFormSchema"]),
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
    const [productMode, setProductMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('text');
    const [isSummarizingProduct, setIsSummarizingProduct] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [refCharCount, setRefCharCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [refWordCount, setRefWordCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const { clearAll } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStorageReset$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStorageReset"])();
    const { scrapedImages, setScrapedImages, isFetchingUrl, fetchAndPopulate } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUrlScraper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUrlScraper"])({
        setValue,
        setInputType
    });
    const { createProfile, updateProfile, deleteProfile, applyProfileToForm, loadProductFromProfile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProfileManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileManager"])({
        savedProfiles,
        setSavedProfiles,
        activeProfile,
        onSetActiveProfile,
        brandKnowledge,
        setValue
    });
    // Restore persisted form
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useArticleForm.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    Object.keys(parsed).forEach({
                        "useArticleForm.useEffect": (key)=>{
                            // @ts-ignore
                            setValue(key, parsed[key]);
                        }
                    }["useArticleForm.useEffect"]);
                    if (parsed.scrapedImages) setScrapedImages((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$imageUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dedupeScrapedImages"])(parsed.scrapedImages));
                } catch (e) {
                    console.warn('Failed to restore persisted form', e);
                }
            }
        }
    }["useArticleForm.useEffect"], [
        setScrapedImages,
        setValue
    ]);
    // Persist + counts
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useArticleForm.useEffect": ()=>{
            const subscription = watch({
                "useArticleForm.useEffect.subscription": (values)=>{
                    const dataToSave = {
                        ...values,
                        scrapedImages
                    };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
                    const content = values.referenceContent || '';
                    setRefCharCount(content.length);
                    const cjkCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
                    const nonCjkText = content.replace(/[\u4e00-\u9fa5]/g, ' ');
                    const englishWords = nonCjkText.trim().split(/\s+/).filter({
                        "useArticleForm.useEffect.subscription.englishWords": (w)=>w.length > 0
                    }["useArticleForm.useEffect.subscription.englishWords"]);
                    setRefWordCount(cjkCount + englishWords.length);
                }
            }["useArticleForm.useEffect.subscription"]);
            return ({
                "useArticleForm.useEffect": ()=>subscription.unsubscribe()
            })["useArticleForm.useEffect"];
        }
    }["useArticleForm.useEffect"], [
        scrapedImages,
        watch
    ]);
    // Apply active profile
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useArticleForm.useEffect": ()=>{
            if (activeProfile) {
                applyProfileToForm(activeProfile);
            }
        }
    }["useArticleForm.useEffect"], [
        activeProfile,
        applyProfileToForm
    ]);
    const usableImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useArticleForm.useMemo[usableImages]": ()=>scrapedImages.filter({
                "useArticleForm.useMemo[usableImages]": (img)=>!img.ignored
            }["useArticleForm.useMemo[usableImages]"])
    }["useArticleForm.useMemo[usableImages]"], [
        scrapedImages
    ]);
    const handleClear = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useArticleForm.useCallback[handleClear]": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            if (!confirm('確定要清空所有輸入與紀錄嗎？\n這會重置表單、分析與草稿，並重新整理頁面。')) return;
            reset();
            setScrapedImages([]);
            setValue('targetAudience', 'zh-TW');
            clearAll({
                reload: true,
                includeForm: true
            });
        }
    }["useArticleForm.useCallback[handleClear]"], [
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
_s(useArticleForm, "JCmUE1JaCXKnh2NIv5tBUck7Mt8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useForm"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStorageReset$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStorageReset"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useUrlScraper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUrlScraper"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useProfileManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProfileManager"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useSemanticFilter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSemanticFilter",
    ()=>useSemanticFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/embeddingService.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
const DEFAULT_SEMANTIC_THRESHOLD = 0.79;
const splitIntoBlankLineChunks = (content)=>content.split(/\n\s*\n+/).map((chunk)=>chunk.trim()).filter(Boolean);
const useSemanticFilter = ()=>{
    _s();
    const [isChunkModalOpen, setIsChunkModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [chunkPreview, setChunkPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isFilteringChunks, setIsFilteringChunks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [filterError, setFilterError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [chunkScores, setChunkScores] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isScoringChunks, setIsScoringChunks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [manualKeep, setManualKeep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [semanticThreshold, setSemanticThreshold] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_SEMANTIC_THRESHOLD);
    const [semanticThresholdInput, setSemanticThresholdInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_SEMANTIC_THRESHOLD.toString());
    const commitSemanticThreshold = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSemanticFilter.useCallback[commitSemanticThreshold]": (raw)=>{
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
        }
    }["useSemanticFilter.useCallback[commitSemanticThreshold]"], [
        semanticThresholdInput,
        semanticThreshold
    ]);
    const scoreChunks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSemanticFilter.useCallback[scoreChunks]": async (chunks, title)=>{
            if (!title) {
                setFilterError('請先填寫標題，再計算語意距離。');
                return null;
            }
            setIsScoringChunks(true);
            setFilterError(null);
            try {
                const [titleEmbeddings, chunkEmbeddings] = await Promise.all([
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["embedTexts"])([
                        title
                    ]),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["embedTexts"])(chunks)
                ]);
                const titleEmbedding = titleEmbeddings[0];
                if (!titleEmbedding?.length) {
                    throw new Error('無法取得標題向量，請稍後再試。');
                }
                const similarities = chunks.map({
                    "useSemanticFilter.useCallback[scoreChunks].similarities": (chunk, idx)=>{
                        const chunkEmbedding = chunkEmbeddings[idx];
                        if (!chunkEmbedding?.length) return 1;
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cosineSimilarity"])(titleEmbedding, chunkEmbedding);
                    }
                }["useSemanticFilter.useCallback[scoreChunks].similarities"]);
                setChunkScores(similarities);
                return similarities;
            } catch (error) {
                setFilterError(error?.message || '語意過濾失敗，請稍後再試。');
                return null;
            } finally{
                setIsScoringChunks(false);
            }
        }
    }["useSemanticFilter.useCallback[scoreChunks]"], []);
    const openFilterModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSemanticFilter.useCallback[openFilterModal]": (content, title)=>{
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
        }
    }["useSemanticFilter.useCallback[openFilterModal]"], [
        scoreChunks
    ]);
    const applyFilter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSemanticFilter.useCallback[applyFilter]": async (content, title)=>{
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
                const keptChunks = chunks.filter({
                    "useSemanticFilter.useCallback[applyFilter].keptChunks": (chunk, idx)=>{
                        const similarity = computedScores[idx] ?? 1;
                        const forcedKeep = manualKeep[idx];
                        return forcedKeep || similarity >= semanticThreshold;
                    }
                }["useSemanticFilter.useCallback[applyFilter].keptChunks"]);
                const filteredContent = keptChunks.join('\n\n').trim();
                setIsChunkModalOpen(false);
                return filteredContent;
            } catch (error) {
                setFilterError(error?.message || '語意過濾失敗，請稍後再試。');
                return null;
            } finally{
                setIsFilteringChunks(false);
            }
        }
    }["useSemanticFilter.useCallback[applyFilter]"], [
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
_s(useSemanticFilter, "JsEzasIzkiAGpG+To1VuTXIUOz0=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useImageEditor.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useImageEditor",
    ()=>useImageEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/imageService.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
const useImageEditor = ({ editorRef, tiptapApi, imageContainerRef, targetAudience, visualStyle, scrapedImages, onAddCost, handleInput, saveSelection, restoreSelection })=>{
    _s();
    const [showImageModal, setShowImageModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imagePrompt, setImagePrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isImageLoading, setIsImageLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isDownloadingImages, setIsDownloadingImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [imagePlans, setImagePlans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isPlanning, setIsPlanning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isBatchProcessing, setIsBatchProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const openImageModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[openImageModal]": async ()=>{
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
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateImagePromptFromContext"])(contextText, targetAudience, visualStyle || '');
                setImagePrompt(res.data);
                onAddCost?.(res.cost, res.usage);
            } catch (e) {
                setImagePrompt('Create a realistic image relevant to this article.');
            } finally{
                setIsImageLoading(false);
            }
        }
    }["useImageEditor.useCallback[openImageModal]"], [
        editorRef,
        onAddCost,
        saveSelection,
        targetAudience,
        visualStyle
    ]);
    const generateImageFromPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[generateImageFromPrompt]": async (prompt)=>{
            if (!prompt) return;
            setIsImageLoading(true);
            try {
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateImage"])(prompt);
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
        }
    }["useImageEditor.useCallback[generateImageFromPrompt]"], [
        editorRef,
        handleInput,
        onAddCost,
        restoreSelection
    ]);
    const downloadImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[downloadImages]": async ()=>{
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
                    await new Promise({
                        "useImageEditor.useCallback[downloadImages]": (r)=>setTimeout(r, 200)
                    }["useImageEditor.useCallback[downloadImages]"]);
                }
            } catch (e) {
                console.error('Download failed', e);
                alert('Some images could not be downloaded.');
            } finally{
                document.body.removeChild(downloadLink);
                setIsDownloadingImages(false);
            }
        }
    }["useImageEditor.useCallback[downloadImages]"], [
        editorRef
    ]);
    const updatePlanPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[updatePlanPrompt]": (id, newPrompt)=>{
            setImagePlans({
                "useImageEditor.useCallback[updatePlanPrompt]": (prev)=>prev.map({
                        "useImageEditor.useCallback[updatePlanPrompt]": (p)=>p.id === id ? {
                                ...p,
                                generatedPrompt: newPrompt
                            } : p
                    }["useImageEditor.useCallback[updatePlanPrompt]"])
            }["useImageEditor.useCallback[updatePlanPrompt]"]);
        }
    }["useImageEditor.useCallback[updatePlanPrompt]"], []);
    const injectImageIntoEditor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[injectImageIntoEditor]": (plan, method = 'auto')=>{
            if (!plan.url) return;
            const imgHtml = `<img src="${plan.url}" alt="${plan.generatedPrompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;
            const anchorText = plan.insertAfter?.trim() || '';
            const tryInjectByAnchor = {
                "useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor": (html, replaceFn)=>{
                    const insertAt = {
                        "useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor.insertAt": (target)=>{
                            if (!target || !html.includes(target)) return false;
                            replaceFn(html.replace(target, `${target}<br/>${imgHtml}`));
                            return true;
                        }
                    }["useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor.insertAt"];
                    if (insertAt(anchorText)) return true;
                    const chunks = anchorText.split(/[，,。.\n\t\s、：:]+/).filter({
                        "useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor.chunks": (c)=>c.length >= 4
                    }["useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor.chunks"]).sort({
                        "useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor.chunks": (a, b)=>b.length - a.length
                    }["useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor.chunks"]);
                    for (const chunk of chunks){
                        if (insertAt(chunk)) return true;
                    }
                    return false;
                }
            }["useImageEditor.useCallback[injectImageIntoEditor].tryInjectByAnchor"];
            if (tiptapApi) {
                const insertAtSelection = {
                    "useImageEditor.useCallback[injectImageIntoEditor].insertAtSelection": ()=>tiptapApi.insertImage(plan.url, plan.generatedPrompt)
                }["useImageEditor.useCallback[injectImageIntoEditor].insertAtSelection"];
                if (method === 'cursor' || !anchorText || !tiptapApi.getHtml || !tiptapApi.setHtml) {
                    insertAtSelection();
                    return;
                }
                const html = tiptapApi.getHtml();
                const injected = tryInjectByAnchor(html, {
                    "useImageEditor.useCallback[injectImageIntoEditor].injected": (nextHtml)=>tiptapApi.setHtml(nextHtml)
                }["useImageEditor.useCallback[injectImageIntoEditor].injected"]);
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
            const injected = tryInjectByAnchor(currentHtml, {
                "useImageEditor.useCallback[injectImageIntoEditor].injected": (nextHtml)=>{
                    editorRef.current.innerHTML = nextHtml;
                    handleInput({
                        currentTarget: editorRef.current
                    });
                }
            }["useImageEditor.useCallback[injectImageIntoEditor].injected"]);
            if (!injected) {
                alert(`Could not find anchor: "...${anchorText.substring(0, 15)}...". \n\nPlease place your cursor in the text and click the "Cursor" button to insert manually.`);
            }
        }
    }["useImageEditor.useCallback[injectImageIntoEditor]"], [
        editorRef,
        handleInput,
        restoreSelection,
        tiptapApi
    ]);
    const generateSinglePlan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[generateSinglePlan]": async (plan)=>{
            if (plan.status === 'generating') return;
            setImagePlans({
                "useImageEditor.useCallback[generateSinglePlan]": (prev)=>prev.map({
                        "useImageEditor.useCallback[generateSinglePlan]": (p)=>p.id === plan.id ? {
                                ...p,
                                status: 'generating'
                            } : p
                    }["useImageEditor.useCallback[generateSinglePlan]"])
            }["useImageEditor.useCallback[generateSinglePlan]"]);
            try {
                const imgRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateImage"])(plan.generatedPrompt);
                if (imgRes.data) {
                    const updatedPlan = {
                        ...plan,
                        status: 'done',
                        url: imgRes.data || undefined
                    };
                    setImagePlans({
                        "useImageEditor.useCallback[generateSinglePlan]": (prev)=>prev.map({
                                "useImageEditor.useCallback[generateSinglePlan]": (p)=>p.id === plan.id ? updatedPlan : p
                            }["useImageEditor.useCallback[generateSinglePlan]"])
                    }["useImageEditor.useCallback[generateSinglePlan]"]);
                    onAddCost?.(imgRes.cost, imgRes.usage);
                } else {
                    setImagePlans({
                        "useImageEditor.useCallback[generateSinglePlan]": (prev)=>prev.map({
                                "useImageEditor.useCallback[generateSinglePlan]": (p)=>p.id === plan.id ? {
                                        ...p,
                                        status: 'error'
                                    } : p
                            }["useImageEditor.useCallback[generateSinglePlan]"])
                    }["useImageEditor.useCallback[generateSinglePlan]"]);
                }
            } catch (e) {
                console.error('Single generation failed', e);
                setImagePlans({
                    "useImageEditor.useCallback[generateSinglePlan]": (prev)=>prev.map({
                            "useImageEditor.useCallback[generateSinglePlan]": (p)=>p.id === plan.id ? {
                                    ...p,
                                    status: 'error'
                                } : p
                        }["useImageEditor.useCallback[generateSinglePlan]"])
                }["useImageEditor.useCallback[generateSinglePlan]"]);
            }
        }
    }["useImageEditor.useCallback[generateSinglePlan]"], [
        onAddCost
    ]);
    const handleBatchProcess = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[handleBatchProcess]": async ()=>{
            if (isBatchProcessing) return;
            setIsBatchProcessing(true);
            const plansToProcess = imagePlans.filter({
                "useImageEditor.useCallback[handleBatchProcess].plansToProcess": (p)=>p.status !== 'done'
            }["useImageEditor.useCallback[handleBatchProcess].plansToProcess"]);
            const promises = plansToProcess.map({
                "useImageEditor.useCallback[handleBatchProcess].promises": (plan)=>generateSinglePlan(plan)
            }["useImageEditor.useCallback[handleBatchProcess].promises"]);
            await Promise.all(promises);
            setIsBatchProcessing(false);
        }
    }["useImageEditor.useCallback[handleBatchProcess]"], [
        generateSinglePlan,
        imagePlans,
        isBatchProcessing
    ]);
    const autoPlanImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useImageEditor.useCallback[autoPlanImages]": async ()=>{
            const getContent = {
                "useImageEditor.useCallback[autoPlanImages].getContent": ()=>{
                    if (tiptapApi?.getPlainText) return tiptapApi.getPlainText();
                    return editorRef.current?.innerText || '';
                }
            }["useImageEditor.useCallback[autoPlanImages].getContent"];
            if (isPlanning) return;
            setIsPlanning(true);
            try {
                const content = getContent();
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["planImagesForArticle"])(content, scrapedImages, targetAudience, visualStyle || '');
                setImagePlans(res.data);
                onAddCost?.(res.cost, res.usage);
            } catch (e) {
                console.error('Auto-plan failed', e);
                alert('Failed to plan images.');
            } finally{
                setIsPlanning(false);
            }
        }
    }["useImageEditor.useCallback[autoPlanImages]"], [
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
_s(useImageEditor, "FKF5VmbOkxlt08t8QEm6WFRcIHU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useMetaGenerator.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMetaGenerator",
    ()=>useMetaGenerator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentGenerationService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
;
const useMetaGenerator = ({ editorRef, tiptapApi, targetAudience, context, onAddCost, onMetaGenerated })=>{
    _s();
    const [metaTitle, setMetaTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [metaDescription, setMetaDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [urlSlug, setUrlSlug] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isMetaLoading, setIsMetaLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const generateMeta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMetaGenerator.useCallback[generateMeta]": async ()=>{
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
                const metaPrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["promptTemplates"].metaSeo({
                    targetAudience,
                    contextLines,
                    articlePreview: articleText
                });
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSnippet"])(metaPrompt, targetAudience, {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                        properties: {
                            title: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            description: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            slug: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Type"].STRING
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
        }
    }["useMetaGenerator.useCallback[generateMeta]"], [
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
_s(useMetaGenerator, "aDsigj8NIrJuv+3QfohpWaSB1kE=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useAskAi.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAskAi",
    ()=>useAskAi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$marked$2f$lib$2f$marked$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/marked/lib/marked.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentGenerationService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
;
const useAskAi = ({ tiptapApi, targetAudience, onAddCost, setIsAiLoading, updateCountsFromText, onChange })=>{
    _s();
    const askAiRangesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const lastRangeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastActionModeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pendingCountRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const clearAskAiState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAskAi.useCallback[clearAskAiState]": ()=>{
            // Keep other task highlights; only clear generic marks if no task is specified.
            lastActionModeRef.current = null;
        }
    }["useAskAi.useCallback[clearAskAiState]"], [
        tiptapApi
    ]);
    const buildAskAiPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAskAi.useCallback[buildAskAiPrompt]": (input, text)=>{
            const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
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
            const presetInstruction = ({
                "useAskAi.useCallback[buildAskAiPrompt].presetInstruction": ()=>{
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
                }
            })["useAskAi.useCallback[buildAskAiPrompt].presetInstruction"]();
            return `TARGET TEXT: """${text}"""\nINSTRUCTION: ${presetInstruction}${input.prompt ? `\nCUSTOM PROMPT: ${input.prompt}` : ''}\n\n${languageInstruction}\n\nTASK: Return ONLY the rewritten result in HTML/Markdown.`;
        }
    }["useAskAi.useCallback[buildAskAiPrompt]"], [
        targetAudience
    ]);
    const lockAskAiRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAskAi.useCallback[lockAskAiRange]": (taskId)=>{
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
        }
    }["useAskAi.useCallback[lockAskAiRange]"], [
        tiptapApi
    ]);
    const runAskAiAction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAskAi.useCallback[runAskAiAction]": async (input)=>{
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
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSnippet"])(promptToSend, targetAudience);
                const htmlSnippet = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$marked$2f$lib$2f$marked$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["marked"].parse(res.data || '', {
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
        }
    }["useAskAi.useCallback[runAskAiAction]"], [
        buildAskAiPrompt,
        onAddCost,
        setIsAiLoading,
        targetAudience,
        tiptapApi
    ]);
    const handleAskAiInsert = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAskAi.useCallback[handleAskAiInsert]": (html, taskId)=>{
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
        }
    }["useAskAi.useCallback[handleAskAiInsert]"], [
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
_s(useAskAi, "ufa0BidID3k5QYIpV20i4q2wZ0c=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useEditorAutosave.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useEditorAutosave",
    ()=>useEditorAutosave
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const useEditorAutosave = ({ storageKey = 'ai_writer_editor_autosave_v1', debounceMs = 3000 })=>{
    _s();
    const autosaveTimerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const latestHtmlRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])('');
    const latestMetaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const pendingRestoreRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastSavedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(''); // cache serialized payload to avoid redundant writes
    // Load saved draft on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useEditorAutosave.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            try {
                const savedRaw = localStorage.getItem(storageKey);
                if (!savedRaw) return;
                const saved = JSON.parse(savedRaw);
                if (saved && saved.html) {
                    pendingRestoreRef.current = saved;
                }
            } catch (e) {
                console.warn('Failed to read autosave', e);
            }
        }
    }["useEditorAutosave.useEffect"], [
        storageKey
    ]);
    const queueAutosave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorAutosave.useCallback[queueAutosave]": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
            autosaveTimerRef.current = setTimeout({
                "useEditorAutosave.useCallback[queueAutosave]": ()=>{
                    const payload = {
                        html: latestHtmlRef.current || '',
                        ...latestMetaRef.current,
                        ts: Date.now()
                    };
                    if (!payload.html.trim()) return;
                    const serialized = JSON.stringify(payload);
                    if (serialized === lastSavedRef.current) return;
                    try {
                        localStorage.setItem(storageKey, serialized);
                        lastSavedRef.current = serialized;
                    } catch (e) {
                        console.warn('Autosave failed', e);
                    }
                }
            }["useEditorAutosave.useCallback[queueAutosave]"], debounceMs);
        }
    }["useEditorAutosave.useCallback[queueAutosave]"], [
        debounceMs,
        storageKey
    ]);
    const recordHtml = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorAutosave.useCallback[recordHtml]": (html)=>{
            latestHtmlRef.current = html || '';
            queueAutosave();
        }
    }["useEditorAutosave.useCallback[recordHtml]"], [
        queueAutosave
    ]);
    const recordMeta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorAutosave.useCallback[recordMeta]": (meta)=>{
            latestMetaRef.current = {
                ...latestMetaRef.current,
                ...meta
            };
            queueAutosave();
        }
    }["useEditorAutosave.useCallback[recordMeta]"], [
        queueAutosave
    ]);
    const consumeDraft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useEditorAutosave.useCallback[consumeDraft]": ()=>{
            const saved = pendingRestoreRef.current;
            pendingRestoreRef.current = null;
            return saved;
        }
    }["useEditorAutosave.useCallback[consumeDraft]"], []);
    return {
        recordHtml,
        recordMeta,
        consumeDraft
    };
};
_s(useEditorAutosave, "czKtb2LMkm+hAGP++DGZU5CBGQk=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/generation/generationLogger.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appendAnalysisLog",
    ()=>appendAnalysisLog,
    "summarizeList",
    ()=>summarizeList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-client] (ecmascript)");
;
const appendAnalysisLog = (msg)=>{
    const store = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/generation/useAnalysisPipeline.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runAnalysisPipeline",
    ()=>runAnalysisPipeline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useMetricsStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/productFeatureToPainPointMapper.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$nlpService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/nlpService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$termUsagePlanner$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/termUsagePlanner.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useSettingsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useSettingsStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/referenceAnalysisService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$authorityService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/authorityService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/imageService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/generationLogger.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionalAnalysisService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/research/regionalAnalysisService.ts [app-client] (ecmascript)");
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
const isStopped = ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().isStopped;
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
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    const analysisStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState();
    const metricsStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMetricsStore"].getState();
    // Reset State for Analysis
    generationStore.setStatus('analyzing');
    analysisStore.setScrapedImages(config.scrapedImages || []);
    analysisStore.setTargetAudience(config.targetAudience);
    analysisStore.setArticleTitle(config.title || '');
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(config.targetAudience);
    analysisStore.setLanguageInstruction(languageInstruction);
    console.info('[LangConfig]', {
        targetAudience: config.targetAudience,
        languageInstruction
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`語言設定：${audienceLabel(config.targetAudience)}（${config.targetAudience}）`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Starting analysis...');
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
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Parsing product brief and CTA...');
            const parseRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseProductContext"])(config.productRawText);
            console.log(`[Timer] Product Context Parse: ${parseRes.duration}ms`);
            parsedProductBrief = parseRes.data;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Product brief parsed.');
            metricsStore.addCost(parseRes.cost.totalCost, parseRes.usage.totalTokens);
        }
        if (parsedProductBrief && parsedProductBrief.productName) {
            if (isStopped()) return {
                brief: parsedProductBrief,
                mapping: []
            };
            generationStore.setGenerationStep('mapping_product');
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Mapping pain points to product features...');
            const mapRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$productFeatureToPainPointMapper$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateProblemProductMapping"])(parsedProductBrief, fullConfig.targetAudience);
            console.log(`[Timer] Product Mapping: ${mapRes.duration}ms`);
            generatedMapping = mapRes.data;
            analysisStore.setProductMapping(generatedMapping);
            if (generatedMapping.length > 0) {
                const example = generatedMapping[0];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Product-feature mapping ready (${generatedMapping.length}). e.g., ${example.painPoint} → ${example.productFeature}`);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Product-feature mapping ready (no matches found).');
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Running NLP keyword scan...');
        const keywords = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$nlpService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["analyzeText"])(fullConfig.referenceContent);
        // DYNAMIC LIMIT CALCULATION:
        const settings = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useSettingsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSettingsStore"].getState();
        const contentLen = fullConfig.referenceContent.length;
        const calculatedLimit = Math.floor(contentLen / settings.keywordCharDivisor);
        const finalLimit = Math.max(settings.minKeywords, Math.min(settings.maxKeywords, calculatedLimit));
        const keywordPlanCandidates = keywords.slice(0, finalLimit);
        const topTokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["summarizeList"])(keywordPlanCandidates.map((k)=>k.token), 6);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`NLP scan found ${keywords.length} keywords. Using top ${keywordPlanCandidates.length} (Ratio: 1/${settings.keywordCharDivisor}, Min: ${settings.minKeywords}): ${topTokens}`);
        if (keywordPlanCandidates.length > 0 && !isStopped()) {
            generationStore.setGenerationStep('planning_keywords');
            try {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Planning keyword strategy (top ${keywordPlanCandidates.length})...`);
                const planRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$termUsagePlanner$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractSemanticKeywordsAnalysis"])(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                console.log(`[Timer] Keyword Action Plan: ${planRes.duration}ms`);
                console.log(`[SemanticKeywords] Final aggregated plans: ${planRes.data.length} / ${keywordPlanCandidates.length}`);
                analysisStore.setKeywordPlans(planRes.data);
                const planWords = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["summarizeList"])(planRes.data.map((p)=>p.word), 6);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Keyword plan ready (${planRes.data.length}). Focus: ${planWords}`);
                metricsStore.addCost(planRes.cost.totalCost, planRes.usage.totalTokens);
            } catch (e) {
                console.warn("Action Plan extraction failed", e);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Keyword planning failed (continuing).');
            }
        }
    };
    // Task 3: Structure & Authority (run concurrently)
    const structureTask = async ()=>{
        if (isStopped()) return;
        generationStore.setGenerationStep('extracting_structure');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Extracting reference structure and authority signals...');
        const [structRes, authRes] = await Promise.all([
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$referenceAnalysisService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["analyzeReferenceStructure"])(fullConfig.referenceContent, fullConfig.targetAudience),
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$authorityService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["analyzeAuthorityTerms"])(fullConfig.authorityTerms || '', fullConfig.title, fullConfig.websiteType || 'General Professional Website', fullConfig.targetAudience)
        ]);
        console.log(`[Timer] Narrative Structure (Outline): ${structRes.duration}ms`);
        console.log(`[Timer] Authority Analysis: ${authRes.duration}ms`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Structure extracted (${structRes.data?.structure?.length || 0} sections).`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Authority terms mapped.');
        if (structRes.data?.structure?.length) {
            const sectionTitles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["summarizeList"])(structRes.data.structure.map((s)=>s.title), 6);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Sections: ${sectionTitles}`);
        }
        if (authRes.data?.relevantTerms?.length) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Authority terms: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["summarizeList"])(authRes.data.relevantTerms, 6)}`);
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Analyzing source images and visual identity...');
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
                        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["analyzeImageWithAI"])(img.url);
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
            const styleRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["analyzeVisualStyle"])(analyzedImages, fullConfig.websiteType || "Modern Business");
            analysisStore.setVisualStyle(styleRes.data);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`✓ Visual style extracted: ${styleRes.data}`);
            metricsStore.addCost(styleRes.cost.totalCost, styleRes.usage.totalTokens);
        } catch (e) {
            console.warn("Failed to extract visual style", e);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Visual style extraction skipped.');
        }
    };
    // Task 5: Regional Analysis (NEW)
    const regionalTask = async ()=>{
        if (isStopped()) return;
        generationStore.setGenerationStep('localizing_hk'); // Reuse step label or create new 'analyzing_region'
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Analyzing regional terminology & brand grounding...');
        try {
            const regionRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$research$2f$regionalAnalysisService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["analyzeRegionalTerms"])(fullConfig.referenceContent, fullConfig.targetAudience);
            console.log(`[Timer] Regional Analysis: ${regionRes.duration}ms`);
            if (regionRes.data && regionRes.data.length > 0) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Regional analysis found ${regionRes.data.length} terms to correct.`);
                // Store in refAnalysis (requires refAnalysis to be initialized first, or return it)
                return regionRes.data;
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Regional analysis: No major issues found.');
                return [];
            }
        } catch (e) {
            console.warn("Regional analysis failed", e);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Regional analysis failed (continuing).');
            return [];
        }
    };
    // --- EXECUTE ALL TASKS WITH STAGGERING ---
    // Burst protection: Start each major task 1 second apart to prevent proxy/backend overload
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Dispatching analysis tasks with burst protection...');
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('All analysis tasks completed. Preparing to write...');
    generationStore.setGenerationStep('idle');
    return {
        productResult,
        structureResult,
        keywordPromise: Promise.resolve(keywordResult),
        visualPromise: Promise.resolve(visualResultsPromise),
        regionalPromise: Promise.resolve(regionalResult)
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/generation/useContentGenerator.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runContentGeneration",
    ()=>runContentGeneration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useMetricsStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentGenerationService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentDisplayService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/contentDisplayService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/textUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/generation/imageService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/generationLogger.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
const isStopped = ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().isStopped;
const runContentGeneration = async (config, analysisResults)=>{
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    const analysisStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState();
    const metricsStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useMetricsStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMetricsStore"].getState();
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
        const normalizedTitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanHeadingText"])(title);
        if (!shouldUseHeadingAnalysis) return normalizedTitle;
        const candidate = headingOptimizations.find((opt)=>{
            const before = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanHeadingText"])(opt.h2_before);
            const after = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanHeadingText"])(opt.h2_after);
            return before === normalizedTitle || after === normalizedTitle;
        });
        if (!candidate) return normalizedTitle;
        // Pick the highest scoring option from the optimizer; fallback to the suggested H2.
        const scoredOptions = (candidate.h2_options || []).map((opt)=>({
                text: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanHeadingText"])(opt.text || ''),
                score: typeof opt.score === 'number' ? opt.score : undefined
            })).filter((opt)=>opt.text && typeof opt.score === 'number').sort((a, b)=>(b.score ?? -Infinity) - (a.score ?? -Infinity));
        const fallback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanHeadingText"])(candidate.h2_after || candidate.h2_before || normalizedTitle);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanHeadingText"])(scoredOptions[0]?.text || fallback || normalizedTitle);
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
    const getHeading = (idx)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanHeadingText"])(sectionHeadings[idx] || sectionsToGenerate[idx]?.title || `Section ${idx + 1}`);
    const renderSectionBlock = (idx, bodyOverride)=>{
        const heading = getHeading(idx);
        const body = typeof bodyOverride === 'string' ? bodyOverride : sectionBodies[idx];
        if (body) return `## ${heading}\n\n${body}`;
        return `## ${heading}\n\n_(Writing...)_`;
    };
    const renderTurboSections = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentDisplayService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeTurboSections"])(sectionsToGenerate, sectionBodies.map((body, idx)=>body ? renderSectionBlock(idx, body) : ""));
    const renderProgressSections = ()=>sectionBodies.map((_, idx)=>renderSectionBlock(idx)).join('\n\n');
    const getKeywordPlans = ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState().keywordPlans || [];
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
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$contentGenerationService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSectionContent"])(loopConfig, section.title, specificPlan, refAnalysisData?.generalPlan, getKeywordPlans(), dummyPreviousContent, futureTitles, authAnalysisData, sectionPoints, [], 0, section);
            if (!isStopped()) {
                sectionBodies[i] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$textUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripLeadingHeading"])(res.data.content);
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
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Planning visual assets...');
                const imagePlans = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["planImagesForArticle"])(fullContent, analysisStore.scrapedImages, config.targetAudience, analysisStore.visualStyle);
                console.log(`[Images] Planned ${imagePlans.data.length} images`);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Visual plan ready: ${imagePlans.data.length} images.`);
                metricsStore.addCost(imagePlans.cost.totalCost, imagePlans.usage.totalTokens);
                // Generate images in parallel (limit concurrency if needed, but for now all at once is fine for small batches)
                const imagePromises = imagePlans.data.map(async (plan)=>{
                    if (isStopped()) return;
                    try {
                        const label = plan.category || plan.insertAfter || plan.id;
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])(`Generating image: ${label}...`);
                        const imgRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$generation$2f$imageService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateImage"])(plan.generatedPrompt);
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
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Image generation completed.');
            } catch (e) {
                console.error("Image generation phase failed", e);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Image generation failed.');
            }
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$generationLogger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["appendAnalysisLog"])('Skipping auto image planning (manual only).');
        }
        // --- REGION LOCALIZATION skipped as requested ---
        generationStore.setGenerationStep('finalizing');
        // FIX: Ensure immediate completion so the content is visible under the modal
        generationStore.setStatus('completed');
        generationStore.setGenerationStep('idle');
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useGeneration.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGeneration",
    ()=>useGeneration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useGenerationStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAnalysisStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$resetGenerationState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/resetGenerationState.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useAnalysisPipeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/useAnalysisPipeline.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useContentGenerator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/generation/useContentGenerator.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const runAnalysisOnly = async (config)=>{
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
    // Reset State
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$resetGenerationState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resetGenerationState"])();
    generationStore.setError(null);
    generationStore.setLastConfig(config);
    try {
        // 1. Analysis Phase
        const analysisResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useAnalysisPipeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAnalysisPipeline"])(config);
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().isStopped) return;
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
    const generationStore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
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
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAnalysisStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnalysisStore"].getState().keywordPlans?.length) missingData.push('關鍵字規劃 (Keywords)');
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
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$generation$2f$useContentGenerator$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runContentGeneration"])(config, analysisResults);
    } catch (err) {
        console.error(err);
        generationStore.setError(err?.message || '生成段落時發生錯誤，請重試。');
        generationStore.setStatus('error');
        generationStore.setGenerationStep('idle');
    }
};
const useGeneration = ()=>{
    _s();
    const mutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useGeneration.useMutation[mutation]": (config)=>runAnalysisOnly(config)
        }["useGeneration.useMutation[mutation]"]
    });
    const writeMutation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useGeneration.useMutation[writeMutation]": ()=>runWritingPhase()
        }["useGeneration.useMutation[writeMutation]"]
    });
    const generate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGeneration.useCallback[generate]": async (config)=>{
            const genState = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState();
            const hasExistingAnalysis = !!genState.analysisResults;
            const hasExistingContent = (genState.content || '').trim().length > 0;
            if (hasExistingAnalysis || hasExistingContent) {
                const confirmed = window.confirm('已經有分析結果或內容，重新分析會覆蓋目前的資料，確定要繼續嗎？');
                if (!confirmed) return;
            }
            await mutation.mutateAsync(config);
        }
    }["useGeneration.useCallback[generate]"], [
        mutation
    ]);
    const startWriting = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGeneration.useCallback[startWriting]": async ()=>{
            await writeMutation.mutateAsync();
        }
    }["useGeneration.useCallback[startWriting]"], [
        writeMutation
    ]);
    const stop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGeneration.useCallback[stop]": ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useGenerationStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGenerationStore"].getState().stopGeneration();
        }
    }["useGeneration.useCallback[stop]"], []);
    return {
        generate,
        startWriting,
        stop,
        status: mutation.status
    };
};
_s(useGeneration, "+jo3792lYX5z2eXYYwhl5IQHS6w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_hooks_fd23e20d._.js.map