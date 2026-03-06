import { createContext, useContext } from "react";
import type { UserAction, LayoutContext } from "../realestate-ui/domain-types.js";

export const ActionContext = createContext<(action: UserAction) => void>(() => {});

export const LayoutCtx = createContext<LayoutContext>({
  agentId: "agent-1",
  agentName: "Sarah Chen",
  brokerage: "LocalEdge Realty",
  viewport: "desktop",
  theme: "light",
});

export function useLayout(): LayoutContext {
  return useContext(LayoutCtx);
}
