import { useEffect, useRef, useState } from 'react';
import {
  BoltIcon,
  CheckIcon,
  ClipboardIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import type { ContentScriptContext } from '#imports';

interface PageDetails {
  title: string;
  hostname: string;
  path: string;
}

function readPageDetails(): PageDetails {
  return {
    title: document.title || 'Untitled page',
    hostname: location.hostname,
    path: location.pathname + location.search,
  };
}

function App({ ctx }: { ctx: ContentScriptContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState(readPageDetails);
  const [hasCopied, setHasCopied] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  // `isolateEvents` stops key events at the shadow root, so Escape is handled
  // on the panel itself — move focus there when it opens.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  // Client-side navigations don't re-run the content script, so keep the
  // panel in sync with WXT's synthetic location change event.
  useEffect(() => {
    ctx.addEventListener(window, 'wxt:locationchange', () =>
      setDetails(readPageDetails()),
    );
  }, [ctx]);

  useEffect(() => {
    if (!hasCopied) return;
    const timeout = ctx.setTimeout(() => setHasCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [ctx, hasCopied]);

  const copyDetails = async () => {
    await navigator.clipboard.writeText(`${details.title}\n${location.href}`);
    setHasCopied(true);
  };

  if (!isOpen) {
    return (
      <div className="root">
        <button
          type="button"
          className="launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open bakbak"
        >
          <BoltIcon className="icon" aria-hidden="true" />
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
        aria-label="bakbak"
        onKeyDown={(event) => event.key === 'Escape' && setIsOpen(false)}
      >
        <header className="panel-header">
          <div>
            <h2 className="panel-title">bakbak</h2>
            <p className="panel-subtitle">
              Injected on every page from a shadow root.
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
          <dl className="details">
            <div>
              <dt className="detail-term">Title</dt>
              <dd className="detail-value">{details.title}</dd>
            </div>
            <div>
              <dt className="detail-term">Host</dt>
              <dd className="detail-value">{details.hostname}</dd>
            </div>
            <div>
              <dt className="detail-term">Path</dt>
              <dd className="detail-value">{details.path}</dd>
            </div>
          </dl>
        </div>

        <footer className="panel-footer">
          <p className="footer-note">Press Escape to close.</p>
          <button type="button" className="button-primary" onClick={copyDetails}>
            {hasCopied ? (
              <CheckIcon className="icon" aria-hidden="true" />
            ) : (
              <ClipboardIcon className="icon" aria-hidden="true" />
            )}
            {hasCopied ? 'Copied' : 'Copy page'}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default App;
