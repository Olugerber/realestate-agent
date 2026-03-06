/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  Participant,
  MilestoneTimeline,
  WorkflowStep,
  BuyerProfile,
  SellerProfile,
  TransactionRecord,
} from "../domain-types.js";
import { GenerateDisclosureCommand } from "./generate-disclosure.js";

export class AdvanceTransactionCommand extends Command<
  Participant,
  MilestoneTimeline,
  WorkflowStep,
  [BuyerProfile, SellerProfile, TransactionRecord]
> {
  readonly commandName = "advanceTransaction" as const;

  resolveBuyer(
    subject: BuyerProfile,
    object: Readonly<MilestoneTimeline>,
  ): Template<AdvanceTransactionCommand, [], BuyerProfile> {
    return new FinancingMilestone();
  }

  resolveSeller(
    subject: SellerProfile,
    object: Readonly<MilestoneTimeline>,
  ): Template<AdvanceTransactionCommand, [], SellerProfile> {
    return new DisclosureMilestone();
  }

  resolveTransaction(
    subject: TransactionRecord,
    object: Readonly<MilestoneTimeline>,
  ): Template<AdvanceTransactionCommand, [], TransactionRecord> {
    return new TransactionProgressTemplate();
  }
}

export abstract class BuyerMilestoneTemplate<
  SU extends BuyerProfile,
> implements Template<
  AdvanceTransactionCommand,
  [GenerateDisclosureCommand],
  SU
> {
  readonly generateDisclosure = new GenerateDisclosureCommand();

  abstract execute(
    subject: SU,
    object: Readonly<MilestoneTimeline>,
  ): WorkflowStep;
}

export abstract class SellerMilestoneTemplate<
  SU extends SellerProfile,
> implements Template<
  AdvanceTransactionCommand,
  [GenerateDisclosureCommand],
  SU
> {
  readonly generateDisclosure = new GenerateDisclosureCommand();

  abstract execute(
    subject: SU,
    object: Readonly<MilestoneTimeline>,
  ): WorkflowStep;
}

export class TransactionProgressTemplate implements Template<
  AdvanceTransactionCommand,
  [],
  TransactionRecord
> {
  execute(
    subject: TransactionRecord,
    object: Readonly<MilestoneTimeline>,
  ): WorkflowStep {
    const milestoneOrder: TransactionRecord["currentMilestone"][] = [
      "offer_accepted",
      "disclosure",
      "inspection",
      "financing",
      "appraisal",
      "closing",
    ];

    const currentIndex = milestoneOrder.indexOf(object.currentMilestone);
    const isComplete = object.completedMilestones.includes(object.currentMilestone);

    if (!isComplete) {
      const deadline = object.deadlines[object.currentMilestone];
      const isOverdue = deadline && deadline < new Date();

      return {
        stepName: `transaction:${object.transactionId}:${object.currentMilestone}`,
        status: isOverdue ? "blocked" : "in_progress",
        nextSteps: [`Complete ${object.currentMilestone} milestone to advance transaction`],
        dueDate: deadline,
        notes: isOverdue
          ? `OVERDUE: ${object.currentMilestone} deadline was ${deadline?.toDateString()} — immediate action required`
          : `Transaction ${object.transactionId} is at the ${object.currentMilestone} milestone`,
      };
    }

    const nextMilestone = milestoneOrder[currentIndex + 1];
    if (!nextMilestone) {
      subject.currentMilestone = "closing";
      subject.completedMilestones = [...milestoneOrder];
      return {
        stepName: `transaction:${object.transactionId}:closing`,
        status: "completed",
        nextSteps: ["File deed", "Disburse funds", "Transfer keys to buyer"],
        notes: `Transaction ${object.transactionId} is complete — all milestones cleared`,
      };
    }

    subject.currentMilestone = nextMilestone;
    subject.completedMilestones.push(object.currentMilestone);

    const nextDeadline = object.deadlines[nextMilestone];
    return {
      stepName: `transaction:${object.transactionId}:${nextMilestone}`,
      status: "pending",
      nextSteps: [`Begin ${nextMilestone} phase`],
      dueDate: nextDeadline,
      notes:
        `Transaction ${object.transactionId} advanced from ${object.currentMilestone} ` +
        `to ${nextMilestone}. Progress: ${subject.completedMilestones.length}/${milestoneOrder.length} milestones complete`,
    };
  }
}

export class FinancingMilestone extends BuyerMilestoneTemplate<BuyerProfile> {
  execute(
    subject: BuyerProfile,
    object: Readonly<MilestoneTimeline>,
  ): WorkflowStep {
    const { financialProfile, participant } = subject;
    const blockers: string[] = [];

    if (financialProfile.preApprovalAmount <= 0) {
      blockers.push("No mortgage pre-approval — lender must issue commitment letter");
    } else if (financialProfile.preApprovalExpiry < new Date()) {
      blockers.push("Mortgage pre-approval has expired — contact lender for renewal");
    }

    if (financialProfile.creditScore < 620) {
      blockers.push(`Credit score ${financialProfile.creditScore} is below lender minimum of 620`);
    }

    if (financialProfile.debtToIncomeRatio > 0.43) {
      blockers.push(
        `Debt-to-income ratio ${(financialProfile.debtToIncomeRatio * 100).toFixed(1)}% exceeds 43% — ` +
        `pay down debts or reduce loan amount`,
      );
    }

    const deadline = object.deadlines["financing"];

    if (blockers.length > 0) {
      return {
        stepName: `financing:${participant.id}`,
        status: "blocked",
        nextSteps: blockers,
        dueDate: deadline,
        notes: `Buyer ${participant.name} has unresolved financing issues`,
      };
    }

    return {
      stepName: `financing:${participant.id}`,
      status: "completed",
      nextSteps: ["appraisal", "scheduleClosing"],
      dueDate: deadline,
      notes:
        `Buyer ${participant.name} financing cleared — pre-approved for ` +
        `$${financialProfile.preApprovalAmount.toLocaleString()} ` +
        `(credit score: ${financialProfile.creditScore}, DTI: ${(financialProfile.debtToIncomeRatio * 100).toFixed(1)}%)`,
    };
  }
}

export class InspectionBuyerMilestone extends BuyerMilestoneTemplate<BuyerProfile> {
  execute(
    subject: BuyerProfile,
    object: Readonly<MilestoneTimeline>,
  ): WorkflowStep {
    const { participant } = subject;
    const deadline = object.deadlines["inspection"];
    const isOverdue = deadline && deadline < new Date();

    if (isOverdue) {
      return {
        stepName: `inspection:buyer:${participant.id}`,
        status: "blocked",
        nextSteps: [
          "Contact listing agent immediately to negotiate inspection period extension",
          "Risk losing inspection contingency if deadline is not extended",
        ],
        dueDate: deadline,
        notes: `OVERDUE: Inspection period expired ${deadline?.toDateString()} for buyer ${participant.name}`,
      };
    }

    const daysRemaining = deadline
      ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      stepName: `inspection:buyer:${participant.id}`,
      status: "in_progress",
      nextSteps: [
        "Schedule licensed home inspector within inspection period",
        "Review inspection report and request repairs or credits if needed",
        "Sign inspection contingency removal or submit repair request",
      ],
      dueDate: deadline,
      notes: daysRemaining !== null
        ? `Buyer ${participant.name} has ${daysRemaining} day(s) remaining in the inspection period`
        : `Buyer ${participant.name} inspection milestone in progress`,
    };
  }
}

export class DisclosureMilestone extends SellerMilestoneTemplate<SellerProfile> {
  execute(
    subject: SellerProfile,
    object: Readonly<MilestoneTimeline>,
  ): WorkflowStep {
    const { participant, disclosuresCompleted } = subject;
    const deadline = object.deadlines["disclosure"];

    if (!disclosuresCompleted) {
      const isOverdue = deadline && deadline < new Date();
      return {
        stepName: `disclosure:${participant.id}`,
        status: isOverdue ? "blocked" : "in_progress",
        nextSteps: [
          "Complete Transfer Disclosure Statement",
          "Complete Seller Property Questionnaire",
          "Obtain Natural Hazard Disclosure report",
          ...(subject.listingDetails.price > 0 ? [] : ["Set listing price before disclosure package is finalized"]),
        ],
        dueDate: deadline,
        notes: isOverdue
          ? `OVERDUE: Disclosures for ${participant.name} were due ${deadline?.toDateString()} — deliver immediately`
          : `Seller ${participant.name} has not yet completed all disclosure forms`,
      };
    }

    return {
      stepName: `disclosure:${participant.id}`,
      status: "completed",
      nextSteps: ["deliverDisclosuresToBuyer", "inspection"],
      dueDate: deadline,
      notes: `Seller ${participant.name} disclosure package complete — deliver to buyer for review and signature`,
    };
  }
}

export class InspectionSellerMilestone extends SellerMilestoneTemplate<SellerProfile> {
  execute(
    subject: SellerProfile,
    object: Readonly<MilestoneTimeline>,
  ): WorkflowStep {
    const { participant } = subject;
    const deadline = object.deadlines["inspection"];
    const isOverdue = deadline && deadline < new Date();

    return {
      stepName: `inspection:seller:${participant.id}`,
      status: isOverdue ? "blocked" : "in_progress",
      nextSteps: isOverdue
        ? [
            "Respond to buyer's repair request or credit demand immediately",
            "Negotiate resolution to keep transaction on track",
          ]
        : [
            "Ensure property is accessible for buyer's inspector",
            "Review buyer's repair request if submitted",
            "Respond to repair request: agree to repairs, offer credit, or decline",
          ],
      dueDate: deadline,
      notes: isOverdue
        ? `OVERDUE: Seller ${participant.name} must respond to inspection by ${deadline?.toDateString()}`
        : `Seller ${participant.name} awaiting buyer inspection results at ${subject.listingDetails.address}`,
    };
  }
}
