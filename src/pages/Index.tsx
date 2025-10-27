import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QuizInput } from '@/components/QuizInput';
import { QuestionCard } from '@/components/QuestionCard';
import { ResultsPanel } from '@/components/ResultsPanel';
import { PromptBlock } from '@/components/PromptBlock';
import { parseQuizText, gradeQuiz } from '@/utils/quizParser';
import { Question, QuizData } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'quiz-runner-text';

const Index = () => {
  const [quizText, setQuizText] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof gradeQuiz> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setQuizText(saved);
    }
  }, []);

  // Save to localStorage when text changes
  useEffect(() => {
    if (quizText) {
      localStorage.setItem(STORAGE_KEY, quizText);
    }
  }, [quizText]);

  const handleParse = () => {
    try {
      const parsed = parseQuizText(quizText);
      if (parsed.questions.length === 0) {
        toast({
          title: 'No questions found',
          description: 'Please check your quiz format and try again',
          variant: 'destructive',
        });
        return;
      }
      setQuizData(parsed);
      setIsGraded(false);
      setResults(null);
      toast({
        title: 'Quiz parsed!',
        description: `Found ${parsed.questions.length} question${parsed.questions.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Parse error',
        description: 'Failed to parse quiz. Please check the format.',
        variant: 'destructive',
      });
    }
  };

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    if (!quizData) return;
    
    setQuizData({
      ...quizData,
      questions: quizData.questions.map((q) =>
        q.id === questionId ? { ...q, userAnswer: answer } : q
      ),
    });
  };

  const handleSubmit = () => {
    if (!quizData) return;

    const unansweredCount = quizData.questions.filter((q) => !q.userAnswer).length;
    
    if (unansweredCount > 0) {
      toast({
        title: 'Incomplete quiz',
        description: `Please answer all questions (${unansweredCount} remaining)`,
        variant: 'destructive',
      });
      return;
    }

    const gradeResults = gradeQuiz(quizData.questions);
    setResults(gradeResults);
    setIsGraded(true);

    toast({
      title: 'Quiz graded!',
      description: `You scored ${gradeResults.score}%`,
    });
  };

  const handleReset = () => {
    setQuizText('');
    setQuizData(null);
    setIsGraded(false);
    setResults(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Quiz Runner</h1>
              <p className="text-sm text-muted-foreground">Parse, practice, and grade your quizzes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!quizData ? (
          // Input View
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-md">
                <QuizInput
                  value={quizText}
                  onChange={setQuizText}
                  onParse={handleParse}
                />
              </div>
              <div className="space-y-6">
                <PromptBlock />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-card border border-border rounded-xl p-6 shadow-md"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-3">Supported Formats</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong className="text-foreground">Multiple Choice:</strong> Options with A. B. C. D. format</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong className="text-foreground">True/False:</strong> Simple T/F questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong className="text-foreground">Fill-in-the-Blank:</strong> With ___ blanks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong className="text-foreground">Match:</strong> Pair matching questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong className="text-foreground">Answer Key:</strong> Global or per-question</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          // Quiz View
          <div className="max-w-4xl mx-auto space-y-6">
            {!isGraded && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-md"
              >
                <div>
                  <p className="text-sm text-muted-foreground">Questions answered</p>
                  <p className="text-2xl font-bold text-foreground">
                    {quizData.questions.filter((q) => q.userAnswer).length} / {quizData.questions.length}
                  </p>
                </div>
                <Button onClick={handleSubmit} size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Quiz
                </Button>
              </motion.div>
            )}

            {isGraded && results && (
              <ResultsPanel
                totalQuestions={results.totalQuestions}
                correctAnswers={results.correctAnswers}
                score={results.score}
                onReset={handleReset}
              />
            )}

            <div className="space-y-4">
              {quizData.questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onAnswer={(answer) => handleAnswer(question.id, answer)}
                  isGraded={isGraded}
                  isCorrect={
                    isGraded ? results?.answers.find((a) => a.questionId === question.id)?.isCorrect : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Quiz Runner - Made with React, TypeScript, and Framer Motion</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
