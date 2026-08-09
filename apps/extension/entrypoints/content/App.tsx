import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  StopIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import type { ContentScriptContext } from '#imports';
import { extractArticle, selectedText } from '@/lib/article';
import { usePlayer } from '@/lib/use-player';
import { openLogin } from '@/lib/messages';

function App({ ctx }: { ctx: ContentScriptContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(() => document.title || 'Untitled page');
  const panelRef = useRef<HTMLElement>(null);

  const player = usePlayer();
  const {
    status,
    chunks,
    index,
    error,
    requiresLogin,
    progress,
    prepare,
    reset,
    play,
  } = player;
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

  const start = useCallback(async () => {
    const selection = selectedText();
    const article = selection
      ? { title: document.title, text: selection }
      : extractArticle();

    if (!article.text) return;

    setTitle(article.title);
    const next = await prepare(article.text);

    if (next) play();
  }, [prepare, play]);

  const chunkCount = chunks.length;

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
            <div className="notice" role="alert">
              <ExclamationTriangleIcon className="icon" aria-hidden="true" />
              <span className="notice-message">{error}</span>
              {requiresLogin ? (
                <button
                  type="button"
                  className="notice-login"
                  onClick={() => void openLogin()}
                >
                  Login
                  <ArrowTopRightOnSquareIcon className="icon" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : null}

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
                  : chunks.length
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
          ) : chunks.length ? (
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
