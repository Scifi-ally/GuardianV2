import { useCallback, useRef } from "react";

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playEmergencySound = useCallback(async () => {
    try {
      // Initialize AudioContext if not already done
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Create emergency alert sound (high-pitched beeps)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Emergency sound pattern: High pitch, urgent pattern
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      oscillator.type = "sine";

      // Volume envelope for urgency
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.11,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.21,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("Could not play emergency sound:", error);
    }
  }, []);

  const playWarningSound = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Warning sound: Lower pitch, single beep
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.2,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.warn("Could not play warning sound:", error);
    }
  }, []);

  const playSuccessSound = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Success sound: Rising tone
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(
        600,
        audioContext.currentTime + 0.1,
      );
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.15,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn("Could not play success sound:", error);
    }
  }, []);

  return {
    playEmergencySound,
    playWarningSound,
    playSuccessSound,
  };
}
