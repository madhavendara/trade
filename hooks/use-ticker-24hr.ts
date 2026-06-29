import { useQuery } from "@tanstack/react-query";
import { fetchTicker24hr } from "@/lib/binance";

export const TICKER_24HR_QUERY = {
  queryKey: ["ticker-24hr"] as const,
  queryFn: fetchTicker24hr,
  refetchInterval: 30_000,
  staleTime: 25_000,
} as const;

export function useTicker24hr() {
  return useQuery(TICKER_24HR_QUERY);
}
