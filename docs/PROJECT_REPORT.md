# Kotonoha — Project Analysis Report

**Generated:** 2026-04-20  
**Repository:** `/var/www/kotonoha`  
**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase

---

## 1. Purpose

**Kotonoha** (葉 — "leaf") is a structured Japanese language learning web application designed to help learners prepare for the **JLPT (Japanese Language Proficiency Test)** across all five proficiency levels — N5 (Beginner) through N1 (Advanced).

The app targets learners who speak **English and Myanmar (Burmese)**, providing bilingual support throughout all content — explanations, meanings, and example sentences are available in both languages.

### Core Goals
- Guide learners through the official JLPT pathway (N5 → N1)
- Cover all five JLPT skill areas: Vocabulary, Kanji, Grammar, Reading, and Listening
- Track personal study progress persistently in the browser
- Provide interactive practice through quizzes and pronunciation drills
- Offer a built-in Hiragana/Katakana reference accessible at any time

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.0.8 (App Router) |
| UI Library | React 19.1.0 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 with PostCSS |
| Icons | Lucide React 0.544.0 |
| Database | Supabase (installed, minimal usage) |
| Data | Static JSON files in `/public/data/` |
| Persistence | Browser `localStorage` |
| Audio | Web Speech Synthesis API (browser-native) |
| Bundler | Turbopack (Next.js default) |

**Supabase** is set up with both browser and server clients but the application currently runs as a fully static/client-side app — all content comes from JSON files and progress is stored in `localStorage`.

---

## 3. Project Structure

```
kotonoha/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Home dashboard
│   │   ├── layout.tsx                      # Root layout (Header + FloatingKanaSheet)
│   │   ├── level/[id]/page.tsx             # Lesson list for a JLPT level
│   │   ├── level/[id]/[lesson]/page.tsx    # Individual lesson content
│   │   ├── module/[kana]/page.tsx          # Kana character table
│   │   ├── module/[kana]/[char]/page.tsx   # Single character detail
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── FloatingKanaSheet.tsx
│   │   │   ├── lesson/
│   │   │   │   ├── VocabularyCard.tsx
│   │   │   │   ├── VocabularyQuiz.tsx
│   │   │   │   ├── KanjiCard.tsx
│   │   │   │   ├── GrammarPointCard.tsx
│   │   │   │   ├── ReadingPassage.tsx
│   │   │   │   └── ListeningExercise.tsx
│   │   │   ├── HomeCard.tsx
│   │   │   ├── LevelCard.tsx
│   │   │   ├── LessonItem.tsx
│   │   │   └── FoundationsCard.tsx
│   ├── types/types.ts                      # All TypeScript interfaces
│   └── utils/supabase/                     # Supabase client utilities
├── public/data/
│   ├── lesson/level.json                   # Level & lesson metadata
│   ├── vocabulary/5/vocabulary.json        # 800 N5 words
│   ├── kanji/                              # Kanji data per level
│   ├── grammar/                            # Grammar points per level
│   ├── reading/                            # Reading passages per level
│   ├── listening/                          # Listening exercises per level
│   └── character/                          # Hiragana & Katakana charts
└── supabase/                               # Supabase local config
```

---

## 4. Content Included

### JLPT Levels

All five levels (N5–N1) are defined with the same five lesson types:

| Level | Title | Difficulty |
|-------|-------|-----------|
| N5 | JLPT N5 | Beginner |
| N4 | JLPT N4 | Elementary |
| N3 | JLPT N3 | Intermediate |
| N2 | JLPT N2 | Upper Intermediate |
| N1 | JLPT N1 | Advanced |

**N5 is the most developed level** with complete, fully-populated content.

### Content Per Level

| Lesson Type | N5 Count | Notes |
|-------------|----------|-------|
| Vocabulary | 800 words | Divided into 10 pages × 80 words |
| Kanji | 102 characters | Onyomi, Kunyomi, stroke count, examples |
| Grammar | 65 points | With English + Myanmar explanations |
| Reading | 8 passages | With comprehension questions |
| Listening | 6 exercises | With transcripts and questions |

### Foundation Modules
- **Hiragana** — Full character chart (basic vowels, ka/sa/ta/na/ha/ma/ya/ra/wa rows + combinations)
- **Katakana** — Full character chart (same row structure)

Each character includes its kana symbol, romaji, and audio pronunciation via Web Speech API.

---

## 5. Features

### 5.1 Vocabulary Study

- **Pagination** — 800 N5 words split into 10 pages (Day 1–10), each with 80 words
- **Progress tracking** — Per-word completion checkboxes, persisted in `localStorage`
- **Progress bars** — Daily (current page) and overall (all 800 words) with percentage
- **Page persistence** — Last visited page remembered across sessions
- **Shuffle** — Randomizes card order on the current page using Fisher-Yates algorithm
- **Reset** — Clears all completion data with confirmation dialog
- **Completion celebration** — Animated message when all words on a page are completed

### 5.2 Vocabulary Quiz

A full quiz engine accessible from the vocabulary lesson page.

**Four quiz modes:**

| Mode | Prompt | Answer |
|------|--------|--------|
| JP → EN | Japanese word | English meaning |
| EN → JP | English meaning | Japanese word |
| JP → MM | Japanese word | Myanmar meaning |
| Audio → JP | Hear pronunciation | Japanese word |

**Configuration options:**
- Word source: This Page / Not Studied (incomplete only) / All Words
- Question count: 10, 20, 50, or All

**Quiz experience:**
- Multiple choice with 4 options (1 correct + 3 random distractors)
- Immediate per-answer feedback (green/red highlight)
- Streak counter with flame icon
- Progress bar showing current question number

**Results screen:**
- Final score as percentage with trophy icon
- Motivational message (Perfect / Great / Good / Keep Studying)
- Best streak badge
- Review panel listing all incorrect answers with correct answers and audio playback

### 5.3 Kanji Study

Cards showing:
- Large kanji character (7xl font)
- Stroke count badge
- Onyomi and Kunyomi readings
- English and Myanmar meanings
- Example word in romaji and hiragana
- Contextual description
- Speaker button for pronunciation

### 5.4 Grammar Study

Cards showing:
- Grammar point title (Japanese + Myanmar)
- Explanation in English and Myanmar
- Multiple example sentences each with Japanese, English, Myanmar, and audio button

### 5.5 Reading Comprehension

Accordion-style expandable cards with:
- Passage title in three languages
- Full passage text
- Toggleable English and Myanmar translations
- Multiple-choice comprehension questions
- Answer submission with correct/incorrect feedback
- Score summary
- Reset button to retry

### 5.6 Listening Practice

Same accordion layout as reading, plus:
- Play/Pause button using Web Speech Synthesis API
- Speech rate control (default 0.8×)
- Toggleable transcript
- Toggleable English and Myanmar translations
- Multiple-choice questions with answer checking

### 5.7 Floating Kana Reference Sheet

A persistent Floating Action Button (bottom-right corner) that opens a full reference modal:
- Two tabs: Hiragana and Katakana
- Organized by character row (Vowels, ka-row, sa-row, etc.)
- Combination characters (yōon) section
- Click any character to hear pronunciation
- **Keyboard shortcuts:** `Ctrl+K` or `Ctrl+H` to toggle; `Escape` to close

### 5.8 Visibility Toggles

Global and per-card toggles to show/hide:
- **Romaji** (romanization)
- **English** meaning
- **Myanmar** meaning

Global toggles affect all cards; per-card eye icons override the global setting for individual words.

### 5.9 Pronunciation (Web Speech API)

Used throughout the app for:
- Individual vocabulary words (ja-JP locale, 0.85× rate)
- Kanji characters
- Grammar point titles and example sentences
- Listening exercise audio (0.8× rate by default)
- Kana chart characters

Gracefully degrades if the browser does not support the API.

---

## 6. Data Models

```typescript
// Core lesson structure
LevelProps        // id, title, description, status, lessons[]
LessonProps       // id, level_id, title, route, description, status, icon

// Learning content
VocabularyProps   // word, word_rmj, spelling, meaning, meaning_mm, level_id, status
KanjiProps        // word, word_kana, onyomi, kunyomi, meaning, meaning_mm, strokes, description
GrammarProps      // title, title_mm, explanation_en, explanation_mm, examples[]
GrammarExampleProps  // japanese, english, myanmar

ReadingProps      // title/title_en/title_mm, passage, translation_en/mm, questions[]
ReadingQuestionProps // question/question_en/question_mm, options[], answer

ListeningProps    // title/title_en/title_mm, transcript, translation_en/mm, questions[]
ListeningQuestionProps // question, question_mm, options[], answer

// Foundation characters
BasicCharProps    // kana, romaji, char_row, type, audio, image, gif, status
BasicModuleProps  // id, title, description, status
```

---

## 7. UI/UX Design

### Visual Identity
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F5EDED` | Page background |
| Primary text | `#3E3636` | Headings, body text |
| Accent | `#D72323` | Buttons, borders, active states |
| Success | Emerald (`#10b981`) | Completed cards, correct answers |

### Responsive Layout
- Mobile-first using Tailwind breakpoints (`sm`, `md`, `lg`)
- Card grids: 1 column (mobile) → 2 columns (tablet) → 3–4 columns (desktop)
- Touch-friendly button sizes (minimum 44×44px)

### Interactions
- Card hover: lift animation (`-translate-y-1`) with shadow increase
- Button press: scale-down (`scale-95`)
- Progress bars: smooth width transition (500ms)
- Completion state: card turns emerald with checkmark
- Modal overlays: backdrop blur

### Accessibility
- Semantic HTML heading hierarchy
- `title` attributes on icon-only buttons
- Keyboard navigable with visible focus states
- Escape key closes all modals
- Disabled states with visual feedback (reduced opacity + `cursor-not-allowed`)

---

## 8. localStorage Keys

| Key | Contents |
|-----|----------|
| `kotonoha_vocab_completed_n5` | Set of completed word IDs for N5 |
| `kotonoha_vocab_page_5` | Last visited page number for N5 |

Pattern repeats per level (`n4`, `n3`, `n2`, `n1`).

---

## 9. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Both are required for Supabase connectivity. The app functions without them since content is JSON-based, but they must be set to avoid build warnings.

---

## 10. Development Commands

```bash
npm run dev     # Start dev server with Turbopack (localhost:3000)
npm run build   # Production build
npm start       # Serve production build
npm run lint    # Run ESLint
```

---

## Summary

Kotonoha is a production-ready, feature-complete JLPT preparation platform. All planned features (vocabulary pagination, completion tracking, quiz system, floating kana reference) are implemented. The application is frontend-driven with static JSON content and browser localStorage — no server-side logic is required to run it today. Supabase infrastructure is in place for future features such as user accounts, cloud-synced progress, or dynamic content management.
