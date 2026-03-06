/* @odetovibe-generated */
import { Subject } from "codascon";

export class BuyerProfile extends Subject {
  readonly visitName = "resolveBuyer" as const;
  participant: Participant = { id: "", name: "", email: "", phone: "" };
  financialProfile: FinancialProfile = {
    annualIncome: 0,
    creditScore: 0,
    preApprovalAmount: 0,
    preApprovalExpiry: new Date(),
    downPaymentAvailable: 0,
    debtToIncomeRatio: 0,
  };
  criteria: PropertyCriteria = {
    maxPrice: 0,
    minBedrooms: 0,
    minBathrooms: 0,
    preferredLocations: [],
    requiredFeatures: [],
  };
  qualificationStatus: "pending" | "qualified" | "disqualified" = "pending";
  scheduledShowings: string[] = [];
  activeOffers: string[] = [];
}

export class SellerProfile extends Subject {
  readonly visitName = "resolveSeller" as const;
  participant: Participant = { id: "", name: "", email: "", phone: "" };
  listingDetails: ListingDetails = {
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    address: "",
    city: "",
    features: [],
    daysOnMarket: 0,
  };
  motivationLevel: "low" | "medium" | "high" = "medium";
  targetCloseDate?: Date;
  disclosuresCompleted: boolean = false;
  receivedOffers: string[] = [];
}

export class PropertyListing extends Subject {
  readonly visitName = "resolveListing" as const;
  listingId: string = "";
  details: ListingDetails = {
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    address: "",
    city: "",
    features: [],
    daysOnMarket: 0,
  };
  status: "active" | "pending" | "under_contract" | "sold" = "active";
  availableSlots: Date[] = [];
  sellerId: string = "";
}

export class OfferDocument extends Subject {
  readonly visitName = "resolveOffer" as const;
  offerId: string = "";
  buyerId: string = "";
  sellerId: string = "";
  listingId: string = "";
  terms?: OfferTerms;
  status: "draft" | "submitted" | "countered" | "accepted" | "rejected" | "withdrawn" = "draft";
  negotiationHistory: Array<{ party: string; amount: number; timestamp: Date }> = [];
  counterOfferCount: number = 0;
}

export class ShowingRequest extends Subject {
  readonly visitName = "resolveShowing" as const;
  showingId: string = "";
  buyerId: string = "";
  listingId: string = "";
  requestedSlot?: ShowingSlot;
  confirmedDate?: Date;
  status: "requested" | "confirmed" | "completed" | "cancelled" = "requested";
  feedback?: ShowingFeedback;
}

export class TransactionRecord extends Subject {
  readonly visitName = "resolveTransaction" as const;
  transactionId: string = "";
  buyerId: string = "";
  sellerId: string = "";
  listingId: string = "";
  acceptedOfferPrice: number = 0;
  currentMilestone: "offer_accepted" | "inspection" | "financing" | "disclosure" | "appraisal" | "closing" = "offer_accepted";
  completedMilestones: string[] = [];
  blockedReasons: string[] = [];
  closingDate?: Date;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface PropertyContext {
  propertyId: string;
  address: string;
  yearBuilt: number;
  knownIssues: string[];
  recentRenovations: string[];
  hoaInfo?: { name: string; monthlyFee: number };
  zoning: string;
}

export interface Agent {
  id: string;
  name: string;
  licenseNumber: string;
  email: string;
  phone: string;
  brokerage: string;
}

export interface PropertyCriteria {
  maxPrice: number;
  minPrice?: number;
  minBedrooms: number;
  minBathrooms: number;
  preferredLocations: string[];
  requiredFeatures: string[];
  preferredSqft?: number;
}

export interface FinancialProfile {
  annualIncome: number;
  creditScore: number;
  preApprovalAmount: number;
  preApprovalExpiry: Date;
  downPaymentAvailable: number;
  debtToIncomeRatio: number;
}

export interface ListingDetails {
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: string;
  city: string;
  features: string[];
  daysOnMarket: number;
}

export interface OfferTerms {
  offerPrice: number;
  earnestMoney: number;
  closingDate: Date;
  contingencies: Array<"financing" | "inspection" | "appraisal" | "sale_of_home">;
  expirationDate: Date;
  inspectionPeriodDays: number;
  sellerConcessions?: number;
}

export interface ShowingSlot {
  requestedDate: Date;
  durationMinutes: number;
  notes?: string;
}

export interface MilestoneTimeline {
  currentMilestone: "offer_accepted" | "inspection" | "financing" | "disclosure" | "appraisal" | "closing";
  deadlines: Record<string, Date>;
  completedMilestones: string[];
  transactionId: string;
}

export interface MatchResult {
  matches: Array<{ listingId: string; score: number; address: string; price: number }>;
  totalFound: number;
  criteriaUsed: PropertyCriteria;
}

export interface WorkflowStep {
  stepName: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  nextSteps: string[];
  dueDate?: Date;
  notes?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  errors?: string[];
}

export interface ComplianceCheck {
  passed: boolean;
  disclosureItems: Array<{ category: string; description: string; severity: "low" | "medium" | "high" }>;
  generatedDocuments: string[];
  requiredSignatures: string[];
  completedAt?: Date;
}

export interface ShowingFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  interested: boolean;
  comments: string;
  concerns: string[];
}

export interface NegotiationSummary {
  originalOfferPrice: number;
  currentTerms: OfferTerms;
  counterOfferCount: number;
  status: "pending" | "countered" | "accepted" | "rejected";
  history: Array<{ party: string; amount: number; timestamp: Date }>;
}
