import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { BuyerWorkspaceView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

interface BuyerData {
  participant: { id: string };
  qualificationStatus: string;
  financialProfile: { preApprovalAmount: number };
}

export default function BuyerWorkspacePage() {
  const { buyerId } = useParams<{ buyerId: string }>();
  const layout = useLayout();

  const [subject, setSubject] = useState(() => {
    const s = new BuyerWorkspaceView();
    s.viewId = buyerId ?? "";
    s.agentId = layout.agentId;
    s.buyerId = buyerId ?? "";
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  useEffect(() => {
    if (!buyerId) return;
    api.get<BuyerData>(`/buyers/${buyerId}`).then((buyer) => {
      setSubject((prev) =>
        cloneSubject(prev, {
          buyerId: buyer.participant.id,
          qualificationStatus: buyer.qualificationStatus,
          preApprovalAmount: buyer.financialProfile.preApprovalAmount,
          loadingState: "idle",
        }),
      );
    }).catch(() => setSubject((prev) => cloneSubject(prev, { loadingState: "error" })));
  }, [buyerId]);

  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading buyer workspace…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
