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
import { useTranslation } from "react-i18next";

const GlobalStyle = createGlobalStyle`
  body {
    font-family: "DM Sans", sans-serif;
    background:
      radial-gradient(1200px 600px at 10% -10%, rgba(0, 255, 136, 0.07), transparent 55%),
      radial-gradient(900px 500px at 95% 0%, rgba(0, 180, 216, 0.08), transparent 50%),
      linear-gradient(160deg, #07090f 0%, #0d1220 45%, #10182a 100%);
    background-attachment: fixed;
    color: #ffffff;
    overflow-x: hidden;
    min-height: 100vh;
    margin: 0;
    padding: 0;
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
    background: #1a1a2e;
    color: #ffffff;
    border: 1px solid #2d2d4d;
    border-radius: 8px;
  }

  .Toastify__toast-body {
    font-family: "DM Sans", sans-serif;
  }

  .Toastify__close-button {
    color: #ffffff;
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
`;

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLang = (lang: "en" | "ar") => {
    i18n.changeLanguage(lang);
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
  };

  return (
    <Provider store={store}>
      <GlobalStyle />
      <Router>
        <TourProvider>
          <AuthBootstrap />
          <AppRoutes />
          <GuidedTour />
          <AssistantChat />
        </TourProvider>
      </Router>
      {/* ToastContainer with custom styling */}
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
    </Provider>
  );
};

export default App;