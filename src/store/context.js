import { createContext, useContext } from "react";

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const DEFAULT_SETTINGS = { newPerDay: 15, events: {} };

// Keys in codeStats: "n:15" for the number 15, "c:5H" for the five of hearts.
export const statKey = (kind, key) => (kind === "cards" ? "c:" : "n:") + key;
