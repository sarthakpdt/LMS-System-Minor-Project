import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./design-system.css";
import "./index.css";
import { ThemeProvider } from "./theme/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
