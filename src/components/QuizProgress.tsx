import { motion } from 'framer-motion';
import { CheckCircle, Circle, Flag } from 'lucide-react';
import { Question } from '@/types/quiz';

interface QuizProgressProps {
  questions: Question[];
  currentIndex?: number;
  onJumpTo?: (index: number) => void;
}

export function QuizProgress({ questions, currentIndex, onJumpTo }: QuizProgressProps) {
  const answeredCount = questions.filter((q) => q.userAnswer).length;
  const flaggedCount = questions.filter((q) => q.isFlagged).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-semibold">
            {answeredCount} / {questions.length}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-primary/80"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{answeredCount}</span> answered
          </span>
        </div>
        {flaggedCount > 0 && (
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{flaggedCount}</span> flagged
            </span>
          </div>
        )}
      </div>

      {/* Question Grid */}
      {onJumpTo && questions.length <= 50 && (
        <div className="grid grid-cols-10 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onJumpTo(idx)}
              className={`aspect-square rounded-md border-2 flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 ${
                currentIndex === idx
                  ? 'border-primary bg-primary text-primary-foreground'
                  : q.userAnswer
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border bg-card text-muted-foreground hover:border-primary'
              }`}
            >
              {q.isFlagged && (
                <Flag className="w-3 h-3 absolute -top-1 -right-1" fill="currentColor" />
              )}
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
