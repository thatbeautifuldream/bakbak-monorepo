import { BrowserAudioInterface } from 'sarvam-conv-ai-sdk/browser';
import { API_URL, SESSION_COOKIE, WEB_URL } from './config';

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

async function getSessionToken() {
  const cookie = await browser.cookies.get({ url: WEB_URL, name: SESSION_COOKIE });
  if (!cookie?.value) throw new Error(`Sign in at ${WEB_URL} to use voice chat`);
  return cookie.value;
}

export type VoiceClientCallbacks = {
  onMessage: (message: VoiceMessage) => void;
  onState: (state: 'connecting' | 'connected' | 'closed') => void;
};

export async function executeWebsiteTool(
  name: string,
  args: Record<string, unknown> = {},
) {
  switch (name) {
    case 'get_page_context':
      return {
        title: document.title,
        url: location.href,
        text: document.body?.innerText.slice(0, 12000) ?? '',
      };
    case 'get_selected_text':
      return { text: window.getSelection()?.toString() ?? '' };
    default:
      return { error: `Website tool ${name} is not enabled`, args };
  }
}

export class VoiceClient {
  private socket?: WebSocket;
  private audio = new BrowserAudioInterface(16000);

  constructor(private readonly callbacks: VoiceClientCallbacks) {}

  async start() {
    const { url, token } = socketUrl(await getSessionToken());
    this.callbacks.onState('connecting');
    this.socket = new WebSocket(url, ['bearer', token]);
    this.socket.addEventListener('open', () => this.callbacks.onState('connected'));
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as VoiceMessage;
      if (message.audio_base64) {
        void this.audio.output(
          decode(message.audio_base64),
          message.sample_rate ?? 16000,
        );
      }
      this.callbacks.onMessage(message);
    });
    this.socket.addEventListener('close', () => this.callbacks.onState('closed'));
    this.socket.addEventListener('error', () => this.callbacks.onState('closed'));

    await this.audio.start(async (audio) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'audio', audio: encode(audio) }));
      }
    });
  }

  stop() {
    void this.audio.stop();
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'stop' }));
    }
    this.socket?.close();
    this.socket = undefined;
  }

  sendToolResult(name: string, result: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'tool_result', name, result }));
    }
  }
}
