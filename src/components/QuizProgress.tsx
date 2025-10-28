import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Flag } from 'lucide-react';
import { Question } from '@/types/quiz';

interface QuizProgressProps {
  questions: Question[];
  currentIndex?: number;
  onJumpTo?: (index: number) => void;
}

export function QuizProgress({ questions, currentIndex, onJumpTo }: QuizProgressProps) {
  const answeredCount = questions.filter((q) => q.userAnswer).length;
  const flaggedCount = questions.filter((q) => q.isFlagged).length;
  const progress = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const progressClamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={answeredCount}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="font-semibold text-foreground"
            >
              {answeredCount} / {questions.length}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-muted/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressClamped}%` }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-purple-500"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: progress > 0 ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-white/20 via-transparent to-transparent mix-blend-soft-light"
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
        <AnimatePresence initial={false}>
          {flaggedCount > 0 ? (
            <motion.div
              key="flagged"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Flag className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{flaggedCount}</span> flagged
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Question Grid */}
      {onJumpTo && questions.length <= 50 && (
        <div className="grid grid-cols-10 gap-2">
          {questions.map((q, idx) => (
            <motion.button
              key={q.id}
              onClick={() => onJumpTo(idx)}
              className={`aspect-square rounded-md border-2 flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 ${
                currentIndex === idx
                  ? 'border-primary bg-primary text-primary-foreground'
                  : q.userAnswer
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border bg-card text-muted-foreground hover:border-primary'
              }`}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -2 }}
            >
              {q.isFlagged && (
                <Flag className="w-3 h-3 absolute -top-1 -right-1" fill="currentColor" />
              )}
              {idx + 1}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
