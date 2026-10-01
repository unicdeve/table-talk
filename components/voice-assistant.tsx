'use client';

import {
  ConversationProvider,
  useConversationClientTool,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from '@elevenlabs/react';
import { useValue } from '@legendapp/state/react';
import { AudioLines, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

import { useTableTalkStore } from '@/hooks/use-tabletalk-store';
import { isMenuItemId } from '@/lib/tabletalk/menu';
import {
  highlightToolSchema,
  searchToolSchema,
  updateToolSchema,
} from '@/lib/tabletalk/tool-schemas';
import { cn } from '@/lib/utils';

const SESSION_LIMIT_MS = 5 * 60_000;

type VoiceAssistantProps = { className?: string };

export default function VoiceAssistant({ className }: VoiceAssistantProps) {
  const { state$, receiveMessage } = useTableTalkStore();

  return (
    <ConversationProvider
      onMessage={({ message, role, event_id }) => {
        if (!message.trim()) return;
        const id = event_id !== undefined ? `${role}-${event_id}` : crypto.randomUUID();
        receiveMessage({ id, role, text: message });
      }}
      onError={() =>
        state$.voice.error.set('The voice connection failed. End the session and try again.')
      }
      onDisconnect={(details) => {
        if (details.reason === 'error')
          state$.voice.error.set('Voice disconnected unexpectedly. You can retry.');
      }}
    >
      <VoiceSurface className={className} />
    </ConversationProvider>
  );
}

function VoiceSurface({ className }: VoiceAssistantProps) {
  const { state$, summary$, changeOrder, showRecommendations } = useTableTalkStore();
  const voice$ = state$.voice;
  const summary = useValue(summary$);
  const messages = useValue(voice$.messages);
  const error = useValue(voice$.error);
  const starting = useValue(voice$.starting);
  const code = useValue(voice$.accessCode);
  const { startSession, endSession, sendContextualUpdate } = useConversationControls();
  const { status } = useConversationStatus();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking } = useConversationMode();
  const transcriptRef = useRef<HTMLDivElement>(null);

  const active = status === 'connected';
  const busy = starting || status === 'connecting';
  const label = statusLabel({ active, busy, isMuted, isSpeaking });

  useConversationClientTool('search_menu', searchMenuTool);

  useConversationClientTool('highlight_items', (params: unknown) => {
    const parsed = highlightToolSchema.safeParse(params);
    if (!parsed.success || !parsed.data.itemIds.every(isMenuItemId))
      return toolResult({
        success: false,
        error: 'Use only valid item IDs returned by search_menu.',
      });
    showRecommendations(parsed.data.itemIds);
    return toolResult({ success: true });
  });

  useConversationClientTool('update_draft_order', (params: unknown) => {
    const parsed = updateToolSchema.safeParse(params);
    if (!parsed.success)
      return toolResult({ success: false, error: 'Invalid item, action or quantity.' });
    return toolResult(changeOrder(parsed.data));
  });

  useEffect(() => {
    if (!active) return;
    
    sendContextualUpdate(
      `Current draft order: ${JSON.stringify(summary)}. Use these quantities as the source of truth. This update does not require a spoken response.`,
    );
  }, [summary, active, sendContextualUpdate]);

  useEffect(() => {
    if (!active) return;

    const timer = setTimeout(() => {
      endSession();
      voice$.error.set('The five-minute demo session has ended. Start again to continue.');
    }, SESSION_LIMIT_MS);

    return () => clearTimeout(timer);
  }, [active, endSession, voice$]);

  useEffect(() => {
    const element = transcriptRef.current;

    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  async function start() {
    if (busy || active) return;

    voice$.assign({ starting: true, error: '' });
    const session = await requestVoiceSession(voice$.accessCode.peek());
    voice$.starting.set(false);
    if ('error' in session) {
      voice$.error.set(session.error);
      return;
    }
    voice$.messages.set([]);
    startSession({ conversationToken: session.token, connectionType: 'webrtc' });
  }

  return (
    <section
      className={cn(
        'rounded-[18px] border border-sage-border bg-sage p-6 text-center text-sage-foreground',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground">
          YOUR TABLE ASSISTANT
        </span>
        <span className="rounded-full bg-white/60 px-2 py-1 text-xs">
          {active ? 'Live' : 'Voice'}
        </span>
      </div>
      <div
        className={cn(
          'mx-auto mt-7.5 mb-5.75 grid size-25 place-items-center rounded-full bg-primary text-accent shadow-orb',
          active && isSpeaking && 'motion-safe:animate-orb-pulse',
        )}
      >
        <AudioLines size={44} />
      </div>
      <h2 className="mb-2.75 text-[25px] tracking-[-0.03em] text-foreground">
        {active ? 'What are you craving?' : 'Let’s talk food.'}
      </h2>
      <p className="text-sm leading-[1.6]">
        {active ? (
          label
        ) : (
          <>
            Tell me what you’re craving.
            <br />
            I’ll help you build your order.
          </>
        )}
      </p>

      {!active && (
        <details className="mt-3.75 text-left text-xs">
          <summary className="text-center">Have a demo access code?</summary>
          <label htmlFor="demo-code" className="mt-3 mb-1.25 block">
            Access code
          </label>
          <input
            id="demo-code"
            type="password"
            autoComplete="off"
            value={code}
            onChange={(event) => voice$.accessCode.set(event.target.value)}
            className="w-full rounded-[7px] border border-input bg-white p-2 text-sm text-foreground"
          />
        </details>
      )}

      {active ? (
        <div className="mt-5.5 flex items-center gap-2.25">
          <button
            className="grid place-items-center rounded-[9px] border border-sage-foreground/40 bg-white/60 p-3.25 text-primary"
            onClick={() => setMuted(!isMuted)}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={isMuted}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button className={primaryButton} onClick={() => endSession()}>
            <PhoneOff size={17} /> End conversation
          </button>
        </div>
      ) : (
        <button className={cn(primaryButton, 'mt-5.5')} disabled={busy} onClick={start}>
          <Mic size={17} />
          {busy ? 'Connecting…' : error ? 'Try voice again' : 'Talk to the assistant'}
        </button>
      )}

      <p className="mt-2.75 text-xs">
        {active ? 'Powered by ElevenLabs' : 'Uses your microphone. Audio is sent to ElevenLabs.'}
      </p>
      {error && (
        <p
          className="mt-3.5 rounded-lg border border-danger-border bg-danger-surface p-3 text-left text-[13px] text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 border-t border-sage-line pt-4.75 text-left">
        <div className="flex justify-between gap-2 text-[13px] font-bold text-foreground">
          Conversation{' '}
          <span className="text-xs font-normal text-sage-foreground">
            {active ? label : 'Transcript'}
          </span>
        </div>
        <div
          ref={transcriptRef}
          className="max-h-61.25 overflow-auto overscroll-contain"
          role="log"
          aria-label="Conversation transcript"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 ? (
            <p className="mt-3.25 text-[13px] leading-[1.6]">
              Try “Something vegetarian under ₦8,000”, then “Add one to my order”.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'mt-2.5 rounded-[10px] p-3',
                  message.role === 'user' ? 'bg-sage-strong' : 'bg-white/70',
                )}
              >
                <span className="text-[11px] font-bold">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
                <p className="mt-1.25 text-sm text-foreground">{message.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

const primaryButton =
  'flex w-full items-center justify-center gap-2.25 rounded-[9px] bg-primary px-3.75 py-3.25 text-[15px] font-bold text-primary-foreground';

function statusLabel({
  active,
  busy,
  isMuted,
  isSpeaking,
}: {
  active: boolean;
  busy: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
}) {
  if (!active) return busy ? 'Connecting…' : 'Ready when you are';
  if (isMuted) return 'Microphone muted';
  return isSpeaking ? 'Assistant speaking' : 'Listening to you';
}

const toolResult = (value: unknown) => JSON.stringify(value);

async function searchMenuTool(params: unknown) {
  const parsed = searchToolSchema.safeParse(params);
  if (!parsed.success) return toolResult({ success: false, error: 'Invalid menu filters.' });

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed.data))
    if (value !== undefined) search.set(key, String(value));

  try {
    const response = await fetch(`/api/menu?${search}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Menu search failed.');
    return toolResult({ success: true, result: await response.json() });
  } catch {
    return toolResult({ success: false, error: 'Menu search is unavailable. Please retry.' });
  }
}

const sessionResponseSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
});

/** Fetches a conversation token and checks microphone access. Never throws. */
async function requestVoiceSession(code: string): Promise<{ token: string } | { error: string }> {
  try {
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error('Voice needs microphone support on localhost or HTTPS.');

    const response = await fetch('/api/voice/session', {
      method: 'POST',
      headers: { 'x-demo-access-code': code },
      signal: AbortSignal.timeout(15_000),
    });
    const body = sessionResponseSchema.parse(await response.json());
    if (!response.ok || !body.token)
      throw new Error(body.error || 'Could not start a voice session.');

    const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphone.getTracks().forEach((track) => track.stop());
    return { token: body.token };
  } catch (failure) {
    if (failure instanceof DOMException && failure.name === 'NotAllowedError')
      return {
        error:
          'Microphone access was denied. Allow it in your browser’s site settings, then retry.',
      };
    return {
      error: failure instanceof Error ? failure.message : 'Could not start voice. Please retry.',
    };
  }
}
