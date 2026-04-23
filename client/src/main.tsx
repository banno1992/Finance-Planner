import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply theme class before render to prevent flash of wrong theme.
(() => {
  try {
    const stored = localStorage.getItem("networth-theme");
    const theme = stored === "light" ? "light" : "dark";
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("dark");
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
