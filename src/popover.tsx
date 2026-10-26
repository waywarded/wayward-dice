import React from "react";
import ReactDOM from "react-dom/client";

import CssBaseline from "@mui/material/CssBaseline";

import "./fonts/fonts.css";
import { GlobalStyles } from "./GlobalStyles";
import { PluginThemeProvider } from "./plugin/PluginThemeProvider";
import { PopoverTrays } from "./plugin/PopoverTrays";
import { PluginGate } from "./plugin/PluginGate";
import { DiceRollSync } from "./plugin/DiceRollSync";
import { RollRequestListener } from "./api/RollRequestListener";
import { RollResultReporter } from "./api/RollResultReporter";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PluginThemeProvider>
      <CssBaseline />
      <GlobalStyles />
      <PluginGate>
        <PopoverTrays />
        <RollRequestListener />
        <RollResultReporter />
        <DiceRollSync />
      </PluginGate>
    </PluginThemeProvider>
  </React.StrictMode>
);
