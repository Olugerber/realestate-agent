import express from "express";
import cors from "cors";
import { store, newId, reviveDates, BUYER_ID, SELLER_ID, LISTING_ID } from "./store.js";
import {
  BuyerProfile,
  SellerProfile,
  PropertyListing,
  OfferDocument,
  ShowingRequest,
  TransactionRecord,
  type OfferTerms,
  type PropertyCriteria,
  type ShowingSlot,
  type MilestoneTimeline,
  type PropertyContext,
} from "../realestate/domain-types.js";
import { QualifyParticipantCommand } from "../realestate/commands/qualify-participant.js";
import { MatchPropertyCommand } from "../realestate/commands/match-property.js";
import {
  ProcessOfferCommand,
  AcceptOfferStrategy,
  RejectOfferStrategy,
} from "../realestate/commands/process-offer.js";
import { ScheduleShowingCommand } from "../realestate/commands/schedule-showing.js";
import { AdvanceTransactionCommand } from "../realestate/commands/advance-transaction.js";
import { GenerateDisclosureCommand } from "../realestate/commands/generate-disclosure.js";

const app = express();
app.use(cors());
app.use(express.json());

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Agent ───────────────────────────────────────────────────────────────────
app.get("/api/agent", (_req, res) => res.json(store.agent));

// ── Buyers ──────────────────────────────────────────────────────────────────
app.get("/api/buyers", (_req, res) => res.json([...store.buyers.values()]));

app.post("/api/buyers", (req, res) => {
  const id = newId();
  const buyer = Object.assign(new BuyerProfile(), req.body);
  buyer.participant = { ...req.body.participant, id };
  store.buyers.set(id, buyer);
  res.status(201).json(buyer);
});

app.get("/api/buyers/:id", (req, res) => {
  const b = store.buyers.get(req.params.id);
  if (!b) return res.status(404).json({ error: "Buyer not found" });
  res.json(b);
});

app.put("/api/buyers/:id", (req, res) => {
  const b = store.buyers.get(req.params.id);
  if (!b) return res.status(404).json({ error: "Buyer not found" });
  Object.assign(b, reviveDates(req.body));
  res.json(b);
});

// ── Sellers ─────────────────────────────────────────────────────────────────
app.get("/api/sellers", (_req, res) => res.json([...store.sellers.values()]));

app.post("/api/sellers", (req, res) => {
  const id = newId();
  const seller = Object.assign(new SellerProfile(), req.body);
  seller.participant = { ...req.body.participant, id };
  store.sellers.set(id, seller);
  res.status(201).json(seller);
});

app.get("/api/sellers/:id", (req, res) => {
  const s = store.sellers.get(req.params.id);
  if (!s) return res.status(404).json({ error: "Seller not found" });
  res.json(s);
});

app.put("/api/sellers/:id", (req, res) => {
  const s = store.sellers.get(req.params.id);
  if (!s) return res.status(404).json({ error: "Seller not found" });
  Object.assign(s, reviveDates(req.body));
  res.json(s);
});

// ── Listings ─────────────────────────────────────────────────────────────────
app.get("/api/listings", (_req, res) => res.json([...store.listings.values()]));

app.post("/api/listings", (req, res) => {
  const id = newId();
  const listing = Object.assign(new PropertyListing(), req.body, { listingId: id });
  store.listings.set(id, listing);
  res.status(201).json(listing);
});

app.get("/api/listings/:id", (req, res) => {
  const l = store.listings.get(req.params.id);
  if (!l) return res.status(404).json({ error: "Listing not found" });
  res.json(l);
});

app.put("/api/listings/:id", (req, res) => {
  const l = store.listings.get(req.params.id);
  if (!l) return res.status(404).json({ error: "Listing not found" });
  Object.assign(l, reviveDates(req.body));
  res.json(l);
});

// ── Offers ───────────────────────────────────────────────────────────────────
app.get("/api/offers", (_req, res) => res.json([...store.offers.values()]));

app.get("/api/offers/:id", (req, res) => {
  const o = store.offers.get(req.params.id);
  if (!o) return res.status(404).json({ error: "Offer not found" });
  res.json(o);
});

// ── Showings ─────────────────────────────────────────────────────────────────
app.get("/api/showings", (_req, res) => res.json([...store.showings.values()]));

app.get("/api/showings/:id", (req, res) => {
  const s = store.showings.get(req.params.id);
  if (!s) return res.status(404).json({ error: "Showing not found" });
  res.json(s);
});

// ── Transactions ──────────────────────────────────────────────────────────────
app.get("/api/transactions", (_req, res) => res.json([...store.transactions.values()]));

app.get("/api/transactions/:id", (req, res) => {
  const t = store.transactions.get(req.params.id);
  if (!t) return res.status(404).json({ error: "Transaction not found" });
  res.json(t);
});

// ── Commands ──────────────────────────────────────────────────────────────────

app.post("/api/commands/qualify-participant", (req, res) => {
  const { buyerId, sellerId } = req.body as { buyerId?: string; sellerId?: string };
  const subject = buyerId
    ? store.buyers.get(buyerId)
    : sellerId
    ? store.sellers.get(sellerId)
    : undefined;

  if (!subject) return res.status(404).json({ error: "Subject not found" });

  const result = new QualifyParticipantCommand().run(subject, store.agent);
  res.json(result);
});

app.post("/api/commands/match-property", (req, res) => {
  const { buyerId, listingId, criteria } = req.body as {
    buyerId?: string;
    listingId?: string;
    criteria?: PropertyCriteria;
  };

  const subject = buyerId
    ? store.buyers.get(buyerId)
    : listingId
    ? store.listings.get(listingId)
    : undefined;

  if (!subject) return res.status(404).json({ error: "Subject not found" });

  const matchCriteria: PropertyCriteria =
    criteria ??
    (subject instanceof BuyerProfile
      ? subject.criteria
      : { maxPrice: 0, minBedrooms: 0, minBathrooms: 0, preferredLocations: [], requiredFeatures: [] });

  // For a buyer subject, also run against each active listing and aggregate
  if (subject instanceof BuyerProfile) {
    const cmd = new MatchPropertyCommand();
    const listingResults = [...store.listings.values()]
      .filter((l) => l.status === "active")
      .map((listing) => cmd.run(listing, matchCriteria));

    const allMatches = listingResults.flatMap((r) => r.matches);
    const result = { matches: allMatches, totalFound: allMatches.length, criteriaUsed: matchCriteria };
    // Also update buyer criteria in store
    if (criteria) subject.criteria = criteria;
    res.json(result);
    return;
  }

  const result = new MatchPropertyCommand().run(subject, matchCriteria);
  res.json(result);
});

app.post("/api/commands/process-offer", (req, res) => {
  const body = reviveDates(req.body) as {
    action: "submit" | "accept" | "reject" | "counter" | "review";
    buyerId?: string;
    sellerId?: string;
    offerId?: string;
    listingId?: string;
    terms?: OfferTerms;
  };

  const { action, buyerId, sellerId, offerId, terms } = body;

  // Default stub terms so commands don't crash on missing fields
  const safeTerms: OfferTerms = terms ?? {
    offerPrice: 0,
    earnestMoney: 0,
    closingDate: new Date(Date.now() + 30 * 86400000),
    contingencies: ["financing", "inspection"],
    expirationDate: new Date(Date.now() + 3 * 86400000),
    inspectionPeriodDays: 10,
  };

  if (action === "accept" && offerId) {
    const offer = store.offers.get(offerId);
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    const offerTerms = offer.terms ?? safeTerms;
    const result = new AcceptOfferStrategy().execute(offer, offerTerms);
    if (result.success) {
      // Create transaction
      const txId = newId();
      const tx = new TransactionRecord();
      tx.transactionId = txId;
      tx.buyerId = offer.buyerId;
      tx.sellerId = offer.sellerId;
      tx.listingId = offer.listingId;
      tx.acceptedOfferPrice = offerTerms.offerPrice;
      tx.currentMilestone = "offer_accepted";
      store.transactions.set(txId, tx);
      result.data = { ...result.data, transactionId: txId };
    }
    return res.json(result);
  }

  if (action === "reject" && offerId) {
    const offer = store.offers.get(offerId);
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    const result = new RejectOfferStrategy().execute(offer, offer.terms ?? safeTerms);
    return res.json(result);
  }

  if (action === "counter" && offerId) {
    const offer = store.offers.get(offerId);
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    const result = new ProcessOfferCommand().run(offer, safeTerms);
    return res.json(result);
  }

  if (action === "submit" && buyerId) {
    const buyer = store.buyers.get(buyerId);
    if (!buyer) return res.status(404).json({ error: "Buyer not found" });
    const result = new ProcessOfferCommand().run(buyer, safeTerms);
    if (result.success && result.data?.offerId) {
      const newOffer = new OfferDocument();
      newOffer.offerId = result.data.offerId as string;
      newOffer.buyerId = buyerId;
      newOffer.sellerId = body.listingId
        ? (store.listings.get(body.listingId)?.sellerId ?? SELLER_ID)
        : SELLER_ID;
      newOffer.listingId = body.listingId ?? LISTING_ID;
      newOffer.terms = safeTerms;
      newOffer.status = "submitted";
      store.offers.set(newOffer.offerId, newOffer);
    }
    return res.json(result);
  }

  if ((action === "review" || !action) && sellerId) {
    const seller = store.sellers.get(sellerId);
    if (!seller) return res.status(404).json({ error: "Seller not found" });
    const result = new ProcessOfferCommand().run(seller, safeTerms);
    return res.json(result);
  }

  res.status(400).json({ error: "Invalid processOffer request" });
});

app.post("/api/commands/schedule-showing", (req, res) => {
  const body = reviveDates(req.body) as {
    action?: "request" | "confirm" | "cancel" | "reschedule" | "feedback";
    buyerId?: string;
    listingId?: string;
    showingId?: string;
    requestedDate?: Date;
    confirmedDate?: Date;
    newDate?: Date;
    durationMinutes?: number;
    notes?: string;
    rating?: number;
    interested?: boolean;
    comments?: string;
    concerns?: string[];
  };

  const slot: ShowingSlot = {
    requestedDate: body.requestedDate ?? new Date(Date.now() + 2 * 86400000),
    durationMinutes: body.durationMinutes ?? 30,
    notes: body.notes,
  };

  if (body.action === "confirm" && body.showingId) {
    const showing = store.showings.get(body.showingId);
    if (!showing) return res.status(404).json({ error: "Showing not found" });
    const result = new ScheduleShowingCommand().run(showing, slot);
    return res.json(result);
  }

  if (body.action === "feedback" && body.showingId) {
    const showing = store.showings.get(body.showingId);
    if (!showing) return res.status(404).json({ error: "Showing not found" });
    showing.status = "completed";
    showing.feedback = {
      rating: (body.rating ?? 3) as 1 | 2 | 3 | 4 | 5,
      interested: body.interested ?? false,
      comments: body.comments ?? "",
      concerns: body.concerns ?? [],
    };
    return res.json({
      success: true,
      message: "Feedback recorded",
      data: { showingId: body.showingId, action: "feedback" },
    });
  }

  if (body.action === "cancel" && body.showingId) {
    const showing = store.showings.get(body.showingId);
    if (!showing) return res.status(404).json({ error: "Showing not found" });
    showing.status = "cancelled";
    return res.json({
      success: true,
      message: "Showing cancelled",
      data: { showingId: body.showingId, action: "cancel" },
    });
  }

  // Request a new showing (buyer subject)
  if (body.buyerId) {
    const buyer = store.buyers.get(body.buyerId);
    if (!buyer) return res.status(404).json({ error: "Buyer not found" });
    const result = new ScheduleShowingCommand().run(buyer, slot);

    if (result.success) {
      const showingId = newId();
      const showing = new ShowingRequest();
      showing.showingId = showingId;
      showing.buyerId = body.buyerId;
      showing.listingId = body.listingId ?? LISTING_ID;
      showing.requestedSlot = slot;
      showing.status = "requested";
      store.showings.set(showingId, showing);
      result.data = {
        ...result.data,
        showingId,
        listingId: showing.listingId,
        requestedDate: slot.requestedDate.toISOString(),
        durationMinutes: slot.durationMinutes,
      };
    }
    return res.json(result);
  }

  if (body.listingId) {
    const listing = store.listings.get(body.listingId);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    const result = new ScheduleShowingCommand().run(listing, slot);
    return res.json(result);
  }

  res.status(400).json({ error: "Invalid scheduleShowing request" });
});

app.post("/api/commands/advance-transaction", (req, res) => {
  const body = reviveDates(req.body) as {
    buyerId?: string;
    sellerId?: string;
    transactionId?: string;
    milestone?: string;
    deadlines?: Record<string, Date>;
  };

  const timeline: MilestoneTimeline = {
    currentMilestone: (body.milestone ?? "offer_accepted") as MilestoneTimeline["currentMilestone"],
    deadlines: body.deadlines ?? {},
    completedMilestones: [],
    transactionId: body.transactionId ?? "",
  };

  if (body.transactionId) {
    const tx = store.transactions.get(body.transactionId);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    const result = new AdvanceTransactionCommand().run(tx, timeline);
    if (result.status === "completed") {
      const milestoneOrder = ["offer_accepted", "inspection", "financing", "disclosure", "appraisal", "closing"];
      const currentIdx = milestoneOrder.indexOf(tx.currentMilestone);
      if (currentIdx < milestoneOrder.length - 1) {
        tx.completedMilestones.push(tx.currentMilestone);
        tx.currentMilestone = milestoneOrder[currentIdx + 1] as typeof tx.currentMilestone;
      }
    }
    return res.json(result);
  }

  if (body.buyerId) {
    const buyer = store.buyers.get(body.buyerId);
    if (!buyer) return res.status(404).json({ error: "Buyer not found" });
    const result = new AdvanceTransactionCommand().run(buyer, timeline);
    return res.json(result);
  }

  if (body.sellerId) {
    const seller = store.sellers.get(body.sellerId);
    if (!seller) return res.status(404).json({ error: "Seller not found" });
    const result = new AdvanceTransactionCommand().run(seller, timeline);
    return res.json(result);
  }

  res.status(400).json({ error: "Invalid advanceTransaction request" });
});

app.post("/api/commands/generate-disclosure", (req, res) => {
  const body = reviveDates(req.body) as {
    sellerId?: string;
    listingId?: string;
    propertyId?: string;
    currentStep?: number;
    answers?: Record<string, unknown>;
    action?: string;
  };

  const listingId = body.listingId ?? body.propertyId ?? LISTING_ID;
  const listing = store.listings.get(listingId);

  const context: PropertyContext = {
    propertyId: listingId,
    address: listing?.details.address ?? "",
    yearBuilt: 1998,
    knownIssues: [],
    recentRenovations: ["updated kitchen"],
    hoaInfo: undefined,
    zoning: "residential",
  };

  if (body.sellerId) {
    const seller = store.sellers.get(body.sellerId);
    if (!seller) return res.status(404).json({ error: "Seller not found" });
    const result = new GenerateDisclosureCommand().run(seller, context);
    if (result.passed) {
      seller.disclosuresCompleted = true;
    }
    return res.json(result);
  }

  if (listing) {
    const result = new GenerateDisclosureCommand().run(listing, context);
    return res.json(result);
  }

  res.status(400).json({ error: "Invalid generateDisclosure request" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`LocalEdge backend running on port ${PORT}`);
  console.log(`Seed data: buyer=${BUYER_ID}, seller=${SELLER_ID}, listing=${LISTING_ID}`);
});
