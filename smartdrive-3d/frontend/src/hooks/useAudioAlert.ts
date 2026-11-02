import { useEffect, useRef, useState, useCallback } from 'react';
import { SafetyStatus } from '../types';

export function useAudioAlert() {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  const currentAlarmOscRef = useRef<OscillatorNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Synthesize pleasant 2-tone chime for Caution
  const playCautionChime = useCallback(() => {
    if (isMuted) return;
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 2500) return; // 2.5s cooldown
    lastAlertTimeRef.current = now;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12); // E6

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {
      // Audio autoplay policy
    }
  }, [isMuted, getAudioContext]);

  // Synthesize urgent emergency buzzer for Danger
  const playDangerSiren = useCallback(() => {
    if (isMuted) return;
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 1200) return; // 1.2s cooldown
    lastAlertTimeRef.current = now;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(2200, ctx.currentTime);
      gain1.gain.setValueAtTime(0.22, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.13);

      // Pulse 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(2600, ctx.currentTime + 0.14);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.14);
      osc2.stop(ctx.currentTime + 0.29);
    } catch (e) {
      // Audio autoplay policy
    }
  }, [isMuted, getAudioContext]);

  const triggerSoundForStatus = useCallback(
    (status: SafetyStatus) => {
      if (status === 'DANGER') {
        playDangerSiren();
      } else if (status === 'CAUTION') {
        playCautionChime();
      }
    },
    [playDangerSiren, playCautionChime]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    playCautionChime,
    playDangerSiren,
    triggerSoundForStatus,
  };
}
