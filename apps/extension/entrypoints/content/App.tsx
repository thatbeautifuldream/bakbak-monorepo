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
  PauseIcon,
  StopIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import type { ContentScriptContext } from "#imports";
import { openLogin } from "@/lib/messages";
import {
  describeWebsiteTool,
  executeWebsiteTool,
  getWebsiteContext,
  getWebsiteSafety,
  newsTrustEvent,
  translationEvent,
  type NewsTrustView,
  type TranslationView,
  VoiceClient,
} from "@/lib/voice-client";

type VoiceState = "idle" | "connecting" | "connected" | "reconnecting" | "paused";
type Entry = { id: number; kind: "user" | "agent" | "action"; text: string };

const CLOSE_MS = 150;
const METER_BARS = 5;
const TUCK_KEY = "bakbak:tucked";
const READING_MODE_KEY = "bakbak:reading-mode";

const inactivityMessages = {
  en: "I haven't heard a response, so this session has ended. I'm here whenever you're ready — press Start to talk again.",
  as: "কিছু সময় ধৰি আপোনাৰ কোনো উত্তৰ পোৱা হোৱা নাই, সেয়ে এই ছেছন শেষ হৈছে। আপুনি সাজু হ’লে কথা পাতিবলৈ Start টিপক।",
  bn: "কিছু সময় ধরে আপনার কোনো উত্তর পাইনি, তাই এই সেশনটি শেষ হয়েছে। আপনি প্রস্তুত হলে কথা বলতে Start চাপুন।",
  gu: "થોડા સમયથી તમારો કોઈ જવાબ મળ્યો નથી, તેથી આ સેશન સમાપ્ત થયું છે. જ્યારે તમે તૈયાર હો, ત્યારે વાત કરવા Start દબાવો.",
  hi: "मुझे कुछ देर से आपका कोई जवाब नहीं मिला, इसलिए यह सत्र समाप्त हो गया है। जब भी आप तैयार हों, बात करने के लिए Start दबाएँ।",
  kn: "ಸ್ವಲ್ಪ ಸಮಯದಿಂದ ನಿಮ್ಮಿಂದ ಪ್ರತಿಕ್ರಿಯೆ ಬಂದಿಲ್ಲ, ಆದ್ದರಿಂದ ಈ ಸೆಷನ್ ಮುಗಿದಿದೆ. ನೀವು ಸಿದ್ಧರಾದಾಗ ಮಾತನಾಡಲು Start ಒತ್ತಿರಿ.",
  ml: "കുറച്ച് സമയമായി നിങ്ങളിൽ നിന്ന് മറുപടി ലഭിച്ചില്ല, അതിനാൽ ഈ സെഷൻ അവസാനിച്ചു. നിങ്ങൾ തയ്യാറാകുമ്പോൾ സംസാരിക്കാൻ Start അമർത്തുക.",
  mr: "मला काही वेळापासून तुमच्याकडून प्रतिसाद मिळाला नाही, त्यामुळे हे सत्र संपले आहे. तुम्ही तयार झाल्यावर बोलण्यासाठी Start दाबा.",
  ne: "केही समयदेखि तपाईंको कुनै प्रतिक्रिया आएको छैन, त्यसैले यो सत्र समाप्त भएको छ। तपाईं तयार हुँदा कुरा गर्न Start थिच्नुहोस्।",
  od: "କିଛି ସମୟ ଧରି ଆପଣଙ୍କଠାରୁ କୌଣସି ଉତ୍ତର ମିଳିନାହିଁ, ତେଣୁ ଏହି ସେସନ୍ ଶେଷ ହୋଇଛି। ଆପଣ ପ୍ରସ୍ତୁତ ହେଲେ କଥା ହେବାକୁ Start ଦବାନ୍ତୁ।",
  pa: "ਮੈਨੂੰ ਕੁਝ ਸਮੇਂ ਤੋਂ ਤੁਹਾਡਾ ਕੋਈ ਜਵਾਬ ਨਹੀਂ ਮਿਲਿਆ, ਇਸ ਲਈ ਇਹ ਸੈਸ਼ਨ ਖਤਮ ਹੋ ਗਿਆ ਹੈ। ਜਦੋਂ ਤੁਸੀਂ ਤਿਆਰ ਹੋਵੋ, ਗੱਲ ਕਰਨ ਲਈ Start ਦਬਾਓ।",
  ta: "சில நேரமாக உங்களிடமிருந்து பதில் வரவில்லை, அதனால் இந்த அமர்வு முடிந்தது. நீங்கள் தயாரானதும் பேச Start-ஐ அழுத்தவும்.",
  te: "కొంతసేపటి నుంచి మీ నుంచి స్పందన రాలేదు, కాబట్టి ఈ సెషన్ ముగిసింది. మీరు సిద్ధమైనప్పుడు మాట్లాడటానికి Start నొక్కండి.",
  ur: "کچھ دیر سے آپ کی طرف سے کوئی جواب نہیں ملا، اس لیے یہ سیشن ختم ہو گیا ہے۔ جب آپ تیار ہوں تو بات کرنے کے لیے Start دبائیں۔",
} as const;

type InactivityLanguage = keyof typeof inactivityMessages;

const languageFromBrowser = () =>
  [...navigator.languages, navigator.language]
    .map((language) => language?.toLowerCase().split("-")[0])
    .find((language): language is InactivityLanguage => typeof language === "string" && language in inactivityMessages) ?? "en";

const languageFromText = (text: string, fallback: InactivityLanguage) => {
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa";
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
  if (/[\u0B00-\u0B7F]/.test(text)) return "od";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  if (/[\u0980-\u09FF]/.test(text)) return fallback === "as" ? "as" : "bn";
  if (/[\u0900-\u097F]/.test(text)) {
    return fallback === "mr" || fallback === "ne" ? fallback : "hi";
  }
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  return fallback;
};

const stateLabel: Record<VoiceState, string> = {
  idle: "Ready",
  connecting: "Connecting",
  connected: "Listening",
  reconnecting: "Reconnecting",
  paused: "Paused",
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
  const [readingMode, setReadingMode] = useState(false);
  const [title, setTitle] = useState(() => document.title || "Untitled page");
  const [websiteSafety, setWebsiteSafety] = useState(getWebsiteSafety);
  const [translation, setTranslation] = useState<TranslationView | null>(null);
  const [newsTrust, setNewsTrust] = useState<NewsTrustView | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const voiceRef = useRef<VoiceClient | undefined>(undefined);
  const entryId = useRef(0);
  const inactivityLanguage = useRef<InactivityLanguage>(languageFromBrowser());
  const wasReconnecting = useRef(false);
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
  const isReconnecting = voiceState === "reconnecting";
  const isPaused = voiceState === "paused";
  const hasConversation = isLive || isReconnecting || isPaused;

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
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    ctx.addEventListener(window, "wxt:locationchange", () => {
      setTitle(document.title || "Untitled page");
      setWebsiteSafety(getWebsiteSafety());
      setTranslation(null);
      setNewsTrust(null);
      setEntries([]);
      setError(null);
      voiceRef.current?.end();
      voiceRef.current = undefined;
      setVoiceState("idle");
      setSeconds(0);
    });
  }, [ctx]);

  useEffect(() => () => voiceRef.current?.end(), []);

  useEffect(() => {
    const showTranslation = (event: Event) => {
      const detail = (event as CustomEvent<TranslationView>).detail;
      if (!detail?.originalText || !detail.translatedText || !detail.targetLanguage) return;
      setTranslation(detail);
    };
    window.addEventListener(translationEvent, showTranslation);
    return () => window.removeEventListener(translationEvent, showTranslation);
  }, []);

  useEffect(() => {
    const showNewsTrust = (event: Event) => {
      const detail = (event as CustomEvent<NewsTrustView>).detail;
      if (!detail?.source || !detail.canonicalUrl) return;
      setNewsTrust(detail);
    };
    window.addEventListener(newsTrustEvent, showNewsTrust);
    return () => window.removeEventListener(newsTrustEvent, showNewsTrust);
  }, []);

  useEffect(() => {
    void browser.storage.local
      .get([TUCK_KEY, READING_MODE_KEY])
      .then((stored) => {
        setIsTucked(stored[TUCK_KEY] === true);
        setReadingMode(stored[READING_MODE_KEY] === true);
      });
  }, []);

  const tuck = useCallback((tucked: boolean) => {
    setIsTucked(tucked);
    void browser.storage.local.set({ [TUCK_KEY]: tucked });
  }, []);

  const toggleReadingMode = useCallback(() => {
    setReadingMode((current) => {
      const next = !current;
      void browser.storage.local.set({ [READING_MODE_KEY]: next });
      return next;
    });
  }, []);

  useEffect(() => {
    const openWithShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing = target instanceof HTMLElement
        && (target.isContentEditable || Boolean(target.closest('input, textarea, select, [contenteditable="true"]')));
      if (isEditing || !event.altKey || event.ctrlKey || event.metaKey || event.key.toLowerCase() !== "b") return;
      event.preventDefault();
      setIsOpen(true);
    };
    window.addEventListener("keydown", openWithShortcut);
    return () => window.removeEventListener("keydown", openWithShortcut);
  }, []);

  const close = useCallback(() => {
    setIsRevealed(false);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsOpen(false);
    }, CLOSE_MS);
  }, []);

  const pause = useCallback(async () => {
    const client = voiceRef.current;
    if (!client) return;
    setError(null);
    try {
      await client.pause();
    } catch (cause) {
      client.end();
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);

  const endConversation = useCallback(() => {
    voiceRef.current?.end();
    voiceRef.current = undefined;
    setVoiceState("idle");
    setEntries([]);
    setSeconds(0);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setWebsiteSafety(getWebsiteSafety());
    wasReconnecting.current = false;
    const existingClient = voiceRef.current;
    if (voiceState === "paused" && existingClient) {
      try {
        await existingClient.resume();
      } catch (cause) {
        existingClient.end();
        setError(cause instanceof Error ? cause.message : String(cause));
      }
      return;
    }

    setSeconds(0);
    let client: VoiceClient;
    client = new VoiceClient({
      onState: (state) => {
        if (state === "closed") {
          if (voiceRef.current === client) {
            voiceRef.current = undefined;
            setEntries([]);
            setSeconds(0);
          }
          wasReconnecting.current = false;
          setVoiceState("idle");
          return;
        }
        if (state === "reconnecting") {
          wasReconnecting.current = true;
          append("action", "Connection lost — reconnecting.");
        }
        if (state === "connected" && wasReconnecting.current) {
          wasReconnecting.current = false;
          append("action", "Reconnected. You can keep talking.");
        }
        setVoiceState(state);
      },
      onLevel: (level) => levelListener.current?.(level),
      onMessage: (message) => {
        const toolName = message.name ?? message.tool_name;
        const text = message.content ?? message.text;
        if (message.role === "user" && text) {
          inactivityLanguage.current = languageFromText(text, languageFromBrowser());
        }
        if (message.type === "server.action.interaction_end") {
          append("agent", inactivityMessages[inactivityLanguage.current]);
        }
        if (
          (message.type === "server.event.tool_call" || message.type === "browser_tool_call") &&
          toolName
        ) {
          const args = message.arguments ?? message.parameters;
          const action = describeWebsiteTool(toolName, args);
          if (action) append("action", action);
          void executeWebsiteTool(toolName, args)
            .then((result) => client.sendToolResult(toolName, result, message.request_id))
            .catch((error) =>
              client.sendToolResult(
                toolName,
                { error: error instanceof Error ? error.message : String(error) },
                message.request_id,
              ),
            );
        }
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
      client.end();
      voiceRef.current = undefined;
      setVoiceState("idle");
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [append, voiceState]);

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
            aria-label={isLive ? "Show Bakbak, session live" : isReconnecting ? "Show Bakbak, reconnecting" : isPaused ? "Show Bakbak, conversation paused" : "Show Bakbak"}
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
              aria-label={isLive ? "Open Bakbak, session live" : isReconnecting ? "Open Bakbak, reconnecting" : isPaused ? "Open Bakbak, conversation paused" : "Open Bakbak"}
            >
              <MicrophoneIcon className="icon" aria-hidden="true" />
              {isLive ? <LiveRing subscribe={subscribeToLevel} /> : null}
            </button>
            <span className="t-tt" role="tooltip">
              {isLive ? `Bakbak · ${formatDuration(seconds)}` : isReconnecting ? "Bakbak · reconnecting" : isPaused ? "Bakbak · paused" : "Bakbak"}
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
        className={`panel t-dropdown ${readingMode ? "panel-reading-mode" : ""} ${isClosing ? "is-closing" : isRevealed ? "is-open" : ""}`}
        aria-label="Bakbak voice assistant. Press Alt and B to open this panel."
        onKeyDown={(event) => event.key === "Escape" && close()}
      >
        <header className="panel-header">
          <span
            className={`state-dot ${isLive ? "state-dot-live" : ""}`}
            aria-hidden="true"
          />
          <p className="state" role="status">
            {voiceState === "connecting" || voiceState === "reconnecting" ? (
              <span className="t-shimmer" data-text={stateLabel[voiceState]}>
                {stateLabel[voiceState]}
              </span>
            ) : (
              <StateLabel label={stateLabel[voiceState]} />
            )}
          </p>
          {hasConversation ? <time className="elapsed">{formatDuration(seconds)}</time> : null}
          <button
            className="button-ghost reading-mode-toggle"
            type="button"
            onClick={toggleReadingMode}
            aria-label={readingMode ? "Use standard text size" : "Use larger reading text"}
            aria-pressed={readingMode}
            title={readingMode ? "Standard text size" : "Larger reading text"}
          >
            <span aria-hidden="true">A+</span>
          </button>
          <button
            className="button-ghost"
            type="button"
            onClick={close}
            aria-label={isLive ? "Minimise, keep conversation running" : isReconnecting ? "Minimise, keep reconnecting" : isPaused ? "Minimise, keep conversation paused" : "Close Bakbak"}
          >
            {hasConversation ? (
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
          {websiteSafety.isSensitive ? <span className="scope-safe">Read-only</span> : null}
        </div>

        {translation ? (
          <section className="translation" aria-live="polite">
            <div>
              <p className="translation-label">Original</p>
              <p>{translation.originalText}</p>
            </div>
            <div>
              <p className="translation-label">{translation.targetLanguage}</p>
              <p>{translation.translatedText}</p>
            </div>
            <button className="button-ghost translation-close" type="button" onClick={() => setTranslation(null)} aria-label="Close translation">
              <XMarkIcon className="icon" aria-hidden="true" />
            </button>
          </section>
        ) : null}

        {newsTrust ? (
          <section className="news-trust" aria-live="polite">
            <div className="news-trust-heading">
              <p>Source details</p>
              <span>{newsTrust.hasStructuredData ? "Article metadata found" : "Limited article metadata"}</span>
            </div>
            <dl>
              <div><dt>Source</dt><dd>{newsTrust.source}</dd></div>
              <div><dt>Canonical</dt><dd><a href={newsTrust.canonicalUrl} target="_blank" rel="noreferrer">Open original</a></dd></div>
              {newsTrust.author ? <div><dt>Author</dt><dd>{newsTrust.author}</dd></div> : null}
              {newsTrust.publishedAt ? <div><dt>Published</dt><dd>{newsTrust.publishedAt}</dd></div> : null}
              {newsTrust.modifiedAt ? <div><dt>Updated</dt><dd>{newsTrust.modifiedAt}</dd></div> : null}
              {newsTrust.contentType ? <div><dt>Type</dt><dd>{newsTrust.contentType}</dd></div> : null}
            </dl>
            <button className="button-ghost news-trust-close" type="button" onClick={() => setNewsTrust(null)} aria-label="Close source details">
              <XMarkIcon className="icon" aria-hidden="true" />
            </button>
          </section>
        ) : null}

        {entries.length === 0 ? (
          <div className="empty">
            <p>Ask about this page, or have Bakbak find and click through it. Press Alt+B any time to open Bakbak.</p>
          </div>
        ) : (
          <ol className="log" ref={logRef} role="list" aria-label="Conversation transcript" aria-live="polite" aria-relevant="additions text">
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
          ) : isReconnecting ? (
            <p className="footer-note">Connection lost. Reconnecting automatically…</p>
          ) : isPaused ? (
            <p className="footer-note">Conversation paused. Resume when you&apos;re ready.</p>
          ) : (
            <p className="footer-note">Mic opens only while a session is live.</p>
          )}
          {isLive ? (
            <>
              <button className="button-secondary" type="button" onClick={() => void pause()}>
                <PauseIcon className="icon" aria-hidden="true" />
                Pause
              </button>
              <button className="button-end" type="button" onClick={endConversation} aria-label="End conversation">
                End
              </button>
            </>
          ) : isReconnecting ? (
            <button className="button-end" type="button" onClick={endConversation} aria-label="End conversation">
              <StopIcon className="icon" aria-hidden="true" />
              End
            </button>
          ) : isPaused ? (
            <>
              <button className="button-end" type="button" onClick={endConversation} aria-label="End conversation">
                <StopIcon className="icon" aria-hidden="true" />
                End
              </button>
              <button className="button-primary" type="button" onClick={() => void start()}>
                <MicrophoneIcon className="icon" aria-hidden="true" />
                Resume
              </button>
            </>
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
