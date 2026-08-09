import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  StopIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import type { ContentScriptContext } from '#imports';
import { extractArticle, selectedText } from '@/lib/article';
import { usePlayer, type VoiceSettings } from '@/lib/use-player';
import { send } from '@/lib/messages';
import type { Voices } from '@/lib/api';

const CONTENT_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'news', label: 'News' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'education', label: 'Education' },
] as const;

const RATES = [0.75, 1, 1.25, 1.5, 2] as const;

const DEFAULT_SETTINGS: VoiceSettings = {
  speaker: 'shubh',
  contentType: 'general',
  rate: 1,
};

function App({ ctx }: { ctx: ContentScriptContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [voices, setVoices] = useState<Voices | null>(null);
  const [title, setTitle] = useState(() => document.title || 'Untitled page');
  const panelRef = useRef<HTMLElement>(null);

  const player = usePlayer(settings);
  const { status, plan, index, error, progress, prepare, reset, play } = player;
  const isBusy = status === 'preparing';

  // `isolateEvents` stops key events at the shadow root, so Escape is handled
  // on the panel itself — move focus there when it opens.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  // Client-side navigations don't re-run the content script; a new page means
  // the prepared narration no longer matches what's on screen.
  useEffect(() => {
    ctx.addEventListener(window, 'wxt:locationchange', () => {
      setTitle(document.title || 'Untitled page');
      reset();
    });
  }, [ctx, reset]);

  useEffect(() => {
    if (!isOpen || voices) return;
    send({ type: 'voices' })
      .then(setVoices)
      .catch(() => {});
  }, [isOpen, voices]);

  const start = useCallback(async () => {
    const selection = selectedText();
    const article = selection
      ? { title: document.title, text: selection }
      : extractArticle();

    if (!article.text) return;

    setTitle(article.title);
    const next = await prepare({
      text: article.text,
      title: article.title,
      contentType: settings.contentType,
      targetLanguageCode: settings.targetLanguageCode,
    });

    if (next) play();
  }, [prepare, play, settings.contentType, settings.targetLanguageCode]);

  const speakers = voices?.models.find((m) => m.id === 'bulbul:v3')?.speakers;
  const chunkCount = plan?.chunks.length ?? 0;

  if (!isOpen) {
    return (
      <div className="root">
        <button
          type="button"
          className="launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open bakbak"
        >
          <SpeakerWaveIcon className="icon" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="root">
      <section
        ref={panelRef}
        tabIndex={-1}
        className="panel"
        aria-label="bakbak narration player"
        onKeyDown={(event) => event.key === 'Escape' && setIsOpen(false)}
      >
        <header className="panel-header">
          <div className="panel-heading">
            <h2 className="panel-title">bakbak</h2>
            <p className="panel-subtitle" title={title}>
              {title}
            </p>
          </div>
          <button
            type="button"
            className="button-ghost"
            onClick={() => setIsOpen(false)}
            aria-label="Close panel"
          >
            <XMarkIcon className="icon" aria-hidden="true" />
          </button>
        </header>

        <div className="panel-body">
          {error ? (
            <p className="notice" role="alert">
              <ExclamationTriangleIcon className="icon" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}

          <div className="field">
            <label className="field-label" htmlFor="bak-voice">
              Voice
            </label>
            <div className="select-wrap">
              <select
                id="bak-voice"
                name="voice"
                className="select"
                value={settings.speaker}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    speaker: event.target.value as VoiceSettings['speaker'],
                  }))
                }
              >
                {(speakers ?? [settings.speaker]).map((speaker) => (
                  <option key={speaker} value={speaker}>
                    {speaker}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 8 5"
                width="8"
                height="5"
                fill="none"
                className="select-chevron"
                aria-hidden="true"
              >
                <path d="M.5.5 4 4 7.5.5" stroke="currentcolor" />
              </svg>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="bak-language">
              Narrate in
            </label>
            <div className="select-wrap">
              <select
                id="bak-language"
                name="language"
                className="select"
                value={settings.targetLanguageCode ?? ''}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    targetLanguageCode: (event.target.value ||
                      undefined) as VoiceSettings['targetLanguageCode'],
                  }))
                }
              >
                <option value="">Original language</option>
                {(voices?.languages ?? []).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 8 5"
                width="8"
                height="5"
                fill="none"
                className="select-chevron"
                aria-hidden="true"
              >
                <path d="M.5.5 4 4 7.5.5" stroke="currentcolor" />
              </svg>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="bak-tone">
              Tone
            </label>
            <div className="select-wrap">
              <select
                id="bak-tone"
                name="tone"
                className="select"
                value={settings.contentType}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    contentType: event.target
                      .value as VoiceSettings['contentType'],
                  }))
                }
              >
                {CONTENT_TYPES.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 8 5"
                width="8"
                height="5"
                fill="none"
                className="select-chevron"
                aria-hidden="true"
              >
                <path d="M.5.5 4 4 7.5.5" stroke="currentcolor" />
              </svg>
            </div>
          </div>

          <div className="field">
            <span className="field-label" id="bak-speed-label">
              Speed
            </span>
            <div className="rates" role="group" aria-labelledby="bak-speed-label">
              {RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className="rate"
                  aria-pressed={settings.rate === rate}
                  onClick={() => setSettings((prev) => ({ ...prev, rate }))}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          {chunkCount > 0 ? (
            <div className="progress">
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Narration progress"
              >
                <div
                  className="progress-fill"
                  style={{ inlineSize: `${progress}%` }}
                />
              </div>
              <p className="progress-label">
                Part {Math.min(index + 1, chunkCount)} of {chunkCount}
                {plan?.translated ? ` · ${plan.languageCode}` : null}
              </p>
            </div>
          ) : null}
        </div>

        <footer className="panel-footer">
          {status === 'playing' || status === 'paused' ? (
            <button
              type="button"
              className="button-ghost"
              onClick={player.stop}
              aria-label="Stop narration"
            >
              <StopIcon className="icon" aria-hidden="true" />
            </button>
          ) : null}

          <p className="footer-note">
            {status === 'preparing'
              ? 'Preparing narration…'
              : status === 'playing'
                ? 'Playing'
                : status === 'paused'
                  ? 'Paused'
                  : plan
                    ? 'Ready'
                    : 'Press Escape to close.'}
          </p>

          {status === 'playing' ? (
            <button
              type="button"
              className="button-primary"
              onClick={player.pause}
            >
              <PauseIcon className="icon" aria-hidden="true" />
              Pause
            </button>
          ) : status === 'paused' ? (
            <button
              type="button"
              className="button-primary"
              onClick={player.resume}
            >
              <PlayIcon className="icon" aria-hidden="true" />
              Resume
            </button>
          ) : plan ? (
            <button
              type="button"
              className="button-primary"
              onClick={player.play}
            >
              <PlayIcon className="icon" aria-hidden="true" />
              Play
            </button>
          ) : (
            <button
              type="button"
              className="button-primary"
              onClick={start}
              disabled={isBusy}
            >
              {isBusy ? (
                <ArrowPathIcon className="icon icon-spin" aria-hidden="true" />
              ) : (
                <PlayIcon className="icon" aria-hidden="true" />
              )}
              {isBusy ? 'Preparing' : 'Listen'}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export default App;
