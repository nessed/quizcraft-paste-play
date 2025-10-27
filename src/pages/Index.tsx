import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizInput } from '@/components/QuizInput';
import { QuestionCard } from '@/components/QuestionCard';
import { ResultsPanel } from '@/components/ResultsPanel';
import { PromptBlock } from '@/components/PromptBlock';
import { QuizSettings } from '@/components/QuizSettings';
import { QuizTimer } from '@/components/QuizTimer';
import { QuizProgress } from '@/components/QuizProgress';
import { parseQuizText, gradeQuiz } from '@/utils/quizParser';
import { Question, QuizData, QuizSettings as QuizSettingsType } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, RotateCcw, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'quiz-runner-text';
const SETTINGS_KEY = 'quiz-runner-settings';

const DEFAULT_SETTINGS: QuizSettingsType = {
  mode: 'test',
  timerEnabled: false,
  timerMinutes: 10,
};

const Index = () => {
  const [quizText, setQuizText] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof gradeQuiz> | null>(null);
  const [settings, setSettings] = useState<QuizSettingsType>(DEFAULT_SETTINGS);
  const [reviewMode, setReviewMode] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedText = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (savedText) {
      setQuizText(savedText);
    }
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        // Use defaults if parse fails
      }
    }
  }, []);

  // Save text to localStorage
  useEffect(() => {
    if (quizText) {
      localStorage.setItem(STORAGE_KEY, quizText);
    }
  }, [quizText]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

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
      setReviewMode(false);
      setTimerStarted(settings.timerEnabled);
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

  const checkAnswer = (questionId: string, answer: string | string[]): boolean => {
    const question = quizData?.questions.find((q) => q.id === questionId);
    if (!question) return false;

    if (question.type === 'match' && Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
      return question.correctAnswer.length === answer.length &&
             question.correctAnswer.every((ans, idx) => 
               ans.toLowerCase().trim() === answer[idx]?.toLowerCase().trim()
             );
    } else if (typeof question.correctAnswer === 'string' && typeof answer === 'string') {
      return question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
    }
    return false;
  };

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    if (!quizData) return;
    
    const isCorrect = settings.mode === 'practice' ? checkAnswer(questionId, answer) : undefined;

    setQuizData({
      ...quizData,
      questions: quizData.questions.map((q) =>
        q.id === questionId 
          ? { ...q, userAnswer: answer, isAnsweredCorrectly: isCorrect } 
          : q
      ),
    });
  };

  const handleFlag = (questionId: string) => {
    if (!quizData) return;
    
    setQuizData({
      ...quizData,
      questions: quizData.questions.map((q) =>
        q.id === questionId ? { ...q, isFlagged: !q.isFlagged } : q
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
    setTimerStarted(false);

    toast({
      title: 'Quiz graded!',
      description: `You scored ${gradeResults.score}%`,
    });
  };

  const handleTimeUp = () => {
    toast({
      title: 'Time is up!',
      description: 'Your quiz will be submitted automatically',
      variant: 'destructive',
    });
    handleSubmit();
  };

  const handleReset = () => {
    setQuizText('');
    setQuizData(null);
    setIsGraded(false);
    setResults(null);
    setReviewMode(false);
    setTimerStarted(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleReviewWrong = () => {
    setReviewMode(true);
  };

  const filteredQuestions = reviewMode && results
    ? quizData?.questions.filter((q) => {
        const result = results.answers.find((a) => a.questionId === q.id);
        return result && !result.isCorrect;
      }) || []
    : quizData?.questions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Quiz Runner</h1>
                <p className="text-sm text-muted-foreground">Parse, practice, and grade your quizzes</p>
              </div>
            </div>
            {!quizData && <QuizSettings settings={settings} onChange={setSettings} />}
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
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left: Quiz Content */}
              <div className="flex-1 space-y-6">
                {!isGraded && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-4 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {settings.mode === 'practice' ? 'Practice Mode' : 'Test Mode'}
                          </p>
                          <p className="text-xl font-bold text-foreground">
                            {quizData.questions.filter((q) => q.userAnswer).length} / {quizData.questions.length}
                          </p>
                        </div>
                        {settings.timerEnabled && timerStarted && (
                          <QuizTimer
                            durationMinutes={settings.timerMinutes}
                            onTimeUp={handleTimeUp}
                            isPaused={false}
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleReset} variant="outline" size="sm">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                        {settings.mode === 'test' && (
                          <Button onClick={handleSubmit} size="sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit Quiz
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {isGraded && results && (
                  <div className="space-y-4">
                    <ResultsPanel
                      totalQuestions={results.totalQuestions}
                      correctAnswers={results.correctAnswers}
                      score={results.score}
                      onReset={handleReset}
                    />
                    {results.correctAnswers < results.totalQuestions && (
                      <Button
                        onClick={handleReviewWrong}
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review Incorrect Answers
                      </Button>
                    )}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <div className="space-y-4">
                    {reviewMode && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4"
                      >
                        <p className="text-sm font-semibold text-error">
                          Reviewing {filteredQuestions.length} incorrect answer
                          {filteredQuestions.length !== 1 ? 's' : ''}
                        </p>
                      </motion.div>
                    )}
                    {filteredQuestions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        onAnswer={(answer) => handleAnswer(question.id, answer)}
                        onFlag={() => handleFlag(question.id)}
                        isGraded={isGraded}
                        isPracticeMode={settings.mode === 'practice'}
                        showFeedback={!!question.userAnswer}
                        isCorrect={
                          isGraded ? results?.answers.find((a) => a.questionId === question.id)?.isCorrect : undefined
                        }
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </div>

              {/* Right: Progress Sidebar */}
              {!isGraded && quizData && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:w-80"
                >
                  <div className="sticky top-24 bg-card border border-border rounded-xl p-6 shadow-md">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Progress</h3>
                    <QuizProgress questions={quizData.questions} />
                  </div>
                </motion.div>
              )}
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
