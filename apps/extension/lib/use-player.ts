import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from './api';
import type { Plan, PlanRequest, SpeakRequest } from './api';
import { send } from './messages';

export type PlayerStatus =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'error';

export interface VoiceSettings {
  speaker: SpeakRequest['speaker'];
  targetLanguageCode?: PlanRequest['targetLanguageCode'];
  contentType: NonNullable<PlanRequest['contentType']>;
  rate: number;
}

const MIME_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  opus: 'audio/ogg; codecs=opus',
  flac: 'audio/flac',
  aac: 'audio/aac',
  linear16: 'audio/wav',
  mulaw: 'audio/basic',
  alaw: 'audio/basic',
};

const toBlobUrl = (base64: string, codec: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(
    new Blob([bytes], { type: MIME_TYPES[codec] ?? 'application/octet-stream' }),
  );
};

export function usePlayer(settings: VoiceSettings) {
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef(new Map<number, Promise<string>>());
  const planRef = useRef<Plan | null>(null);
  // Read inside async callbacks and the once-bound `ended` listener, so they
  // always see current values rather than the render they were created in.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  // The ref leads and state follows: chunk transitions happen faster than
  // React re-renders, so callers must never read a stale index.
  const indexRef = useRef(index);

  const moveTo = useCallback((next: number) => {
    indexRef.current = next;
    setIndex(next);
  }, []);

  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  const releaseCache = useCallback(() => {
    for (const pending of cacheRef.current.values()) {
      pending.then(URL.revokeObjectURL).catch(() => {});
    }
    cacheRef.current.clear();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      releaseCache();
    };
  }, [releaseCache]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = settings.rate;
  }, [settings.rate]);

  const audioFor = useCallback((chunkIndex: number) => {
    const current = planRef.current;
    const chunk = current?.chunks[chunkIndex];
    if (!current || !chunk) return null;

    const cached = cacheRef.current.get(chunkIndex);
    if (cached) return cached;

    const pending = send({
      type: 'speak',
      body: {
        text: chunk.text,
        languageCode: current.languageCode,
        speaker: settingsRef.current.speaker,
      },
    }).then((speech) => toBlobUrl(speech.audio, speech.codec));

    // Don't cache a rejection — a retry should be able to re-request.
    pending.catch(() => cacheRef.current.delete(chunkIndex));
    cacheRef.current.set(chunkIndex, pending);
    return pending;
  }, []);

  const playIndex = useCallback(
    async (chunkIndex: number) => {
      const audio = audioRef.current;
      const current = planRef.current;
      if (!audio || !current) return;

      if (chunkIndex >= current.chunks.length) {
        setStatus('ready');
        moveTo(0);
        return;
      }

      moveTo(chunkIndex);
      setStatus('playing');

      try {
        const url = await audioFor(chunkIndex);
        if (!url) return;

        audio.src = url;
        audio.playbackRate = settingsRef.current.rate;
        await audio.play();

        // Warm the next chunk so playback continues without a gap.
        void audioFor(chunkIndex + 1);
      } catch (cause) {
        // A pause() during an in-flight play() rejects; that isn't an error.
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        const needsLogin = cause instanceof ApiError && cause.status === 401;
        setRequiresLogin(needsLogin);
        setError(
          needsLogin
            ? 'Sign in to listen to this page.'
            : cause instanceof Error
              ? cause.message
              : String(cause),
        );
        setStatus('error');
      }
    },
    [audioFor],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => void playIndex(indexRef.current + 1);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [playIndex]);

  const prepare = useCallback(
    async (body: PlanRequest) => {
      setStatus('preparing');
      setError(null);
      setRequiresLogin(false);
      releaseCache();
      moveTo(0);

      try {
        const next = await send({ type: 'plan', body });
        planRef.current = next;
        setPlan(next);
        setStatus('ready');
        return next;
      } catch (cause) {
        const needsLogin = cause instanceof ApiError && cause.status === 401;
        setRequiresLogin(needsLogin);
        setError(
          needsLogin
            ? 'Sign in to listen to this page.'
            : cause instanceof Error
              ? cause.message
              : String(cause),
        );
        setStatus('error');
        return null;
      }
    },
    [releaseCache, moveTo],
  );

  const play = useCallback(() => void playIndex(indexRef.current), [playIndex]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.src) {
      void audio.play();
      setStatus('playing');
    } else {
      void playIndex(indexRef.current);
    }
  }, [playIndex]);

  const seek = useCallback(
    (chunkIndex: number) => {
      audioRef.current?.pause();
      void playIndex(chunkIndex);
    },
    [playIndex],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    moveTo(0);
    setStatus(planRef.current ? 'ready' : 'idle');
  }, [moveTo]);

  const reset = useCallback(() => {
    audioRef.current?.pause();
    releaseCache();
    planRef.current = null;
    setPlan(null);
    moveTo(0);
    setStatus('idle');
    setError(null);
    setRequiresLogin(false);
  }, [releaseCache, moveTo]);

  // A different voice invalidates every rendered chunk.
  useEffect(() => {
    releaseCache();
  }, [settings.speaker, releaseCache]);

  const progress = useMemo(() => {
    if (!plan?.chunks.length) return 0;
    return Math.round((index / plan.chunks.length) * 100);
  }, [plan, index]);

  return {
    status,
    plan,
    index,
    error,
    requiresLogin,
    progress,
    prepare,
    play,
    pause,
    resume,
    seek,
    stop,
    reset,
  };
}
