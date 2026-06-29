# Live Market Dashboard

Real-time crypto dashboard built with Next.js (App Router), React Query, Tailwind, and Recharts. Pulls live data straight from Binance's public market data API, no key, no backend, no signup.

## What's here

- **Ticker table** (`components/ticker-table.tsx`) — one combined WebSocket connection streaming live `miniTicker` updates for 12 symbols. Click a row to select it. Price cells flash green/red for ~650ms on every tick, up or down, the signature touch that makes it feel like a live trading screen rather than a static table.
- **Price chart** (`components/price-chart.tsx`) — React Query fetches the last 100 1-minute candles over REST on load, then a second WebSocket stream patches the in-progress candle live and appends new ones as they close.
- **`hooks/use-binance-stream.ts`** — the generic WS hook. Pass it a list of stream names, get a callback per message. Handles reconnects with a 2s backoff.
- **`lib/binance.ts`** — REST fetcher (`fetchKlines`) and stream-name builders. All typed against Binance's actual message shapes.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Where to take it next

- **D3 candlestick chart**: swap the Recharts `AreaChart` in `price-chart.tsx` for a hand-built D3 OHLC/candlestick chart. The data shape (`Kline[]`) already has open/high/low/close, you're not blocked on data, just the rendering.
- **Order book depth chart**: subscribe to `<symbol>@depth` (add a builder next to `klineStream` in `lib/binance.ts`) and render cumulative bid/ask volume, good second D3 chart with a different shape problem than OHLC.
- **Symbol search/filter**: `SYMBOLS` in `lib/binance.ts` is a fixed list of 12. Swap it for a fetch against `GET /api/v3/exchangeInfo` to list all trading pairs and add a filter input above the table.
- **Virtualize the table**: fine at 12 rows, but if you list all ~2000 symbols you'll want TanStack Table + virtualization, which the job posting calls out directly.

## One thing to know before deploying anywhere public

`npm audit` currently flags some moderate/high advisories in the Next.js 14.x line (image optimizer, middleware, SSRF on server-handled WS upgrades). None of them apply to what this project actually does, it's a client-only dashboard with no `next/image`, no middleware, no server-side WebSocket handling. Fine for local dev and a portfolio demo. If you ever put this behind a real domain, bump to a current Next major first.
