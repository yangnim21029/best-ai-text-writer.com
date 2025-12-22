# Ask AI — Selected Text Interaction

Design and behavior spec for the Ask AI flow that acts on highlighted text. This separates the UX from the existing rich editor so we can rebuild the buttons and preview cleanly.

## Goals

- Single floating entry point that appears beside a text selection.
- Clear difference between **Edit** (prompt-based) and **Format** (one-click templates including bullet/table variations).
- Context shown as **Before** text with inline **After** preview; only Edit exposes a freeform prompt input.
- Avoid broken states where the Ask AI button is unclickable or misaligned.

## Trigger and Toolbar

- When user selects text, show a vertical pill on the right of the selection (z-10, sticky to selection bounds).
- Icons (top to bottom): `edit` (magic pen), `format` (sparkle chat), `shorten` (smile/concise), `visual` (optional future; can be placeholder).
- Hover/active states: light shadow, primary-blue icon; click opens the corresponding menu.

## Menus

- **Edit menu** (opens on clicking edit icon):
  - Header “Modify with a prompt”.
  - Presets: Rephrase, Elaborate, More formal, More casual, Summarise, Bulletise, Shorten (enabled).
  - Custom prompt field at top; selecting preset immediately runs without extra input.
- **Format menu** (opens on clicking format icon):
  - No freeform prompt.
  - Templates: Bullet list, Numbered list, Table (2-col or 3-col), Checklist, Quote block, Markdown clean-up.
  - Each option runs directly and opens the preview panel.

## Preview Panel (After)

- Anchored beneath the selected text, full-width card with rounded corners.
- Top row: icon + action title (e.g., “Bulletise”), close `X`.
- Body:
  - **Before** (label on left, gray text) shows original selection, read-only.
  - **After** (label on right) shows AI result; laid out horizontally on desktop, stacked on mobile.
- Footer actions:
  - Left: “Refine with a prompt” input **only in Edit mode**; hidden in Format mode.
  - Center: “Refine” dropdown for quick follow-ups (shorter, longer, friendlier, more formal, bulletise).
  - Right: “Insert” primary button; inserts result at the original selection and closes panel.
  - Secondary buttons: Undo/Discard preview; thumbs up/down feedback (optional).
- Loading: spinner inline with action title; disable Insert while loading.

## States and Rules

- If no text is selected, hide the toolbar and menus.
- Selection highlight stays while the preview is open; cleared after Insert or Close.
- In Format mode, the prompt textarea is removed and the “After” preview uses the chosen template.
- Shorten can live under Edit presets (do not disable).
- Keyboard: `Esc` closes menu or preview; `Enter` in prompt submits.

## Data / API Integration

- Input to AI: { selectedText, mode: edit|format, preset, customPrompt?, locale, contextIds? }.
- Output: HTML snippet; keep links/headings intact; avoid extra wrappers.
- Insert behavior: replace the selection range; if selection is collapsed, insert at caret.

## Acceptance Criteria

- Ask AI pill appears on selection and is clickable on desktop/mobile.
- Edit menu shows prompt + presets; Format menu shows only templates.
- Preview shows Before/After horizontally on desktop; After only input area (prompt) exists in Edit mode.
- Insert replaces selected text and closes preview; closing clears highlight.
- No overlapping/misaligned buttons when the selection is near the right edge.
