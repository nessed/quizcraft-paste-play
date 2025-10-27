import { motion } from 'framer-motion';
import { Question } from '@/types/quiz';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  onAnswer: (answer: string | string[]) => void;
  isGraded?: boolean;
  isCorrect?: boolean;
}

export function QuestionCard({ question, index, onAnswer, isGraded, isCorrect }: QuestionCardProps) {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <Button
                key={option.label}
                variant={
                  isGraded
                    ? question.userAnswer === option.label
                      ? isCorrect
                        ? 'default'
                        : 'destructive'
                      : 'outline'
                    : question.userAnswer === option.label
                    ? 'default'
                    : 'outline'
                }
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => !isGraded && onAnswer(option.label)}
                disabled={isGraded}
              >
                <span className="font-semibold mr-3">{option.label})</span>
                <span className="flex-1">{option.text}</span>
              </Button>
            ))}
          </div>
        );

      case 'truefalse':
        return (
          <div className="flex gap-3">
            {['True', 'False'].map((option) => (
              <Button
                key={option}
                variant={
                  isGraded
                    ? question.userAnswer === option
                      ? isCorrect
                        ? 'default'
                        : 'destructive'
                      : 'outline'
                    : question.userAnswer === option
                    ? 'default'
                    : 'outline'
                }
                className="flex-1"
                onClick={() => !isGraded && onAnswer(option)}
                disabled={isGraded}
              >
                {option}
              </Button>
            ))}
          </div>
        );

      case 'fillin':
        return (
          <Input
            value={(question.userAnswer as string) || ''}
            onChange={(e) => !isGraded && onAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={isGraded}
            className={
              isGraded
                ? isCorrect
                  ? 'border-success'
                  : 'border-error'
                : ''
            }
          />
        );

      case 'match':
        return (
          <Input
            value={
              Array.isArray(question.userAnswer)
                ? question.userAnswer.join(', ')
                : (question.userAnswer as string) || ''
            }
            onChange={(e) =>
              !isGraded && onAnswer(e.target.value.split(',').map((s) => s.trim()))
            }
            placeholder="Enter answers separated by commas..."
            disabled={isGraded}
            className={
              isGraded
                ? isCorrect
                  ? 'border-success'
                  : 'border-error'
                : ''
            }
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
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
        {isGraded && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-success" />
            ) : (
              <XCircle className="w-6 h-6 text-error" />
            )}
          </div>
        )}
      </div>

      <div className="mt-4">{renderQuestionContent()}</div>

      {isGraded && !isCorrect && (
        <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
          <p className="text-sm text-success-foreground">
            <span className="font-semibold">Correct answer:</span>{' '}
            {Array.isArray(question.correctAnswer)
              ? question.correctAnswer.join(', ')
              : question.correctAnswer}
          </p>
        </div>
      )}
    </motion.div>
  );
}
