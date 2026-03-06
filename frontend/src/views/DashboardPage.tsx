import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { DashboardView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

export default function DashboardPage() {
  const layout = useLayout();
  const [subject, setSubject] = useState(() => {
    const s = new DashboardView();
    s.viewId = "dashboard";
    s.agentId = layout.agentId;
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  // Load portfolio stats
  useEffect(() => {
    Promise.all([
      api.get<unknown[]>("/buyers"),
      api.get<unknown[]>("/sellers"),
      api.get<unknown[]>("/showings"),
      api.get<unknown[]>("/transactions"),
    ]).then(([buyers, sellers, showings, transactions]) => {
      setSubject((prev) =>
        cloneSubject(prev, {
          portfolioStats: {
            activeBuyers: buyers.length,
            activeSellers: sellers.length,
            pendingShowings: (showings as Array<{ status: string }>).filter((s) => s.status === "requested").length,
            openTransactions: (transactions as Array<{ currentMilestone: string }>).filter((t) => t.currentMilestone !== "closing").length,
          },
          loadingState: "idle",
        }),
      );
    }).catch(() => setSubject((prev) => cloneSubject(prev, { loadingState: "error" })));
  }, []);

  // Recompute render spec
  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading dashboard…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
