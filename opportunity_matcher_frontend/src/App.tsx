import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import { Provider } from "react-redux";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from "./store";
import AppRoutes from "./routes";
import AuthBootstrap from "./components/AuthBootstrap";
import { TourProvider } from "./tour/TourContext";
import GuidedTour from "./tour/GuidedTour";
import AssistantChat from "./components/AssistantChat";
import { ThemeProvider } from "./theme/ThemeContext";
import { themeCss } from "./theme/themeStyles";

const GlobalStyle = createGlobalStyle`
  ${themeCss}

  body {
    font-family: "DM Sans", sans-serif;
    background:
      radial-gradient(1200px 600px at 10% -10%, var(--rhq-glow-a), transparent 55%),
      radial-gradient(900px 500px at 95% 0%, var(--rhq-glow-b), transparent 50%),
      linear-gradient(160deg, var(--rhq-bg-0) 0%, var(--rhq-bg-1) 45%, var(--rhq-bg-2) 100%);
    background-attachment: fixed;
    color: var(--rhq-text);
    overflow-x: hidden;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    transition: background 0.25s ease, color 0.2s ease;
  }

  *,
  *::before,
  *::after {
    font-family: inherit;
  }

  button,
  input,
  select,
  textarea {
    font-family: inherit;
  }

  .Toastify__toast {
    background: var(--rhq-surface-strong);
    color: var(--rhq-text);
    border: 1px solid var(--rhq-border);
    border-radius: 8px;
  }

  .Toastify__toast-body {
    font-family: "DM Sans", sans-serif;
  }

  .Toastify__close-button {
    color: var(--rhq-text);
  }

  .Toastify__toast--error {
    border-left: 4px solid #ef4444;
    
    .Toastify__progress-bar {
      background: #ef4444;
    }
  }

  .Toastify__toast--success {
    border-left: 4px solid #10b981;
    
    .Toastify__progress-bar {
      background: #10b981;
    }
  }

  .Toastify__toast--warning {
    border-left: 4px solid #f59e0b;
    
    .Toastify__progress-bar {
      background: #f59e0b;
    }
  }

  .Toastify__toast--info {
    border-left: 4px solid #3b82f6;
    
    .Toastify__progress-bar {
      background: #3b82f6;
    }
  }

  html[data-theme="dark"] {
    color-scheme: dark;
  }
`;

const ThemedApp: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Router>
        <TourProvider>
          <AuthBootstrap />
          <AppRoutes />
          <GuidedTour />
          <AssistantChat />
        </TourProvider>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </Provider>
  );
};

export default App;