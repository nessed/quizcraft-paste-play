import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface ResultsPanelProps {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  onReset: () => void;
}

export function ResultsPanel({ totalQuestions, correctAnswers, score, onReset }: ResultsPanelProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    return 'text-error';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="bg-card border border-border rounded-xl p-8 shadow-xl"
    >
      <div className="text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg"
        >
          <Trophy className="w-8 h-8 text-primary-foreground" />
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Complete!</h2>
        <p className="text-muted-foreground mb-6">Here's how you did:</p>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-foreground">Total Questions</span>
            <span className="font-semibold text-foreground">{totalQuestions}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-foreground">Correct Answers</span>
            <span className="font-semibold text-success">{correctAnswers}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-foreground">Incorrect Answers</span>
            <span className="font-semibold text-error">{totalQuestions - correctAnswers}</span>
          </div>

          <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-sm text-muted-foreground mb-1">Your Score</div>
            <div className={`text-5xl font-bold ${getScoreColor()}`}>{score}%</div>
          </div>
        </div>

        <Button onClick={onReset} className="w-full" size="lg">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start New Quiz
        </Button>
      </div>
    </motion.div>
  );
}
