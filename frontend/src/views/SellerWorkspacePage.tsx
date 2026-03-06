import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { SellerWorkspaceView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

interface SellerData {
  participant: { id: string };
  qualificationStatus: string;
  disclosuresCompleted: boolean;
  receivedOffers: string[];
}

export default function SellerWorkspacePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const layout = useLayout();

  const [subject, setSubject] = useState(() => {
    const s = new SellerWorkspaceView();
    s.viewId = sellerId ?? "";
    s.agentId = layout.agentId;
    s.sellerId = sellerId ?? "";
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  useEffect(() => {
    if (!sellerId) return;
    api.get<SellerData>(`/sellers/${sellerId}`).then((seller) => {
      setSubject((prev) =>
        cloneSubject(prev, {
          sellerId: seller.participant.id,
          qualificationStatus: seller.qualificationStatus ?? "pending",
          disclosureStatus: seller.disclosuresCompleted ? "complete" : "not_started",
          receivedOfferCount: seller.receivedOffers?.length ?? 0,
          loadingState: "idle",
        }),
      );
    }).catch(() => setSubject((prev) => cloneSubject(prev, { loadingState: "error" })));
  }, [sellerId]);

  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading seller workspace…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
