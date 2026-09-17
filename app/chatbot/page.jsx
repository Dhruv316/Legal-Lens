
"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "../Navbar"
import { Poppins } from "next/font/google"
import {
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Sparkles,
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
} from "lucide-react"
import { DemoPage, PageHeader, Eyebrow, IconChip, PrimaryButton } from "../demo/DemoUI"
import { StatChip } from "../demo/ItemIdentity"
import { DEMO_PRODUCT } from "../../lib/demoData"
import { DEMO_MODE } from "../../lib/demoConfig"
import DemoChatbot from "./DemoChatbot"

const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"] })
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

// useSearchParams() requires a Suspense boundary, otherwise `next build`
// fails during static prerendering.
export default function Chatbot() {
  if (DEMO_MODE) return <DemoChatbot />

  return (
    <Suspense fallback={null}>
      <ChatbotContent />
    </Suspense>
  )
}

function ChatbotContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Authentication logic
  useEffect(() => {
    const userIdParam = searchParams.get("userId")
    const roleParam = searchParams.get("role")

    if (userIdParam && roleParam) {
      setUserId(parseInt(userIdParam))
      setUserRole(roleParam)
      setIsAuthenticated(true)
      localStorage.setItem("userid", userIdParam)
      localStorage.setItem("userrole", roleParam)
      localStorage.setItem("isAuthenticated", "true")
    } else {
      const storedUserId = localStorage.getItem("userid")
      const storedRole = localStorage.getItem("userrole")
      const storedAuth = localStorage.getItem("isAuthenticated")

      if (storedUserId && storedRole && storedAuth === "true") {
        setUserId(parseInt(storedUserId))
        setUserRole(storedRole)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setTimeout(() => router.push("/auth/login"), 2000)
      }
    }
  }, [searchParams, router])

  // Chat states
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your AI compliance assistant. I can help you with:\n\n• **Personal Data Queries**: Ask about your products, compliance scores, and statistics\n• **General Compliance**: Learn about regulations, rules, and requirements\n\nHow can I help you today?`,
      intent: "greeting",
      timestamp: new Date().toISOString(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    if (!isAuthenticated || !userId || !userRole) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Authentication required. Please log in to continue.",
          intent: "error",
          timestamp: new Date().toISOString(),
        },
      ])
      return
    }

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: inputMessage.trim(),
        }),
      })

      const data = await response.json()
     console.log(data)
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear()
          setTimeout(() => router.push("/auth/login"), 1500)
          throw new Error("Session expired. Please log in again.")
        }
        throw new Error(data.error || "Failed to get response")
      }

      const assistantMessage = {
        role: "assistant",
        content: data.message,
        intent: data.intent,
        user_context: data.user_context,
        timestamp: data.timestamp,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat API error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
          intent: "error",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Copy message to clipboard
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hello! I'm your AI compliance assistant. I can help you with:\n\n• **Personal Data Queries**: Ask about your products, compliance scores, and statistics\n• **General Compliance**: Learn about regulations, rules, and requirements\n\nHow can I help you today?`,
        intent: "greeting",
        timestamp: new Date().toISOString(),
      },
    ])
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get intent icon and color
  const getIntentStyle = (intent) => {
    switch (intent) {
      case "personal_data":
        return { icon: Package, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" }
      case "general_compliance":
        return { icon: ShieldCheck, color: "text-violet-300", bg: "bg-violet-500/15", border: "border-violet-500/30" }
      case "error":
        return { icon: AlertCircle, color: "text-red-300", bg: "bg-red-500/15", border: "border-red-500/30" }
      default:
        return { icon: Brain, color: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30" }
    }
  }

  // Show authentication warning if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background text-foreground ml-20 lg:ml-64 flex items-center justify-center p-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-10 h-10 text-red-300" />
              <h2 className="text-xl font-bold text-red-300">Authentication required</h2>
            </div>
            <p className="text-foreground-muted mb-4">Please log in to access the chatbot. Redirecting to login...</p>
            <PrimaryButton onClick={() => router.push("/auth/login")}>Go to Login</PrimaryButton>
          </div>
        </div>
      </>
    )
  }

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
                  User <span className="font-mono text-foreground">{userId}</span> · Role{" "}
                  <span className="font-semibold text-foreground">{userRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div className="flex flex-col flex-1 min-h-0 bg-card border border-white/[0.04] shadow-sm shadow-black/40 rounded-2xl">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent">
              {messages.map((message, index) => {
                const isUser = message.role === "user"
                const intentStyle = !isUser ? getIntentStyle(message.intent) : null
                const IntentIcon = intentStyle?.icon

                // Message grouping: consecutive messages from the same
                // sender collapse their gap and repeat only a blank
                // spacer instead of the same avatar circle again — a
                // purely visual read (Slack/iMessage-style), computed
                // fresh from the existing `messages` array each render.
                // Doesn't touch how messages are sent, stored, or fetched.
                const prevMessage = messages[index - 1]
                const isGrouped = prevMessage?.role === message.role

                return (
                  <div
                    key={index}
                    className={`flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                    style={isGrouped ? { marginTop: "-0.5rem" } : undefined}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                        {!isGrouped && (
                          <div className={`w-full h-full rounded-full ${intentStyle.bg} border ${intentStyle.border} flex items-center justify-center`}>
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
                    <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl p-3 sm:p-4 ${
                          isUser
                            ? "bg-accent text-white"
                            : "bg-white/[0.03] border border-white/[0.06] text-foreground"
                        }`}
                      >
                        <div
                          className={`text-sm sm:text-base ${poppins.className} whitespace-pre-wrap break-words`}
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, `<strong class="font-bold ${isUser ? "text-white" : "text-foreground"}">$1</strong>`)
                              .replace(/\n/g, "<br/>")
                              .replace(/•/g, `<span class="${isUser ? "text-white" : "text-accent"}">•</span>`),
                          }}
                        />

                        {/* User Context Display — the backend already returns this
                            live, per-user stats block on personal_data-intent
                            replies (user_context.stats); this was previously built
                            but left commented out with a plain ad-hoc grid. Re-enabled
                            here using StatChip so it reads as the same "small labeled
                            data point" visual language as the rest of the app,
                            instead of a bespoke grid found only on this page. Purely
                            a rendering change — the data still comes from the same
                            response object, nothing new is fetched or fabricated. */}
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
                              {copiedIndex === index ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
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
                )
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
                  onClick={() => setInputMessage("Show me my products with low compliance scores")}
                  className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs hover:bg-white/[0.06] transition-colors text-foreground-muted"
                  disabled={loading}
                >
                  My products
                </button>
                <button
                  onClick={() => setInputMessage("What is the Legal Metrology Act?")}
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
                    style={{ minHeight: "48px", maxHeight: "120px" }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="px-4 sm:px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-[10px] text-foreground-muted mt-2 text-center uppercase tracking-wider">
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
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
  )
}
