import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PickerApp } from "./components/PickerApp";

createRoot(document.getElementById("picker-root")!).render(
  <StrictMode>
    <PickerApp />
  </StrictMode>,
);
