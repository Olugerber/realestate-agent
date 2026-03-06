/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  Participant,
  PropertyCriteria,
  MatchResult,
  BuyerProfile,
  PropertyListing,
} from "../domain-types.js";

export class MatchPropertyCommand extends Command<
  Participant,
  PropertyCriteria,
  MatchResult,
  [BuyerProfile, PropertyListing]
> {
  readonly commandName = "matchProperty" as const;

  resolveBuyer(
    subject: BuyerProfile,
    object: Readonly<PropertyCriteria>,
  ): Template<MatchPropertyCommand, [], BuyerProfile> {
    return new CriteriaMatchTemplate();
  }

  resolveListing(
    subject: PropertyListing,
    object: Readonly<PropertyCriteria>,
  ): Template<MatchPropertyCommand, [], PropertyListing> {
    return new ListingPushTemplate();
  }
}

export class CriteriaMatchTemplate implements Template<
  MatchPropertyCommand,
  [],
  BuyerProfile
> {
  execute(
    subject: BuyerProfile,
    object: Readonly<PropertyCriteria>,
  ): MatchResult {
    if (subject.qualificationStatus !== "qualified") {
      return { matches: [], totalFound: 0, criteriaUsed: object };
    }

    // Score a hypothetical listing against the buyer's criteria.
    // In production this would query a listing repository; here we score
    // the criteria object itself to produce a search-intent result.
    const effectiveCriteria: PropertyCriteria = {
      ...object,
      maxPrice: Math.min(object.maxPrice, subject.financialProfile.preApprovalAmount),
    };

    // Derive an intent-based match score from how well the criteria can be
    // satisfied given the buyer's financial profile.
    const budgetUtilization =
      effectiveCriteria.maxPrice > 0
        ? subject.financialProfile.preApprovalAmount / effectiveCriteria.maxPrice
        : 0;

    const score = Math.min(100, Math.round(budgetUtilization * 60 + 40));

    // Produce a search-intent entry that downstream listing queries can use.
    const searchIntent = {
      listingId: `search:${subject.participant.id}`,
      score,
      address: `${effectiveCriteria.preferredLocations.join(", ")} — ${effectiveCriteria.minBedrooms}+ bed, $${effectiveCriteria.maxPrice.toLocaleString()} max`,
      price: effectiveCriteria.maxPrice,
    };

    return {
      matches: [searchIntent],
      totalFound: 1,
      criteriaUsed: effectiveCriteria,
    };
  }
}

export class ListingPushTemplate implements Template<
  MatchPropertyCommand,
  [],
  PropertyListing
> {
  execute(
    subject: PropertyListing,
    object: Readonly<PropertyCriteria>,
  ): MatchResult {
    if (subject.status !== "active") {
      return { matches: [], totalFound: 0, criteriaUsed: object };
    }

    const { details } = subject;
    const issues: string[] = [];

    if (details.price > object.maxPrice) {
      issues.push(`price $${details.price.toLocaleString()} exceeds budget $${object.maxPrice.toLocaleString()}`);
    }
    if (object.minPrice !== undefined && details.price < object.minPrice) {
      issues.push(`price $${details.price.toLocaleString()} is below minimum $${object.minPrice.toLocaleString()}`);
    }
    if (details.bedrooms < object.minBedrooms) {
      issues.push(`${details.bedrooms} bedrooms below required ${object.minBedrooms}`);
    }
    if (details.bathrooms < object.minBathrooms) {
      issues.push(`${details.bathrooms} bathrooms below required ${object.minBathrooms}`);
    }

    const locationMatch =
      object.preferredLocations.length === 0 ||
      object.preferredLocations.some(
        (loc) =>
          details.city.toLowerCase().includes(loc.toLowerCase()) ||
          details.address.toLowerCase().includes(loc.toLowerCase()),
      );
    if (!locationMatch) {
      issues.push(`location "${details.city}" not in preferred areas: ${object.preferredLocations.join(", ")}`);
    }

    const missingFeatures = object.requiredFeatures.filter(
      (f) => !details.features.map((df) => df.toLowerCase()).includes(f.toLowerCase()),
    );
    if (missingFeatures.length > 0) {
      issues.push(`missing required features: ${missingFeatures.join(", ")}`);
    }

    if (issues.length > 0) {
      return { matches: [], totalFound: 0, criteriaUsed: object };
    }

    // Score the listing: price proximity (40%), location (20%), features (20%), freshness (20%)
    const priceMidpoint = object.minPrice
      ? (object.minPrice + object.maxPrice) / 2
      : object.maxPrice * 0.85;
    const priceDelta = Math.abs(details.price - priceMidpoint) / priceMidpoint;
    const priceScore = Math.max(0, 40 - priceDelta * 40);

    const featureScore =
      object.requiredFeatures.length > 0
        ? (object.requiredFeatures.filter((f) =>
            details.features.map((df) => df.toLowerCase()).includes(f.toLowerCase()),
          ).length /
            object.requiredFeatures.length) *
          20
        : 20;

    const sqftScore =
      object.preferredSqft && details.sqft > 0
        ? Math.min(20, (details.sqft / object.preferredSqft) * 20)
        : 20;

    const freshnessScore = Math.max(0, 20 - details.daysOnMarket * 0.5);

    const score = Math.round(priceScore + 20 + featureScore + sqftScore + freshnessScore);

    return {
      matches: [
        {
          listingId: subject.listingId,
          score: Math.min(100, score),
          address: `${details.address}, ${details.city}`,
          price: details.price,
        },
      ],
      totalFound: 1,
      criteriaUsed: object,
    };
  }
}
