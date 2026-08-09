import { BrowserAudioInterface } from 'sarvam-conv-ai-sdk/browser';
import { API_URL } from './config';
import { send } from './messages';

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

const isVisible = (element: Element) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
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

const socketUrl = (token: string) => {
  const url = new URL('/ws/voice', API_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return { url: url.toString(), token };
};

const interactionEndType = 'server.action.interaction_end';

async function getSessionToken() {
  return send({ type: 'session-token' });
}

export type VoiceClientCallbacks = {
  onMessage: (message: VoiceMessage) => void;
  onState: (state: 'connecting' | 'connected' | 'closed') => void;
  onError?: (message: string) => void;
};

export async function executeWebsiteTool(
  name: string,
  args: Record<string, unknown> = {},
) {
  switch (name) {
    case 'browser_action': {
      const action = typeof args.action === 'string' ? args.action : '';
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
        const elementId = typeof args.element_id === 'string' ? args.element_id : '';
        const element = document.querySelector(`[data-bakbak-id="${CSS.escape(elementId)}"]`);
        if (!(element instanceof HTMLElement)) {
          return { error: 'Element not found. Ask the user to restate the target.' };
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
      return {
        title: document.title,
        url: location.href,
        text: document.body?.innerText.slice(0, 12000) ?? '',
      };
    case 'get_selected_text':
      return { text: window.getSelection()?.toString() ?? '' };
    case 'get_accessibility_tree':
      return { accessibility_tree: JSON.stringify(getInteractiveElements()) };
    case 'get_page_metadata':
      return getWebsiteContext();
    case 'click_element': {
      const elementId = typeof args.element_id === 'string' ? args.element_id : '';
      const element = document.querySelector(`[data-bakbak-id="${CSS.escape(elementId)}"]`);
      if (!(element instanceof HTMLElement)) return { error: 'Element not found. Refresh the accessibility tree.' };
      if (element.matches('button[type="submit"], input[type="submit"]')) {
        return { error: 'Submitting forms by voice is not enabled.' };
      }
      element.click();
      return { ok: true, element_id: elementId };
    }
    case 'fill_element': {
      const elementId = typeof args.element_id === 'string' ? args.element_id : '';
      const value = typeof args.value === 'string' ? args.value : '';
      const element = document.querySelector(`[data-bakbak-id="${CSS.escape(elementId)}"]`);
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
        return { error: 'Element is not a text input. Refresh the accessibility tree.' };
      }
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
    case 'navigate_to_page': {
      const url = typeof args.url === 'string' ? new URL(args.url, location.href) : undefined;
      if (!url || !['http:', 'https:'].includes(url.protocol)) {
        return { error: 'Only HTTP and HTTPS pages can be opened.' };
      }
      location.assign(url.href);
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

  constructor(private readonly callbacks: VoiceClientCallbacks) {}

  async start(context: WebsiteContext) {
    const { url, token } = socketUrl(await getSessionToken());
    this.isClosed = false;
    this.callbacks.onState('connecting');
    this.socket = new WebSocket(url, ['bearer', token]);
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as VoiceMessage;
      if (message.type === 'context_required') {
        this.socket?.send(JSON.stringify({ type: 'init', context }));
      }
      if (message.type === 'ready') {
        this.isReady = true;
        this.callbacks.onState('connected');
      }
      if (message.type === interactionEndType) {
        this.finish();
      }
      if (message.audio_base64) {
        void this.audio.output(
          decode(message.audio_base64),
          message.sample_rate ?? 16000,
        );
      }
      this.callbacks.onMessage(message);
    });
    this.socket.addEventListener('close', () => this.finish());
    this.socket.addEventListener('error', () => {
      this.callbacks.onError?.('WebSocket connection error.');
      this.finish();
    });

    await this.audio.start(async (audio) => {
      if (this.socket?.readyState === WebSocket.OPEN && this.isReady) {
        this.socket.send(JSON.stringify({ type: 'audio', audio: encode(audio) }));
      }
    });
  }

  stop() {
    const socket = this.socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'stop' }));
    }
    this.finish();
    socket?.close();
  }

  sendToolResult(name: string, result: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'tool_result', name, result }));
    }
  }

  private finish() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.isReady = false;
    this.socket = undefined;
    void this.audio.stop();
    this.callbacks.onState('closed');
  }
}
