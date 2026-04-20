# Kotonoha — Future Planning

> Last updated: 2026-04-18

---

## 1. ✅ Vocabulary Pagination (COMPLETED)

**Goal:** Split 800 N5 vocabulary words into 10 pages (80 words per page), enabling a structured 10-day study plan.

### Requirements
- **80 words per page** with 10 pages total
- Each word should be **labeled 1 to 80** within each page
  - Page 1: Words 1–80
  - Page 2: Words 81–160
  - ...and so on
- **Page navigation** at top and bottom with numbered buttons (1–10)
- Show **current page indicator** (e.g., "Day 3 of 10")
- Preserve **Shuffle** functionality within the current page
- Remember last visited page in `localStorage`

### Study Plan
| Day | Words | Page |
|-----|-------|------|
| 1   | 1–80  | 1    |
| 2   | 81–160 | 2   |
| 3   | 161–240 | 3  |
| 4   | 241–320 | 4  |
| 5   | 321–400 | 5  |
| 6   | 401–480 | 6  |
| 7   | 481–560 | 7  |
| 8   | 561–640 | 8  |
| 9   | 641–720 | 9  |
| 10  | 721–800 | 10 |

---

## 2. ✅ Mark as Complete (COMPLETED)

**Goal:** Track study progress by marking individual vocabulary cards as "complete."

### Requirements
- **Toggle switch** on each vocabulary card (top-right corner)
- Completed cards should have a **subtle green border or checkmark overlay**
- Store completion data in **localStorage** keyed by word
  - Example key: `kotonoha_vocab_completed_n5`
  - Value: `Set<string>` of completed word identifiers
- Show **progress bar** at the top of the vocabulary section
  - e.g., "42/80 completed today" with a visual progress indicator
- **Daily reset option** available (button to clear today's completions)
- Completed count should persist across page reloads
- Consider a **summary view** showing:
  - Total completed across all pages
  - Completion percentage per page/day

---

## 3. ✅ Vocabulary Quiz (COMPLETED)

**Goal:** Test memory retention with a multiple-choice quiz based on studied vocabulary.

### Requirements
- **Quiz modes:**
  1. **Japanese → English** — Show Japanese word, select correct English meaning
  2. **English → Japanese** — Show English meaning, select correct Japanese word
  3. **Japanese → Myanmar** — Show Japanese word, select correct Myanmar meaning
  4. **Audio → Word** — Play pronunciation, select correct word
- **Question format:** Multiple choice with 4 options
- **Quiz flow:**
  - Select number of questions (10, 20, 50, or all)
  - Filter by page/day (e.g., "Quiz Day 3 words only")
  - Option to quiz only **incomplete** (not yet marked) words
  - Show immediate feedback (correct/incorrect) after each answer
  - Final score screen with percentage and breakdown
- **UI considerations:**
  - Progress bar showing current question (e.g., "12/20")
  - Timer option (optional, configurable)
  - Streak counter for consecutive correct answers
  - Review screen at the end showing incorrect answers

---

## 4. ✅ Floating Hiragana/Katakana Reference Sheet (COMPLETED)

**Goal:** Provide quick access to hiragana and katakana charts from any page, as a floating button/modal.

### Requirements
- **Floating action button (FAB)** in the bottom-right corner of all pages
  - Icon: あ/ア toggle
  - Always visible, doesn't interfere with content
- **Click to open** a full-screen or large modal with:
  - Two tabs: **Hiragana** and **Katakana**
  - Display the complete character chart (same data as existing `/module/hiragana` and `/module/katakana`)
  - Compact grid layout optimized for quick reference
  - Click any character to hear its pronunciation (SpeechSynthesis)
- **Keyboard shortcut:** `Ctrl+K` or `Ctrl+H` to open/close
- ⚠️ **CAUTION:** The original `/module/hiragana` and `/module/katakana` pages must remain **untouched** — the floating sheet is an additional convenience feature, not a replacement.

### Data source
- Reuse existing JSON files:
  - `/data/character/hiragana.json`
  - `/data/character/katakana.json`

### Placement
- Add the FAB component to `layout.tsx` so it appears globally
- Or alternatively, wrap it in a client component used across lesson pages

---

## Implementation Priority Order

1. **Pagination** — Foundation for the 10-day study plan
2. **Mark as Complete** — Track daily progress
3. **Floating Kana Sheet** — Quick reference utility
4. **Vocabulary Quiz** — Memory Testing (requires pagination + completion data)

---

## Technical Notes

- All vocabulary data is now in **JSON format** at `/public/data/vocabulary/5/vocabulary.json` (800 words)
- Use **localStorage** for persistence (no backend needed)
- SpeechSynthesis API is already integrated for pronunciation
- Global show/hide toggles (Romaji/English/Myanmar) are already implemented
