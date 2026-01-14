import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import "./index.css";

// ✅ Initialize theme from localStorage on app start
// This ensures theme persists across all pages
const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </BrowserRouter>
  </React.StrictMode>
);