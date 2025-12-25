import { generateText, generateObject } from 'ai';
import { vertex } from '../adapters/aiService';
import { perplexity } from '../adapters/perplexity';
import { z } from 'zod';
import { logger } from '../../utils/logger';

/**
 * Run research using Google Search Grounding via Vertex AI.
 * This acts as the "Director" finding real-time data to support the section writing.
 */
export async function runDirectorResearch(topic: string, context: string) {
    try {
        const { text, sources } = await generateText({
            model: vertex('gemini-3-flash-preview'), // Use Pro for better reasoning/research
            tools: {
                googleSearch: vertex.tools.googleSearch({}),
            },
            system: `You are an expert Research Director. Your goal is to find accurate, up-to-date information to support a specific section of an article.
      
      Context of the article:
      "${context.slice(0, 1000)}..."
      
      You will be given a specific TOPIC to research.
      1. Use Google Search to find relevant facts, statistics, and depth.
      2. Synthesize the findings into a "Research Note".
      3. CITATIONS: You MUST cite your sources.
      
      Output Format:
      - Quick Summary of findings.
      - Key Facts (bullet points).
      - Relevant Statistics (if any).
      - Source Links (explicitly listed).`,
            prompt: `Research this topic: "${topic}"`,
        });

        return {
            content: text,
            // Note: 'sources' might be available in the result object depending on SDK version structure for grounding.
            // In SDK v6 with Vertex tools, grounding metadata often comes in 'experimental_providerMetadata' or similar if not directly in 'sources'.
            // But for now, we return the text which should contain the synthesized answer with citations if the model follows instructions,
            // and checking if 'sources' (tool results) are returned.
        };
    } catch (error) {
        logger.error('nlp_analysis', 'Director: Research failed', { error, topic });
        return {
            content: 'Research failed or service unavailable. Proceeding with internal knowledge.',
            error: error
        };
    }
}

/**
 * Plan a full article based on a description, using Google Search Grounding.
 */
export async function planArticleWithDirector(description: string, targetAudience: string = 'zh-TW', voiceContext: string = '') {
    try {
        const { text } = await generateText({
            model: vertex('gemini-3-flash-preview'),
            tools: {
                googleSearch: vertex.tools.googleSearch({}),
            },
            system: `You are an expert Research Director and Editor-in-Chief.
      Goal: Plan a comprehensive, high-quality article based on the user's description.
      
      ${voiceContext ? `
      CRITICAL VOICE INSTRUCTION:
      The user has specified a distinct Brand Voice/Persona:
      "${voiceContext}"
      
      You MUST adapt the article plan (Tone, Narrative Flow, Section Titles) to embody this persona.
      If the voice is "Humorous", plan for jokes/wit.
      If the voice is "Professional", plan for deep authority.
      ` : ''}

      Process:
      1. ANALYZE the request: "${description}"
      2. RESEARCH using Google Search to find:
         - Trending angles and subtopics.
         - Key facts, statistics, and data points.
         - Competitor structure.
      3. PLAN the outline:
         - Create a logical flow of H2 sections.
         - Incorporate the research findings into "keyFacts".
      
      Audience: ${targetAudience}
      Language: Traditional Chinese (Taiwan).
      
      OUTPUT FORMAT:
      You must return ONLY a raw JSON object (no markdown 'json' fences) matching this structure:
      {
        "toneSensation": "Describe the desired tone (e.g., Professional, Wit, Empathetic)",
        "humanWritingVoice": "Describe the writing persona (e.g., Senior Tech Editor)",
        "generalPlan": ["Writing Guideline 1", "Guideline 2"],
        "conversionPlan": ["Engagement Strategy 1", "Strategy 2"],
        "structure": [
          {
            "title": "Section Title",
            "narrativePlan": ["Point 1", "Point 2"],
            "logicalFlow": "Connection logic...",
            "coreFocus": "Main focus...",
            "keyFacts": ["Fact 1", "Fact 2"],
            "coreQuestion": "What does this answer?",
            "writingMode": "direct" | "multi_solutions",
            "subsections": [{"title": "Sub H3", "keyFacts": []}],
            "instruction": "Writer instruction"
          }
        ]
      }
      IMPORTANT: Ensure 'writingMode' is exactly "direct" or "multi_solutions".
      `,
            prompt: `Create a detailed article plan for: "${description}"`,
        });

        // Clean up markdown code blocks if present
        // Clean up markdown code blocks if present
        let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Robust JSON extraction: Find the first '{' and last '}'
        const firstOpen = cleanJson.indexOf('{');
        const lastClose = cleanJson.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            cleanJson = cleanJson.substring(firstOpen, lastClose + 1);
        }

        const data = JSON.parse(cleanJson);
        return {
            structure: data.structure,
            toneSensation: data.toneSensation || "Director's Choice",
            humanWritingVoice: data.humanWritingVoice || "Expert Editor",
            generalPlan: data.generalPlan || [],
            conversionPlan: data.conversionPlan || [],
        };
    } catch (error) {
        logger.error('extracting_structure', 'Director: Planning failed', { error });
        throw error;
    }
}

/**
 * Run a detailed sourcing mission based on an approved article plan.
 */
/**
 * Run a detailed sourcing mission based on an approved article plan.
 * Returns structured key facts mapped to section titles.
 */
export async function runDetailedSourcing(topic: string, structure: any[], targetAudience: string = 'zh-TW') {
    try {
        const structureSummary = structure.map(s => `- ${s.title}: ${s.coreFocus || ''}`).join('\n');

        const { text } = await generateText({
            model: vertex('gemini-3-flash-preview'),
            tools: {
                googleSearch: vertex.tools.googleSearch({}),
            },
            system: `You are an expert Research Director.
      Goal: Conduct research to find "Fresh Key Facts" for each section of the article.
      
      Input:
      Topic: "${topic}"
      Structure:
      ${structureSummary}
      
      Audience: ${targetAudience}
      
      Instructions:
      1. For each section, use Google Search to find specific STATISTICS, DATA, CASE STUDIES, or EXPERT QUOTES.
      2. IGNORE general knowledge. Only find new, hard-to-find information.
      3. Return a JSON object mapping section titles to an array of facts.
      
      OUTPUT FORMAT:
      Return ONLY raw JSON:
      {
        "sourcingResults": [
          {
            "sectionTitle": "Exact Title from Input",
            "freshKeyFacts": ["Fact 1 with citation", "Stat 2 with source"]
          }
        ]
      }
      `,
            prompt: `Start sourcing for: "${topic}"`,
        });

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstOpen = cleanJson.indexOf('{');
        const lastClose = cleanJson.lastIndexOf('}');
        const jsonStr = (firstOpen !== -1 && lastClose !== -1) ? cleanJson.substring(firstOpen, lastClose + 1) : cleanJson;

        const data = JSON.parse(jsonStr);
        return {
            sourcingResults: data.sourcingResults || []
        };
    } catch (error) {
        logger.error('nlp_analysis', 'Director: Sourcing failed', { error, topic });
        throw error;
    }
}

/**
 * Use Google Grounding to find the top 3 most authoritative URLs for a topic.
 */
export async function findTopGroundingUrls(topic: string, targetAudience: string = 'zh-TW', structure: any[] = []) {
    try {
        let promptContext = `Topic: "${topic}"`;

        if (structure && structure.length > 0) {
            const sectionTitles = structure.map(s => s.title).join(', ');
            promptContext += `\nTarget Sections to Cover: ${sectionTitles}`;
        }

        // Use Perplexity Sonar Pro for deep reasoning and live search
        const { text } = await generateText({
            model: perplexity('sonar-pro'),
            messages: [
                {
                    role: 'system',
                    content: `You are an expert Research Librarian using Perplexity's deep search capabilities.
                    Goal: Find the 3 most authoritative, high-quality, and SPECIFIC URLs for the given TOPIC.
                    
                    ${promptContext}
                    Audience: ${targetAudience}
                    
                    Instructions:
                    1. SEARCH DEEP: Use your "sonar-pro" reasoning to find the best available sources on the web right now.
                    2. FILTER: 
                       - EXPEL Homepages, Product Landing Pages, and 404s.
                       - EXPEL unrelated brands (e.g. searching for Apple -> ignore Samsung unless comparing).
                    3. MATCH: Prioritize articles that cover the "Target Sections" defined in the prompt.
                    4. SELECT: Return exactly 3 best URLs.

                    OUTPUT FORMAT:
                    You must return ONLY a raw JSON object:
                    {
                      "topUrls": [
                        "https://url1...",
                        "https://url2...",
                        "https://url3..."
                      ]
                    }`
                },
                {
                    role: 'user',
                    content: `Find the top 3 deep-dive references for: "${topic}"`
                }
            ]
        });

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstOpen = cleanJson.indexOf('{');
        const lastClose = cleanJson.lastIndexOf('}');
        const jsonStr = (firstOpen !== -1 && lastClose !== -1) ? cleanJson.substring(firstOpen, lastClose + 1) : cleanJson;

        const data = JSON.parse(jsonStr);
        return data.topUrls || [];
    } catch (error) {
        logger.error('nlp_analysis', 'Director: Perplexity Discovery failed', { error, topic });
        // Throwing error allows the caller to decide whether to show an alert or fallback
        throw new Error(`Failed to find authoritative URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
