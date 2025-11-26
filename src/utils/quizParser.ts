import { ParseWarning, Question, QuizData } from '@/types/quiz';

export function parseQuizText(text: string): QuizData {
  const lines = text.split('\n').map(line => line.trim());
  const parsedQuestions: Question[] = [];
  const warnings: ParseWarning[] = [];
  const warn = (code: ParseWarning['code'], message: string, details?: string) => {
    warnings.push({ code, message, details });
  };
  
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

        if (!Number.isFinite(questionNum) || !answer) {
          warn('invalid_answer_key_pair', 'Found an incomplete entry in the answer key.', pair);
          return;
        }

        globalAnswerKey.set(questionNum, answer);
      } else if (pair) {
        warn('invalid_answer_key_pair', 'Found an answer key entry without a question number.', pair);
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
  
  const seenQuestionNumbers = new Set<number>();

  const finalizeQuestion = () => {
    if (!currentQuestion || !currentQuestion.question) {
      return;
    }

    if (seenQuestionNumbers.has(questionNumber)) {
      warn('duplicate_question_number', 'Found a duplicate question number. The later entry was skipped.', `Question ${questionNumber}`);
      return;
    }

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

    if (!currentQuestion.correctAnswer || (Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.length === 0)) {
      warn('missing_answer', 'A question was skipped because no answer was provided.', currentQuestion.question);
      return;
    }

    if (currentQuestion.type === 'mcq' && (!currentQuestion.options || currentQuestion.options.length < 2)) {
      warn('mcq_option_shortfall', 'Multiple-choice question missing options was removed.', currentQuestion.question);
      return;
    }

    seenQuestionNumbers.add(questionNumber);
    parsedQuestions.push(currentQuestion as Question);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) continue;

    // Check for "Question X of N" format
    if (/^Question\s+\d+\s+of\s+\d+/i.test(line)) {
      // Save previous question
      finalizeQuestion();

      const match = line.match(/^Question\s+(\d+)\s+of\s+\d+/i);
      questionNumber = match ? parseInt(match[1]) : questionNumber + 1;

      // Next line should be the actual question
      i++;
      if (i < lines.length) {
        const questionText = lines[i].trim();

        if (!questionText) {
          warn('missing_question_text', 'A question header was found without a prompt.', `Question ${questionNumber}`);
          currentQuestion = null;
          continue;
        }

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
      } else {
        warn('missing_question_text', 'A question header was found without a prompt.', `Question ${questionNumber}`);
      }
    }
    // Check for MCQ options such as "A. option", "A) option", or "A: option"
    else if (currentQuestion && /^[A-D][\.\):]\s+(.+)/i.test(line)) {
      const optionMatch = line.match(/^([A-D])[\.\):]\s+(.+)/i);
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

      if (!answerText) {
        warn('missing_answer', 'An answer label was present but empty.', currentQuestion.question);
        continue;
      }

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
    // Orphaned answer line without a question context
    else if (!currentQuestion && line.toLowerCase().startsWith('answer:')) {
      warn('orphan_answer', 'Answer text appeared before any question header.', line);
    }
    // Orphaned option without a question context
    else if (!currentQuestion && /^[A-D][\.\):]\s+(.+)/i.test(line)) {
      warn('orphan_option', 'Choice text appeared before any question header.', line);
    }
  }

  // Don't forget the last question
  finalizeQuestion();

  const unmatchedAnswerKeys = Array.from(globalAnswerKey.keys()).filter(key => !seenQuestionNumbers.has(key));
  if (unmatchedAnswerKeys.length > 0) {
    warn(
      'unused_answer_key_entries',
      'Some answer key entries did not match any parsed question numbers.',
      unmatchedAnswerKeys.join(', ')
    );
  }

  if (totalQuestions && parsedQuestions.length !== totalQuestions) {
    warn(
      'count_mismatch',
      'The declared question count did not match what was parsed.',
      `Expected ${totalQuestions}, parsed ${parsedQuestions.length}`
    );
  }

  return {
    questions: parsedQuestions,
    warnings,
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
