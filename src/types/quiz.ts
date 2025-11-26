export type QuestionType = 'mcq' | 'truefalse' | 'fillin' | 'match';
export type QuizMode = 'practice' | 'test';

export interface MCQOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: MCQOption[]; // For MCQ
  correctAnswer: string | string[]; // Single for most, array for match
  userAnswer?: string | string[];
  isFlagged?: boolean;
  isAnsweredCorrectly?: boolean; // For practice mode
  explanation?: string; // Optional explanation
}

export interface ParseWarning {
  code:
    | 'missing_question_text'
    | 'duplicate_question_number'
    | 'missing_answer'
    | 'mcq_option_shortfall'
    | 'unused_answer_key_entries'
    | 'count_mismatch'
    | 'orphan_answer'
    | 'orphan_option'
    | 'invalid_answer_key_pair';
  message: string;
  details?: string;
}

export interface QuizData {
  questions: Question[];
  title?: string;
  warnings?: ParseWarning[];
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  answers: {
    questionId: string;
    isCorrect: boolean;
  }[];
}

export interface QuizSettings {
  mode: QuizMode;
  timerEnabled: boolean;
  timerMinutes: number;
}
