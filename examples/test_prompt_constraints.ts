
import { promptRegistry } from '../services/promptRegistry';

const mockPayload = {
    sectionTitle: "Test Section",
    languageInstruction: "Write in English",
    previousSections: ["Intro"],
    futureSections: ["Conclusion"],
    generalPlan: ["Be professional"],
    specificPlan: ["Explain details"],
    kbInsights: [],
    keywordPlans: [],
    relevantAuthTerms: [],
    points: ["Point A"],
    injectionPlan: "",
    articleTitle: "Test Article",
    coreQuestion: "What is this?",
    difficulty: "easy" as const,
    writingMode: "direct" as const,
    solutionAngles: [],
    avoidContent: ["Avoid Topic A", "Avoid Topic B"]
};

const prompt = promptRegistry.build('sectionContent', mockPayload);

console.log("Generated Prompt:");
console.log(prompt);

if (prompt.includes("⛔ NEGATIVE CONSTRAINTS")) {
    console.log("\n✅ SUCCESS: Negative constraints section found.");
} else {
    console.log("\n❌ FAILURE: Negative constraints section NOT found.");
}

if (prompt.includes("Avoid Topic A") && prompt.includes("Avoid Topic B")) {
    console.log("✅ SUCCESS: Avoided topics found in prompt.");
} else {
    console.log("❌ FAILURE: Avoided topics NOT found in prompt.");
}
