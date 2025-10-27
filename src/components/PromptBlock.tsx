import { motion } from 'framer-motion';
import { Copy, Check, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const LLM_PROMPT = `Create a quiz with 5-10 questions in the following format:

1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct option letter]

2. [True/False question text] (True or False)
Answer: [True or False]

3. Fill in the blank: [Question with _____ for blank]
Answer: [Correct answer]

4. Match the following: [List items to match, separated by commas]
Answer: [Correct matches, separated by commas]

Make sure to follow this exact format for best results!`;

export function PromptBlock() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LLM_PROMPT);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'LLM prompt copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">Generate Quizzes with AI</h3>
          <p className="text-sm text-muted-foreground">
            Use this prompt with any LLM (ChatGPT, Claude, Gemini) to generate properly formatted quizzes
          </p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm text-foreground whitespace-pre-wrap mb-4 border border-border">
        {LLM_PROMPT}
      </div>

      <Button onClick={handleCopy} variant="outline" className="w-full" disabled={copied}>
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy Prompt
          </>
        )}
      </Button>
    </motion.div>
  );
}
