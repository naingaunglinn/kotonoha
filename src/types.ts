export interface LessonHead {
  vocab : LessonHeadContent
}
export interface LessonHeadContent {
  title : string;
  description : string;
}

export interface LessonProps {
  id: number;
  level_id: number | null;
  title: string | null;
  route: string | null;
  description: string | null;
  status: boolean | null;
  icon: string | null;
}

export interface LevelProps {
  id: number;
  title: string | null;
  description: string | null;
  status: boolean | null;
  lessons: LessonProps[];
}

export interface BasicCharProps {
  id: number;
  basic_module_id: number | null;
  char_row: string | null;
  kana: string | null;
  romaji: string | null;
  type: string | null;
  image: string | null;
  audio: string | null;
  gif: string | null;
  status: boolean | null;
}
export interface BasicModuleProps {
  id: number;
  title: string | null;
  description: string | null;
  status: boolean | null;
}

export interface BasicModuleDataProps {
  id: number;
  title: string | null;
  description: string | null;
  status: boolean | null;
  basic_characters: BasicCharProps[];
}

export interface LessonMenuPageProps {
  level: LevelProps;
  onSelectLesson: (lesson: LessonProps) => void;
}

export interface LessonContentPageProps {
  lesson: LessonProps;
}

export interface VocabularyProps {
  id: number;
  level_id: string | null;
  route: string | null;
  word: string | null;
  word_rmj: string | null;
  spelling: string | null;
  audio: string | null;
  meaning: string | null;
  meaning_mm: string | null;
  status: boolean | null;
}

export interface KanjiProps {
  "level_id": string | null;
  "word": string | null;
  "word_rmj": string | null;
  "word_kana": string | null;
  "description": string | null;
  "onyomi": string | null;
  "kunyomi": string | null;
  "spelling": string | null;
  "meaning": string | null;
  "meaning_mm": string | null;
  "audio": string | null;
  "image": string | null;
  "strokes": string | null;
  "status": boolean | null;
}

export interface GrammarProps {
  level_id: string | null;
  title: string | null;
  title_mm: string | null;
  explanation_mm: string | null;
  explanation_en: string | null;
  examples: GrammarExampleProps[]
  status: boolean | null;
}

export interface GrammarExampleProps {
  japanese: string | null;
  english: string | null;
  myanmar: string | null;
  status: boolean | null;
}

export interface ReadingQuestionProps {
  question: string;
  question_en: string;
  question_mm: string;
  options: string[];
  answer: string;
}

export interface ReadingProps {
  level_id: string;
  title: string;
  title_en: string;
  title_mm: string;
  passage: string;
  translation_en: string;
  translation_mm: string;
  questions: ReadingQuestionProps[];
  status: boolean;
}

export interface ListeningQuestionProps {
  question: string;
  question_mm: string;
  options: string[];
  answer: string;
}

export interface ListeningProps {
  level_id: string;
  title: string;
  title_en: string;
  title_mm: string;
  transcript: string;
  translation_en: string;
  translation_mm: string;
  questions: ListeningQuestionProps[];
  status: boolean;
}
