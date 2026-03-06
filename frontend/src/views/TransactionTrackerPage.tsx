import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { TransactionTrackerView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

interface TxData {
  transactionId: string; buyerId: string; sellerId: string; listingId: string;
  acceptedOfferPrice: number; currentMilestone: string;
  completedMilestones: string[]; closingDate?: string;
}

export default function TransactionTrackerPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const layout = useLayout();

  const [subject, setSubject] = useState(() => {
    const s = new TransactionTrackerView();
    s.viewId = transactionId ?? "";
    s.agentId = layout.agentId;
    s.transactionId = transactionId ?? "";
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  useEffect(() => {
    if (!transactionId) return;
    api.get<TxData>(`/transactions/${transactionId}`).then((tx) => {
      setSubject((prev) =>
        cloneSubject(prev, {
          transactionId: tx.transactionId,
          buyerId: tx.buyerId,
          sellerId: tx.sellerId,
          listingId: tx.listingId,
          acceptedPrice: tx.acceptedOfferPrice,
          currentMilestone: tx.currentMilestone,
          closingDate: tx.closingDate ? new Date(tx.closingDate) : undefined,
          loadingState: "idle",
        }),
      );
    }).catch(() => setSubject((prev) => cloneSubject(prev, { loadingState: "error" })));
  }, [transactionId]);

  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading transaction…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
