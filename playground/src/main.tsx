import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "dag-flow/style.css";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("root element not found");

createRoot(container).render(<App />);
