import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Side-effect: reads localStorage, applies `.dark-mode` class to <html>
// before first paint so there's no flash.
import "./lib/theme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
