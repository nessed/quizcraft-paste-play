import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuizTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export function QuizTimer({ durationMinutes, onTimeUp, isPaused }: QuizTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp, isPaused]);

  useEffect(() => {
    // Warn when 1 minute remaining
    if (secondsRemaining === 60 && !hasWarned) {
      setHasWarned(true);
      toast({
        title: 'Time Warning',
        description: 'Only 1 minute remaining!',
        variant: 'destructive',
      });
    }
  }, [secondsRemaining, hasWarned]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isLowTime = secondsRemaining <= 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: isLowTime ? [1, 1.05, 1] : 1,
      }}
      transition={isLowTime ? { repeat: Infinity, duration: 1 } : {}}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
        isLowTime
          ? 'bg-error/10 border-error text-error'
          : 'bg-card border-border text-foreground'
      }`}
    >
      {isLowTime ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span className="font-mono text-lg font-semibold">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </motion.div>
  );
}
