import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { OfferNegotiationView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

interface OfferData {
  offerId: string; buyerId: string; sellerId: string; listingId: string;
  status: string; counterOfferCount: number;
  negotiationHistory: Array<{ party: string; amount: number; timestamp: string }>;
}

export default function OfferNegotiationPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const layout = useLayout();

  const [subject, setSubject] = useState(() => {
    const s = new OfferNegotiationView();
    s.viewId = offerId ?? "";
    s.agentId = layout.agentId;
    s.offerId = offerId ?? "";
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  useEffect(() => {
    if (!offerId) return;
    api.get<OfferData>(`/offers/${offerId}`).then((offer) => {
      setSubject((prev) =>
        cloneSubject(prev, {
          offerId: offer.offerId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          listingId: offer.listingId,
          currentStatus: offer.status,
          counterOfferCount: offer.counterOfferCount,
          offerHistory: offer.negotiationHistory.map((h) => ({
            ...h,
            timestamp: new Date(h.timestamp),
            status: offer.status,
          })),
          loadingState: "idle",
        }),
      );
    }).catch(() => setSubject((prev) => cloneSubject(prev, { loadingState: "error" })));
  }, [offerId]);

  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading offer…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
