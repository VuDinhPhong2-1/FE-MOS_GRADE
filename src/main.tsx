import { MD3ThemeProvider } from "@bug-on/m3-expressive";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorModal, ToastCenter } from "./components/common";
import { queryClient } from "./lib/queryClient";
import { installAlertInterceptor } from "./utils/notify";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
installAlertInterceptor();

// Ignore noisy browser-extension selection errors (not from app source code).
window.addEventListener("error", (event) => {
	const message = event.message || "";
	const filename = event.filename || "";
	const isExtensionSelectionError =
		message.includes("Failed to execute 'getRangeAt' on 'Selection'") &&
		filename.includes("content.js");

	if (isExtensionSelectionError) {
		event.preventDefault();
	}
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MD3ThemeProvider
			defaultMode="light"
			persistToLocalStorage
			sourceColor="#1B6EF3"
			variant="expressive"
			contrastLevel={0}
			enableSnackbar
		>
			<QueryClientProvider client={queryClient}>
				<GoogleOAuthProvider clientId={googleClientId}>
					<BrowserRouter useTransitions={false}>
						<App />
						<ToastCenter />
						<ErrorModal />
					</BrowserRouter>
				</GoogleOAuthProvider>
			</QueryClientProvider>
		</MD3ThemeProvider>
	</StrictMode>,
);
