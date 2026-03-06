/* @odetovibe-generated */
import { Subject } from "codascon";
import type {
  WorkflowStep,
  MatchResult,
  ActionResult,
  ComplianceCheck,
} from "../../backend/realestate/domain-types.js";

// Re-export backend result types so command files can import from one place
export type { WorkflowStep, MatchResult, ActionResult, ComplianceCheck };

export class DashboardView extends Subject {
  readonly visitName = "resolveDashboard" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  activeWorkflowSteps: WorkflowStep[] = [];
  portfolioStats: {
    activeBuyers: number;
    activeSellers: number;
    pendingShowings: number;
    openTransactions: number;
  } = { activeBuyers: 0, activeSellers: 0, pendingShowings: 0, openTransactions: 0 };
  alerts: string[] = [];
}

export class BuyerWorkspaceView extends Subject {
  readonly visitName = "resolveBuyerWorkspace" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  buyerId: string = "";
  qualificationStatus: "pending" | "qualified" | "disqualified" = "pending";
  preApprovalAmount: number = 0;
  matchResults: MatchResult[] = [];
  workflowStep?: WorkflowStep;
  savedListingIds: string[] = [];
  currentFormValues: FormValues = { formId: "buyerCriteria", fields: {}, dirty: false };
}

export class SellerWorkspaceView extends Subject {
  readonly visitName = "resolveSellerWorkspace" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  sellerId: string = "";
  listingId: string = "";
  qualificationStatus: "pending" | "qualified" | "disqualified" = "pending";
  workflowStep?: WorkflowStep;
  disclosureStatus: "not_started" | "in_progress" | "complete" = "not_started";
  receivedOfferCount: number = 0;
  currentFormValues: FormValues = { formId: "sellerListing", fields: {}, dirty: false };
}

export class ListingDetailView extends Subject {
  readonly visitName = "resolveListingDetail" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  listingId: string = "";
  address: string = "";
  city: string = "";
  price: number = 0;
  bedrooms: number = 0;
  bathrooms: number = 0;
  sqft: number = 0;
  features: string[] = [];
  daysOnMarket: number = 0;
  matchScore?: number;
  matchedCriteria: string[] = [];
  missedCriteria: string[] = [];
  availableSlots: Date[] = [];
  status: "active" | "pending" | "under_contract" | "sold" = "active";
}

export class OfferNegotiationView extends Subject {
  readonly visitName = "resolveOfferNegotiation" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  offerId: string = "";
  listingId: string = "";
  buyerId: string = "";
  sellerId: string = "";
  offerHistory: Array<{ party: string; amount: number; timestamp: Date; status: string }> = [];
  currentStatus: "draft" | "submitted" | "countered" | "accepted" | "rejected" | "withdrawn" = "draft";
  counterOfferCount: number = 0;
  currentFormValues: FormValues = { formId: "offerTerms", fields: {}, dirty: false };
  lastActionResult?: ActionResult;
}

export class ShowingCalendarView extends Subject {
  readonly visitName = "resolveShowingCalendar" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  showings: Array<{
    showingId: string;
    listingId: string;
    address: string;
    date: Date;
    durationMinutes: number;
    status: "requested" | "confirmed" | "completed" | "cancelled";
  }> = [];
  pendingFeedbackIds: string[] = [];
}

export class TransactionTrackerView extends Subject {
  readonly visitName = "resolveTransactionTracker" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  transactionId: string = "";
  buyerId: string = "";
  sellerId: string = "";
  listingId: string = "";
  acceptedPrice: number = 0;
  milestones: WorkflowStep[] = [];
  currentMilestone: string = "";
  overdueItems: string[] = [];
  closingDate?: Date;
}

export class DisclosureWizardView extends Subject {
  readonly visitName = "resolveDisclosureWizard" as const;
  viewId: string = "";
  agentId: string = "";
  loadingState: "idle" | "loading" | "error" = "idle";
  propertyId: string = "";
  sellerId: string = "";
  currentStep: number = 0;
  totalSteps: number = 0;
  stepTitles: string[] = [
    "Property Details",
    "Known Defects",
    "Environmental Hazards",
    "HOA & Legal",
    "Recent Improvements",
    "Review & Submit",
  ];
  completionMap: Record<string, boolean> = {};
  lastComplianceCheck?: ComplianceCheck;
  currentFormValues: FormValues = { formId: "disclosure", fields: {}, dirty: false };
}

export interface ViewBase {
  viewId: string;
  agentId: string;
  loadingState: "idle" | "loading" | "error";
}

export interface LayoutContext {
  agentId: string;
  agentName: string;
  brokerage: string;
  viewport: "mobile" | "tablet" | "desktop";
  theme: "light" | "dark";
}

export interface UserAction {
  actionType: "click" | "submit" | "select" | "drag" | "input";
  sourceViewId: string;
  targetId?: string;
  payload: Record<string, unknown>;
}

export interface BackendPayload {
  commandName:
    | "qualifyParticipant"
    | "matchProperty"
    | "processOffer"
    | "scheduleShowing"
    | "generateDisclosure"
    | "advanceTransaction";
  result: WorkflowStep | MatchResult | ActionResult | ComplianceCheck;
}

export interface FormValues {
  formId: string;
  fields: Record<string, string | number | boolean | string[]>;
  dirty: boolean;
}

export interface NavigationEvent {
  trigger: "link" | "redirect" | "back" | "deepLink";
  targetHint: string;
  params: Record<string, string>;
  historyMode: "push" | "replace";
}

export interface RenderSpec {
  componentName: string;
  props: Record<string, unknown>;
  children: RenderSpec[];
  loadingState: "idle" | "loading" | "error";
  errorMessage?: string;
}

export interface DispatchIntent {
  isNoOp: boolean;
  backendCommandName: string;
  args: Record<string, unknown>;
  onSuccessNavigation?: NavigationEvent;
  validationErrors?: ValidationReport;
}

export interface ViewStatePatch {
  viewId: string;
  updates: Record<string, unknown>;
  pendingNavigation?: NavigationEvent;
  timestamp: number;
}

export interface ValidationReport {
  isValid: boolean;
  fieldErrors: Record<string, string>;
  globalBlockers: string[];
}

export interface RouteTarget {
  path: string;
  params: Record<string, string>;
  historyMode: "push" | "replace";
}
