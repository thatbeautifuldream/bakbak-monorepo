import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  MinusIcon,
  StopIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import type { ContentScriptContext } from "#imports";
import { openLogin } from "@/lib/messages";
import {
  describeWebsiteTool,
  executeWebsiteTool,
  getWebsiteContext,
  VoiceClient,
} from "@/lib/voice-client";

type VoiceState = "idle" | "connecting" | "connected";
type Entry = { id: number; kind: "user" | "agent" | "action"; text: string };

const CLOSE_MS = 150;
const METER_BARS = 5;
const TUCK_KEY = "bakbak:tucked";

const stateLabel: Record<VoiceState, string> = {
  idle: "Ready",
  connecting: "Connecting",
  connected: "Listening",
};

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Swaps its own text with a blur-and-rise so the parent never re-renders for it. */
function StateLabel({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(label);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || previous.current === label) return;
    previous.current = label;
    element.classList.add("is-exit");
    const timer = setTimeout(() => {
      element.textContent = label;
      element.classList.remove("is-exit");
      element.classList.add("is-enter-start");
      void element.offsetHeight;
      element.classList.remove("is-enter-start");
    }, 150);
    return () => clearTimeout(timer);
  }, [label]);

  return (
    <span className="t-text-swap state-label">{previous.current}</span>
  );
}

/** Rolling window of real mic amplitude — owns its state so audio chunks don't re-render the panel. */
function Meter({
  subscribe,
}: {
  subscribe: (listener: (level: number) => void) => () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history: number[] = Array(METER_BARS).fill(0);
    return subscribe((level) => {
      history.shift();
      history.push(level);
      const bars = ref.current?.children;
      if (!bars) return;
      for (let index = 0; index < bars.length; index++) {
        (bars[index] as HTMLElement).style.setProperty(
          "--level",
          (history[index] ?? 0).toFixed(3),
        );
      }
    });
  }, [subscribe]);

  return (
    <div className="meter" ref={ref} aria-hidden="true">
      {Array.from({ length: METER_BARS }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

/** Ring around the collapsed launcher, sized by the same real mic level the panel meter uses. */
function LiveRing({
  subscribe,
}: {
  subscribe: (listener: (level: number) => void) => () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      subscribe((level) =>
        ref.current?.style.setProperty("--level", level.toFixed(3)),
      ),
    [subscribe],
  );

  return <span className="live-ring" ref={ref} aria-hidden="true" />;
}

function App({ ctx }: { ctx: ContentScriptContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isTucked, setIsTucked] = useState(false);
  const [title, setTitle] = useState(() => document.title || "Untitled page");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const voiceRef = useRef<VoiceClient | undefined>(undefined);
  const entryId = useRef(0);
  const levelListener = useRef<((level: number) => void) | undefined>(
    undefined,
  );

  const subscribeToLevel = useCallback((listener: (level: number) => void) => {
    levelListener.current = listener;
    return () => {
      if (levelListener.current === listener) levelListener.current = undefined;
    };
  }, []);

  const isLive = voiceState === "connected";

  const append = useCallback((kind: Entry["kind"], text: string) => {
    setEntries((current) => {
      const last = current.at(-1);
      if (kind !== "action" && last?.kind === kind) {
        return [...current.slice(0, -1), { ...last, text }];
      }
      return [...current, { id: ++entryId.current, kind, text }];
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
    const frame = requestAnimationFrame(() => setIsRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [entries]);

  useEffect(() => {
    if (!isLive) return;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    ctx.addEventListener(window, "wxt:locationchange", () => {
      setTitle(document.title || "Untitled page");
      setEntries([]);
      setError(null);
      voiceRef.current?.stop();
      voiceRef.current = undefined;
      setVoiceState("idle");
    });
  }, [ctx]);

  useEffect(() => () => voiceRef.current?.stop(), []);

  useEffect(() => {
    void browser.storage.local
      .get(TUCK_KEY)
      .then((stored) => setIsTucked(stored[TUCK_KEY] === true));
  }, []);

  const tuck = useCallback((tucked: boolean) => {
    setIsTucked(tucked);
    void browser.storage.local.set({ [TUCK_KEY]: tucked });
  }, []);

  const close = useCallback(() => {
    setIsRevealed(false);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsOpen(false);
    }, CLOSE_MS);
  }, []);

  const stop = useCallback(() => {
    voiceRef.current?.stop();
    voiceRef.current = undefined;
    setVoiceState("idle");
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const client = new VoiceClient({
      onState: (state) =>
        setVoiceState(state === "closed" ? "idle" : state),
      onLevel: (level) => levelListener.current?.(level),
      onMessage: (message) => {
        const toolName = message.name ?? message.tool_name;
        if (message.type === "server.event.tool_call" && toolName) {
          const args = message.arguments ?? message.parameters;
          const action = describeWebsiteTool(toolName, args);
          if (action) append("action", action);
          void executeWebsiteTool(toolName, args).then((result) =>
            client.sendToolResult(toolName, result),
          );
        }
        const text = message.content ?? message.text;
        if (text) append(message.role === "user" ? "user" : "agent", text);
        if (message.type === "error") {
          setError(message.message ?? "The conversation could not start.");
        }
      },
      onError: setError,
    });
    voiceRef.current = client;
    try {
      await client.start(getWebsiteContext());
    } catch (cause) {
      client.stop();
      voiceRef.current = undefined;
      setVoiceState("idle");
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [append]);

  const hostname = (() => {
    try {
      return new URL(location.href).hostname.replace(/^www\./, "");
    } catch {
      return "this page";
    }
  })();

  if (!isOpen) {
    if (isTucked) {
      return (
        <div className="root root-tucked">
          <button
            className="nub"
            type="button"
            onClick={() => tuck(false)}
            aria-label={isLive ? "Show Bakbak, session live" : "Show Bakbak"}
          >
            {isLive ? <span className="nub-dot" aria-hidden="true" /> : null}
          </button>
        </div>
      );
    }

    return (
      <div className="root">
        <div className="dock">
          <button
            className="button-tuck"
            type="button"
            onClick={() => tuck(true)}
            aria-label="Hide Bakbak"
          >
            <ChevronRightIcon className="icon" aria-hidden="true" />
          </button>
          <span className="t-tt-wrap">
            <button
              className={`launcher t-tt-trigger ${isLive ? "launcher-live" : ""}`}
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label={isLive ? "Open Bakbak, session live" : "Open Bakbak"}
            >
              <MicrophoneIcon className="icon" aria-hidden="true" />
              {isLive ? <LiveRing subscribe={subscribeToLevel} /> : null}
            </button>
            <span className="t-tt" role="tooltip">
              {isLive ? `Bakbak · ${formatDuration(seconds)}` : "Bakbak"}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="root">
      <section
        ref={panelRef}
        tabIndex={-1}
        data-origin="bottom-right"
        className={`panel t-dropdown ${isClosing ? "is-closing" : isRevealed ? "is-open" : ""}`}
        aria-label="Bakbak"
        onKeyDown={(event) => event.key === "Escape" && close()}
      >
        <header className="panel-header">
          <span
            className={`state-dot ${isLive ? "state-dot-live" : ""}`}
            aria-hidden="true"
          />
          <p className="state" role="status">
            {voiceState === "connecting" ? (
              <span className="t-shimmer" data-text="Connecting">
                Connecting
              </span>
            ) : (
              <StateLabel label={stateLabel[voiceState]} />
            )}
          </p>
          {isLive ? <time className="elapsed">{formatDuration(seconds)}</time> : null}
          <button
            className="button-ghost"
            type="button"
            onClick={close}
            aria-label={isLive ? "Minimise, keep session running" : "Close Bakbak"}
          >
            {isLive ? (
              <MinusIcon className="icon" aria-hidden="true" />
            ) : (
              <XMarkIcon className="icon" aria-hidden="true" />
            )}
          </button>
        </header>

        <div className="scope">
          <p className="scope-title" title={title}>
            {title}
          </p>
          <span className="scope-host">{hostname}</span>
        </div>

        {entries.length === 0 ? (
          <div className="empty">
            <p>Ask about this page, or have Bakbak find and click through it.</p>
          </div>
        ) : (
          <ol className="log" ref={logRef} role="list">
            {entries.map((entry) => (
              <li key={entry.id} className={`entry entry-${entry.kind}`}>
                {entry.kind === "action" ? null : (
                  <span className="who">
                    {entry.kind === "user" ? "You" : "Bakbak"}
                  </span>
                )}
                <p>{entry.text}</p>
              </li>
            ))}
          </ol>
        )}

        {error ? (
          <div className="notice" role="alert">
            <ExclamationTriangleIcon className="icon" aria-hidden="true" />
            <p>{error}</p>
            {error.toLowerCase().includes("sign in") ? (
              <button
                className="button-ghost button-ghost-inline"
                type="button"
                onClick={() => void openLogin()}
              >
                Log in
                <ArrowTopRightOnSquareIcon className="icon" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}

        <footer className="panel-footer">
          {isLive ? (
            <Meter subscribe={subscribeToLevel} />
          ) : (
            <p className="footer-note">Mic opens only while a session is live.</p>
          )}
          {isLive ? (
            <button className="button-secondary" type="button" onClick={stop}>
              <StopIcon className="icon" aria-hidden="true" />
              Stop
            </button>
          ) : (
            <button
              className="button-primary"
              type="button"
              onClick={() => void start()}
              disabled={voiceState === "connecting"}
            >
              <MicrophoneIcon className="icon" aria-hidden="true" />
              Start
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export default App;
