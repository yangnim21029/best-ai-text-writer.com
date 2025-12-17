# Changelog

## [Unreleased]

### Refactoring
- **Analysis Renaming**: Renamed `KeywordActionPlan` to `FrequentWordsPlacementAnalysis` throughout the codebase (`types.ts`, store, services, hooks) to improved semantic accuracy.
- **Cleanup**: Removed unused files (`test-scraping.ts`, `examples/` dir, etc.) and dependencies (`react-markdown`).

### Features
- **Keyword Analysis**: Added extraction of a single, short `exampleSentence` for each analyzed keyword to provide better context.
- **UI**: Added a "Localization & Safety" card in the Sidebar to explicitly display regional corrections and blocked terms.
- **UI**: Added display of the extracted `exampleSentence` in the Keyword Analysis card.

### Performance & Fixes
- **Pipeline Sync**: Fixed a race condition where the analysis status became "Ready" before keyword analysis was complete. `runAnalysisPipeline` now awaits all tasks.
- **Prompt Optimization**: Constrained extracting `exampleSentence` to be under 15 words and simplified prompt instructions to reduce latency (from ~120s down).
- **Parallelization**: Implemented async batching for keyword analysis.
