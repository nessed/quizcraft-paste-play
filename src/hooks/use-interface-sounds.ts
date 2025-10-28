import { useCallback, useMemo, useRef } from "react";

type Tone = {
  frequency: number;
  type?: OscillatorType;
  duration?: number;
  delay?: number;
  volume?: number;
  attack?: number;
  release?: number;
  detune?: number;
};

const DEFAULTS = {
  duration: 0.22,
  volume: 0.14,
  attack: 0.015,
  release: 0.18,
} as const;

export type InterfaceSounds = {
  playPrimary: () => void;
  playSuccess: () => void;
  playError: () => void;
  playSelect: () => void;
  playAnswerCorrect: () => void;
  playAnswerIncorrect: () => void;
  playFlag: (isActive: boolean) => void;
  playAchievement: () => void;
};

type UseInterfaceSoundsOptions = {
  muted?: boolean;
};

export function useInterfaceSounds(options: UseInterfaceSoundsOptions = {}): InterfaceSounds {
  const { muted = false } = options;
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass: typeof AudioContext | undefined =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!contextRef.current) {
      contextRef.current = new AudioContextClass();
    }

    return contextRef.current;
  }, []);

  const playTones = useCallback(
    (tones: Tone[]) => {
      if (muted) {
        return;
      }

      const context = getContext();

      if (!context) {
        return;
      }

      if (context.state === "suspended") {
        void context.resume();
      }

      const now = context.currentTime;

      tones.forEach((tone) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const startTime = now + (tone.delay ?? 0);
        const attackTime = tone.attack ?? DEFAULTS.attack;
        const releaseTime = tone.release ?? DEFAULTS.release;
        const duration = tone.duration ?? DEFAULTS.duration;
        const maxVolume = tone.volume ?? DEFAULTS.volume;

        oscillator.type = tone.type ?? "sine";
        oscillator.frequency.setValueAtTime(tone.frequency, startTime);

        if (typeof tone.detune === "number") {
          oscillator.detune.setValueAtTime(tone.detune, startTime);
        }

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + attackTime);
        gainNode.gain.setValueAtTime(maxVolume, startTime + duration);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration + releaseTime);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration + releaseTime + 0.05);
      });
    },
    [getContext, muted],
  );

  const playPrimary = useCallback(() => {
    playTones([
      { frequency: 260, type: "triangle", duration: 0.12, volume: 0.12, attack: 0.01 },
      { frequency: 390, type: "triangle", delay: 0.06, duration: 0.1, volume: 0.08 },
    ]);
  }, [playTones]);

  const playSuccess = useCallback(() => {
    playTones([
      { frequency: 440, type: "sine", duration: 0.18, volume: 0.16 },
      { frequency: 660, type: "sine", delay: 0.08, duration: 0.18, volume: 0.12 },
      { frequency: 880, type: "sine", delay: 0.16, duration: 0.22, volume: 0.1 },
    ]);
  }, [playTones]);

  const playError = useCallback(() => {
    playTones([
      { frequency: 220, type: "sawtooth", duration: 0.18, volume: 0.12, attack: 0.005 },
      { frequency: 160, type: "sawtooth", delay: 0.05, duration: 0.22, volume: 0.1 },
    ]);
  }, [playTones]);

  const playSelect = useCallback(() => {
    playTones([
      { frequency: 320, type: "triangle", duration: 0.1, volume: 0.09 },
      { frequency: 420, type: "triangle", delay: 0.04, duration: 0.12, volume: 0.07 },
    ]);
  }, [playTones]);

  const playAnswerCorrect = useCallback(() => {
    playTones([
      { frequency: 520, type: "sine", duration: 0.14, volume: 0.15 },
      { frequency: 760, type: "sine", delay: 0.07, duration: 0.2, volume: 0.12 },
      { frequency: 1020, type: "triangle", delay: 0.16, duration: 0.16, volume: 0.09 },
    ]);
  }, [playTones]);

  const playAnswerIncorrect = useCallback(() => {
    playTones([
      { frequency: 360, type: "triangle", duration: 0.16, volume: 0.12 },
      { frequency: 220, type: "triangle", delay: 0.06, duration: 0.22, volume: 0.1 },
    ]);
  }, [playTones]);

  const playFlag = useCallback(
    (isActive: boolean) => {
      if (isActive) {
        playTones([
          { frequency: 600, type: "triangle", duration: 0.12, volume: 0.11 },
          { frequency: 820, type: "triangle", delay: 0.05, duration: 0.12, volume: 0.09 },
        ]);
      } else {
        playTones([
          { frequency: 300, type: "triangle", duration: 0.12, volume: 0.08 },
        ]);
      }
    },
    [playTones],
  );

  const playAchievement = useCallback(() => {
    playTones([
      { frequency: 540, type: "sine", duration: 0.2, volume: 0.16 },
      { frequency: 720, type: "triangle", delay: 0.12, duration: 0.2, volume: 0.13 },
      { frequency: 960, type: "sine", delay: 0.24, duration: 0.28, volume: 0.12 },
      { frequency: 1240, type: "triangle", delay: 0.36, duration: 0.3, volume: 0.1 },
    ]);
  }, [playTones]);

  return useMemo(
    () => ({
      playPrimary,
      playSuccess,
      playError,
      playSelect,
      playAnswerCorrect,
      playAnswerIncorrect,
      playFlag,
      playAchievement,
    }),
    [
      playAnswerCorrect,
      playAnswerIncorrect,
      playAchievement,
      playError,
      playFlag,
      playPrimary,
      playSelect,
      playSuccess,
    ],
  );
}
