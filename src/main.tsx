import { createRoot } from "react-dom/client";
import { SGDocuApp } from "./core/app/index.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<SGDocuApp />);
