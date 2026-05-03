import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechSynthesisReturn {
  speak: (text: string, lang?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const frenchVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices — browsers may load them asynchronously
  useEffect(() => {
    if (!isSupported) return;

    const pickFrenchVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer a French (France) voice, fall back to any French voice
      const frFR = voices.find(
        (v) => v.lang === 'fr-FR' && !v.localService === false
      );
      const anyFrench = voices.find((v) => v.lang.startsWith('fr'));
      frenchVoiceRef.current = frFR ?? anyFrench ?? null;
    };

    pickFrenchVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickFrenchVoice);

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        pickFrenchVoice
      );
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string, lang = 'fr-FR') => {
      if (!isSupported || !text.trim()) return;

      // Cancel any ongoing utterance
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      if (frenchVoiceRef.current) {
        utterance.voice = frenchVoiceRef.current;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
