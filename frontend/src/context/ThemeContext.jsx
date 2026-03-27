import { createContext, useContext, useState } from "react";
import { ThemeProvider } from "styled-components";
import { themes, defaultTheme } from "../theme/themes";

const ThemeCtx = createContext();

export function AppThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme);
  return (
    <ThemeCtx.Provider value={{ theme, setTheme, themes }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
