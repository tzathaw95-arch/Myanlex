
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e) {
    console.error("React Mount Error:", e);
    const errDisplay = document.getElementById('error-display');
    if (errDisplay) {
        errDisplay.style.display = 'block';
        errDisplay.innerHTML = "Critical Error: Failed to mount application. " + String(e);
    }
  }
} else {
  console.error("Root element not found");
}
