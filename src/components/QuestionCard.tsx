import { motion } from 'framer-motion';
import { Question } from '@/types/quiz';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle2, XCircle, Flag } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  onAnswer: (answer: string | string[]) => void;
  onFlag?: () => void;
  isGraded?: boolean;
  isCorrect?: boolean;
  isPracticeMode?: boolean;
  showFeedback?: boolean;
}

export function QuestionCard({ 
  question, 
  index, 
  onAnswer, 
  onFlag,
  isGraded, 
  isCorrect,
  isPracticeMode,
  showFeedback 
}: QuestionCardProps) {
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
                  className="w-full justify-start text-left h-auto py-3 px-4 transition-all"
                  onClick={() => !shouldShowFeedback && onAnswer(option.label)}
                  disabled={shouldShowFeedback}
                >
                  <span className="font-semibold mr-3">{option.label}.</span>
                  <span className="flex-1">{option.text}</span>
                  {shouldShowFeedback && isCorrectAnswer && (
                    <CheckCircle2 className="w-4 h-4 ml-2 text-success" />
                  )}
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
                  className="flex-1"
                  onClick={() => !shouldShowFeedback && onAnswer(option)}
                  disabled={shouldShowFeedback}
                >
                  {option}
                  {shouldShowFeedback && isCorrectAnswer && (
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  )}
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
              onChange={(e) => !shouldShowFeedback && onAnswer(e.target.value)}
              placeholder="Type your answer..."
              disabled={shouldShowFeedback}
              className={
                shouldShowFeedback
                  ? feedbackIsCorrect
                    ? 'border-success bg-success/5'
                    : 'border-error bg-error/5'
                  : ''
              }
            />
            {shouldShowFeedback && !feedbackIsCorrect && (
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Correct answer: {question.correctAnswer}
              </p>
            )}
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
              onChange={(e) =>
                !shouldShowFeedback && onAnswer(e.target.value.split(',').map((s) => s.trim()))
              }
              placeholder="Enter answers separated by commas..."
              disabled={shouldShowFeedback}
              className={
                shouldShowFeedback
                  ? feedbackIsCorrect
                    ? 'border-success bg-success/5'
                    : 'border-error bg-error/5'
                  : ''
              }
            />
            {shouldShowFeedback && !feedbackIsCorrect && (
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Correct answer: {Array.isArray(question.correctAnswer) 
                  ? question.correctAnswer.join(', ')
                  : question.correctAnswer}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="bg-card border border-border rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold shadow-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-foreground font-medium leading-relaxed">{question.question}</p>
          {question.type !== 'mcq' && (
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {question.type === 'truefalse'
                ? 'True/False'
                : question.type === 'fillin'
                ? 'Fill in the Blank'
                : 'Match the Following'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onFlag && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFlag}
              className={question.isFlagged ? 'text-primary' : 'text-muted-foreground'}
            >
              <Flag className="w-4 h-4" fill={question.isFlagged ? 'currentColor' : 'none'} />
            </Button>
          )}
          {shouldShowFeedback && (
            <div className="flex-shrink-0">
              {feedbackIsCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <XCircle className="w-6 h-6 text-error" />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">{renderQuestionContent()}</div>

      {question.explanation && shouldShowFeedback && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
        >
          <p className="text-sm text-foreground">
            <span className="font-semibold">Explanation:</span> {question.explanation}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
