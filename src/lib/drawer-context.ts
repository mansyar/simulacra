import { createContext, useContext } from "react";

export interface DrawerContextValue {
  isExpanded: boolean;
  toggle: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const DrawerContext = createContext<DrawerContextValue>({
  isExpanded: false,
  toggle: () => {},
  setExpanded: () => {},
});

export function useDrawer() {
  return useContext(DrawerContext);
}
