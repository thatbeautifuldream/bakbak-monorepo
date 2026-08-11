import { recordAnalyticsEvents } from "./messages";
import { getWebsiteSafety } from "./voice-client";

export type AnalyticsEvent = {
  id: string;
  visitId: string;
  eventType: "visit_started" | "active_time" | "voice_started";
  domain: string;
  language: string;
  browser: string;
  activeSeconds: number;
  occurredAt: string;
};

export type PageAnalyticsTracker = {
  stop: () => void;
  trackVoiceStarted: () => void;
};

const ACTIVE_HEARTBEAT_MS = 30_000;

let activeTracker: PageAnalyticsTracker | undefined;

const browserFamily = () => {
  const userAgent = navigator.userAgent;
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/OPR\//.test(userAgent)) return "Opera";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Brave\//.test(userAgent)) return "Brave";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "Other";
};

const pageDomain = () => location.hostname.toLowerCase().replace(/^www\./, "");

const isLocalDomain = (domain: string) =>
  domain === "localhost" ||
  domain.endsWith(".localhost") ||
  domain === "0.0.0.0" ||
  domain === "::1" ||
  /^127(?:\.\d{1,3}){3}$/.test(domain);

const canTrackPage = () =>
  (location.protocol === "http:" || location.protocol === "https:") &&
  Boolean(pageDomain()) &&
  !isLocalDomain(pageDomain()) &&
  !getWebsiteSafety().isSensitive;

const send = (event: AnalyticsEvent) => {
  void recordAnalyticsEvents([event]).catch(() => undefined);
};

export const startPageAnalyticsTracking = (): PageAnalyticsTracker | undefined => {
  activeTracker?.stop();
  activeTracker = undefined;
  if (!canTrackPage()) return undefined;

  const visitId = crypto.randomUUID();
  const domain = pageDomain();
  const language = document.documentElement.lang || navigator.language || "und";
  const browser = browserFamily();
  let voiceTracked = false;
  let activeStartedAt =
    document.visibilityState === "visible" && document.hasFocus()
      ? Date.now()
      : undefined;

  const record = (
    eventType: AnalyticsEvent["eventType"],
    activeSeconds = 0,
  ) =>
    send({
      id: crypto.randomUUID(),
      visitId,
      eventType,
      domain,
      language,
      browser,
      activeSeconds,
      occurredAt: new Date().toISOString(),
    });

  const flushActiveTime = () => {
    if (activeStartedAt === undefined) return;
    const seconds = Math.min(
      ACTIVE_HEARTBEAT_MS / 1000,
      Math.max(0, Math.round((Date.now() - activeStartedAt) / 1000)),
    );
    activeStartedAt = undefined;
    if (seconds > 0) record("active_time", seconds);
  };

  const syncActivity = () => {
    const isActive = document.visibilityState === "visible" && document.hasFocus();
    if (isActive && activeStartedAt === undefined) activeStartedAt = Date.now();
    if (!isActive) flushActiveTime();
  };

  const heartbeat = () => {
    if (activeStartedAt === undefined) return;
    flushActiveTime();
    activeStartedAt = Date.now();
  };

  const onVisibilityChange = () => syncActivity();
  const onFocus = () => syncActivity();
  const onBlur = () => syncActivity();
  const onPageHide = () => flushActiveTime();

  record("visit_started");
  window.addEventListener("focus", onFocus);
  window.addEventListener("blur", onBlur);
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibilityChange);
  const heartbeatTimer = window.setInterval(heartbeat, ACTIVE_HEARTBEAT_MS);

  const tracker: PageAnalyticsTracker = {
    stop: () => {
      flushActiveTime();
      window.clearInterval(heartbeatTimer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (activeTracker === tracker) activeTracker = undefined;
    },
    trackVoiceStarted: () => {
      if (voiceTracked) return;
      voiceTracked = true;
      record("voice_started");
    },
  };

  activeTracker = tracker;
  return tracker;
};

export const trackVoiceStarted = () => activeTracker?.trackVoiceStarted();
