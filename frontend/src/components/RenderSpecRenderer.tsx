import React, { useContext } from "react";
import { ActionContext } from "../context.js";
import type { RenderSpec, UserAction } from "../../realestate-ui/domain-types.js";
import * as UI from "./ui.js";

type AnyComponent = React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;

const REGISTRY: Record<string, AnyComponent> = {
  DashboardLayout: UI.DashboardLayout as AnyComponent,
  BuyerWorkspaceLayout: UI.BuyerWorkspaceLayout as AnyComponent,
  SellerWorkspaceLayout: UI.SellerWorkspaceLayout as AnyComponent,
  ListingDetailLayout: UI.ListingDetailLayout as AnyComponent,
  OfferNegotiationLayout: UI.OfferNegotiationLayout as AnyComponent,
  ShowingCalendarLayout: UI.ShowingCalendarLayout as AnyComponent,
  TransactionTrackerLayout: UI.TransactionTrackerLayout as AnyComponent,
  DisclosureWizardLayout: UI.DisclosureWizardLayout as AnyComponent,
  WorkflowStepBanner: UI.WorkflowStepBanner as AnyComponent,
  AlertBadge: UI.AlertBadge as AnyComponent,
  ActionResultBanner: UI.ActionResultBanner as AnyComponent,
  DateDriftAlert: UI.DateDriftAlert as AnyComponent,
  PortfolioStats: UI.PortfolioStats as AnyComponent,
  QualificationBadge: UI.QualificationBadge as AnyComponent,
  BuyerCriteriaEditor: UI.BuyerCriteriaEditor as AnyComponent,
  ListingMatchCard: UI.ListingMatchCard as AnyComponent,
  MatchGapAnalysis: UI.MatchGapAnalysis as AnyComponent,
  ShowingSlotPicker: UI.ShowingSlotPicker as AnyComponent,
  ListingDetailPanel: UI.ListingDetailPanel as AnyComponent,
  OfferHistoryRow: UI.OfferHistoryRow as AnyComponent,
  OfferActionBar: UI.OfferActionBar as AnyComponent,
  ShowingCard: UI.ShowingCard as AnyComponent,
  ShowingFeedbackForm: UI.ShowingFeedbackForm as AnyComponent,
  MilestoneRailItem: UI.MilestoneRailItem as AnyComponent,
  WizardProgressBar: UI.WizardProgressBar as AnyComponent,
  DisclosureStepForm: UI.DisclosureStepForm as AnyComponent,
  ComplianceCheckPanel: UI.ComplianceCheckPanel as AnyComponent,
  DisclosureKickoffPanel: UI.DisclosureKickoffPanel as AnyComponent,
  SellerListingForm: UI.SellerListingForm as AnyComponent,
  OfferSummaryPanel: UI.OfferSummaryPanel as AnyComponent,
};

interface Props {
  spec: RenderSpec;
  onAction?: (action: UserAction) => void;
}

export function RenderSpecRenderer({ spec, onAction }: Props) {
  const parentAction = useContext(ActionContext);
  const fireAction = onAction ?? parentAction;

  if (spec.loadingState === "loading") {
    return <div className="loading">Loading…</div>;
  }

  const Comp = REGISTRY[spec.componentName];
  if (!Comp) {
    return <div style={{ color: "#d32f2f", padding: 8 }}>Unknown component: {spec.componentName}</div>;
  }

  const children = spec.children.map((child, i) => (
    <RenderSpecRenderer key={i} spec={child} />
  ));

  return (
    <ActionContext.Provider value={fireAction}>
      <Comp {...(spec.props as Record<string, unknown>)}>{children}</Comp>
    </ActionContext.Provider>
  );
}
