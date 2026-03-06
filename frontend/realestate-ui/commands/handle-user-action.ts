/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  ViewBase,
  UserAction,
  DispatchIntent,
  DashboardView,
  BuyerWorkspaceView,
  SellerWorkspaceView,
  ListingDetailView,
  OfferNegotiationView,
  ShowingCalendarView,
  TransactionTrackerView,
  DisclosureWizardView,
  NavigationEvent,
} from "../domain-types.js";
import { ValidateFormCommand } from "./validate-form.js";

export class HandleUserActionCommand extends Command<
  ViewBase,
  UserAction,
  DispatchIntent,
  [
    DashboardView,
    BuyerWorkspaceView,
    SellerWorkspaceView,
    ListingDetailView,
    OfferNegotiationView,
    ShowingCalendarView,
    TransactionTrackerView,
    DisclosureWizardView,
  ]
> {
  readonly commandName = "handleUserAction" as const;

  resolveDashboard(
    subject: DashboardView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], DashboardView> {
    return new DashboardActionHandler();
  }

  resolveBuyerWorkspace(
    subject: BuyerWorkspaceView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], BuyerWorkspaceView> {
    return new BuyerActionHandler();
  }

  resolveSellerWorkspace(
    subject: SellerWorkspaceView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], SellerWorkspaceView> {
    return new SellerActionHandler();
  }

  resolveListingDetail(
    subject: ListingDetailView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], ListingDetailView> {
    return new ListingActionHandler();
  }

  resolveOfferNegotiation(
    subject: OfferNegotiationView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], OfferNegotiationView> {
    return new OfferActionHandler();
  }

  resolveShowingCalendar(
    subject: ShowingCalendarView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], ShowingCalendarView> {
    return new ShowingActionHandler();
  }

  resolveTransactionTracker(
    subject: TransactionTrackerView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], TransactionTrackerView> {
    return new TransactionActionHandler();
  }

  resolveDisclosureWizard(
    subject: DisclosureWizardView,
    object: Readonly<UserAction>,
  ): Template<HandleUserActionCommand, [], DisclosureWizardView> {
    return new DisclosureActionHandler();
  }
}

export abstract class WorkspaceActionHandler<
  SU extends BuyerWorkspaceView | SellerWorkspaceView,
> implements Template<HandleUserActionCommand, [], SU> {
  abstract execute(subject: SU, object: Readonly<UserAction>): DispatchIntent;
}

function noOpIntent(reason: string): DispatchIntent {
  return {
    isNoOp: true,
    backendCommandName: "none",
    args: {},
    validationErrors: { isValid: false, fieldErrors: {}, globalBlockers: [reason] },
  };
}

function navEvent(
  targetHint: string,
  params: Record<string, string> = {},
  historyMode: NavigationEvent["historyMode"] = "push",
): NavigationEvent {
  return { trigger: "link", targetHint, params, historyMode };
}

export class DashboardActionHandler implements Template<
  HandleUserActionCommand,
  [],
  DashboardView
> {
  execute(
    subject: DashboardView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    switch (actionId) {
      case "open-buyer-workspace":
        return {
          isNoOp: true,
          backendCommandName: "navigate",
          args: {},
          onSuccessNavigation: navEvent("buyerWorkspace", {
            buyerId: payload["buyerId"] as string ?? "",
          }),
        };
      case "open-seller-workspace":
        return {
          isNoOp: true,
          backendCommandName: "navigate",
          args: {},
          onSuccessNavigation: navEvent("sellerWorkspace", {
            sellerId: payload["sellerId"] as string ?? "",
          }),
        };
      case "open-transaction":
        return {
          isNoOp: true,
          backendCommandName: "navigate",
          args: {},
          onSuccessNavigation: navEvent("transactionTracker", {
            transactionId: payload["transactionId"] as string ?? "",
          }),
        };
      case "dismiss-alert":
        // Local state mutation — no backend call needed
        return { isNoOp: true, backendCommandName: "none", args: { alertIndex: payload["alertIndex"] } };
      default:
        return noOpIntent(`Unknown dashboard action: ${actionId}`);
    }
  }
}

export class ListingActionHandler implements Template<
  HandleUserActionCommand,
  [],
  ListingDetailView
> {
  execute(
    subject: ListingDetailView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    if (subject.status !== "active" && actionId !== "back") {
      return noOpIntent(`Listing ${subject.listingId} is ${subject.status} — actions are disabled`);
    }

    switch (actionId) {
      case "request-showing":
        return {
          isNoOp: false,
          backendCommandName: "scheduleShowing",
          args: {
            listingId: subject.listingId,
            requestedDate: payload["requestedDate"],
            durationMinutes: payload["durationMinutes"] ?? 30,
            notes: payload["notes"] ?? null,
          },
          onSuccessNavigation: navEvent("showingCalendar", { listingId: subject.listingId }),
        };
      case "save-listing":
        // Local state — no backend call
        return {
          isNoOp: true,
          backendCommandName: "none",
          args: { listingId: subject.listingId, saved: true },
        };
      case "make-offer":
        return {
          isNoOp: false,
          backendCommandName: "processOffer",
          args: {
            listingId: subject.listingId,
            buyerId: payload["buyerId"],
          },
          onSuccessNavigation: navEvent("offerNegotiation", { listingId: subject.listingId }),
        };
      case "back":
        return {
          isNoOp: true,
          backendCommandName: "navigate",
          args: {},
          onSuccessNavigation: navEvent("buyerWorkspace", {}, "replace"),
        };
      default:
        return noOpIntent(`Unknown listing action: ${actionId}`);
    }
  }
}

export class OfferActionHandler implements Template<
  HandleUserActionCommand,
  [ValidateFormCommand],
  OfferNegotiationView
> {
  readonly validateForm = new ValidateFormCommand();

  execute(
    subject: OfferNegotiationView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    // Accept and reject do not require form validation
    if (actionId === "accept-offer") {
      if (subject.currentStatus === "accepted") {
        return noOpIntent("Offer is already accepted");
      }
      return {
        isNoOp: false,
        backendCommandName: "processOffer",
        args: { offerId: subject.offerId, action: "accept" },
        onSuccessNavigation: navEvent("transactionTracker", {}, "replace"),
      };
    }

    if (actionId === "reject-offer") {
      if (subject.currentStatus === "rejected" || subject.currentStatus === "accepted") {
        return noOpIntent(`Offer is already ${subject.currentStatus}`);
      }
      return {
        isNoOp: false,
        backendCommandName: "processOffer",
        args: { offerId: subject.offerId, action: "reject" },
        onSuccessNavigation: navEvent("sellerWorkspace", { sellerId: subject.sellerId }, "replace"),
      };
    }

    // Mutation intents (submit, counter) require validation pre-flight
    const validator = this.validateForm.resolveOfferNegotiation(
      subject,
      subject.currentFormValues,
    );
    const report = validator.execute(subject, subject.currentFormValues);

    if (!report.isValid) {
      return {
        isNoOp: true,
        backendCommandName: "none",
        args: {},
        validationErrors: report,
      };
    }

    switch (actionId) {
      case "submit-offer":
        return {
          isNoOp: false,
          backendCommandName: "processOffer",
          args: {
            offerId: subject.offerId,
            action: "submit",
            terms: subject.currentFormValues.fields,
          },
        };
      case "counter-offer":
        if (subject.counterOfferCount >= 5) {
          return noOpIntent("Counter-offer limit of 5 rounds has been reached");
        }
        return {
          isNoOp: false,
          backendCommandName: "processOffer",
          args: {
            offerId: subject.offerId,
            action: "counter",
            terms: subject.currentFormValues.fields,
          },
        };
      default:
        return noOpIntent(`Unknown offer action: ${actionId}`);
    }
  }
}

export class ShowingActionHandler implements Template<
  HandleUserActionCommand,
  [],
  ShowingCalendarView
> {
  execute(
    subject: ShowingCalendarView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    switch (actionId) {
      case "request-slot":
        return {
          isNoOp: false,
          backendCommandName: "scheduleShowing",
          args: {
            action: "request",
            listingId: payload["listingId"],
            requestedDate: payload["requestedDate"],
            durationMinutes: payload["durationMinutes"] ?? 30,
            notes: payload["notes"] ?? null,
          },
        };
      case "confirm-showing":
        return {
          isNoOp: false,
          backendCommandName: "scheduleShowing",
          args: {
            action: "confirm",
            showingId: payload["showingId"],
            confirmedDate: payload["confirmedDate"],
          },
        };
      case "cancel-showing":
        return {
          isNoOp: false,
          backendCommandName: "scheduleShowing",
          args: {
            action: "cancel",
            showingId: payload["showingId"],
          },
        };
      case "reschedule-showing":
        return {
          isNoOp: false,
          backendCommandName: "scheduleShowing",
          args: {
            action: "reschedule",
            showingId: payload["showingId"],
            newDate: payload["newDate"],
          },
        };
      case "submit-feedback":
        return {
          isNoOp: false,
          backendCommandName: "scheduleShowing",
          args: {
            action: "feedback",
            showingId: payload["showingId"],
            rating: payload["rating"],
            interested: payload["interested"],
            comments: payload["comments"] ?? "",
            concerns: payload["concerns"] ?? [],
          },
          onSuccessNavigation: navEvent("buyerWorkspace", {}),
        };
      default:
        return noOpIntent(`Unknown showing action: ${actionId}`);
    }
  }
}

export class TransactionActionHandler implements Template<
  HandleUserActionCommand,
  [],
  TransactionTrackerView
> {
  execute(
    subject: TransactionTrackerView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    switch (actionId) {
      case "complete-milestone":
        return {
          isNoOp: false,
          backendCommandName: "advanceTransaction",
          args: {
            transactionId: subject.transactionId,
            milestone: payload["milestone"] ?? subject.currentMilestone,
            deadlines: payload["deadlines"] ?? {},
          },
        };
      case "view-drift-detail":
        // Local UI expansion — no backend call
        return {
          isNoOp: true,
          backendCommandName: "none",
          args: { milestoneId: payload["milestoneId"], expand: true },
        };
      case "view-accepted-offer":
        return {
          isNoOp: true,
          backendCommandName: "navigate",
          args: {},
          onSuccessNavigation: navEvent("offerNegotiation", {
            offerId: payload["offerId"] as string ?? "",
          }),
        };
      case "open-disclosure":
        return {
          isNoOp: true,
          backendCommandName: "navigate",
          args: {},
          onSuccessNavigation: navEvent("disclosureWizard", {
            propertyId: subject.listingId,
          }),
        };
      case "escalate-risk":
        // External action (e.g. send email/notification) — emit as a no-op
        // with metadata for the caller to handle
        return {
          isNoOp: true,
          backendCommandName: "none",
          args: {
            escalate: true,
            transactionId: subject.transactionId,
            milestone: subject.currentMilestone,
            overdueItems: subject.overdueItems,
          },
        };
      default:
        return noOpIntent(`Unknown transaction action: ${actionId}`);
    }
  }
}

export class DisclosureActionHandler implements Template<
  HandleUserActionCommand,
  [],
  DisclosureWizardView
> {
  execute(
    subject: DisclosureWizardView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    switch (actionId) {
      case "answer-question":
        // Each question answer triggers a generateDisclosure call to update compliance state
        return {
          isNoOp: false,
          backendCommandName: "generateDisclosure",
          args: {
            propertyId: subject.propertyId,
            sellerId: subject.sellerId,
            currentStep: subject.currentStep,
            answers: payload["answers"] ?? {},
          },
        };
      case "next-step": {
        const nextStep = subject.currentStep + 1;
        const maxStep = (subject.totalSteps || subject.stepTitles.length) - 1;
        if (nextStep > maxStep) {
          return noOpIntent("Already on the last step");
        }
        // Local state navigation — no backend call
        return {
          isNoOp: true,
          backendCommandName: "none",
          args: { nextStep },
        };
      }
      case "prev-step": {
        const prevStep = subject.currentStep - 1;
        if (prevStep < 0) {
          return noOpIntent("Already on the first step");
        }
        return {
          isNoOp: true,
          backendCommandName: "none",
          args: { nextStep: prevStep },
        };
      }
      case "submit-packet":
        return {
          isNoOp: false,
          backendCommandName: "generateDisclosure",
          args: {
            propertyId: subject.propertyId,
            sellerId: subject.sellerId,
            action: "submit",
            completionMap: subject.completionMap,
          },
          onSuccessNavigation: navEvent("transactionTracker", {}, "replace"),
        };
      case "save-and-exit":
        return {
          isNoOp: true,
          backendCommandName: "none",
          args: { savedStep: subject.currentStep },
          onSuccessNavigation: navEvent("sellerWorkspace", { sellerId: subject.sellerId }, "replace"),
        };
      default:
        return noOpIntent(`Unknown disclosure action: ${actionId}`);
    }
  }
}

export class BuyerActionHandler extends WorkspaceActionHandler<BuyerWorkspaceView> {
  execute(
    subject: BuyerWorkspaceView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    // Unsaved changes guard: warn before navigating away if form is dirty
    if (
      actionId?.startsWith("navigate-") &&
      subject.currentFormValues.dirty
    ) {
      // Surface as a no-op with a global blocker — the UI layer surfaces a confirm dialog
      return noOpIntent("You have unsaved criteria changes — save or discard before leaving");
    }

    switch (actionId) {
      case "update-criteria":
        return {
          isNoOp: false,
          backendCommandName: "matchProperty",
          args: {
            buyerId: subject.buyerId,
            criteria: payload["criteria"] ?? subject.currentFormValues.fields,
          },
        };
      case "qualify-buyer":
        return {
          isNoOp: false,
          backendCommandName: "qualifyParticipant",
          args: { buyerId: subject.buyerId },
        };
      case "request-showing":
        if (subject.qualificationStatus !== "qualified") {
          return noOpIntent("Buyer must be qualified before requesting showings");
        }
        return {
          isNoOp: false,
          backendCommandName: "scheduleShowing",
          args: {
            buyerId: subject.buyerId,
            listingId: payload["listingId"],
            requestedDate: payload["requestedDate"],
            durationMinutes: payload["durationMinutes"] ?? 30,
          },
          onSuccessNavigation: navEvent("showingCalendar", {}),
        };
      case "submit-offer":
        if (subject.qualificationStatus !== "qualified") {
          return noOpIntent("Buyer must be qualified before submitting offers");
        }
        return {
          isNoOp: false,
          backendCommandName: "processOffer",
          args: {
            buyerId: subject.buyerId,
            listingId: payload["listingId"],
            terms: payload["terms"],
          },
          onSuccessNavigation: navEvent("offerNegotiation", {
            listingId: payload["listingId"] as string ?? "",
          }),
        };
      case "view-listing":
        return {
          isNoOp: true,
          backendCommandName: "navigate",
          args: {},
          onSuccessNavigation: navEvent("listingDetail", {
            listingId: payload["listingId"] as string ?? "",
          }),
        };
      default:
        return noOpIntent(`Unknown buyer action: ${actionId}`);
    }
  }
}

export class SellerActionHandler extends WorkspaceActionHandler<SellerWorkspaceView> {
  execute(
    subject: SellerWorkspaceView,
    object: Readonly<UserAction>,
  ): DispatchIntent {
    const { payload } = object;
    const actionId = payload["actionId"] as string | undefined;

    // Unsaved changes guard
    if (
      actionId?.startsWith("navigate-") &&
      subject.currentFormValues.dirty
    ) {
      return noOpIntent("You have unsaved listing changes — save or discard before leaving");
    }

    switch (actionId) {
      case "qualify-seller":
        return {
          isNoOp: false,
          backendCommandName: "qualifyParticipant",
          args: { sellerId: subject.sellerId },
        };
      case "review-offer":
        return {
          isNoOp: false,
          backendCommandName: "processOffer",
          args: {
            sellerId: subject.sellerId,
            offerId: payload["offerId"],
          },
          onSuccessNavigation: navEvent("offerNegotiation", {
            offerId: payload["offerId"] as string ?? "",
          }),
        };
      case "advance-milestone":
        return {
          isNoOp: false,
          backendCommandName: "advanceTransaction",
          args: {
            sellerId: subject.sellerId,
            transactionId: payload["transactionId"],
            milestone: payload["milestone"],
          },
        };
      case "start-disclosure":
        return {
          isNoOp: false,
          backendCommandName: "generateDisclosure",
          args: {
            sellerId: subject.sellerId,
            listingId: subject.listingId,
          },
          onSuccessNavigation: navEvent("disclosureWizard", {
            propertyId: subject.listingId,
          }),
        };
      case "update-listing":
        return {
          isNoOp: false,
          backendCommandName: "qualifyParticipant",
          args: {
            sellerId: subject.sellerId,
            listing: payload["listing"] ?? subject.currentFormValues.fields,
          },
        };
      default:
        return noOpIntent(`Unknown seller action: ${actionId}`);
    }
  }
}
