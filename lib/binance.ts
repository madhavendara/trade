// Public market data only. No API key required for anything in this file.

export const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "LINKUSDT",
  "DOTUSDT",
  "LTCUSDT",
  "TRXUSDT",
] as const;

export type BinanceSymbol = (typeof SYMBOLS)[number];

export type Kline = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

export type KlineMessage = {
  e: "kline";
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    s: string;
    i: string;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    x: boolean;
  };
};

export type MiniTickerMessage = {
  e: "24hrMiniTicker";
  E: number;
  s: string;
  c: string; // close price
  o: string; // open price 24h ago
  h: string;
  l: string;
  v: string; // base asset volume
  q: string; // quote asset volume (USDT)
};

export type TradeMessage = {
  e: "trade";
  E: number;
  s: string;
  t: number; // trade id
  p: string; // price
  q: string; // quantity
  T: number; // trade time
  m: boolean; // true = buyer is maker = seller-initiated (sell), false = buy
};

export type DepthMessage = {
  lastUpdateId: number;
  bids: [string, string][]; // [price, qty]
  asks: [string, string][]; // [price, qty]
};

export type Ticker24hr = {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
};

export type SymbolInfo = {
  symbol: string;
  status: string;           // TRADING | BREAK | HALT | AUCTION_MATCH
  baseAsset: string;
  quoteAsset: string;
  permissions: string[];    // SPOT | MARGIN | LEVERAGED
};

export type ExchangeInfo = {
  symbols: SymbolInfo[];
};

export type RecentTrade = {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
};

const REST_BASE = "https://api.binance.com";

export async function fetchKlines(
  symbol: string,
  interval = "1m",
  limit = 100
): Promise<Kline[]> {
  const url = `${REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance klines request failed: ${res.status}`);
  const raw: unknown[] = await res.json();
  return raw.map((row) => {
    const k = row as [number, string, string, string, string, string, number];
    return {
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
    };
  });
}

export async function fetchTicker24hr(): Promise<Ticker24hr[]> {
  const res = await fetch(`${REST_BASE}/api/v3/ticker/24hr`);
  if (!res.ok) throw new Error(`Binance ticker/24hr failed: ${res.status}`);
  return res.json();
}

export async function fetchExchangeInfo(): Promise<ExchangeInfo> {
  const res = await fetch(`${REST_BASE}/api/v3/exchangeInfo`);
  if (!res.ok) throw new Error(`Binance exchangeInfo failed: ${res.status}`);
  const raw = await res.json();
  return {
    symbols: (raw.symbols as (SymbolInfo & { permissionSets?: string[][] })[]).map((s) => ({
      symbol: s.symbol,
      status: s.status,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
      // Binance migrated from `permissions: string[]` to `permissionSets: string[][]`
      // Fall back to the old field when permissionSets is absent or empty
      permissions: s.permissionSets?.flat().length
        ? s.permissionSets.flat()
        : (s.permissions ?? []),
    })),
  };
}

export async function fetchRecentTrades(
  symbol: string,
  limit = 20
): Promise<RecentTrade[]> {
  const res = await fetch(
    `${REST_BASE}/api/v3/trades?symbol=${symbol}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Binance trades failed: ${res.status}`);
  return res.json();
}

export function miniTickerStream(symbol: string): string {
  return `${symbol.toLowerCase()}@miniTicker`;
}

export function klineStream(symbol: string, interval = "1m"): string {
  return `${symbol.toLowerCase()}@kline_${interval}`;
}

export function tradeStream(symbol: string): string {
  return `${symbol.toLowerCase()}@trade`;
}

export function depthStream(symbol: string, levels = 20, speedMs = 1000): string {
  return `${symbol.toLowerCase()}@depth${levels}@${speedMs}ms`;
}
