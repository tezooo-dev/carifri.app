import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import {
  Bot, Send, User, Loader2, Sparkles, AlertTriangle,
  Truck, Package, DollarSign, RotateCcw, Copy, Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// --- Prompt helpers ---

function buildSystemPrompt(loads, carriers, shippers, settings) {
  const activeLoads = loads.filter(l => ['Available', 'Booked', 'In Transit'].includes(l.status));
  const loadSummary = activeLoads.map(l => {
    const carrier = carriers.find(c => c.id === l.carrierId);
    return `- ${l.id}: ${l.origin}→${l.destination} | ${l.commodity} | ${l.weight}kg | ${l.truckType} | Status: ${l.status}${carrier ? ` | Carrier: ${carrier.name}` : ''}`;
  }).join('\n');

  const carrierSummary = carriers.map(c =>
    `- ${c.name} (${c.location}): ${c.truckTypes.join(', ')} | ${c.truckCount} trucks | Rating: ${c.rating} | ${c.verified ? 'Verified' : 'Unverified'} | ${c.totalLoads} loads done`
  ).join('\n');

  const financeSummary = [
    `Total commission earned: ${settings.currency} ${loads.filter(l => l.commissionReceived).reduce((s, l) => s + l.commission, 0).toLocaleString()}`,
    `Pending commission: ${settings.currency} ${loads.filter(l => !l.commissionReceived && l.status !== 'Cancelled').reduce((s, l) => s + l.commission, 0).toLocaleString()}`,
    `Commission rate: ${settings.commissionRate}%`,
  ].join('\n');

  return `You are FreightLink AI — an expert freight brokerage operations assistant for ${settings.companyName} in ${settings.country}.

Your role is to assist the dispatch team with:
- Carrier matching and recommendation (analyze requirements vs. carrier capabilities)
- Route pricing guidance (market rates for Kenya freight corridors)
- Load performance analysis and operational insights
- Dispute mediation advice between carriers and shippers
- Compliance reminders (ADR for hazmat, reefer temp requirements, etc.)
- Revenue optimization suggestions

## Current Platform Data (live)

### Active Loads (${activeLoads.length}):
${loadSummary || 'No active loads'}

### Carrier Network (${carriers.length} carriers):
${carrierSummary}

### Financial Snapshot:
${financeSummary}

## Guidelines
- Be concise and actionable — this is an operations tool, not a chatbot
- Quote specific load IDs, carrier names, and ${settings.currency} amounts when relevant
- For carrier recommendations, always explain WHY (rating, truck type match, location proximity, available capacity)
- For pricing: typical Kenya corridors — Mombasa–Nairobi flatbed ~KES 160–200K, Nairobi–Kisumu reefer ~KES 80–110K, Nairobi–Eldoret dry van ~KES 60–85K
- Flag compliance concerns proactively (hazmat, insurance gaps, overweight loads)
- Always respond in a professional but direct tone`;
}

// --- Suggestion chips ---

const SUGGESTIONS = [
  { icon: Truck,     text: 'Which carrier best fits FL-005 (Tanker, Mombasa→Nairobi)?' },
  { icon: Package,   text: 'Which loads need a carrier assigned right now?' },
  { icon: DollarSign,text: 'What is a fair rate for an Eldoret→Nairobi dry van load?' },
  { icon: Sparkles,  text: 'Summarise this week\'s operational performance' },
];

// --- Message bubble ---

function Message({ msg }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = msg.role === 'assistant';

  function copy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isAssistant ? 'bg-blue-600' : 'bg-slate-700'
      }`}>
        {isAssistant
          ? <Bot size={16} className="text-white" />
          : <User size={16} className="text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`group relative max-w-[85%] ${isAssistant ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAssistant
            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
            : 'bg-blue-600 text-white rounded-tr-none'
        }`}>
          {msg.content}
          {msg.streaming && (
            <span className="inline-block w-2 h-4 bg-blue-400 rounded-sm ml-1 animate-pulse" />
          )}
        </div>
        {isAssistant && msg.content && !msg.streaming && (
          <button
            onClick={copy}
            className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

export default function AIDispatch() {
  const { loads, carriers, shippers, settings } = useApp();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] ?? 'there'}! I'm FreightLink AI, your dispatch co-pilot.\n\nI have live access to your ${loads.filter(l => ['Available','Booked','In Transit'].includes(l.status)).length} active loads and ${carriers.length} carriers. Ask me anything — carrier recommendations, route pricing, performance analysis, compliance questions, or operational insights.`,
      streaming: false,
    },
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState('');
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  const hasApiKey = !!import.meta.env.VITE_ANTHROPIC_API_KEY;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput('');
    setApiError('');

    const userMsg = { role: 'user', content: userText, streaming: false };
    const assistantMsg = { role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    // Build history for API (exclude first system greeting)
    const history = [...messages.slice(1), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const client = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const stream = client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: buildSystemPrompt(loads, carriers, shippers, settings),
        messages: history,
      });

      abortRef.current = stream;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          setMessages(prev => {
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.content += event.delta.text;
            updated[updated.length - 1] = last;
            return updated;
          });
        }
      }

      // Mark streaming done
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
        return updated;
      });
    } catch (err) {
      setMessages(prev => prev.slice(0, -1)); // remove empty assistant bubble
      if (err instanceof Anthropic.AuthenticationError) {
        setApiError('Invalid API key. Check VITE_ANTHROPIC_API_KEY in your .env file.');
      } else if (err instanceof Anthropic.RateLimitError) {
        setApiError('Rate limit reached. Please wait a moment and try again.');
      } else {
        setApiError(err?.message ?? 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function stop() {
    abortRef.current?.abort?.();
    setLoading(false);
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
      return updated;
    });
  }

  function reset() {
    setMessages([{
      role: 'assistant',
      content: `Conversation cleared. What would you like to know?`,
      streaming: false,
    }]);
    setApiError('');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Dispatch Co-pilot</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-red-400'}`} />
                {hasApiKey ? 'claude-opus-4-6 · live context loaded' : 'API key not set'}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={13} /> New chat
        </button>
      </div>

      {/* No API key warning */}
      {!hasApiKey && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-0.5">API key required</div>
            <div className="text-amber-700 text-xs">
              Copy <code className="bg-amber-100 px-1 rounded">.env.example</code> to{' '}
              <code className="bg-amber-100 px-1 rounded">.env</code> and add your{' '}
              <code className="bg-amber-100 px-1 rounded">VITE_ANTHROPIC_API_KEY</code>.
              Get your key at{' '}
              <span className="font-semibold">console.anthropic.com</span>.
              Restart the dev server after saving.
            </div>
          </div>
        </div>
      )}

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-5 mb-3">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* API error */}
      {apiError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          {apiError}
        </div>
      )}

      {/* Suggestion chips — show when only the intro message is present */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(({ icon: Icon, text }) => (
            <button
              key={text}
              onClick={() => send(text)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Icon size={13} className="text-slate-400" />
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={hasApiKey ? 'Ask about loads, carriers, pricing, performance…' : 'Set VITE_ANTHROPIC_API_KEY to enable AI chat'}
          disabled={!hasApiKey || loading}
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
        />
        {loading ? (
          <button
            onClick={stop}
            className="px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 flex items-center gap-2"
          >
            <Loader2 size={16} className="animate-spin" /> Stop
          </button>
        ) : (
          <button
            onClick={() => send()}
            disabled={!input.trim() || !hasApiKey}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} /> Send
          </button>
        )}
      </div>

      <p className="text-xs text-center text-slate-400 mt-2">
        AI responses are informational — always verify critical decisions.
        Production deployments should proxy API calls through your backend.
      </p>
    </div>
  );
}
