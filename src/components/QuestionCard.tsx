import { memo } from 'react';
import { motion } from 'framer-motion';
import { Question } from '@/types/quiz';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle2, XCircle, Flag } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  onAnswer: (questionId: string, answer: string | string[]) => void;
  onFlag?: (questionId: string) => void;
  isGraded?: boolean;
  isCorrect?: boolean;
  isPracticeMode?: boolean;
  showFeedback?: boolean;
}

const getQuestionTypeLabel = (type: Question['type']) => {
  switch (type) {
    case 'truefalse':
      return 'True / False';
    case 'fillin':
      return 'Fill in the Blank';
    case 'match':
      return 'Match the Following';
    default:
      return null;
  }
};

const QuestionCardComponent = ({
  question,
  index,
  onAnswer,
  onFlag,
  isGraded,
  isCorrect,
  isPracticeMode,
  showFeedback,
}: QuestionCardProps) => {
  const shouldShowFeedback = isPracticeMode ? showFeedback : isGraded;
  const feedbackIsCorrect = isPracticeMode ? question.isAnsweredCorrectly : isCorrect;

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const isSelected = question.userAnswer === option.label;
              const isCorrectAnswer = shouldShowFeedback && question.correctAnswer === option.label;

              let variant: 'default' | 'outline' | 'destructive' = 'outline';
              if (shouldShowFeedback) {
                if (isCorrectAnswer) {
                  variant = 'default';
                } else if (isSelected && !feedbackIsCorrect) {
                  variant = 'destructive';
                }
              } else if (isSelected) {
                variant = 'default';
              }

              return (
                <Button
                  key={option.label}
                  variant={variant}
                  className="group h-auto w-full justify-start rounded-2xl py-3 px-4 text-left transition-all"
                  onClick={() => !shouldShowFeedback && onAnswer(question.id, option.label)}
                  disabled={shouldShowFeedback}
                >
                  <span className="mr-3 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition group-hover:bg-primary/20">
                    {option.label}.
                  </span>
                  <span className="flex-1 text-sm sm:text-base">{option.text}</span>
                  {shouldShowFeedback && isCorrectAnswer ? (
                    <CheckCircle2 className="ml-2 h-4 w-4 text-success" />
                  ) : null}
                </Button>
              );
            })}
          </div>
        );

      case 'truefalse':
        return (
          <div className="flex gap-3">
            {['True', 'False'].map((option) => {
              const isSelected = question.userAnswer === option;
              const isCorrectAnswer = shouldShowFeedback && question.correctAnswer === option;

              let variant: 'default' | 'outline' | 'destructive' = 'outline';
              if (shouldShowFeedback) {
                if (isCorrectAnswer) {
                  variant = 'default';
                } else if (isSelected && !feedbackIsCorrect) {
                  variant = 'destructive';
                }
              } else if (isSelected) {
                variant = 'default';
              }

              return (
                <Button
                  key={option}
                  variant={variant}
                  className="h-auto flex-1 rounded-xl py-3 text-sm font-medium transition"
                  onClick={() => !shouldShowFeedback && onAnswer(question.id, option)}
                  disabled={shouldShowFeedback}
                >
                  {option}
                  {shouldShowFeedback && isCorrectAnswer ? (
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  ) : null}
                </Button>
              );
            })}
          </div>
        );

      case 'fillin':
        return (
          <div className="space-y-2">
            <Input
              value={(question.userAnswer as string) || ''}
              onChange={(event) => !shouldShowFeedback && onAnswer(question.id, event.target.value)}
              placeholder="Type your answer..."
              disabled={shouldShowFeedback}
              className={
                shouldShowFeedback
                  ? feedbackIsCorrect
                    ? 'border-success bg-success/10'
                    : 'border-error bg-error/10'
                  : ''
              }
            />
            {shouldShowFeedback && !feedbackIsCorrect ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Correct answer: {question.correctAnswer}
              </p>
            ) : null}
          </div>
        );

      case 'match':
        return (
          <div className="space-y-2">
            <Input
              value={
                Array.isArray(question.userAnswer)
                  ? question.userAnswer.join(', ')
                  : (question.userAnswer as string) || ''
              }
              onChange={(event) =>
                !shouldShowFeedback &&
                onAnswer(
                  question.id,
                  event.target.value
                    .split(',')
                    .map((segment) => segment.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Enter pairs separated by commas (e.g., 1:A, 2:B)"
              disabled={shouldShowFeedback}
              className={
                shouldShowFeedback
                  ? feedbackIsCorrect
                    ? 'border-success bg-success/10'
                    : 'border-error bg-error/10'
                  : ''
              }
            />
            {shouldShowFeedback && !feedbackIsCorrect ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Correct answer:{' '}
                {Array.isArray(question.correctAnswer)
                  ? question.correctAnswer.join(', ')
                  : question.correctAnswer}
              </p>
            ) : null}
          </div>
        );

      default:
        return null;
    }
  };

  const questionTypeLabel = getQuestionTypeLabel(question.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -2 }}
      className="rounded-3xl border border-border/60 bg-card/95 p-6 shadow-xl shadow-primary/5 transition-all hover:shadow-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-purple-500 text-base font-semibold text-primary-foreground shadow-md">
            {index + 1}
          </div>
          <div className="space-y-2">
            <p className="text-base font-medium leading-relaxed text-foreground sm:text-lg">
              {question.question}
            </p>
            {questionTypeLabel ? (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {questionTypeLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onFlag ? (
            <Button
              variant={question.isFlagged ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFlag(question.id)}
              className={
                question.isFlagged
                  ? 'border border-primary/40 bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground'
              }
            >
              <Flag className="mr-2 h-4 w-4" />
              {question.isFlagged ? 'Flagged' : 'Flag'}
            </Button>
          ) : null}

          {shouldShowFeedback ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              {feedbackIsCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-error" />
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5">{renderQuestionContent()}</div>

      {question.explanation && shouldShowFeedback ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-5 overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-4"
        >
          <p className="text-sm text-foreground">
            <span className="font-semibold">Explanation:</span> {question.explanation}
          </p>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export const QuestionCard = memo(
  QuestionCardComponent,
  (previous, next) =>
    previous.question === next.question &&
    previous.index === next.index &&
    previous.isGraded === next.isGraded &&
    previous.isCorrect === next.isCorrect &&
    previous.isPracticeMode === next.isPracticeMode &&
    previous.showFeedback === next.showFeedback,
);
