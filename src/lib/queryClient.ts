import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000, // 30s cooldown
			gcTime: 5 * 60 * 1000, // 5 phút cache
			retry: 2, // retry 2 lần nếu lỗi mạng
			refetchOnWindowFocus: true, // auto-refetch khi user focus lại tab trình duyệt
			refetchOnReconnect: true, // auto-refetch khi mạng phục hồi
		},
	},
});
