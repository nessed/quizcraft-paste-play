import { motion } from 'framer-motion';
import { Copy, Check, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const LLM_PROMPT = `Generate a plain-text quiz in this exact, parser-friendly format:

- Start each question block with: "Question X of N (Type: MCQ|Fill-in|True/False|Match)" (on its own line), then the prompt.
- Only use blanks (___) when the Type is Fill-in. Do not add blanks to MCQ prompts.
- MCQ options exactly like:
  A. option text
  B. option text
  C. option text
  D. option text
- True/False accepted (use an 'Answer: True' or 'Answer: False' line).
- Match: state pairs under a single mapping in either the question block or the final key, e.g., 'Answer: 1:C 2:B 3:A'. If using a final global key, nest it like '4:1:C 2:B 3:A' for Question 4.
- Provide answers either per question as 'Answer: <letter/text>' OR as one final line: 'Answer Key: 1:B, 2:False, 3:decision making, 4:1:C 2:B 3:A, 5:D, ...'.
- Plain text only. No markdown tables, no code fences. Separate questions with a blank line.

Example format:

Question 1 of 5 (Type: MCQ)
What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid
Answer: B

Question 2 of 5 (Type: True/False)
Water boils at 100°C at sea level.
Answer: True

Question 3 of 5 (Type: Fill-in)
Fill in the blank: The process of making choices is called _____.
Answer: decision making

Question 4 of 5 (Type: Match)
Match the following programming languages with their primary use:
1. Python
2. SQL
3. JavaScript
Answer: 1:C 2:B 3:A

Question 5 of 5 (Type: MCQ)
Which data structure uses LIFO?
A. Queue
B. Stack
C. Tree
D. Graph
Answer: B`;

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
      className="bg-card border border-border rounded-xl p-6 shadow-md"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
          <Lightbulb className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">Generate Quizzes with AI</h3>
          <p className="text-sm text-muted-foreground">
            Use this prompt with any LLM (ChatGPT, Claude, Gemini) to generate properly formatted quizzes
          </p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-foreground whitespace-pre-wrap mb-4 border border-border max-h-64 overflow-y-auto">
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
