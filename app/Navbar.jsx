"use client"
import { Suspense, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { LayoutDashboard, FileCheck, ShieldCheck, MessageSquare, ShoppingBag, Building2, LogOut, GiftIcon, ScanLine, Search } from "lucide-react"
import { Poppins } from "next/font/google"
import { DEMO_MODE, APP_NAME, APP_VERSION } from "../lib/demoConfig"
import CommandPalette, { openCommandPalette } from "./CommandPalette"

const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"] })
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

// Demo Mode nav — fixed tab order matching the Legal Lens spec.
// Chatbot is kept in demo nav as an intentional exception: it isn't
// described in the Detailed Project Info doc, but it's a real, already
// -built feature, so it's restyled and included rather than removed.
const demoNav = [
  { name: "Dashboard", subtitle: "Overview & activity", path: "dashboard", icon: LayoutDashboard },
  { name: "Check Compliance", subtitle: "Product analysis", path: "check-compliance", icon: FileCheck },
  { name: "Seller Verification", subtitle: "Trust & risk", path: "seller-verification", icon: ShieldCheck },
  { name: "Products", subtitle: "Catalog & insights", path: "products", icon: ShoppingBag },
  { name: "Entities", subtitle: "Connected organizations", path: "entities", icon: Building2 },
  { name: "Rewards", subtitle: "Meta-Token loop", path: "rewards", icon: GiftIcon },
  { name: "Chatbot", subtitle: "Ask Legal Lens", path: "chatbot", icon: MessageSquare },
]

// useSearchParams() requires a Suspense boundary in the App Router,
// otherwise `next build` fails during static prerendering. Wrapping it
// here means every page that renders <Navbar /> is automatically safe.
export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  )
}

function NavbarContent() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const userId = searchParams.get("userId")
  const userRole = searchParams.get("role")

  // ============================
  // ROLE-BASED NAVIGATION
  // ============================

  // Consumer sees:
  // Dashboard, Check Compliance, Entities, Products, Chatbot
  const consumerNav = [
    { name: "Dashboard", path: "dashboard", icon: LayoutDashboard },
    { name: "Check Compliance", path: "check-compliance", icon: FileCheck },
    { name: "Entities", path: "entities", icon: Building2 },
    { name: "Products", path: "products", icon: ShoppingBag },
    { name: "Chatbot", path: "chatbot", icon: MessageSquare },
    { name: "Rewards", path: "rewards", icon: GiftIcon },
  ]

  // Seller sees ONLY:
  // Seller Verification, Chatbot
  const sellerNav = [
    { name: "Seller Verification", path: "seller-verification", icon: ShieldCheck },
    { name: "Chatbot", path: "chatbot", icon: MessageSquare },
  ]

  const navItems = DEMO_MODE ? demoNav : (userRole === "seller" ? sellerNav : consumerNav)

  const navigateWithParams = (path) => {
    if (userId && userRole) {
      router.push(`/${path}?userId=${userId}&role=${userRole}`)
    } else {
      router.push(`/${path}`)
    }
  }

  const handleLogout = async () => {
    if (DEMO_MODE) {
      localStorage.clear()
      router.push("/")
      router.refresh()
      return
    }
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className={`fixed left-0 top-0 h-screen bg-card border-r border-white/5 transition-all duration-300 z-50 flex flex-col ${isCollapsed ? "w-20" : "w-64"}`}>

      {/* GLOBAL COMMAND PALETTE (Cmd+K / Ctrl+K) — mounted once here so it's available on every page */}
      <CommandPalette />

      {/* LOGO */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground tracking-wide truncate">{APP_NAME}</h2>
              <p className="text-[10px] text-foreground-muted tracking-widest uppercase truncate">Compliance Intelligence</p>
            </div>
          )}
          {/* Collapse Button — visible ONLY on small screens */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-foreground-muted hover:bg-white/5 lg:hidden ml-auto"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-0" : "rotate-180"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* SEARCH / COMMAND PALETTE TRIGGER */}
      <div className="px-3 pt-3">
        <button
          onClick={openCommandPalette}
          className={`w-full flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-colors duration-150 ${
            isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2"
          }`}
        >
          <Search className="w-[15px] h-[15px] text-foreground-muted shrink-0" />
          {!isCollapsed && (
            <>
              <span className={`${poppins.className} flex-1 text-left text-xs text-foreground-muted truncate`}>
                Search…
              </span>
              <span className="shrink-0 flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted tracking-wide">
                ⌘K
              </span>
            </>
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === `/${item.path}`
          return (
            <button
              key={item.path}
              onClick={() => navigateWithParams(item.path)}
              className={`w-full flex items-center gap-3 rounded-xl transition-colors duration-150 ${
                isActive ? "bg-accent/10 border border-accent/20" : "border border-transparent hover:bg-white/5"
              } ${isCollapsed ? "justify-center px-3 py-3" : "px-3 py-2.5"}`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-accent" : "text-foreground-muted"}`} />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className={`${poppins.className} text-sm font-medium truncate ${isActive ? "text-foreground" : "text-foreground-muted"}`}>
                    {item.name}
                  </p>
                  {item.subtitle && <p className="text-[11px] text-foreground-muted truncate">{item.subtitle}</p>}
                </div>
              )}
              {!isCollapsed && isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
            </button>
          )
        })}
      </nav>

      {/* LOGOUT */}
      {userId && userRole && (
        <div className="px-3 py-2 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-red-500/10 border border-transparent hover:border-red-400/30 group ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-[18px] h-[18px] text-foreground-muted group-hover:text-red-400 shrink-0" />
            {!isCollapsed && (
              <span className="text-sm text-foreground-muted group-hover:text-red-400">
                Log out
              </span>
            )}
          </button>
        </div>
      )}

      {/* FOOTER */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/5 space-y-2">
          {DEMO_MODE ? (
            <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              System online
            </div>
          ) : (
            userRole && (
              <p className="text-xs text-foreground-muted">
                Role: <span className="font-semibold text-foreground">{userRole}</span>
              </p>
            )
          )}
          <p className="text-[10px] text-foreground-muted/60 tracking-wide">{APP_VERSION}</p>
        </div>
      )}
    </div>
  )
}
