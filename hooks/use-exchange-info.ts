import { useQuery } from "@tanstack/react-query";
import { fetchExchangeInfo } from "@/lib/binance";

export function useExchangeInfo() {
  return useQuery({
    queryKey: ["exchange-info"],
    queryFn: fetchExchangeInfo,
    staleTime: 60 * 60 * 1000, // 1 hour — barely changes
    refetchOnWindowFocus: false,
  });
}
