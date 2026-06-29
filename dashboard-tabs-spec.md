# Dashboard tab specification

Four tabs under one app shell. Header chrome (symbol search, alerts bell) is shared across all tabs, not part of any single one.

## Shared state

| Store | Fields | Persisted? |
|---|---|---|
| Zustand `useDashboardStore` | `selectedSymbol`, `watchlist: string[]`, `intervalsByTab` | `watchlist` via `persist` middleware, rest session-only |
| React Query | namespaced keys: `['klines', symbol, interval]`, `['movers']`, `['depth-snapshot', symbol]`, `['daily-klines', symbol]` | per-key `staleTime`, see each tab below |

`selectedSymbol` lives in Zustand, not component state, so Overview, Activity, and Calendar all read/write the same value, switching tabs doesn't lose your place.

Tabs are client-side state (active tab index), not Next.js routes. No need for shareable URLs on a single-user demo, switch to `/overview`, `/activity` etc. later if you want deep links.

---

## Tab 1: Overview

| Widget | Data source | Endpoint / stream | Update mechanism | Presentation |
|---|---|---|---|---|
| Stat strip | Derived, no new call | reuses the `miniTicker` WS data already in `ticker-table.tsx` | recompute on every WS tick, but throttle the re-render to ~1/sec (batch via `requestAnimationFrame` or a `setInterval` snapshot) so 12 streams ticking don't repaint 4 tiles 12x/sec | 4 small KPI cards: total 24h volume (sum of each symbol's `q` field), average 24h change %, most volatile symbol (max abs change %), active stream count |
| Ticker table | WS only | combined `<symbol>@miniTicker` for the fixed watchlist | live push, already built | dense table, flash green/red on tick (already built) |
| Top movers | REST | `GET /api/v3/ticker/24hr` (no symbol param returns all ~2000 pairs) | React Query, `refetchInterval: 30_000`. Don't drive this off WS, recomputing gainers/losers across thousands of symbols on every tick is wasted work for data that only needs to be fresh-ish | filter to `*USDT` pairs, sort by `priceChangePercent`, top 5 gainers + top 5 losers, each row has a "Watch" button that pushes into `watchlist` |
| Price chart | REST + WS | `GET /api/v3/klines` on mount, then `<symbol>@kline_1m` | React Query seeds `['klines', symbol, '1m']`, WS callback merges into the same cache key via `setQueryData` (see note below) | Recharts area chart, color flips on trend (already built) |

**Note on the chart's WS merge**: the current build keeps a local `points` state instead of writing into the React Query cache. Worth refactoring to `queryClient.setQueryData(['klines', symbol, '1m'], updater)` so the cache is the single source of truth, this is the change flagged in an earlier message as a good interview talking point.

---

## Tab 2: Activity

| Widget | Data source | Endpoint / stream | Update mechanism | Presentation |
|---|---|---|---|---|
| Trade tape | WS only (optional REST backfill) | `<symbol>@trade`. Optional: `GET /api/v3/trades?symbol=...&limit=20` once on mount so the tape isn't empty while the socket connects | pure push, no polling | scrolling list, newest on top, capped at 50 rows. Side comes from the `m` field: `m: true` means the buyer was the maker, so the trade was seller-initiated → render as "sell" (red); `m: false` → "buy" (green). Easy to get backwards, worth double-checking against a known move before trusting the colors |
| Order book depth | WS only | `<symbol>@depth20@1000ms`, the **partial book depth stream**, not the full diff stream | each message is already a self-contained top-20 snapshot, just replace state, no merging | use the simpler partial stream on purpose: the full `<symbol>@depth` diff stream requires tracking `lastUpdateId` and reconciling against a REST snapshot to stay correct, real production behavior, but more engineering than a portfolio piece needs. `depth20` skips all of that for a small accuracy tradeoff (top 20 levels only, ~1s latency) |

Both widgets follow `selectedSymbol` from the shared store, switching the symbol in Overview updates these automatically.

---

## Tab 3: Calendar

| Widget | Data source | Endpoint / stream | Update mechanism | Presentation |
|---|---|---|---|---|
| Daily returns heatmap | REST only | `GET /api/v3/klines?symbol=...&interval=1d&limit=180` (~6 months) | React Query, `staleTime: 60 * 60 * 1000` (1hr), this is historical data, it doesn't need to be live | GitHub-contribution-style grid: weeks as columns, days as rows, each cell colored by that day's `(close-open)/open` sign and magnitude (5-step intensity scale), tooltip shows date, %, close price |
| Klines table (optional second widget) | same query, no new fetch | reuses the daily klines query above | — | plain table view of the same data with a CSV export button, client-side blob download, no API call needed |

No WebSocket in this tab at all, it's the one place where "live" doesn't apply.

---

## Tab 4: Health

| Widget | Data source | Endpoint / stream | Update mechanism | Presentation |
|---|---|---|---|---|
| Connection status panel | Internal only, no Binance API | instrumentation of your own `useBinanceStream` hook | requires extending the hook: right now it only fires `onMessage`, it doesn't expose connection state to the caller. Add internal `status` ('connected' \| 'reconnecting' \| 'closed'), a rolling message-per-second counter (timestamp array trimmed to the last 1s window, or a counter reset on a 1s interval), and `lastReconnectAt`. Return these from the hook instead of just the side effect | a small registry (Zustand store, or React context) that every active `useBinanceStream` call registers into, so this tab can list all of them: ticker stream, kline stream, trade stream, depth stream, each as a row with a status pill, msgs/sec, last reconnect time |

This is the one tab that's pure engineering, no new chart type, no new data. It's also the strongest "I think about reliability, not just visuals" talking point for the interview, since it's instrumentation you built rather than data Binance handed you.

---

## Quick reference: what's NOT a tab

| Item | Lives in |
|---|---|
| Symbol search / combobox | header chrome, replaces "Search website" |
| Candle-close / threshold notifications | header bell icon with badge count |
| Watchlist persistence | not visible UI, Zustand `persist` middleware behind the scenes |
