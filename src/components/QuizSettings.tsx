import { motion } from 'framer-motion';
import { Settings, Timer, Zap, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { QuizSettings as QuizSettingsType } from '@/types/quiz';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface QuizSettingsProps {
  settings: QuizSettingsType;
  onChange: (settings: QuizSettingsType) => void;
}

export function QuizSettings({ settings, onChange }: QuizSettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quiz Settings</DialogTitle>
          <DialogDescription>
            Customize your quiz experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quiz Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={settings.mode === 'practice' ? 'default' : 'outline'}
                onClick={() => onChange({ ...settings, mode: 'practice' })}
                className="h-auto flex-col gap-2 py-4"
              >
                <Zap className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-semibold">Practice</div>
                  <div className="text-xs opacity-80">Instant feedback</div>
                </div>
              </Button>
              <Button
                variant={settings.mode === 'test' ? 'default' : 'outline'}
                onClick={() => onChange({ ...settings, mode: 'test' })}
                className="h-auto flex-col gap-2 py-4"
              >
                <Target className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-semibold">Test</div>
                  <div className="text-xs opacity-80">Grade at end</div>
                </div>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.mode === 'practice' 
                ? 'See correct answers immediately after answering each question'
                : 'Traditional test mode - submit all answers at once'}
            </p>
          </div>

          {/* Timer Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="timer" className="text-base font-semibold flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Timer
              </Label>
              <Switch
                id="timer"
                checked={settings.timerEnabled}
                onCheckedChange={(checked) =>
                  onChange({ ...settings, timerEnabled: checked })
                }
              />
            </div>
            
            {settings.timerEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="minutes" className="text-sm">
                  Duration (minutes)
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  min="1"
                  max="180"
                  value={settings.timerMinutes}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      timerMinutes: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                />
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
