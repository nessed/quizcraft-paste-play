import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CheckCircle,
  RotateCcw,
  Eye,
  Sparkles,
  Timer as TimerIcon,
  Flag,
  Zap,
  Wand2,
  Gauge,
} from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'quiz-runner-text';
const SETTINGS_KEY = 'quiz-runner-settings';

const DEFAULT_SETTINGS: QuizSettingsType = {
  mode: 'test',
  timerEnabled: false,
  timerMinutes: 10,
};

const HERO_FEATURES: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Wand2,
    title: 'Paste anything',
    description: 'Drop in classroom exams, certification drills, or AI-generated sets in seconds.',
  },
  {
    icon: Zap,
    title: 'Adaptive practice',
    description: 'Practice mode shows live feedback, while test mode keeps results until you submit.',
  },
  {
    icon: Gauge,
    title: 'Focus on mastery',
    description: 'Flag tough questions, enable a timer, and review only the misses after grading.',
  },
];

const SAMPLE_QUIZ = `Question 1 of 6
What is the powerhouse of the cell?
A. Nucleus
B. Mitochondria
C. Endoplasmic reticulum
D. Ribosome
Answer: B

Question 2 of 6
Which HTML tag is used to define the largest heading?
A. <heading>
B. <h6>
C. <h1>
D. <head>
Answer: C

Question 3 of 6
Water freezes at 0 deg C. (True or False)
Answer: True

Question 4 of 6
Fill in the blank: React components must return a single _____ element.
Answer: root

Question 5 of 6
Match the programming language with its primary strength:
1. Python
2. SQL
3. TypeScript
Answer: 1:C 2:B 3:A

Question 6 of 6
Which data structure uses FIFO order?
A. Stack
B. Tree
C. Queue
D. Graph
Answer: C`;

type QuickStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: 'primary' | 'success' | 'warning';
};

const accentIconClasses: Record<NonNullable<QuickStatCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary dark:bg-primary/15',
  success: 'bg-success/10 text-success dark:bg-success/20',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
};

const QuickStatCard = ({ icon: Icon, label, value, hint, accent = 'primary' }: QuickStatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-5 shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl"
  >
    <div className="absolute -top-16 right-0 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition group-hover:bg-primary/10" />
    <div className="relative flex items-start gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentIconClasses[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  </motion.div>
);

const Index = () => {
  const [quizText, setQuizText] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof gradeQuiz> | null>(null);
  const [settings, setSettings] = useState<QuizSettingsType>(DEFAULT_SETTINGS);
  const [reviewMode, setReviewMode] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    const savedText = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);

    if (savedText) {
      setQuizText(savedText);
    }
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        // Ignore invalid settings payloads and continue with defaults.
      }
    }
  }, []);

  useEffect(() => {
    if (quizText) {
      localStorage.setItem(STORAGE_KEY, quizText);
    }
  }, [quizText]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleParse = useCallback(() => {
    try {
      const parsed = parseQuizText(quizText);
      if (parsed.questions.length === 0) {
        toast({
          title: 'No questions found',
          description: 'Please check your quiz format and try again.',
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
        title: 'Quiz ready!',
        description: `Loaded ${parsed.questions.length} question${parsed.questions.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: 'Parse error',
        description: 'Failed to understand the quiz text. Double-check the format.',
        variant: 'destructive',
      });
    }
  }, [quizText, settings.timerEnabled]);

  const evaluateAnswer = useCallback((question: Question, answer: string | string[]): boolean => {
    if (question.type === 'match' && Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
      if (question.correctAnswer.length !== answer.length) {
        return false;
      }

      return question.correctAnswer.every(
        (expected, index) => expected.toLowerCase().trim() === answer[index]?.toLowerCase().trim(),
      );
    }

    if (typeof question.correctAnswer === 'string' && typeof answer === 'string') {
      return question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
    }

    return false;
  }, []);

  const handleAnswer = useCallback(
    (questionId: string, answer: string | string[]) => {
      const isPracticeMode = settings.mode === 'practice';

      setQuizData((previous) => {
        if (!previous) {
          return previous;
        }

        const nextQuestions = previous.questions.map((question) => {
          if (question.id !== questionId) {
            return question;
          }

          return {
            ...question,
            userAnswer: answer,
            isAnsweredCorrectly: isPracticeMode ? evaluateAnswer(question, answer) : undefined,
          };
        });

        return {
          ...previous,
          questions: nextQuestions,
        };
      });
    },
    [evaluateAnswer, settings.mode],
  );

  const handleFlag = useCallback((questionId: string) => {
    setQuizData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        questions: previous.questions.map((question) =>
          question.id === questionId ? { ...question, isFlagged: !question.isFlagged } : question,
        ),
      };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!quizData) {
      return;
    }

    const unansweredCount = quizData.questions.filter((question) => !question.userAnswer).length;

    if (unansweredCount > 0) {
      toast({
        title: 'Incomplete quiz',
        description: `Please answer all questions (${unansweredCount} remaining).`,
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
      description: `You scored ${gradeResults.score}%.`,
    });
  }, [quizData]);

  const handleTimeUp = useCallback(() => {
    if (!quizData) {
      return;
    }

    setIsGraded(true);
    const gradeResults = gradeQuiz(quizData.questions);
    setResults(gradeResults);
    setTimerStarted(false);
    toast({
      title: 'Time is up',
      description: 'Your responses were submitted automatically.',
    });
  }, [quizData]);

  const handleReset = useCallback(() => {
    setQuizText('');
    setQuizData(null);
    setIsGraded(false);
    setResults(null);
    setReviewMode(false);
    setTimerStarted(false);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: 'Workspace cleared',
      description: 'Start fresh or load the sample quiz to explore features faster.',
    });
  }, []);

  const handleReviewWrong = useCallback(() => {
    setReviewMode(true);
  }, []);

  const handleLoadSample = useCallback(() => {
    setQuizText(SAMPLE_QUIZ);
    setQuizData(null);
    setIsGraded(false);
    setResults(null);
    setReviewMode(false);
    setTimerStarted(false);
    toast({
      title: 'Sample quiz loaded',
      description: 'Hit "Parse Quiz" to try the workflow with curated questions.',
    });
  }, []);

  const filteredQuestions = useMemo<Question[]>(() => {
    if (!quizData) {
      return [];
    }

    if (reviewMode && results) {
      return quizData.questions.filter((question) => {
        const answer = results.answers.find((entry) => entry.questionId === question.id);
        return answer && !answer.isCorrect;
      });
    }

    return quizData.questions;
  }, [quizData, reviewMode, results]);

  const answeredCount = useMemo(() => {
    if (!quizData) {
      return 0;
    }
    return quizData.questions.reduce((count, question) => count + (question.userAnswer ? 1 : 0), 0);
  }, [quizData]);

  const flaggedCount = useMemo(() => {
    if (!quizData) {
      return 0;
    }
    return quizData.questions.filter((question) => question.isFlagged).length;
  }, [quizData]);

  const totalQuestions = quizData?.questions.length ?? 0;
  const completionPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const accuracyPercent = useMemo(() => {
    if (!quizData) {
      return null;
    }
    if (isGraded && results) {
      return results.score;
    }
    if (settings.mode === 'practice') {
      const attempted = quizData.questions.filter((question) => question.userAnswer).length;
      if (!attempted) {
        return null;
      }
      const correct = quizData.questions.filter((question) => question.isAnsweredCorrectly).length;
      return Math.round((correct / attempted) * 100);
    }
    return null;
  }, [quizData, isGraded, results, settings.mode]);

  const canReset = Boolean(quizText || quizData);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background/95 to-background pb-16">
      <motion.div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[640px] -translate-x-1/2 rounded-[50%] bg-primary/20 blur-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 right-12 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      <div className="relative z-10">
        <header className="border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-purple-500 text-sm font-semibold text-primary-foreground shadow-md">
                QR
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Quiz Runner</p>
                <p className="text-sm text-muted-foreground">Transform pasted exams into a polished practice hub.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleLoadSample}>
                <Sparkles className="mr-2 h-4 w-4" />
                Load demo quiz
              </Button>
              <QuizSettings settings={settings} onChange={setSettings} />
              <Button variant="outline" size="sm" onClick={handleReset} disabled={!canReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10">
          {!quizData ? (
            <div className="space-y-10">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/90 p-8 shadow-2xl backdrop-blur"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" />
                      Smart quiz parsing
                    </div>
                    <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                      Paste any quiz text and get a user-ready practice experience instantly.
                    </h1>
                    <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                      Auto-saved drafts, timer support, review mode, and beautiful question cards make prepping fast and
                      focused.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button size="lg" onClick={handleLoadSample}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Explore with sample data
                      </Button>
                      <Button size="lg" variant="outline" onClick={handleParse} disabled={!quizText.trim()}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Parse current quiz
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {HERO_FEATURES.map(({ icon: Icon, title, description }) => (
                      <div
                        key={title}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/60 px-4 py-3 backdrop-blur dark:border-white/5 dark:bg-slate-900/70"
                      >
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{title}</p>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                <motion.div
                  layout
                  className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur"
                >
                  <QuizInput value={quizText} onChange={setQuizText} onParse={handleParse} isDisabled={false} />
                </motion.div>

                <div className="space-y-6">
                  <motion.div
                    layout
                    className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur"
                  >
                    <PromptBlock />
                  </motion.div>

                  <motion.div
                    layout
                    className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6 shadow-inner backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Tune your run</h3>
                        <p className="text-sm text-muted-foreground">
                          Switch between practice and test mode, or add a countdown timer before parsing.
                        </p>
                      </div>
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4">
                      <QuizSettings settings={settings} onChange={setSettings} />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <section className="grid gap-4 lg:grid-cols-3">
                <QuickStatCard
                  icon={BookOpen}
                  label="Progress"
                  value={`${answeredCount}/${totalQuestions}`}
                  hint={totalQuestions ? `${completionPercent}% complete` : 'Awaiting responses'}
                />
                <QuickStatCard
                  icon={TimerIcon}
                  label="Timer"
                  value={
                    settings.timerEnabled
                      ? `${settings.timerMinutes} minute${settings.timerMinutes === 1 ? '' : 's'}`
                      : 'Timer off'
                  }
                  hint={
                    settings.timerEnabled ? (timerStarted ? 'Counting down' : 'Paused') : 'Enable the timer in settings'
                  }
                  accent={settings.timerEnabled ? 'warning' : 'primary'}
                />
                <QuickStatCard
                  icon={Flag}
                  label="Flags"
                  value={flaggedCount ? `${flaggedCount}` : 'None'}
                  hint={flaggedCount ? 'Review flagged questions later' : 'Mark questions to revisit'}
                  accent={flaggedCount ? 'primary' : 'success'}
                />
              </section>

              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  {!isGraded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl backdrop-blur"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                              {settings.mode === 'practice' ? 'Practice mode' : 'Test mode'}
                            </p>
                            <p className="text-2xl font-semibold text-foreground">
                              {answeredCount} / {totalQuestions} answered
                            </p>
                          </div>
                          {settings.timerEnabled && timerStarted && (
                            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                              <TimerIcon className="h-5 w-5 text-primary" />
                              <QuizTimer durationMinutes={settings.timerMinutes} onTimeUp={handleTimeUp} isPaused={false} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={handleReset} variant="outline" size="sm">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                          </Button>
                          {settings.mode === 'test' && (
                            <Button onClick={handleSubmit} size="sm">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Submit quiz
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {isGraded && results && (
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-success/30 bg-success/10 p-6 shadow-lg backdrop-blur"
                      >
                        <ResultsPanel
                          totalQuestions={results.totalQuestions}
                          correctAnswers={results.correctAnswers}
                          score={results.score}
                          onReset={handleReset}
                        />
                        {results.correctAnswers < results.totalQuestions && (
                          <Button onClick={handleReviewWrong} variant="outline" className="mt-4 w-full">
                            <Eye className="mr-2 h-4 w-4" />
                            Review incorrect answers
                          </Button>
                        )}
                      </motion.div>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    <div className="space-y-4">
                      {reviewMode && filteredQuestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4"
                        >
                          <p className="text-sm font-semibold text-destructive-foreground">
                            Reviewing {filteredQuestions.length} incorrect answer
                            {filteredQuestions.length !== 1 ? 's' : ''}.
                          </p>
                        </motion.div>
                      )}

                      {filteredQuestions.map((question, index) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          index={index}
                          onAnswer={handleAnswer}
                          onFlag={handleFlag}
                          isGraded={isGraded}
                          isPracticeMode={settings.mode === 'practice'}
                          showFeedback={!!question.userAnswer}
                          isCorrect={
                            isGraded
                              ? results?.answers.find((answer) => answer.questionId === question.id)?.isCorrect
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                </div>

                <motion.aside
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="sticky top-24 space-y-6">
                    <div className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl backdrop-blur">
                      <h3 className="text-lg font-semibold text-foreground">Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        Jump to any question or see which ones still need attention.
                      </p>
                      <div className="mt-4">
                        <QuizProgress questions={quizData.questions} />
                      </div>
                    </div>

                    {typeof accuracyPercent === 'number' && (
                      <div className="rounded-3xl border border-success/20 bg-success/10 p-5 shadow-lg backdrop-blur">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <div>
                            <p className="text-sm font-semibold text-success">Accuracy so far</p>
                            <p className="text-xl font-semibold text-success">{accuracyPercent}%</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-success/80">
                          {isGraded
                            ? 'Final score based on submitted answers.'
                            : 'Practice feedback updates as you answer.'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.aside>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-border/70 bg-background/80 py-8 backdrop-blur">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            Quiz Runner - Built with React, TypeScript, and Framer Motion - You are ready to ship quizzes to learners.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
