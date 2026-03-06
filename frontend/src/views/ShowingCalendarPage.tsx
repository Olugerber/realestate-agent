import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { ShowingCalendarView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

interface ShowingData {
  showingId: string; buyerId: string; listingId: string;
  requestedSlot?: { requestedDate: string; durationMinutes: number };
  confirmedDate?: string; status: string;
}

export default function ShowingCalendarPage() {
  const layout = useLayout();

  const [subject, setSubject] = useState(() => {
    const s = new ShowingCalendarView();
    s.viewId = "showings";
    s.agentId = layout.agentId;
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  useEffect(() => {
    api.get<ShowingData[]>("/showings").then((showings) => {
      const mapped = showings.map((s) => ({
        showingId: s.showingId,
        listingId: s.listingId,
        address: "",
        date: new Date(s.confirmedDate ?? s.requestedSlot?.requestedDate ?? Date.now()),
        durationMinutes: s.requestedSlot?.durationMinutes ?? 30,
        status: s.status as "requested" | "confirmed" | "completed" | "cancelled",
      }));
      const pendingFeedbackIds = showings
        .filter((s) => s.status === "completed")
        .map((s) => s.showingId);

      setSubject((prev) =>
        cloneSubject(prev, { showings: mapped, pendingFeedbackIds, loadingState: "idle" }),
      );
    }).catch(() => setSubject((prev) => cloneSubject(prev, { loadingState: "error" })));
  }, []);

  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading showings…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
