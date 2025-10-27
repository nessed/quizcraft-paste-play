import { Question, QuizData } from '@/types/quiz';

export function parseQuizText(text: string): QuizData {
  const lines = text.split('\n').filter(line => line.trim());
  const questions: Question[] = [];
  let currentQuestion: Partial<Question> | null = null;
  let questionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line is a question (starts with number followed by period or parenthesis)
    const questionMatch = line.match(/^(\d+)[\.)]\s*(.+)/);
    
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.question) {
        questions.push(currentQuestion as Question);
      }

      questionCounter++;
      const questionText = questionMatch[2];
      
      // Initialize new question
      currentQuestion = {
        id: `q${questionCounter}`,
        question: questionText,
        type: 'mcq', // Default, will be determined
        options: [],
        correctAnswer: '',
      };

      // Detect question type
      if (questionText.toLowerCase().includes('true or false') || 
          questionText.toLowerCase().includes('(t/f)')) {
        currentQuestion.type = 'truefalse';
      } else if (questionText.toLowerCase().includes('fill in the blank') ||
                 questionText.includes('_____')) {
        currentQuestion.type = 'fillin';
      } else if (questionText.toLowerCase().includes('match the following')) {
        currentQuestion.type = 'match';
      }
    } 
    // Check for MCQ options (A, B, C, D)
    else if (currentQuestion && /^[A-D][\.)]\s*(.+)/i.test(line)) {
      const optionMatch = line.match(/^([A-D])[\.)]\s*(.+)/i);
      if (optionMatch && currentQuestion.type === 'mcq') {
        currentQuestion.options = currentQuestion.options || [];
        currentQuestion.options.push({
          label: optionMatch[1].toUpperCase(),
          text: optionMatch[2].trim(),
        });
      }
    }
    // Check for answer line
    else if (line.toLowerCase().startsWith('answer:') || 
             line.toLowerCase().startsWith('ans:') ||
             line.toLowerCase().startsWith('correct answer:')) {
      const answerText = line.split(':')[1]?.trim() || '';
      
      if (currentQuestion) {
        if (currentQuestion.type === 'match') {
          // Parse comma-separated answers
          currentQuestion.correctAnswer = answerText.split(',').map(a => a.trim());
        } else {
          currentQuestion.correctAnswer = answerText;
        }
      }
    }
  }

  // Don't forget the last question
  if (currentQuestion && currentQuestion.question) {
    questions.push(currentQuestion as Question);
  }

  return {
    questions: questions.filter(q => q.correctAnswer), // Only include questions with answers
  };
}

export function gradeQuiz(questions: Question[]): {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  answers: { questionId: string; isCorrect: boolean }[];
} {
  const answers = questions.map(q => {
    let isCorrect = false;

    if (q.type === 'match' && Array.isArray(q.correctAnswer) && Array.isArray(q.userAnswer)) {
      // For match questions, compare arrays
      isCorrect = q.correctAnswer.length === q.userAnswer.length &&
                  q.correctAnswer.every((ans, idx) => 
                    ans.toLowerCase().trim() === q.userAnswer?.[idx]?.toLowerCase().trim()
                  );
    } else if (typeof q.correctAnswer === 'string' && typeof q.userAnswer === 'string') {
      isCorrect = q.correctAnswer.toLowerCase().trim() === q.userAnswer.toLowerCase().trim();
    }

    return {
      questionId: q.id,
      isCorrect,
    };
  });

  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    correctAnswers,
    score,
    answers,
  };
}
