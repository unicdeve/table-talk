'use client';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { ConversationProvider, useConversationControls, useConversationStatus, useConversationInput, useConversationMode, useConversationClientTool } from '@elevenlabs/react';
import { AudioLines, Mic, MicOff, PhoneOff } from 'lucide-react';
import { menu } from '@/lib/tabletalk/menu';
import { DraftOrder, OrderUpdate, orderSummary } from '@/lib/tabletalk/order';
import { searchToolSchema, highlightToolSchema, updateToolSchema } from '@/lib/tabletalk/tool-schemas';

type Message = { id: string; source: 'user' | 'ai'; text: string };
type Props = { order: DraftOrder; onUpdate: (update: OrderUpdate) => unknown; onHighlight: (ids: string[]) => void };
export default function VoiceAssistant(props: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  return <ConversationProvider
    onMessage={message => {
      if (!message.message.trim()) return;
      const id = message.event_id !== undefined ? `${message.source}-${message.event_id}` : crypto.randomUUID();
      setMessages(current => {
        const index = current.findIndex(item => item.id === id);
        const next = { id, source: message.source, text: message.message };
        return (index >= 0 ? current.map((item, i) => i === index ? next : item) : [...current, next]).slice(-100);
      });
    }}
    onError={() => setError('The voice connection failed. End the session and try again.')}
    onDisconnect={details => { if (details.reason === 'error') setError('Voice disconnected unexpectedly. You can retry.'); }}
  ><VoiceSurface {...props} messages={messages} error={error} setError={setError} resetTranscript={() => setMessages([])}/></ConversationProvider>;
}
function VoiceSurface({ order, onUpdate, onHighlight, messages, error, setError, resetTranscript }: Props & { messages: Message[]; error: string; setError: (message: string) => void; resetTranscript: () => void }) {
  const { startSession, endSession, sendContextualUpdate } = useConversationControls();
  const { status } = useConversationStatus();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking } = useConversationMode();
  const [starting, setStarting] = useState(false);
  const [code, setCode] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);
  const startLock = useRef(false);
  const active = status === 'connected';
  const busy = starting || status === 'connecting';
  useConversationClientTool('search_menu', async (params: unknown) => {
    const parsed = searchToolSchema.safeParse(params);
    if (!parsed.success) return JSON.stringify({ success: false, error: 'Invalid menu filters.' });
    try {
      const search = new URLSearchParams();
      Object.entries(parsed.data).forEach(([key, value]) => { if (value !== undefined) search.set(key, String(value)); });
      const result = await fetch(`/api/menu?${search}`, { signal: AbortSignal.timeout(8000) });
      if (!result.ok) throw new Error('Menu search failed.');
      return JSON.stringify({ success: true, result: await result.json() });
    } catch { return JSON.stringify({ success: false, error: 'Menu search is unavailable. Please retry.' }); }
  });
  useConversationClientTool('highlight_items', (params: unknown) => {
    const parsed = highlightToolSchema.safeParse(params);
    if (!parsed.success || parsed.data.itemIds.some(id => !menu.some(item => item.id === id))) return JSON.stringify({ success: false, error: 'Use only valid item IDs returned by search_menu.' });
    onHighlight(parsed.data.itemIds); return JSON.stringify({ success: true });
  });
  useConversationClientTool('update_draft_order', (params: unknown) => {
    const parsed = updateToolSchema.safeParse(params);
    if (!parsed.success) return JSON.stringify({ success: false, error: 'Invalid item, action or quantity.' });
    return JSON.stringify(onUpdate(parsed.data));
  });
  useEffect(() => {
    if (active) sendContextualUpdate(`Current draft order: ${JSON.stringify(orderSummary(order))}. Use these quantities as the source of truth. This update does not require a spoken response.`);
  }, [order, active, sendContextualUpdate]);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => { endSession(); setError('The five-minute demo session has ended. Start again to continue.'); }, 5 * 60_000);
    return () => clearTimeout(timer);
  }, [active, endSession, setError]);
  useEffect(() => { const element = transcriptRef.current; if (element) element.scrollTop = element.scrollHeight; }, [messages]);
  async function start() {
    if (startLock.current || busy || active) return;
    startLock.current = true; setStarting(true); setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Voice needs microphone support on localhost or HTTPS.');
      const response = await fetch('/api/voice/session', { method: 'POST', headers: { 'x-demo-access-code': code }, signal: AbortSignal.timeout(15_000) });
      const body = z.object({ token: z.string().optional(), error: z.string().optional() }).parse(await response.json());
      if (!response.ok || !body.token) throw new Error(body.error || 'Could not start a voice session.');
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach(track => track.stop());
      resetTranscript(); setMuted(false);
      await startSession({ conversationToken: body.token, connectionType: 'webrtc' });
    } catch (failure) {
      setError(failure instanceof DOMException && failure.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your browser’s site settings, then retry.' : failure instanceof Error ? failure.message : 'Could not start voice. Please retry.');
    } finally { setStarting(false); startLock.current = false; }
  }
  const label = active ? isMuted ? 'Microphone muted' : isSpeaking ? 'Assistant speaking' : 'Listening to you' : busy ? 'Connecting…' : 'Ready when you are';
  return <section className="voice-panel"><div className="panel-heading"><span className="eyebrow">YOUR TABLE ASSISTANT</span><span className="ready-label">{active ? 'Live' : 'Voice'}</span></div>
    <div className={`voice-orb ${active && isSpeaking ? 'speaking' : ''}`}><AudioLines size={44}/></div><h2>{active ? 'What are you craving?' : 'Let’s talk food.'}</h2><p>{active ? label : <>Tell me what you’re craving.<br/>I’ll help you build your order.</>}</p>
    {!active && <details className="access-code"><summary>Have a demo access code?</summary><label htmlFor="demo-code">Access code</label><input id="demo-code" type="password" autoComplete="off" value={code} onChange={event => setCode(event.target.value)}/></details>}
    {active ? <div className="voice-actions"><button className="mute-button" onClick={() => setMuted(!isMuted)} aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'} aria-pressed={isMuted}>{isMuted ? <MicOff size={18}/> : <Mic size={18}/>}</button><button className="primary-button" onClick={() => endSession()}><PhoneOff size={17}/> End conversation</button></div> : <button className="primary-button" disabled={busy} onClick={start}><Mic size={17}/>{busy ? 'Connecting…' : error ? 'Try voice again' : 'Talk to the assistant'}</button>}
    <p className="voice-footnote">{active ? 'Powered by ElevenLabs' : 'Uses your microphone. Audio is sent to ElevenLabs.'}</p>
    {error && <p className="voice-error" role="alert">{error}</p>}
    <div className="transcript-section"><div className="transcript-title">Conversation <span>{active ? label : 'Transcript'}</span></div><div className="transcript" ref={transcriptRef} role="log" aria-label="Conversation transcript" aria-live="polite" aria-relevant="additions text">{messages.length === 0 ? <p className="transcript-empty">Try “Something vegetarian under ₦8,000”, then “Add one to my order”.</p> : messages.map(message => <div key={message.id} className={`message ${message.source}`}><span>{message.source === 'user' ? 'You' : 'Assistant'}</span><p>{message.text}</p></div>)}</div></div>
  </section>;
}
