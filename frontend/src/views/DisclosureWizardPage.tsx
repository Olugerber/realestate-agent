import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLayout } from "../context.js";
import { RenderSpecRenderer } from "../components/RenderSpecRenderer.js";
import { useActionHandler, cloneSubject } from "./useViewPage.js";
import { DisclosureWizardView } from "../../realestate-ui/domain-types.js";
import { RenderViewCommand } from "../../realestate-ui/commands/render-view.js";
import type { RenderSpec } from "../../realestate-ui/domain-types.js";

export default function DisclosureWizardPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const layout = useLayout();

  const [subject, setSubject] = useState(() => {
    const s = new DisclosureWizardView();
    s.viewId = propertyId ?? "";
    s.agentId = layout.agentId;
    s.propertyId = propertyId ?? "";
    s.sellerId = "seller-1"; // default; a real app would pass this via query param
    s.totalSteps = s.stepTitles.length;
    s.loadingState = "idle";
    return s;
  });
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const [renderSpec, setRenderSpec] = useState<RenderSpec | null>(null);
  const handleAction = useActionHandler(subjectRef, setSubject);

  useEffect(() => {
    const spec = new RenderViewCommand().run(subject, layout);
    setRenderSpec(spec);
  }, [subject, layout]);

  if (!renderSpec) return <div className="loading">Loading disclosure wizard…</div>;
  return <RenderSpecRenderer spec={renderSpec} onAction={handleAction} />;
}
