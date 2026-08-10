"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: { [index: number]: { transcript: string }; length: number };
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function VoiceRecorder({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string, durationSeconds: number) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startTimeRef = useRef<number>(0);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (i === event.results.length - 1 && event.results[i].length === 1) {
          interimText += transcript;
        } else {
          finalTranscriptRef.current += transcript + " ";
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || disabled) return;
    finalTranscriptRef.current = "";
    setInterim("");
    startTimeRef.current = Date.now();
    setListening(true);
    recognitionRef.current.start();
  }, [disabled]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const text = (finalTranscriptRef.current + interim).trim();
    if (text.length >= 10) {
      onTranscript(text, duration);
    }
    setInterim("");
  }, [interim, onTranscript]);

  if (!supported) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Voice input requires Chrome or Edge. Use text mode or type your spoken answer below.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-brand-300 bg-brand-50/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">Voice interview mode</p>
          <p className="text-xs text-gray-500">
            Speak your answer as in a real interview. We transcribe and evaluate.
          </p>
        </div>
        {listening ? (
          <button type="button" onClick={stop} className="btn-primary bg-red-600 hover:bg-red-700">
            ■ Stop recording
          </button>
        ) : (
          <button type="button" onClick={start} disabled={disabled} className="btn-primary">
            ● Start speaking
          </button>
        )}
      </div>
      {listening && (
        <div className="flex items-center gap-2 text-sm text-brand-700">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Listening…
        </div>
      )}
      {(interim || finalTranscriptRef.current) && (
        <p className="text-sm italic text-gray-600">
          {finalTranscriptRef.current}
          {interim}
        </p>
      )}
    </div>
  );
}
