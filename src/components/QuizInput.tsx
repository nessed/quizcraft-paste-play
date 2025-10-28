import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface QuizInputProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  isDisabled?: boolean;
  parseState?: "idle" | "parsing" | "success" | "error";
}

export function QuizInput({ value, onChange, onParse, isDisabled, parseState = "idle" }: QuizInputProps) {
  const disabled = isDisabled || parseState === "parsing";

  const status =
    parseState === "success"
      ? { icon: CheckCircle2, tone: "success", message: "Quiz parsed successfully. Ready when you are!" }
      : parseState === "error"
      ? { icon: XCircle, tone: "destructive", message: "We could not parse that format. Give it another shot." }
      : null;

  const StatusIcon = status?.icon;

  const ButtonIcon =
    parseState === "parsing"
      ? Loader2
      : parseState === "success"
      ? CheckCircle2
      : parseState === "error"
      ? XCircle
      : Sparkles;

  const buttonLabel =
    parseState === "parsing"
      ? "Parsing…"
      : parseState === "success"
      ? "Parsed!"
      : parseState === "error"
      ? "Try again"
      : "Parse quiz";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-gradient-to-br from-primary to-primary/80 p-2 shadow-sm">
          <FileText className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Paste Your Quiz</h2>
          <p className="text-sm text-muted-foreground">Enter questions in plain text format</p>
        </div>
      </div>

      <AnimatePresence>
        {status ? (
          <motion.div
            key={status.tone}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm",
              status.tone === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
            aria-live="polite"
          >
            {StatusIcon ? <StatusIcon className="h-4 w-4" /> : null}
            <span>{status.message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Question 1 of 5&#10;What is 2+2?&#10;A. 3&#10;B. 4&#10;C. 5&#10;D. 6&#10;Answer: B&#10;&#10;Question 2 of 5&#10;The sky is blue. (True or False)&#10;Answer: True"
        className={cn(
          "flex-1 min-h-[400px] resize-none rounded-2xl border bg-background/60 font-mono text-sm shadow-inner transition focus-visible:outline-none focus-visible:ring-2",
          parseState === "success"
            ? "border-success/30 ring-success/40"
            : parseState === "error"
            ? "border-destructive/30 ring-destructive/40"
            : "border-border/70 ring-primary/40",
        )}
        disabled={disabled}
      />

      <motion.div className="mt-4 w-full" whileTap={{ scale: disabled ? 1 : 0.98 }}>
        <Button
          onClick={onParse}
          disabled={!value.trim() || disabled}
          className="relative w-full overflow-hidden"
          size="lg"
        >
          <motion.span
            initial={false}
            animate={{ opacity: parseState === "parsing" ? 0.8 : 1, scale: parseState === "success" ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent"
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={buttonLabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center justify-center"
            >
              <ButtonIcon className={cn("mr-2 h-4 w-4", parseState === "parsing" ? "animate-spin" : "")} />
              {buttonLabel}
            </motion.span>
          </AnimatePresence>
        </Button>
      </motion.div>
    </motion.div>
  );
}
