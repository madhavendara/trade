import { useQuery } from "@tanstack/react-query";
import { TICKER_24HR_QUERY } from "./use-ticker-24hr";

export function useTopMovers() {
  return useQuery({
    ...TICKER_24HR_QUERY,
    select: (data) => {
      const usdt = data.filter((t) => t.symbol.endsWith("USDT"));
      usdt.sort(
        (a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)
      );
      return { gainers: usdt.slice(0, 5), losers: usdt.slice(-5).reverse() };
    },
  });
}
