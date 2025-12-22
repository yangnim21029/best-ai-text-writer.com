Naming Inconsistency Fix Plan
Goal Description
Standardize naming conventions across the codebase to improve code quality and maintainability. A recent analysis identified several inconsistent naming patterns, particularly mixing camelCase, YearPascalCase, and snake_case for the same concepts.

Findings & Proposed Changes
The following table lists the top high-priority inconsistencies found and the recommended standardization.

Concept Current Forms (Count) Recommended Standard Notes
Token Counts totalTokens (81), total_tokens (1) totalTokens snake_case likely from API response. Map to camelCase at boundary.
Token Counts inputTokens (63), input_tokens (1) inputTokens Same as above.
Token Counts outputTokens (62), output_tokens (1) outputTokens Same as above.
Tiptap API tiptapApi (101), TiptapApi (2) tiptapApi TiptapApi appears to be a variable/prop misnamed as a type.
HTML Content
html
(60), HTML (18), **html (3)
html
**html is React dangerouslySetInnerHTML specific (keep). HTML should be
html
or htmlContent.
AI Service aiService (54), AIService (4) aiService AIService is likely a class name, check usage. If variable, usage aiService.
Systematic Fixes

1. API Response Normalization
   Most snake_case leaks (like total_tokens) come from direct usage of API responses.

Action: Ensure all API responses are typed and mapped to camelCase immediately upon receipt in the service layer.
Files likely involved: Service adapters, API types. 2. Variable vs Type naming
Many inconsistencies are due to Types and Variables sharing names but differing only by case (e.g., targetAudience vs TargetAudience).

Action: Review instances of PascalCase variables. If a variable is named TargetAudience, rename to targetAudience or targetAudienceType if it conflicts.
Rule: Variables = camelCase, Types/Components = PascalCase. 3. Acronyms
Inconsistency in tiptapApi vs TiptapApi (and potentially HTML vs
html
).

Action: Adopt strict camelCase for properties, treating acronyms as words (e.g., xmlHttpRequest instead of XMLHTTPRequest).
Specific change: Rename independent prop/variable TiptapApi -> tiptapApi (or tiptapAPI if strict acronyms preferred, but consistency is key).
Verification Plan
Automated Tests
Run tsc to ensure no renaming broke type references.
Run npm run lint to catch potential new lint errors.
Manual Verification
Re-run the
find_inconsistencies.py
script to verify the count of high-priority inconsistencies has reached 0 (or acceptable levels for valid collisions).
