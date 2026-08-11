import { BrowserAudioInterface } from 'sarvam-conv-ai-sdk/browser';
import { API_URL } from './config';
import { saveVoiceSessionForNavigation, send } from './messages';

type VoiceMessage = {
  type: string;
  audio_base64?: string;
  sample_rate?: number;
  text?: string;
  content?: string;
  role?: string;
  message?: string;
  name?: string;
  tool_name?: string;
  request_id?: string;
  session_id?: string;
  arguments?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
};

export type WebsiteContext = {
  page_title: string;
  page_url: string;
  page_hostname: string;
  page_language: string;
  meta_description: string;
  canonical_url: string;
  page_content: string;
  page_headings: string;
  page_links: string;
  accessibility_tree: string;
  selected_text: string;
};

export type WebsiteSafety = {
  isSensitive: boolean;
  reason?: "financial" | "identity";
};

export type TranslationView = {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
};

export type NewsTrustView = {
  source: string;
  canonicalUrl: string;
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  contentType?: string;
  hasStructuredData: boolean;
};

export const translationEvent = 'bakbak:translation';
export const newsTrustEvent = 'bakbak:news-trust';

const interactiveSelector = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[contenteditable="true"]',
].join(',');

const sectionSelector = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'article',
  '[role="article"]',
  'main p',
  'article p',
].join(',');

const sensitiveHostnamePattern = /(^|\.)(axisbank|bankofbaroda|canarabank|cred|federalbank|gpay|groww|hdfcbank|icicibank|idfcfirstbank|indusind|kotak|onlinesbi|paytm|phonepe|pnbindia|rblbank|sbi|yesbank|zerodha)\./i;
const identityHostnamePattern = /(^|\.)(digilocker|incometax|uidai)\.gov\.in$/i;
const sensitiveFieldPattern = /\b(?:aadhaar|aadhar|account[\s_-]*number|card[\s_-]*number|cvv|debit[\s_-]*card|credit[\s_-]*card|ifsc|net[\s_-]*banking|one[\s_-]*time[\s_-]*password|otp|pan[\s_-]*number|password|pin|upi[\s_-]*pin)\b/i;
const sensitiveAutocompleteValues = new Set(['cc-number', 'cc-csc', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'one-time-code']);
const safeModeMessage = "Sensitive page detected. Bakbak is in read-only mode and does not share page text or perform browser actions here.";
const sensitiveFieldMessage = 'Bakbak does not enter or interact with passwords, OTPs, card details, PINs, or identity numbers.';

const highlightedElements = new Map<HTMLElement, Record<string, { value: string; priority: string }>>();
let clearHighlightTimer: ReturnType<typeof setTimeout> | undefined;

const isVisible = (element: Element) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
};

const getFormControlText = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) =>
  [
      element.getAttribute('aria-label'),
      element.getAttribute('autocomplete'),
      element.getAttribute('id'),
      element.getAttribute('name'),
      element.getAttribute('placeholder'),
      ...Array.from(element.labels ?? []).filter(isVisible).map((label) => label.textContent),
  ].filter(Boolean).join(' ');

const isSensitiveFormControl = (element: Element) => {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
    return false;
  }
  return (element instanceof HTMLInputElement && (element.type === 'password' || sensitiveAutocompleteValues.has(element.autocomplete)))
    || sensitiveFieldPattern.test(getFormControlText(element));
};

export const getWebsiteSafety = (): WebsiteSafety => {
  const hostname = location.hostname;
  if (identityHostnamePattern.test(hostname)) {
    return { isSensitive: true, reason: 'identity' };
  }
  if (sensitiveHostnamePattern.test(hostname)) {
    return { isSensitive: true, reason: 'financial' };
  }
  return { isSensitive: false };
};

const getElementLabel = (element: Element) =>
  element.getAttribute('aria-label')
  ?? element.getAttribute('title')
  ?? (element instanceof HTMLInputElement ? element.placeholder : '')
  ?? element.textContent?.trim()
  ?? '';

const getInteractiveElements = () =>
  Array.from(document.querySelectorAll(interactiveSelector))
    .filter(isVisible)
    .slice(0, 150)
    .map((element, index) => {
      const id = `bakbak-${index + 1}`;
      element.setAttribute('data-bakbak-id', id);
      return {
        id,
        role: element.getAttribute('role') ?? element.tagName.toLowerCase(),
        label: getElementLabel(element).slice(0, 160),
        type: element.getAttribute('type') ?? undefined,
        href: element instanceof HTMLAnchorElement ? element.href : undefined,
      };
    });

const getPageSections = () =>
  Array.from(document.querySelectorAll(sectionSelector))
    .filter(isVisible)
    .filter((element, index, elements) => elements.indexOf(element) === index)
    .slice(0, 120)
    .map((element, index) => {
      const id = element.getAttribute('data-bakbak-id') ?? `bakbak-section-${index + 1}`;
      const text = element.textContent?.trim().replace(/\s+/g, ' ') ?? '';
      element.setAttribute('data-bakbak-id', id);
      return {
        id,
        tag: element.tagName.toLowerCase(),
        text: text.slice(0, 360),
      };
    })
    .filter(({ text }) => text.length > 0);

const protectedContext = () => ({
  title: 'Sensitive page',
  url: location.origin + location.pathname,
  text: safeModeMessage,
});

const getMetaContent = (...selectors: string[]) => {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.getAttribute('content')?.trim();
    if (value) return value;
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const getStructuredArticles = () =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .flatMap((script) => {
      try {
        const parsed = JSON.parse(script.textContent ?? '') as unknown;
        const record = asRecord(parsed);
        const graph = record && Array.isArray(record['@graph']) ? record['@graph'] : [parsed];
        return graph.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
      } catch {
        return [];
      }
    })
    .filter((article) => {
      const type = article['@type'];
      const types = Array.isArray(type) ? type : [type];
      return types.some((value) => typeof value === 'string' && /article|news/i.test(value));
    });

const getAuthorName = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(getAuthorName).filter(Boolean).join(', ') || undefined;
  const author = asRecord(value);
  return typeof author?.name === 'string' ? author.name : undefined;
};

export const getNewsTrust = (): NewsTrustView => {
  const article = getStructuredArticles()[0];
  const articleType = article?.['@type'];
  const types = Array.isArray(articleType) ? articleType : [articleType];
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const canonicalUrl = canonical ? new URL(canonical, location.href).href : location.href;
  return {
    source: getMetaContent('meta[property="og:site_name"]') ?? location.hostname.replace(/^www\./, ''),
    canonicalUrl,
    author: getMetaContent('meta[name="author"]', 'meta[property="article:author"]')
      ?? getAuthorName(article?.author)
      ?? document.querySelector('a[rel="author"]')?.textContent?.trim()
      ?? undefined,
    publishedAt: getMetaContent('meta[property="article:published_time"]', 'meta[name="date"]', 'meta[itemprop="datePublished"]')
      ?? (typeof article?.datePublished === 'string' ? article.datePublished : undefined),
    modifiedAt: getMetaContent('meta[property="article:modified_time"]', 'meta[itemprop="dateModified"]')
      ?? (typeof article?.dateModified === 'string' ? article.dateModified : undefined),
    contentType: types.find((value): value is string => typeof value === 'string')
      ?? getMetaContent('meta[property="og:type"]'),
    hasStructuredData: Boolean(article),
  };
};

const encode = (audio: Uint8Array) => {
  let binary = '';
  for (const byte of audio) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const decode = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const socketUrl = (token: string, resumeSessionId?: string) => {
  const url = new URL('/ws/voice', API_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  if (resumeSessionId) url.searchParams.set('resume_session_id', resumeSessionId);
  return { url: url.toString(), token };
};

const interactionEndType = 'server.action.interaction_end';
const reconnectDelays = [1000, 2000];

async function getSessionToken() {
  return send({ type: 'session-token' });
}

export type VoiceClientCallbacks = {
  onMessage: (message: VoiceMessage) => void;
  onState: (state: 'connecting' | 'connected' | 'reconnecting' | 'paused' | 'closed') => void;
  onLevel?: (level: number) => void;
  onError?: (message: string) => void;
};

const findElement = (elementId: unknown) =>
  typeof elementId === 'string'
    ? document.querySelector(`[data-bakbak-id="${CSS.escape(elementId)}"]`)
    : null;

const getElementIds = (value: unknown) => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
  }
  return value.split(',').map((id) => id.trim()).filter(Boolean);
};

const clearHighlights = () => {
  for (const [element, properties] of highlightedElements) {
    for (const [property, previous] of Object.entries(properties)) {
      if (previous.value) {
        element.style.setProperty(property, previous.value, previous.priority);
      } else {
        element.style.removeProperty(property);
      }
    }
  }
  highlightedElements.clear();
};

const highlightElement = (element: HTMLElement) => {
  if (!highlightedElements.has(element)) {
    const properties = ['outline', 'outline-offset', 'box-shadow'];
    highlightedElements.set(
      element,
      Object.fromEntries(
        properties.map((property) => [
          property,
          {
            value: element.style.getPropertyValue(property),
            priority: element.style.getPropertyPriority(property),
          },
        ]),
      ),
    );
  }
  element.style.setProperty('outline', '3px solid #f59e0b', 'important');
  element.style.setProperty('outline-offset', '4px', 'important');
  element.style.setProperty('box-shadow', '0 0 0 6px rgb(245 158 11 / 22%)', 'important');
};

const focusElements = (elementIds: unknown) => {
  clearHighlights();
  const elements = getElementIds(elementIds)
    .slice(0, 5)
    .map(findElement)
    .filter((element): element is HTMLElement => element instanceof HTMLElement);
  if (elements.length === 0) {
    return { error: 'No matching page sections were found. Get the page sections again.' };
  }
  for (const element of elements) highlightElement(element);
  elements[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (clearHighlightTimer) clearTimeout(clearHighlightTimer);
  clearHighlightTimer = setTimeout(clearHighlights, 10000);
  return { ok: true, element_ids: elements.map((element) => element.getAttribute('data-bakbak-id')) };
};

const describeTarget = (elementId: unknown) => {
  const element = findElement(elementId);
  const label = element ? getElementLabel(element).trim().slice(0, 40) : '';
  return label ? `“${label}”` : 'an element';
};

/** Human label for a tool call that changes the page. Read-only tools return null. */
export function describeWebsiteTool(
  name: string,
  args: Record<string, unknown> = {},
): string | null {
  const scrolled = (direction: unknown) =>
    direction === 'up' || direction === 'scroll_up' ? 'Scrolled up' : 'Scrolled down';

  switch (name) {
    case 'browser_action': {
      const action = args.action;
      if (action === 'scroll_to_top') return 'Scrolled to the top';
      if (action === 'scroll_to_bottom') return 'Scrolled to the bottom';
      if (action === 'scroll_up' || action === 'scroll_down') return scrolled(action);
      if (action === 'go_back') return 'Went back';
      if (action === 'click') return `Clicked ${describeTarget(args.element_id)}`;
      return null;
    }
    case 'click_element':
      return `Clicked ${describeTarget(args.element_id)}`;
    case 'fill_element':
      return `Filled ${describeTarget(args.element_id)}`;
    case 'scroll_page':
      return scrolled(args.direction);
    case 'focus_elements':
      return `Highlighting ${getElementIds(args.element_ids).length || 1} relevant section${getElementIds(args.element_ids).length === 1 ? '' : 's'}`;
    case 'show_translation':
      return 'Showing the translation';
    case 'get_news_trust':
      return 'Showing source details';
    case 'navigate_to_page':
      try {
        return `Opened ${new URL(String(args.url), location.href).hostname.replace(/^www\./, '')}`;
      } catch {
        return 'Opened a page';
      }
    case 'go_back':
      return 'Went back';
    default:
      return null;
  }
}

export async function executeWebsiteTool(
  name: string,
  args: Record<string, unknown> = {},
) {
  const safety = getWebsiteSafety();
  switch (name) {
    case 'browser_action': {
      const action = typeof args.action === 'string' ? args.action : '';
      if (action === 'scroll_to_top' || action === 'scroll_to_bottom') {
        window.scrollTo({
          top: action === 'scroll_to_top' ? 0 : document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
        return { ok: true, action };
      }
      if (action === 'scroll_up' || action === 'scroll_down') {
        const direction = action === 'scroll_up' ? -1 : 1;
        window.scrollBy({ top: direction * window.innerHeight * 0.8, behavior: 'smooth' });
        return { ok: true, action };
      }
      if (action === 'go_back') {
        history.back();
        return { ok: true, action };
      }
      if (action === 'click') {
        if (safety.isSensitive) return { error: safeModeMessage };
        const elementId = typeof args.element_id === 'string' ? args.element_id : '';
        const element = document.querySelector(`[data-bakbak-id="${CSS.escape(elementId)}"]`);
        if (!(element instanceof HTMLElement)) {
          return { error: 'Element not found. Ask the user to restate the target.' };
        }
        if (isSensitiveFormControl(element)) {
          return { error: sensitiveFieldMessage };
        }
        if (element.matches('button[type="submit"], input[type="submit"]')) {
          return { error: 'Submitting forms by voice is not enabled.' };
        }
        element.click();
        return { ok: true, action, element_id: elementId };
      }
      return { error: `Unsupported browser action: ${action}` };
    }
    case 'get_page_context':
      if (safety.isSensitive) return protectedContext();
      return {
        title: document.title,
        url: location.href,
        text: document.body?.innerText.slice(0, 12000) ?? '',
      };
    case 'get_selected_text':
      if (safety.isSensitive) return { text: safeModeMessage };
      return { text: window.getSelection()?.toString() ?? '' };
    case 'get_accessibility_tree':
      if (safety.isSensitive) return { accessibility_tree: safeModeMessage };
      return { accessibility_tree: JSON.stringify(getInteractiveElements()) };
    case 'get_page_metadata':
      return getWebsiteContext();
    case 'get_page_sections':
      if (safety.isSensitive) return { sections: [], message: safeModeMessage };
      return { sections: getPageSections() };
    case 'click_element': {
      if (safety.isSensitive) return { error: safeModeMessage };
      const elementId = typeof args.element_id === 'string' ? args.element_id : '';
      const element = document.querySelector(`[data-bakbak-id="${CSS.escape(elementId)}"]`);
      if (!(element instanceof HTMLElement)) return { error: 'Element not found. Refresh the accessibility tree.' };
      if (isSensitiveFormControl(element)) return { error: sensitiveFieldMessage };
      if (element.matches('button[type="submit"], input[type="submit"]')) {
        return { error: 'Submitting forms by voice is not enabled.' };
      }
      const link = element.closest('a[href]');
      if (link instanceof HTMLAnchorElement && !link.download && link.target !== '_blank') {
        const url = new URL(link.href, location.href);
        if (['http:', 'https:'].includes(url.protocol)) {
          return { ok: true, element_id: elementId, navigation_url: url.href };
        }
      }
      element.click();
      return { ok: true, element_id: elementId };
    }
    case 'fill_element': {
      if (safety.isSensitive) return { error: safeModeMessage };
      const elementId = typeof args.element_id === 'string' ? args.element_id : '';
      const value = typeof args.value === 'string' ? args.value : '';
      const element = document.querySelector(`[data-bakbak-id="${CSS.escape(elementId)}"]`);
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
        return { error: 'Element is not a text input. Refresh the accessibility tree.' };
      }
      if (isSensitiveFormControl(element)) return { error: sensitiveFieldMessage };
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, element_id: elementId };
    }
    case 'scroll_page': {
      const direction = args.direction === 'up' ? -1 : 1;
      window.scrollBy({ top: direction * window.innerHeight * 0.8, behavior: 'smooth' });
      return { ok: true, direction: direction < 0 ? 'up' : 'down' };
    }
    case 'focus_elements':
      return focusElements(args.element_ids);
    case 'show_translation': {
      if (safety.isSensitive) return { error: safeModeMessage };
      const originalText = typeof args.original_text === 'string' ? args.original_text.trim() : '';
      const translatedText = typeof args.translated_text === 'string' ? args.translated_text.trim() : '';
      const targetLanguage = typeof args.target_language === 'string' ? args.target_language.trim() : '';
      if (!originalText || !translatedText || !targetLanguage) {
        return { error: 'Original text, translated text, and target language are required.' };
      }
      const detail: TranslationView = {
        originalText: originalText.slice(0, 2000),
        translatedText: translatedText.slice(0, 2000),
        targetLanguage: targetLanguage.slice(0, 80),
      };
      window.dispatchEvent(new CustomEvent(translationEvent, { detail }));
      return { ok: true };
    }
    case 'get_news_trust': {
      if (safety.isSensitive) return { error: safeModeMessage };
      const detail = getNewsTrust();
      window.dispatchEvent(new CustomEvent(newsTrustEvent, { detail }));
      return detail;
    }
    case 'navigate_to_page': {
      if (safety.isSensitive) return { error: safeModeMessage };
      const url = typeof args.url === 'string' ? new URL(args.url, location.href) : undefined;
      if (!url || !['http:', 'https:'].includes(url.protocol)) {
        return { error: 'Only HTTP and HTTPS pages can be opened.' };
      }
      return { ok: true, url: url.href };
    }
    case 'go_back':
      history.back();
      return { ok: true };
    default:
      return { error: `Website tool ${name} is not enabled`, args };
  }
}

export function getWebsiteContext(): WebsiteContext {
  if (getWebsiteSafety().isSensitive) {
    return {
      page_title: 'Sensitive page',
      page_url: location.origin + location.pathname,
      page_hostname: location.hostname,
      page_language: document.documentElement.lang || navigator.language,
      meta_description: safeModeMessage,
      canonical_url: location.origin + location.pathname,
      page_content: safeModeMessage,
      page_headings: '[]',
      page_links: '[]',
      accessibility_tree: '[]',
      selected_text: '',
    };
  }
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .filter(isVisible)
    .slice(0, 80)
    .map((element) => ({ level: element.tagName.toLowerCase(), text: element.textContent?.trim().slice(0, 240) }));
  const links = Array.from(document.querySelectorAll('a[href]'))
    .filter(isVisible)
    .slice(0, 100)
    .map((element) => ({ text: element.textContent?.trim().slice(0, 160), url: (element as HTMLAnchorElement).href }));

  return {
    page_title: document.title || 'Untitled page',
    page_url: location.href,
    page_hostname: location.hostname,
    page_language: document.documentElement.lang || navigator.language,
    meta_description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    canonical_url: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? location.href,
    page_content: document.body?.innerText.slice(0, 12000) ?? '',
    page_headings: JSON.stringify(headings).slice(0, 6000),
    page_links: JSON.stringify(links).slice(0, 8000),
    accessibility_tree: JSON.stringify(getInteractiveElements()).slice(0, 12000),
    selected_text: window.getSelection()?.toString().slice(0, 4000) ?? '',
  };
}

export class VoiceClient {
  private socket?: WebSocket;
  private audio = new BrowserAudioInterface(16000);
  private isReady = false;
  private isClosed = false;
  private isPaused = false;
  private context?: WebsiteContext;
  private resumeSessionId?: string;
  private isNavigating = false;
  private reconnectAttempt = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private pendingAcknowledgement?: {
    type: 'paused' | 'resumed';
    resolve: () => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  };

  constructor(private readonly callbacks: VoiceClientCallbacks) {}

  async start(context: WebsiteContext, resumeSessionId?: string) {
    this.context = context;
    this.isClosed = false;
    this.isPaused = false;
    this.isReady = false;
    this.isNavigating = false;
    this.resumeSessionId = resumeSessionId;
    this.reconnectAttempt = 0;
    this.callbacks.onState(resumeSessionId ? 'reconnecting' : 'connecting');
    await this.connect();
    if (!this.isClosed) await this.startAudioCapture();
  }

  async prepareForNavigation() {
    if (this.isClosed || !this.isReady || !this.resumeSessionId) return false;
    await saveVoiceSessionForNavigation(this.resumeSessionId);
    this.isNavigating = true;
    await this.audio.stop();
    this.callbacks.onLevel?.(0);
    return true;
  }

  updateContext(context: WebsiteContext) {
    this.context = context;
  }

  private async connect() {
    const { url, token } = socketUrl(await getSessionToken(), this.resumeSessionId);
    if (this.isClosed) return;
    const socket = new WebSocket(url, ['bearer', token]);
    this.socket = socket;
    socket.addEventListener('message', (event) => {
      if (this.socket !== socket || this.isClosed) return;
      const message = JSON.parse(String(event.data)) as VoiceMessage;
      if (message.type === 'context_required') {
        if (this.context) socket.send(JSON.stringify({ type: 'init', context: this.context }));
      }
      if (message.type === 'ready') {
        this.isReady = true;
        if (typeof message.session_id === 'string') this.resumeSessionId = message.session_id;
        this.reconnectAttempt = 0;
        this.callbacks.onState('connected');
      }
      if (message.type === 'paused') {
        this.isPaused = true;
        this.resolveAcknowledgement('paused');
        this.callbacks.onState('paused');
      }
      if (message.type === 'resumed') {
        this.isPaused = false;
        this.resolveAcknowledgement('resumed');
        this.callbacks.onState('connected');
      }
      if (message.type === interactionEndType) {
        this.finish();
        socket.close();
      }
      if (message.type === 'error') {
        this.callbacks.onError?.(message.message ?? 'The conversation could not continue.');
        this.finish();
        socket?.close();
      }
      if (message.audio_base64 && !this.isPaused) {
        void this.audio.output(
          decode(message.audio_base64),
          message.sample_rate ?? 16000,
        );
      }
      this.callbacks.onMessage(message);
    });
    socket.addEventListener('close', () => this.handleSocketClosed(socket));
    socket.addEventListener('error', () => socket.close());
  }

  async pause() {
    if (this.isClosed || !this.isReady || this.isPaused) return;
    const socket = this.socket;
    if (socket?.readyState !== WebSocket.OPEN) {
      throw new Error('The conversation is no longer connected.');
    }

    const acknowledgement = this.waitForAcknowledgement('paused');
    socket.send(JSON.stringify({ type: 'pause' }));
    await this.audio.stop();
    this.callbacks.onLevel?.(0);
    await acknowledgement;
  }

  async resume() {
    if (this.isClosed || !this.isReady || !this.isPaused) return;
    const socket = this.socket;
    if (socket?.readyState !== WebSocket.OPEN) {
      throw new Error('The conversation is no longer connected.');
    }

    const acknowledgement = this.waitForAcknowledgement('resumed');
    socket.send(JSON.stringify({ type: 'resume' }));
    await acknowledgement;
    await this.startAudioCapture();
  }

  private async startAudioCapture() {
    await this.audio.start(async (audio) => {
      this.emitLevel(audio);
      if (
        this.socket?.readyState === WebSocket.OPEN &&
        this.isReady &&
        !this.isPaused
      ) {
        this.socket.send(JSON.stringify({ type: 'audio', audio: encode(audio) }));
      }
    });
  }

  /** RMS of the captured PCM16 chunk, normalised to 0–1 so the UI meter reflects the real mic. */
  private emitLevel(audio: Uint8Array) {
    if (!this.callbacks.onLevel) return;
    const samples = new Int16Array(audio.buffer, audio.byteOffset, audio.byteLength >> 1);
    if (samples.length === 0) return;
    let sum = 0;
    for (const sample of samples) sum += sample * sample;
    const rms = Math.sqrt(sum / samples.length) / 32768;
    this.callbacks.onLevel(Math.min(1, rms * 6));
  }

  end() {
    const socket = this.socket;
    if (this.isNavigating) {
      this.isClosed = true;
      this.isReady = false;
      this.socket = undefined;
      void this.audio.stop();
      socket?.close();
      return;
    }
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'end' }));
    }
    this.finish();
    socket?.close();
  }

  stop() {
    this.end();
  }

  sendToolResult(name: string, result: unknown, requestId?: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'tool_result', request_id: requestId, name, result }));
    }
  }

  private waitForAcknowledgement(type: 'paused' | 'resumed') {
    if (this.pendingAcknowledgement) {
      return Promise.reject(new Error('A conversation state change is already in progress.'));
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcknowledgement = undefined;
        reject(new Error('The conversation did not respond in time.'));
      }, 5000);
      this.pendingAcknowledgement = { type, resolve, reject, timeout };
    });
  }

  private resolveAcknowledgement(type: 'paused' | 'resumed') {
    if (this.pendingAcknowledgement?.type !== type) return;
    clearTimeout(this.pendingAcknowledgement.timeout);
    this.pendingAcknowledgement.resolve();
    this.pendingAcknowledgement = undefined;
  }

  private handleSocketClosed(socket?: WebSocket) {
    if (socket && this.socket !== socket) return;
    this.socket = undefined;
    this.isReady = false;
    if (this.isClosed) return;
    if (this.isPaused || !this.context) {
      this.finish();
      return;
    }
    if (this.reconnectAttempt >= reconnectDelays.length) {
      this.callbacks.onError?.('Connection lost. Press Start to begin a new session.');
      this.finish();
      return;
    }
    if (this.reconnectTimer) return;
    const delay = reconnectDelays[this.reconnectAttempt++];
    this.callbacks.onState('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect().catch(() => this.handleSocketClosed());
    }, delay);
  }

  private finish() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.isReady = false;
    this.isPaused = false;
    this.context = undefined;
    this.resumeSessionId = undefined;
    this.socket = undefined;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.pendingAcknowledgement) {
      clearTimeout(this.pendingAcknowledgement.timeout);
      this.pendingAcknowledgement.reject(new Error('The conversation ended.'));
      this.pendingAcknowledgement = undefined;
    }
    void this.audio.stop();
    this.callbacks.onLevel?.(0);
    this.callbacks.onState('closed');
  }
}
