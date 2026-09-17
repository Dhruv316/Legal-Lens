"use client"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, ShoppingBag, Building2, ShieldCheck, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react"
import { Poppins } from "next/font/google"
import {
  PRODUCTS_CATALOG,
  BRAND_OWNER_DIRECTORY,
  IMPORTER_DIRECTORY,
  DISTRIBUTOR_DIRECTORY,
  SELLER_VERIFICATION_DATA,
} from "../lib/demoData"

const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"] })

const OPEN_EVENT = "legal-lens:open-command-palette"

// ------------------------------------------------------------
// Lightweight fuzzy/substring matcher.
// A plain substring hit scores higher than an in-order-character
// (subsequence) hit, so "coca cola" still beats out weaker matches
// while still letting something like "ccl" find "Coca-Cola".
// ------------------------------------------------------------
function fuzzyScore(haystack, query) {
  if (!haystack) return -1
  const text = haystack.toLowerCase()
  if (!query) return 0
  if (text.includes(query)) {
    // Reward matches nearer the start of the string.
    return 100 - text.indexOf(query)
  }
  let ti = 0
  for (let qi = 0; qi < query.length; qi++) {
    ti = text.indexOf(query[qi], ti)
    if (ti === -1) return -1
    ti++
  }
  return 1
}

function buildResults(query) {
  const q = query.trim().toLowerCase()
  if (!q) return { products: [], entities: [], sellers: [] }

  // ---- Products (match on name or manufacturer) ----
  const products = PRODUCTS_CATALOG
    .map((p) => {
      const score = Math.max(fuzzyScore(p.name, q), fuzzyScore(p.manufacturer, q))
      return score >= 0 ? { score, item: p } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ item }) => ({
      id: `product-${item.id}`,
      group: "Products",
      icon: ShoppingBag,
      label: item.name,
      sublabel: item.manufacturer,
      meta: item.status,
      path: "products",
    }))

  // ---- Entities (brand owners / importers / distributors, match on entity name) ----
  const entitySources = [
    ...BRAND_OWNER_DIRECTORY.map((e) => ({ ...e })),
    ...IMPORTER_DIRECTORY.map((e) => ({ ...e })),
    ...DISTRIBUTOR_DIRECTORY.map((e) => ({ ...e })),
  ]
  const entities = entitySources
    .map((e) => {
      const score = fuzzyScore(e.name, q)
      return score >= 0 ? { score, item: e } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ item }, idx) => ({
      id: `entity-${item.role}-${idx}-${item.name}`,
      group: "Entities",
      icon: Building2,
      label: item.name,
      sublabel: `${item.role} · ${item.country}`,
      meta: item.role,
      path: "entities",
    }))

  // ---- Sellers (match on seller name) ----
  const sellerInfo = SELLER_VERIFICATION_DATA?.sellerInfo
  const sellers = []
  if (sellerInfo && fuzzyScore(sellerInfo.sellerName, q) >= 0) {
    sellers.push({
      id: "seller-0",
      group: "Sellers",
      icon: ShieldCheck,
      label: sellerInfo.sellerName,
      sublabel: `${sellerInfo.sellerType} · ${sellerInfo.marketplace}`,
      meta: sellerInfo.riskLevel ? `${sellerInfo.riskLevel} risk` : undefined,
      path: "seller-verification",
    })
  }

  return { products, entities, sellers }
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const userId = searchParams?.get("userId")
  const userRole = searchParams?.get("role")

  const grouped = useMemo(() => buildResults(query), [query])
  const flatResults = useMemo(
    () => [...grouped.products, ...grouped.entities, ...grouped.sellers],
    [grouped]
  )

  const closePalette = useCallback(() => {
    setOpen(false)
    setQuery("")
    setActiveIndex(0)
  }, [])

  const navigateTo = useCallback(
    (path) => {
      if (userId && userRole) {
        router.push(`/${path}?userId=${userId}&role=${userRole}`)
      } else {
        router.push(`/${path}`)
      }
      closePalette()
    },
    [router, userId, userRole, closePalette]
  )

  // Global shortcut: Cmd+K (Mac) / Ctrl+K (Windows/Linux), plus a
  // custom event so other UI (e.g. the Navbar's search trigger) can
  // open the palette too.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCombo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"
      if (isCombo) {
        e.preventDefault()
        setOpen((prev) => !prev)
        return
      }
      if (e.key === "Escape" && open) {
        e.preventDefault()
        closePalette()
      }
    }
    const handleOpenEvent = () => setOpen(true)

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener(OPEN_EVENT, handleOpenEvent)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener(OPEN_EVENT, handleOpenEvent)
    }
  }, [open, closePalette])

  // Autofocus the input whenever the palette opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
  }, [open])

  // Reset selection whenever the visible result set changes.
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Arrow-key navigation + Enter to select.
  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (flatResults.length > 0) {
        setActiveIndex((prev) => (prev + 1) % flatResults.length)
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (flatResults.length > 0) {
        setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length)
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      const selected = flatResults[activeIndex]
      if (selected) navigateTo(selected.path)
    }
  }

  // Click-outside to close.
  const handleBackdropMouseDown = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      closePalette()
    }
  }

  if (!open) return null

  let runningIndex = -1
  const renderGroup = (label, items) => {
    if (items.length === 0) return null
    return (
      <div className="px-2 pt-3 first:pt-2">
        <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground-muted/70">
          {label}
        </p>
        <div className="space-y-0.5">
          {items.map((result) => {
            runningIndex += 1
            const isActive = runningIndex === activeIndex
            const Icon = result.icon
            const thisIndex = runningIndex
            return (
              <button
                key={result.id}
                onClick={() => navigateTo(result.path)}
                onMouseEnter={() => setActiveIndex(thisIndex)}
                className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-100 ${
                  isActive ? "bg-accent/15 border border-accent/30" : "border border-transparent hover:bg-white/5"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-accent/20" : "bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-accent" : "text-foreground-muted"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${poppins.className} text-sm font-medium truncate ${isActive ? "text-foreground" : "text-foreground"}`}>
                    {result.label}
                  </p>
                  {result.sublabel && (
                    <p className="text-xs text-foreground-muted truncate">{result.sublabel}</p>
                  )}
                </div>
                {result.meta && (
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-foreground-muted whitespace-nowrap">
                    {result.meta}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const hasQuery = query.trim().length > 0
  const hasResults = flatResults.length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 pt-[12vh] animate-fadeIn"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        className={`${poppins.className} w-full max-w-xl bg-card border border-card-border-strong rounded-2xl shadow-2xl shadow-black/50 overflow-hidden`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* SEARCH INPUT */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
          <Search className="w-[18px] h-[18px] text-foreground-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search products, entities, sellers…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-foreground-muted/70"
          />
          <button
            onClick={closePalette}
            className="p-1 rounded-md text-foreground-muted hover:bg-white/10 hover:text-foreground shrink-0"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RESULTS */}
        <div className="max-h-[50vh] overflow-y-auto pb-2">
          {!hasQuery && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-foreground-muted">
                Start typing to search products, entities, and sellers.
              </p>
            </div>
          )}

          {hasQuery && !hasResults && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-foreground-muted">No results for “{query}”.</p>
            </div>
          )}

          {hasQuery && hasResults && (
            <>
              {renderGroup("Products", grouped.products)}
              {renderGroup("Entities", grouped.entities)}
              {renderGroup("Sellers", grouped.sellers)}
            </>
          )}
        </div>

        {/* FOOTER HINTS */}
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" />
              Select
            </span>
          </div>
          <span className="text-[11px] text-foreground-muted">Esc to close</span>
        </div>
      </div>
    </div>
  )
}

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_EVENT))
  }
}
