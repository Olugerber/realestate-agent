/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  Participant,
  OfferTerms,
  ActionResult,
  BuyerProfile,
  SellerProfile,
  OfferDocument,
} from "../domain-types.js";

export class ProcessOfferCommand extends Command<
  Participant,
  OfferTerms,
  ActionResult,
  [BuyerProfile, SellerProfile, OfferDocument]
> {
  readonly commandName = "processOffer" as const;

  resolveBuyer(
    subject: BuyerProfile,
    object: Readonly<OfferTerms>,
  ): Template<ProcessOfferCommand, [], BuyerProfile> {
    return new SubmitOfferTemplate();
  }

  resolveSeller(
    subject: SellerProfile,
    object: Readonly<OfferTerms>,
  ): Template<ProcessOfferCommand, [], SellerProfile> {
    return new ReviewOfferTemplate();
  }

  resolveOffer(
    subject: OfferDocument,
    object: Readonly<OfferTerms>,
  ): Template<ProcessOfferCommand, [], OfferDocument> {
    return new CounterOfferStrategy();
  }
}

export abstract class NegotiationTemplate<
  SU extends OfferDocument,
> implements Template<ProcessOfferCommand, [], SU> {
  abstract execute(subject: SU, object: Readonly<OfferTerms>): ActionResult;
}

export class SubmitOfferTemplate implements Template<
  ProcessOfferCommand,
  [],
  BuyerProfile
> {
  execute(subject: BuyerProfile, object: Readonly<OfferTerms>): ActionResult {
    if (subject.qualificationStatus !== "qualified") {
      return {
        success: false,
        message: `Buyer ${subject.participant.name} must be qualified before submitting offers`,
        errors: ["Buyer not qualified"],
      };
    }

    if (object.offerPrice <= 0) {
      return {
        success: false,
        message: "Offer price must be greater than zero",
        errors: ["Invalid offer price"],
      };
    }

    if (object.offerPrice > subject.financialProfile.preApprovalAmount) {
      return {
        success: false,
        message:
          `Offer price $${object.offerPrice.toLocaleString()} exceeds buyer's pre-approval ` +
          `of $${subject.financialProfile.preApprovalAmount.toLocaleString()}`,
        errors: ["Offer exceeds pre-approval amount"],
      };
    }

    const minEarnestMoney = object.offerPrice * 0.01;
    if (object.earnestMoney < minEarnestMoney) {
      return {
        success: false,
        message: `Earnest money deposit must be at least 1% of the offer price ($${minEarnestMoney.toLocaleString()})`,
        errors: ["Insufficient earnest money"],
      };
    }

    if (object.expirationDate <= new Date()) {
      return {
        success: false,
        message: "Offer expiration date must be in the future",
        errors: ["Offer already expired"],
      };
    }

    const offerId = `offer:${subject.participant.id}:${Date.now()}`;
    subject.activeOffers.push(offerId);

    const contingencyList = object.contingencies.length > 0
      ? object.contingencies.join(", ")
      : "none";

    return {
      success: true,
      message:
        `Offer submitted by ${subject.participant.name} for $${object.offerPrice.toLocaleString()} ` +
        `with contingencies: ${contingencyList}. Expires ${object.expirationDate.toDateString()}.`,
      data: {
        offerId,
        buyerId: subject.participant.id,
        offerPrice: object.offerPrice,
        earnestMoney: object.earnestMoney,
        closingDate: object.closingDate.toISOString(),
        contingencies: object.contingencies,
        expirationDate: object.expirationDate.toISOString(),
        inspectionPeriodDays: object.inspectionPeriodDays,
      },
    };
  }
}

export class ReviewOfferTemplate implements Template<
  ProcessOfferCommand,
  [],
  SellerProfile
> {
  execute(subject: SellerProfile, object: Readonly<OfferTerms>): ActionResult {
    const { listingDetails, participant, motivationLevel, targetCloseDate } = subject;
    const observations: string[] = [];

    const priceRatio = listingDetails.price > 0 ? object.offerPrice / listingDetails.price : 0;

    if (priceRatio >= 1.0) {
      observations.push(`Offer is at or above asking price (${(priceRatio * 100).toFixed(1)}% of list)`);
    } else if (priceRatio >= 0.97) {
      observations.push(`Offer is within 3% of asking price (${(priceRatio * 100).toFixed(1)}% of list) — strong offer`);
    } else if (priceRatio >= 0.93) {
      observations.push(`Offer is ${((1 - priceRatio) * 100).toFixed(1)}% below asking — consider countering`);
    } else {
      observations.push(`Offer is ${((1 - priceRatio) * 100).toFixed(1)}% below asking — low offer, counter or reject`);
    }

    if (object.contingencies.includes("sale_of_home")) {
      observations.push("Offer includes sale-of-home contingency — adds risk and extended timeline");
    }
    if (!object.contingencies.includes("financing")) {
      observations.push("No financing contingency — stronger offer for seller");
    }
    if (!object.contingencies.includes("inspection")) {
      observations.push("No inspection contingency — reduces seller liability exposure");
    }

    if (object.sellerConcessions && object.sellerConcessions > 0) {
      observations.push(
        `Buyer requests $${object.sellerConcessions.toLocaleString()} in seller concessions`,
      );
    }

    if (targetCloseDate) {
      const closingDiff = Math.round(
        (object.closingDate.getTime() - targetCloseDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (Math.abs(closingDiff) <= 7) {
        observations.push("Proposed closing date aligns with seller's target");
      } else if (closingDiff > 7) {
        observations.push(`Closing date is ${closingDiff} days after seller's target — may not work`);
      } else {
        observations.push(`Closing date is ${Math.abs(closingDiff)} days before seller's target — favorable`);
      }
    }

    const recommendation =
      priceRatio >= 0.97 && motivationLevel === "high"
        ? "accept"
        : priceRatio >= 0.93
        ? "counter"
        : "reject";

    return {
      success: true,
      message: `Offer of $${object.offerPrice.toLocaleString()} reviewed for ${participant.name}. Recommendation: ${recommendation.toUpperCase()}`,
      data: {
        listingPrice: listingDetails.price,
        offerPrice: object.offerPrice,
        priceRatioPercent: Math.round(priceRatio * 100),
        recommendation,
        observations,
        motivationLevel,
      },
    };
  }
}

export class CounterOfferStrategy extends NegotiationTemplate<OfferDocument> {
  execute(subject: OfferDocument, object: Readonly<OfferTerms>): ActionResult {
    if (subject.status === "accepted" || subject.status === "rejected") {
      return {
        success: false,
        message: `Offer ${subject.offerId} is already ${subject.status} and cannot be countered`,
        errors: [`Offer is ${subject.status}`],
      };
    }

    if (subject.counterOfferCount >= 5) {
      return {
        success: false,
        message: "Maximum counter-offer rounds (5) reached — accept, reject, or walk away",
        errors: ["Counter-offer limit reached"],
      };
    }

    // Counter at the midpoint between the offer price and the previous/original terms
    const previousPrice = subject.terms?.offerPrice ?? object.offerPrice;
    const counterPrice = Math.round((previousPrice + object.offerPrice) / 2 / 1000) * 1000;

    const counterTerms: OfferTerms = {
      ...object,
      offerPrice: counterPrice,
      // Remove sale-of-home contingency on counter to strengthen the deal
      contingencies: object.contingencies.filter((c) => c !== "sale_of_home"),
      expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 48-hour counter expiration
    };

    subject.negotiationHistory.push({
      party: "seller",
      amount: counterPrice,
      timestamp: new Date(),
    });
    subject.counterOfferCount += 1;
    subject.status = "countered";
    subject.terms = counterTerms;

    return {
      success: true,
      message: `Counter-offer #${subject.counterOfferCount} issued at $${counterPrice.toLocaleString()} — expires in 48 hours`,
      data: {
        offerId: subject.offerId,
        counterOfferNumber: subject.counterOfferCount,
        originalOfferPrice: object.offerPrice,
        counterOfferPrice: counterPrice,
        removedContingencies: ["sale_of_home"],
        expiresAt: counterTerms.expirationDate.toISOString(),
      },
    };
  }
}

export class AcceptOfferStrategy extends NegotiationTemplate<OfferDocument> {
  execute(subject: OfferDocument, object: Readonly<OfferTerms>): ActionResult {
    if (subject.status === "rejected" || subject.status === "withdrawn") {
      return {
        success: false,
        message: `Cannot accept offer ${subject.offerId} — it has been ${subject.status}`,
        errors: [`Offer is ${subject.status}`],
      };
    }

    if (object.expirationDate < new Date()) {
      return {
        success: false,
        message: "Offer has expired and can no longer be accepted",
        errors: ["Offer expired"],
      };
    }

    subject.status = "accepted";
    subject.terms = object;
    subject.negotiationHistory.push({
      party: "seller",
      amount: object.offerPrice,
      timestamp: new Date(),
    });

    return {
      success: true,
      message:
        `Offer accepted for $${object.offerPrice.toLocaleString()}. ` +
        `Closing scheduled for ${object.closingDate.toDateString()}.`,
      data: {
        offerId: subject.offerId,
        buyerId: subject.buyerId,
        sellerId: subject.sellerId,
        listingId: subject.listingId,
        acceptedPrice: object.offerPrice,
        earnestMoney: object.earnestMoney,
        closingDate: object.closingDate.toISOString(),
        contingencies: object.contingencies,
        inspectionPeriodDays: object.inspectionPeriodDays,
      },
    };
  }
}

export class RejectOfferStrategy extends NegotiationTemplate<OfferDocument> {
  execute(subject: OfferDocument, object: Readonly<OfferTerms>): ActionResult {
    if (subject.status === "accepted") {
      return {
        success: false,
        message: `Offer ${subject.offerId} has already been accepted and cannot be rejected`,
        errors: ["Offer already accepted"],
      };
    }

    subject.status = "rejected";
    subject.negotiationHistory.push({
      party: "seller",
      amount: 0,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: `Offer of $${object.offerPrice.toLocaleString()} rejected. Buyer ${subject.buyerId} has been notified.`,
      data: {
        offerId: subject.offerId,
        buyerId: subject.buyerId,
        rejectedPrice: object.offerPrice,
        counterOffersMade: subject.counterOfferCount,
        rejectedAt: new Date().toISOString(),
      },
    };
  }
}
