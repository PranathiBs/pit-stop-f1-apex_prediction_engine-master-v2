---
description: Automating F1 News Flow with Bing News API
---

# F1 News Automation Workflow

This workflow describes the process of integrating real-time F1 news into the dashboard using an external API.

## Steps

### 1. Configure API Access
- Obtain a Bing News Search API key (or similar JSON news provider).
- Add the key to `.env` as `BING_NEWS_API_KEY`.

### 2. Implement the News Engine Component
// turbo
- Create `components/LatestUpdates.tsx`.
- Use `useEffect` and `axios` for fetching with a 60-minute auto-refresh.
- Implement a 3-column grid where the first item is a Hero (spanning 2 cols/rows).
- Bind image `src` strictly to the `urlToImage` field.
- Add an `onError` fallback to a thematic F1 asset.

### 3. State Management & Interaction
- Use `useState` for `isExpanded` (slice 5 vs all).
- Use `useState` for `loading`, `error`, and `filter`.
- Derive filter categories dynamically from the news metadata.
- Implement case-insensitive search logic for title and description.
- Use secure `window.open` redirection on click for all cards.

### 4. Integration
- Replace the legacy news logic in `app/page.tsx` with `<LatestUpdates />`.
- Add a premium loading spinner and 'Live Updates Currently Unavailable' fallback.
