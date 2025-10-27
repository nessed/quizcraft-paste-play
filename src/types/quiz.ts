export type QuestionType = 'mcq' | 'truefalse' | 'fillin' | 'match';

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
}

export interface QuizData {
  questions: Question[];
  title?: string;
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
