import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Untitled UI's dark variant keys off `.dark-mode` anywhere in the tree.
document.documentElement.classList.add("dark-mode");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
