import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import ToastCenter from './components/ToastCenter';
import { installAlertInterceptor } from './utils/notify';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
installAlertInterceptor();

// Ignore noisy browser-extension selection errors (not from app source code).
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const filename = event.filename || '';
  const isExtensionSelectionError =
    message.includes("Failed to execute 'getRangeAt' on 'Selection'") &&
    filename.includes('content.js');

  if (isExtensionSelectionError) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <App />
        <ToastCenter />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
