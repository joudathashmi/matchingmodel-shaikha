import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "./i18n"; // 👈 import i18n config

// Desk UI is dark-first — force dark so a prior light preference cannot wash out text
try {
  localStorage.setItem("rhq.settings.theme", "dark");
} catch {
  /* ignore */
}
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.style.colorScheme = "dark";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
