import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { ListingDetailView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

interface ListingData {
  listingId: string;
  details: {
    address: string; city: string; price: number; bedrooms: number;
    bathrooms: number; sqft: number; features: string[]; daysOnMarket: number;
  };
  status: string;
  availableSlots: string[];
}

export default function ListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const layout = useLayout();

  const [subject, setSubject] = useState(() => {
    const s = new ListingDetailView();
    s.viewId = listingId ?? "";
    s.agentId = layout.agentId;
    s.listingId = listingId ?? "";
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  useEffect(() => {
    if (!listingId) return;
    api.get<ListingData>(`/listings/${listingId}`).then((listing) => {
      setSubject((prev) =>
        cloneSubject(prev, {
          listingId: listing.listingId,
          address: listing.details.address,
          city: listing.details.city,
          price: listing.details.price,
          bedrooms: listing.details.bedrooms,
          bathrooms: listing.details.bathrooms,
          sqft: listing.details.sqft,
          features: listing.details.features,
          daysOnMarket: listing.details.daysOnMarket,
          status: listing.status,
          availableSlots: listing.availableSlots.map((s) => new Date(s)),
          loadingState: "idle",
        }),
      );
    }).catch(() => setSubject((prev) => cloneSubject(prev, { loadingState: "error" })));
  }, [listingId]);

  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading listing…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
