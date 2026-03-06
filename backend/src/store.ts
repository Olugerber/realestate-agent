import { randomUUID } from "crypto";
import {
  BuyerProfile,
  SellerProfile,
  PropertyListing,
  OfferDocument,
  ShowingRequest,
  TransactionRecord,
  type Agent,
} from "../realestate/domain-types.js";

export interface AppStore {
  agent: Agent;
  buyers: Map<string, BuyerProfile>;
  sellers: Map<string, SellerProfile>;
  listings: Map<string, PropertyListing>;
  offers: Map<string, OfferDocument>;
  showings: Map<string, ShowingRequest>;
  transactions: Map<string, TransactionRecord>;
}

function seedBuyer(id: string): BuyerProfile {
  const b = new BuyerProfile();
  b.participant = { id, name: "Alice Johnson", email: "alice@example.com", phone: "555-0101" };
  b.financialProfile = {
    annualIncome: 120000,
    creditScore: 740,
    preApprovalAmount: 600000,
    preApprovalExpiry: new Date(Date.now() + 90 * 86400000),
    downPaymentAvailable: 120000,
    debtToIncomeRatio: 0.28,
  };
  b.criteria = {
    maxPrice: 575000,
    minBedrooms: 3,
    minBathrooms: 2,
    preferredLocations: ["Westside", "Downtown"],
    requiredFeatures: ["garage", "yard"],
  };
  b.qualificationStatus = "pending";
  return b;
}

function seedSeller(id: string): SellerProfile {
  const s = new SellerProfile();
  s.participant = { id, name: "Bob Martinez", email: "bob@example.com", phone: "555-0102" };
  s.listingDetails = {
    price: 550000,
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2200,
    address: "123 Maple Street",
    city: "Westside",
    features: ["garage", "yard", "updated kitchen"],
    daysOnMarket: 12,
  };
  s.motivationLevel = "high";
  s.targetCloseDate = new Date(Date.now() + 60 * 86400000);
  s.disclosuresCompleted = true;
  return s;
}

function seedListing(id: string, sellerId: string): PropertyListing {
  const l = new PropertyListing();
  l.listingId = id;
  l.sellerId = sellerId;
  l.details = {
    price: 550000,
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2200,
    address: "123 Maple Street",
    city: "Westside",
    features: ["garage", "yard", "updated kitchen"],
    daysOnMarket: 12,
  };
  l.status = "active";
  l.availableSlots = [
    new Date(Date.now() + 2 * 86400000),
    new Date(Date.now() + 3 * 86400000),
    new Date(Date.now() + 5 * 86400000),
  ];
  return l;
}

export const BUYER_ID = "buyer-1";
export const SELLER_ID = "seller-1";
export const LISTING_ID = "listing-1";

export const store: AppStore = {
  agent: {
    id: "agent-1",
    name: "Sarah Chen",
    licenseNumber: "DRE-1234567",
    email: "sarah@localedge.com",
    phone: "555-0100",
    brokerage: "LocalEdge Realty",
  },
  buyers: new Map([[BUYER_ID, seedBuyer(BUYER_ID)]]),
  sellers: new Map([[SELLER_ID, seedSeller(SELLER_ID)]]),
  listings: new Map([[LISTING_ID, seedListing(LISTING_ID, SELLER_ID)]]),
  offers: new Map(),
  showings: new Map(),
  transactions: new Map(),
};

export function newId(): string {
  return randomUUID();
}

/** Deep-revive ISO date strings into Date objects */
export function reviveDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string" && /^\d{4}-\d{2}-\d{2}T[\d:.Z+-]+$/.test(obj)) {
    return new Date(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(reviveDates) as unknown as T;
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, reviveDates(v)])
    ) as T;
  }
  return obj;
}
