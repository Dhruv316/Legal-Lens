'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../Navbar';
import { Poppins } from 'next/font/google';
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Brain,
  TrendingUp,
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { PageHeader, Eyebrow, DemoCard, SectionTitle } from '../demo/DemoUI';
import { StatChip } from '../demo/ItemIdentity';
import { DEMO_PRODUCT } from '../../lib/demoData';
import { DEMO_USER } from '../../lib/demoConfig';
import { generateChatResponse, PRODUCT_STATS, EXAMPLE_QUERIES } from '../../lib/chatbotIntents';

const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'] });

const GREETING_MESSAGE = {
  role: 'assistant',
  content:
    `Hello! I'm your AI compliance assistant. I can help you with:\n\n` +
    `• **Personal Data Queries**: Ask about your products, compliance scores, and statistics\n` +
    `• **General Compliance**: Learn about regulations, rules, and requirements\n\n` +
    `How can I help you today?`,
  intent: 'greeting',
  timestamp: new Date().toISOString(),
};

// useSearchParams() requires a Suspense boundary, otherwise `next build`
// fails during static prerendering — same pattern as the real page and
// every other Demo* component that reads the query string.
export default function DemoChatbot() {
  return (
    <Suspense fallback={null}>
      <DemoChatbotContent />
    </Suspense>
  );
}

function DemoChatbotContent() {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Demo mode never gates on a real session — same as every other
  // Demo* page — but still honors userId/role from the query string
  // when present, falling back to the shared DEMO_USER otherwise.
  const userId = searchParams.get('userId') || DEMO_USER.userId;
  const userRole = searchParams.get('role') || DEMO_USER.role;

  const [messages, setMessages] = useState([GREETING_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message — no network call. A short artificial delay
  // keeps the existing "Analyzing..." loading indicator meaningful
  // instead of the response appearing instantly, which would look
  // broken next to the rest of the send/receive UX.
  const handleSendMessage = () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const messageToSend = inputMessage.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    setTimeout(() => {
      const data = generateChatResponse(messageToSend);
      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        intent: data.intent,
        user_context: data.user_context,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
      inputRef.current?.focus();
    }, 550 + Math.random() * 400);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([{ ...GREETING_MESSAGE, timestamp: new Date().toISOString() }]);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Each intent also carries its own ambient glow shadow (same rgba
  // figures as the matching .glow-accent / .glow-success utility class
  // in globals.css, plus a bespoke violet one for general_compliance,
  // which has no existing violet glow-* class) so the bot's avatar can
  // glow in the intent's own hue. Kept as an inline shadow value here
  // rather than a stacked glow-* class, since the avatar circle also
  // needs its own bg/border classes and mixing a glow-* class in would
  // just add a second box-shadow rule with no guaranteed layering.
  const getIntentStyle = (intent) => {
    switch (intent) {
      case 'personal_data':
        return {
          icon: Package,
          color: 'text-accent',
          bg: 'bg-accent/10',
          border: 'border-accent/20',
          glowShadow: '0 0 0 1px rgba(124, 111, 238, 0.08), 0 0 28px 6px rgba(124, 111, 238, 0.35)',
        };
      case 'general_compliance':
        return {
          icon: ShieldCheck,
          color: 'text-violet-300',
          bg: 'bg-violet-500/15',
          border: 'border-violet-500/30',
          glowShadow: '0 0 0 1px rgba(109, 40, 217, 0.08), 0 0 28px 6px rgba(109, 40, 217, 0.32)',
        };
      default:
        return {
          icon: Brain,
          color: 'text-emerald-300',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/30',
          glowShadow: '0 0 0 1px rgba(16, 185, 129, 0.10), 0 0 28px 6px rgba(16, 185, 129, 0.35)',
        };
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground ml-20 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 h-screen flex flex-col">
          <PageHeader icon={MessageSquare} label="Chatbot" page="Chatbot" code={DEMO_PRODUCT.code} />

          {/* Header */}
          <div className="mt-6 mb-4 shrink-0">
            <Eyebrow color="blue">Assistant / Intent Detection</Eyebrow>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Chatbot</h1>
                <p className="text-sm text-foreground-muted mt-1">Intelligent compliance assistant with intent detection.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/[0.03] transition-colors text-xs flex items-center gap-2 text-foreground-muted"
                  aria-label="Clear chat"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <div className={`text-xs ${poppins.className} text-foreground-muted`}>
                  User <span className="font-mono text-foreground">{userId}</span> · Role{' '}
                  <span className="font-semibold text-foreground">{userRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Part 11 structural redesign: the chat used to be the
              only thing on the page — one full-width column with no
              persistent context. It now sits beside a narrow sidebar
              (desktop only; the chat itself is untouched below) with
              a real catalog snapshot (PRODUCT_STATS, the exact same
              derived figures the "Your Stats" panel inside the chat
              already uses) and a few of the real EXAMPLE_QUERIES as
              clickable prompts, so the assistant's capabilities are
              visible at a glance instead of only discoverable by
              scrolling to the 3 suggestion chips under the input. */}
          <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_260px] gap-6">
          {/* Chat Container — warm hero gradient tint (hero-gradient-bg,
              the same --gradient-hero token used on other pages' summary
              surfaces) in place of a flat white panel, plus the standard
              elevated-tier shadow so the whole chat reads as a distinct
              surface rather than a plain box floating on the page bg. */}
          <div className="flex flex-col min-h-0 hero-gradient-bg border border-white/[0.04] elevation-elevated rounded-2xl">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                const intentStyle = !isUser ? getIntentStyle(message.intent) : null;
                const IntentIcon = intentStyle?.icon;

                // Message grouping: consecutive messages from the same
                // sender collapse their gap and skip repeating the avatar
                // circle — same Slack/iMessage-style visual as the real
                // page, computed fresh from `messages` each render.
                const prevMessage = messages[index - 1];
                const isGrouped = prevMessage?.role === message.role;

                return (
                  <div
                    key={index}
                    className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    style={isGrouped ? { marginTop: '-0.5rem' } : undefined}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                        {!isGrouped && (
                          <div
                            className={`w-full h-full rounded-full ${intentStyle.bg} border ${intentStyle.border} flex items-center justify-center`}
                            style={{ boxShadow: intentStyle.glowShadow }}
                          >
                            {IntentIcon ? (
                              <IntentIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${intentStyle.color}`} />
                            ) : (
                              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-foreground-muted" />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Elevated user bubbles vs. flatter bot bubbles for
                          visual rhythm: user messages sit a tier up
                          (elevation-elevated) while the bot's replies stay
                          at the calmer resting tier (elevation-card) —
                          same two-tier vocabulary the rest of the app uses
                          to distinguish "yours" from ambient content. */}
                      <div
                        className={`rounded-2xl p-3 sm:p-4 ${
                          isUser
                            ? 'bg-accent text-white elevation-elevated'
                            : 'bg-white/[0.03] border border-white/[0.06] text-foreground elevation-card'
                        }`}
                      >
                        <div
                          className={`text-sm sm:text-base ${poppins.className} whitespace-pre-wrap break-words`}
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, `<strong class="font-bold ${isUser ? 'text-white' : 'text-foreground'}">$1</strong>`)
                              .replace(/\n/g, '<br/>')
                              .replace(/•/g, `<span class="${isUser ? 'text-white' : 'text-accent'}">•</span>`),
                          }}
                        />

                        {/* User Context Display — same StatChip panel Part 9
                            built for the live backend's user_context.stats,
                            now fed by the locally computed PRODUCT_STATS via
                            chatbotIntents.js instead of a live response. */}
                        {message.user_context?.stats && (
                          <div className="mt-3 pt-3 border-t border-white/[0.06]">
                            <div className="flex items-center gap-2 text-[10px] text-foreground-muted uppercase tracking-wider mb-2">
                              <TrendingUp className="w-3 h-3" />
                              Your Stats
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <StatChip
                                icon={Package}
                                label="Total Products"
                                value={message.user_context.stats.total_products}
                                tone="accent"
                              />
                              <StatChip
                                icon={CheckCircle2}
                                label="Compliant"
                                value={message.user_context.stats.compliant_products}
                                tone="emerald"
                              />
                              <StatChip
                                icon={XCircle}
                                label="Non-Compliant"
                                value={message.user_context.stats.non_compliant_products}
                                tone="amber"
                              />
                              <StatChip
                                icon={TrendingUp}
                                label="Avg Score"
                                value={message.user_context.stats.avg_compliance_score}
                                tone="teal"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message Footer */}
                      <div className="flex items-center gap-2 mt-1 px-2">
                        <span className="text-[10px] text-foreground-muted uppercase tracking-wider">
                          {formatTime(message.timestamp)}
                        </span>
                        {!isUser && (
                          <>
                            <span className="text-foreground-muted/50">•</span>
                            <button
                              onClick={() => copyToClipboard(message.content, index)}
                              className="text-foreground-muted hover:text-accent transition-colors"
                              aria-label="Copy message"
                            >
                              {copiedIndex === index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                        {!isGrouped && (
                          <div className="w-full h-full rounded-full bg-accent flex items-center justify-center">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex gap-3 sm:gap-4 justify-start animate-fade-in">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-foreground-muted" />
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span className={`text-sm ${poppins.className} text-foreground-muted uppercase tracking-wider`}>
                        Analyzing...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-white/[0.06] p-4 sm:p-6 bg-white/[0.015]">
              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setInputMessage('Show me my products with low compliance scores')}
                  className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs hover:bg-white/[0.06] transition-colors text-foreground-muted"
                  disabled={loading}
                >
                  My products
                </button>
                <button
                  onClick={() => setInputMessage('What is the Legal Metrology Act?')}
                  className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs hover:bg-white/[0.06] transition-colors text-foreground-muted"
                  disabled={loading}
                >
                  Legal Metrology
                </button>
                <button
                  onClick={() => setInputMessage("What's my average compliance score?")}
                  className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs hover:bg-white/[0.06] transition-colors text-foreground-muted"
                  disabled={loading}
                >
                  My stats
                </button>
              </div>

              {/* Input Field */}
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your products or compliance regulations..."
                    className={`w-full px-4 py-3 bg-card border border-white/10 rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent/50 transition-colors resize-none ${poppins.className} text-sm sm:text-base`}
                    rows="1"
                    disabled={loading}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="px-4 sm:px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-[10px] text-foreground-muted mt-2 text-center uppercase tracking-wider">
                Press Enter to send • Shift + Enter for new line · Runs fully offline in demo mode
              </p>
            </div>
          </div>

          {/* Sidebar — desktop only, chat area/logic above is
              unchanged. Nothing here is a new StatChip usage (the
              "Your Stats" panel inside the chat already covers that
              component); this is a plain summary + prompt list. */}
          <aside className="hidden lg:flex flex-col gap-5">
            <DemoCard>
              <SectionTitle sub="Same figures the assistant uses in-chat">Catalog Snapshot</SectionTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Total Products</span>
                  <span className="font-semibold text-foreground">{PRODUCT_STATS.total_products}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Compliant</span>
                  <span className="font-semibold text-emerald-300">{PRODUCT_STATS.compliant_products}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Non-Compliant</span>
                  <span className="font-semibold text-red-300">{PRODUCT_STATS.non_compliant_products}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Avg Score</span>
                  <span className="font-semibold text-foreground">{PRODUCT_STATS.avg_compliance_score}</span>
                </div>
              </div>
            </DemoCard>

            <DemoCard>
              <SectionTitle>Try Asking</SectionTitle>
              <div className="flex flex-col gap-2.5">
                {EXAMPLE_QUERIES.slice(0, 5).map((q) => (
                  <button
                    key={q.text}
                    onClick={() => setInputMessage(q.text)}
                    disabled={loading}
                    className="text-left px-3.5 py-2.5 rounded-lg text-xs text-foreground-muted bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-foreground transition"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </DemoCard>
          </aside>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(124, 111, 238, 0.3);
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 111, 238, 0.5);
        }

        scrollbar-width: thin;
        scrollbar-color: rgba(124, 111, 238, 0.3) transparent;
      `}</style>
    </>
  );
}
