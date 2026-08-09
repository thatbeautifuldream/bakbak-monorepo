import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from './api';
import { splitText } from './chunk';
import { send } from './messages';

export type PlayerStatus =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'error';

const toAudioUrl = (encoded: string) => {
  const base64 = encoded.replace(/^data:[^,]+,/, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const type =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
      ? 'audio/wav'
      : (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
          (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0)
        ? 'audio/mpeg'
        : bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53
          ? 'audio/ogg'
          : bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43
            ? 'audio/flac'
            : null;

  if (!type) throw new Error('TTS returned an unsupported audio format');
  return `data:${type};base64,${base64}`;
};

export function usePlayer() {
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [chunks, setChunks] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef(new Map<number, Promise<string>>());
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(index);

  const moveTo = useCallback((next: number) => {
    indexRef.current = next;
    setIndex(next);
  }, []);

  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  const releaseCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      releaseCache();
    };
  }, [releaseCache]);

  const audioFor = useCallback((chunkIndex: number) => {
    const text = chunksRef.current[chunkIndex];
    if (!text) return null;

    const cached = cacheRef.current.get(chunkIndex);
    if (cached) return cached;

    const pending = send({
      type: 'speak',
      body: {
        text,
      },
    }).then((speech) => toAudioUrl(speech.audio));

    pending.catch(() => cacheRef.current.delete(chunkIndex));
    cacheRef.current.set(chunkIndex, pending);
    return pending;
  }, []);

  const playIndex = useCallback(
    async (chunkIndex: number) => {
      const audio = audioRef.current;
      if (!audio || !chunksRef.current.length) return;

      if (chunkIndex >= chunksRef.current.length) {
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
        await audio.play();
        void audioFor(chunkIndex + 1);
      } catch (cause) {
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
    [audioFor, moveTo],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => void playIndex(indexRef.current + 1);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [playIndex]);

  const prepare = useCallback(
    async (text: string) => {
      setStatus('preparing');
      setError(null);
      setRequiresLogin(false);
      releaseCache();
      moveTo(0);

      const next = splitText(text);
      if (!next.length) {
        setError('No text found on this page');
        setStatus('error');
        return false;
      }

      chunksRef.current = next;
      setChunks(next);
      setStatus('ready');
      return true;
    },
    [moveTo, releaseCache],
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

  const stop = useCallback(() => {
    audioRef.current?.pause();
    moveTo(0);
    setStatus(chunksRef.current.length ? 'ready' : 'idle');
  }, [moveTo]);

  const reset = useCallback(() => {
    audioRef.current?.pause();
    releaseCache();
    chunksRef.current = [];
    setChunks([]);
    moveTo(0);
    setStatus('idle');
    setError(null);
    setRequiresLogin(false);
  }, [releaseCache, moveTo]);

  const progress = useMemo(
    () => (chunks.length ? Math.round((index / chunks.length) * 100) : 0),
    [chunks.length, index],
  );

  return {
    status,
    chunks,
    index,
    error,
    requiresLogin,
    progress,
    prepare,
    play,
    pause,
    resume,
    stop,
    reset,
  };
}
