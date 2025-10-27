import { motion } from 'framer-motion';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface QuizInputProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  isDisabled?: boolean;
}

export function QuizInput({ value, onChange, onParse, isDisabled }: QuizInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
          <FileText className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Paste Your Quiz</h2>
          <p className="text-sm text-muted-foreground">Enter questions in plain text format</p>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Question 1 of 5&#10;What is 2+2?&#10;A. 3&#10;B. 4&#10;C. 5&#10;D. 6&#10;Answer: B&#10;&#10;Question 2 of 5&#10;The sky is blue. (True or False)&#10;Answer: True"
        className="flex-1 min-h-[400px] resize-none font-mono text-sm shadow-inner"
        disabled={isDisabled}
      />

      <Button
        onClick={onParse}
        disabled={!value.trim() || isDisabled}
        className="mt-4 w-full"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Parse Quiz
      </Button>
    </motion.div>
  );
}
