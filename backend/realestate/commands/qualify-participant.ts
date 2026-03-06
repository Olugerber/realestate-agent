/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  Participant,
  Agent,
  WorkflowStep,
  BuyerProfile,
  SellerProfile,
} from "../domain-types.js";

export class QualifyParticipantCommand extends Command<
  Participant,
  Agent,
  WorkflowStep,
  [BuyerProfile, SellerProfile]
> {
  readonly commandName = "qualifyParticipant" as const;

  resolveBuyer(
    subject: BuyerProfile,
    object: Readonly<Agent>,
  ): Template<QualifyParticipantCommand, [], BuyerProfile> {
    return new BuyerQualifier();
  }

  resolveSeller(
    subject: SellerProfile,
    object: Readonly<Agent>,
  ): Template<QualifyParticipantCommand, [], SellerProfile> {
    return new SellerQualifier();
  }
}

export abstract class ParticipantQualifier<
  SU extends BuyerProfile | SellerProfile,
> implements Template<QualifyParticipantCommand, [], SU> {
  abstract execute(subject: SU, object: Readonly<Agent>): WorkflowStep;
}

export class BuyerQualifier extends ParticipantQualifier<BuyerProfile> {
  execute(subject: BuyerProfile, object: Readonly<Agent>): WorkflowStep {
    const { financialProfile, participant, criteria } = subject;
    const issues: string[] = [];

    if (financialProfile.creditScore < 620) {
      issues.push(`Credit score ${financialProfile.creditScore} is below the minimum threshold of 620`);
    }

    if (financialProfile.preApprovalAmount <= 0) {
      issues.push("No mortgage pre-approval on file — obtain pre-approval before proceeding");
    } else if (financialProfile.preApprovalExpiry < new Date()) {
      issues.push("Mortgage pre-approval has expired — renewal required");
    }

    if (financialProfile.preApprovalAmount > 0) {
      const minDownPayment = financialProfile.preApprovalAmount * 0.03;
      if (financialProfile.downPaymentAvailable < minDownPayment) {
        issues.push(
          `Down payment of $${financialProfile.downPaymentAvailable.toLocaleString()} is below ` +
          `the 3% minimum of $${minDownPayment.toLocaleString()}`
        );
      }
    }

    if (financialProfile.debtToIncomeRatio > 0.43) {
      issues.push(
        `Debt-to-income ratio of ${(financialProfile.debtToIncomeRatio * 100).toFixed(1)}% ` +
        `exceeds the 43% limit for most loan programs`
      );
    }

    if (criteria.maxPrice > financialProfile.preApprovalAmount) {
      issues.push(
        `Search budget $${criteria.maxPrice.toLocaleString()} exceeds ` +
        `pre-approval amount $${financialProfile.preApprovalAmount.toLocaleString()}`
      );
    }

    if (issues.length > 0) {
      subject.qualificationStatus = "disqualified";
      return {
        stepName: "buyerQualification",
        status: "blocked",
        nextSteps: issues,
        notes: `Buyer ${participant.name} did not meet qualification criteria. Assigned agent: ${object.name}`,
      };
    }

    subject.qualificationStatus = "qualified";
    return {
      stepName: "buyerQualification",
      status: "completed",
      nextSteps: ["matchProperty", "scheduleShowing"],
      notes:
        `Buyer ${participant.name} qualified for up to ` +
        `$${financialProfile.preApprovalAmount.toLocaleString()} with agent ${object.name} (${object.brokerage})`,
    };
  }
}

export class SellerQualifier extends ParticipantQualifier<SellerProfile> {
  execute(subject: SellerProfile, object: Readonly<Agent>): WorkflowStep {
    const { participant, listingDetails, motivationLevel, targetCloseDate } = subject;
    const issues: string[] = [];

    if (listingDetails.price <= 0) {
      issues.push("Listing price has not been set — a comparative market analysis (CMA) is required");
    }

    if (!listingDetails.address || !listingDetails.city) {
      issues.push("Property address is incomplete — verify ownership documentation");
    }

    if (listingDetails.bedrooms <= 0 || listingDetails.bathrooms <= 0) {
      issues.push("Property details (bedrooms/bathrooms) are missing — complete listing intake form");
    }

    if (!subject.disclosuresCompleted) {
      issues.push("Seller disclosure forms have not been completed — required before listing");
    }

    if (issues.length > 0) {
      return {
        stepName: "sellerQualification",
        status: "blocked",
        nextSteps: issues,
        notes: `Seller ${participant.name} requires additional preparation before listing`,
      };
    }

    const urgencyNote =
      motivationLevel === "high"
        ? "Seller is highly motivated — prioritize offers"
        : motivationLevel === "low"
        ? "Seller is exploratory — allow extended timeline"
        : "Seller has standard motivation";

    return {
      stepName: "sellerQualification",
      status: "completed",
      nextSteps: ["generateDisclosure", "matchProperty"],
      dueDate: targetCloseDate,
      notes:
        `Seller ${participant.name} qualified. Property at ${listingDetails.address} ` +
        `listed at $${listingDetails.price.toLocaleString()}. ${urgencyNote}. ` +
        `Assigned agent: ${object.name} (${object.brokerage})`,
    };
  }
}
