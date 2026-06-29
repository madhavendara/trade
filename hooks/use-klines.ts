import { useQuery } from "@tanstack/react-query";
import { fetchKlines, type Kline } from "@/lib/binance";

export function useKlines(symbol: string, interval = "1m", limit = 100) {
  return useQuery<Kline[]>({
    queryKey: ["klines", symbol, interval, limit],
    queryFn: () => fetchKlines(symbol, interval, limit),
    staleTime: 60_000,
  });
}
