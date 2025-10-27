import { Question, QuizData } from '@/types/quiz';

export function parseQuizText(text: string): QuizData {
  const lines = text.split('\n').map(line => line.trim());
  const questions: Question[] = [];
  
  // First, check if there's a global Answer Key at the end
  let globalAnswerKey: Map<number, string> = new Map();
  const answerKeyLineIndex = lines.findIndex(line => 
    line.toLowerCase().startsWith('answer key:')
  );
  
  if (answerKeyLineIndex !== -1) {
    const answerKeyText = lines[answerKeyLineIndex].substring(11).trim(); // Remove "Answer Key:"
    const keyPairs = answerKeyText.split(',').map(s => s.trim());
    
    keyPairs.forEach(pair => {
      const colonIndex = pair.indexOf(':');
      if (colonIndex !== -1) {
        const questionNum = parseInt(pair.substring(0, colonIndex).trim());
        const answer = pair.substring(colonIndex + 1).trim();
        globalAnswerKey.set(questionNum, answer);
      }
    });
    
    // Remove answer key line from processing
    lines.splice(answerKeyLineIndex, 1);
  }
  
  let currentQuestion: Partial<Question> | null = null;
  let questionNumber = 0;
  let totalQuestions = 0;
  
  // First pass: count total questions
  for (const line of lines) {
    if (/^Question\s+\d+\s+of\s+\d+/i.test(line)) {
      const match = line.match(/^Question\s+\d+\s+of\s+(\d+)/i);
      if (match) {
        totalQuestions = parseInt(match[1]);
        break;
      }
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line) continue;
    
    // Check for "Question X of N" format
    if (/^Question\s+\d+\s+of\s+\d+/i.test(line)) {
      // Save previous question
      if (currentQuestion && currentQuestion.question) {
        // Get answer from global key if no local answer
        if (!currentQuestion.correctAnswer && globalAnswerKey.has(questionNumber)) {
          const answer = globalAnswerKey.get(questionNumber)!;
          currentQuestion.correctAnswer = answer;
        }
        questions.push(currentQuestion as Question);
      }
      
      const match = line.match(/^Question\s+(\d+)\s+of\s+\d+/i);
      questionNumber = match ? parseInt(match[1]) : questionNumber + 1;
      
      // Next line should be the actual question
      i++;
      if (i < lines.length) {
        const questionText = lines[i].trim();
        
        currentQuestion = {
          id: `q${questionNumber}`,
          question: questionText,
          type: 'mcq', // Default
          options: [],
          correctAnswer: '',
        };
        
        // Detect question type
        if (questionText.toLowerCase().includes('true or false') || 
            questionText.toLowerCase().includes('(t/f)')) {
          currentQuestion.type = 'truefalse';
        } else if (questionText.toLowerCase().includes('fill in the blank') ||
                   questionText.includes('_____') ||
                   questionText.includes('___')) {
          currentQuestion.type = 'fillin';
        } else if (questionText.toLowerCase().includes('match the following')) {
          currentQuestion.type = 'match';
        }
      }
    }
    // Check for MCQ options with period (A. option)
    else if (currentQuestion && /^[A-D]\.\s+(.+)/i.test(line)) {
      const optionMatch = line.match(/^([A-D])\.\s+(.+)/i);
      if (optionMatch && currentQuestion.type === 'mcq') {
        currentQuestion.options = currentQuestion.options || [];
        currentQuestion.options.push({
          label: optionMatch[1].toUpperCase(),
          text: optionMatch[2].trim(),
        });
      }
    }
    // Check for per-question answer
    else if (currentQuestion && line.toLowerCase().startsWith('answer:')) {
      const answerText = line.substring(7).trim(); // Remove "Answer:"
      
      if (currentQuestion.type === 'match') {
        // Parse match answer - could be "1:C 2:B 3:A" format
        if (answerText.includes(':')) {
          const pairs = answerText.split(/\s+/);
          currentQuestion.correctAnswer = pairs.map(pair => {
            const [, value] = pair.split(':');
            return value;
          });
        } else {
          currentQuestion.correctAnswer = answerText.split(',').map(a => a.trim());
        }
      } else {
        currentQuestion.correctAnswer = answerText;
      }
    }
  }
  
  // Don't forget the last question
  if (currentQuestion && currentQuestion.question) {
    if (!currentQuestion.correctAnswer && globalAnswerKey.has(questionNumber)) {
      const answer = globalAnswerKey.get(questionNumber)!;
      
      // Handle match questions in global key (format: "1:C 2:B 3:A")
      if (currentQuestion.type === 'match' && answer.includes(':')) {
        const pairs = answer.split(/\s+/);
        currentQuestion.correctAnswer = pairs.map(pair => {
          const [, value] = pair.split(':');
          return value;
        });
      } else {
        currentQuestion.correctAnswer = answer;
      }
    }
    questions.push(currentQuestion as Question);
  }
  
  return {
    questions: questions.filter(q => q.correctAnswer && 
      (Array.isArray(q.correctAnswer) ? q.correctAnswer.length > 0 : q.correctAnswer !== '')),
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
