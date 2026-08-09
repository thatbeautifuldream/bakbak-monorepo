import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  SparklesIcon,
  StopIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import type { ContentScriptContext } from '#imports';
import { openLogin } from '@/lib/messages';
import { executeWebsiteTool, getWebsiteContext, VoiceClient } from '@/lib/voice-client';

type VoiceState = 'idle' | 'connecting' | 'connected';

function App({ ctx }: { ctx: ContentScriptContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(() => document.title || 'Untitled page');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [lastMessage, setLastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const voiceRef = useRef<VoiceClient | undefined>(undefined);

  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    ctx.addEventListener(window, 'wxt:locationchange', () => {
      setTitle(document.title || 'Untitled page');
      setLastMessage('');
      setError(null);
      voiceRef.current?.stop();
      voiceRef.current = undefined;
      setVoiceState('idle');
    });
  }, [ctx]);

  useEffect(() => () => voiceRef.current?.stop(), []);

  const stop = useCallback(() => {
    voiceRef.current?.stop();
    voiceRef.current = undefined;
    setVoiceState('idle');
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setLastMessage('Starting a private conversation…');
    const client = new VoiceClient({
      onState: (state) => {
        if (state === 'connected') {
          setVoiceState('connected');
          setLastMessage('Listening. Ask me anything about this page.');
        } else if (state === 'connecting') {
          setVoiceState('connecting');
        } else {
          setVoiceState('idle');
        }
      },
      onMessage: (message) => {
        const toolName = message.name ?? message.tool_name;
        if (message.type === 'server.event.tool_call' && toolName) {
          void executeWebsiteTool(toolName, message.arguments ?? message.parameters).then(
            (result) => client.sendToolResult(toolName, result),
          );
        }
        if (message.content) setLastMessage(message.content);
        if (message.text) setLastMessage(message.text);
        if (message.type === 'error') {
          setError(message.message ?? 'The conversation could not start.');
        }
      },
    });
    voiceRef.current = client;
    try {
      await client.start(getWebsiteContext());
    } catch (cause) {
      client.stop();
      voiceRef.current = undefined;
      setVoiceState('idle');
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);

  const hostname = (() => {
    try {
      return new URL(location.href).hostname.replace(/^www\./, '');
    } catch {
      return 'this page';
    }
  })();

  if (!isOpen) {
    return (
      <div className="root">
        <button className="launcher" type="button" onClick={() => setIsOpen(true)} aria-label="Open bakbak voice companion">
          <span className="launcher-orb" aria-hidden="true"><SparklesIcon className="icon" /></span>
          <span className="launcher-label">bakbak</span>
        </button>
      </div>
    );
  }

  const isLive = voiceState === 'connected';

  return (
    <div className="root">
      <section
        ref={panelRef}
        tabIndex={-1}
        className="panel"
        aria-label="bakbak voice companion"
        onKeyDown={(event) => event.key === 'Escape' && setIsOpen(false)}
      >
        <header className="panel-header">
          <div>
            <p className="eyebrow"><span className="eyebrow-mark" />PAGE COMPANION</p>
            <h2 className="panel-title">Talk it through.</h2>
          </div>
          <button className="button-icon" type="button" onClick={() => setIsOpen(false)} aria-label="Close bakbak">
            <XMarkIcon className="icon" aria-hidden="true" />
          </button>
        </header>

        <div className="panel-body">
          <div className="page-context">
            <span className="context-icon"><CheckCircleIcon className="icon" aria-hidden="true" /></span>
            <div className="context-copy">
              <p className="context-label">You are on</p>
              <p className="context-title" title={title}>{title}</p>
            </div>
            <span className="context-host">{hostname}</span>
          </div>

          {error ? (
            <div className="notice" role="alert">
              <ExclamationTriangleIcon className="icon" aria-hidden="true" />
              <p>{error}</p>
              {error.toLowerCase().includes('sign in') ? (
                <button className="notice-login" type="button" onClick={() => void openLogin()}>
                  Login <ArrowTopRightOnSquareIcon className="icon" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : null}

          <div className={`conversation-stage ${isLive ? 'conversation-stage-live' : ''}`}>
            <div className="orb-wrap" aria-hidden="true">
              <span className="orb-halo" />
              <span className="orb"><MicrophoneIcon className="orb-icon" /></span>
            </div>
            <p className="stage-status">
              {voiceState === 'connecting' ? 'Connecting securely' : isLive ? 'Conversation live' : 'Ready when you are'}
            </p>
            <p className="stage-message">{lastMessage || 'Ask about the page, find a detail, or get a quick explanation.'}</p>
            {isLive ? (
              <div className="signal-bars" aria-label="Microphone active">
                {Array.from({ length: 11 }, (_, index) => <span key={index} style={{ '--bar-delay': `${index * 70}ms` } as CSSProperties} />)}
              </div>
            ) : null}
          </div>
        </div>

        <footer className="panel-footer">
          <p className="privacy-note">Mic starts only after you ask. Audio is relayed securely.</p>
          {isLive ? (
            <button className="button-stop" type="button" onClick={stop}>
              <StopIcon className="icon" aria-hidden="true" /> Stop
            </button>
          ) : (
            <button className="button-primary" type="button" onClick={() => void start()} disabled={voiceState === 'connecting'}>
              <MicrophoneIcon className="icon" aria-hidden="true" />
              {voiceState === 'connecting' ? 'Connecting' : 'Start talking'}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export default App;
