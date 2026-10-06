import dns from "node:dns";
import https from "node:https";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

dns.setDefaultResultOrder("ipv4first");

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const target =
		env.VITE_API_TARGET?.trim().toLowerCase() === "deploy"
			? env.VITE_API_DEPLOY_URL
			: env.VITE_API_LOCAL_URL;
	const apiProxyTarget = (target?.trim() || "https://localhost:7223").replace(
		/\/+$/,
		"",
	);

	return {
		plugins: [react(), tailwindcss()],
		build: {
			chunkSizeWarningLimit: 600,
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes("node_modules")) {
							if (
								id.includes("react/") ||
								id.includes("react-dom/") ||
								id.includes("react-router-dom/") ||
								id.includes("react-router/")
							) {
								return "vendor-react";
							}
							if (id.includes("@bug-on/") || id.includes("motion")) {
								return "vendor-m3";
							}
							if (id.includes("jspdf") || id.includes("html2canvas")) {
								return "vendor-pdf";
							}
							if (
								id.includes("xlsx") ||
								id.includes("xlsx-js-style") ||
								id.includes("react-export-table-to-excel")
							) {
								return "vendor-excel";
							}
							if (id.includes("axios") || id.includes("jwt-decode")) {
								return "vendor-core";
							}
						}
					},
				},
			},
		},
		server: {
			proxy: {
				"/api": {
					target: apiProxyTarget,
					changeOrigin: true,
					secure: false,
					ws: true,
					timeout: 60000,
					proxyTimeout: 60000,
					agent: apiProxyTarget.startsWith("https:")
						? new https.Agent({
								keepAlive: false,
								family: 4,
								rejectUnauthorized: false,
							})
						: undefined,
					configure: (proxy) => {
						proxy.on("error", (err, _req, res) => {
							console.warn(
								`[vite proxy warning] Failed to proxy to ${apiProxyTarget}:`,
								err.message,
							);
							if (res && "writeHead" in res && !res.headersSent) {
								res.writeHead(502, { "Content-Type": "application/json" });
								res.end(
									JSON.stringify({
										message: `Proxy error: Không thể kết nối tới backend tại ${apiProxyTarget}. Vui lòng kiểm tra backend đã được khởi động chưa.`,
										error: err.message,
										target: apiProxyTarget,
									}),
								);
							}
						});
					},
				},
			},
		},
	};
});
