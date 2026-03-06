/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  ViewBase,
  BackendPayload,
  ViewStatePatch,
  DashboardView,
  BuyerWorkspaceView,
  SellerWorkspaceView,
  ListingDetailView,
  OfferNegotiationView,
  ShowingCalendarView,
  TransactionTrackerView,
  DisclosureWizardView,
  WorkflowStep,
  MatchResult,
  ActionResult,
  ComplianceCheck,
  NavigationEvent,
} from "../domain-types.js";
import { NavigateCommand } from "./navigate.js";

export class SyncBackendStateCommand extends Command<
  ViewBase,
  BackendPayload,
  ViewStatePatch,
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
  readonly commandName = "syncBackendState" as const;

  resolveDashboard(
    subject: DashboardView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], DashboardView> {
    return new DashboardStateSync();
  }

  resolveBuyerWorkspace(
    subject: BuyerWorkspaceView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], BuyerWorkspaceView> {
    return new BuyerStateSync();
  }

  resolveSellerWorkspace(
    subject: SellerWorkspaceView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], SellerWorkspaceView> {
    return new SellerStateSync();
  }

  resolveListingDetail(
    subject: ListingDetailView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], ListingDetailView> {
    return new ListingStateSync();
  }

  resolveOfferNegotiation(
    subject: OfferNegotiationView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], OfferNegotiationView> {
    return new OfferStateSync();
  }

  resolveShowingCalendar(
    subject: ShowingCalendarView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], ShowingCalendarView> {
    return new ShowingStateSync();
  }

  resolveTransactionTracker(
    subject: TransactionTrackerView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], TransactionTrackerView> {
    return new TransactionStateSync();
  }

  resolveDisclosureWizard(
    subject: DisclosureWizardView,
    object: Readonly<BackendPayload>,
  ): Template<SyncBackendStateCommand, [], DisclosureWizardView> {
    return new DisclosureStateSync();
  }
}

export abstract class WorkspaceStateSync<
  SU extends BuyerWorkspaceView | SellerWorkspaceView,
> implements Template<SyncBackendStateCommand, [], SU> {
  abstract execute(
    subject: SU,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch;
}

function patch(
  subject: { viewId: string },
  updates: Record<string, unknown>,
  pendingNavigation?: NavigationEvent,
): ViewStatePatch {
  return { viewId: subject.viewId, updates, timestamp: Date.now(), pendingNavigation };
}

function asWorkflowStep(result: BackendPayload["result"]): WorkflowStep | null {
  const r = result as Partial<WorkflowStep>;
  return r.stepName !== undefined ? (result as WorkflowStep) : null;
}

function asMatchResult(result: BackendPayload["result"]): MatchResult | null {
  const r = result as Partial<MatchResult>;
  return r.matches !== undefined ? (result as MatchResult) : null;
}

function asActionResult(result: BackendPayload["result"]): ActionResult | null {
  const r = result as Partial<ActionResult>;
  return r.success !== undefined && r.message !== undefined ? (result as ActionResult) : null;
}

function asComplianceCheck(result: BackendPayload["result"]): ComplianceCheck | null {
  const r = result as Partial<ComplianceCheck>;
  return r.disclosureItems !== undefined ? (result as ComplianceCheck) : null;
}

export class DashboardStateSync implements Template<
  SyncBackendStateCommand,
  [],
  DashboardView
> {
  execute(
    subject: DashboardView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    const step = asWorkflowStep(object.result);

    if (step) {
      // Merge or replace the workflow step for this command in the dashboard list
      const existingIndex = subject.activeWorkflowSteps.findIndex(
        (s) => s.stepName === step.stepName,
      );
      const updatedSteps =
        existingIndex >= 0
          ? subject.activeWorkflowSteps.map((s, i) => (i === existingIndex ? step : s))
          : [...subject.activeWorkflowSteps, step];

      const newAlerts =
        step.status === "blocked"
          ? [...new Set([...subject.alerts, `Action required: ${step.stepName}`])]
          : subject.alerts.filter((a) => !a.includes(step.stepName));

      return patch(subject, {
        activeWorkflowSteps: updatedSteps,
        alerts: newAlerts,
        loadingState: "idle",
      });
    }

    const actionResult = asActionResult(object.result);
    if (actionResult) {
      const alert = actionResult.success
        ? null
        : `Error from ${object.commandName}: ${actionResult.message}`;
      return patch(subject, {
        loadingState: "idle",
        alerts: alert ? [...subject.alerts, alert] : subject.alerts,
      });
    }

    return patch(subject, { loadingState: "idle" });
  }
}

export class ListingStateSync implements Template<
  SyncBackendStateCommand,
  [],
  ListingDetailView
> {
  execute(
    subject: ListingDetailView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    if (object.commandName === "matchProperty") {
      const matchResult = asMatchResult(object.result);
      if (matchResult) {
        const thisListing = matchResult.matches.find(
          (m) => m.listingId === subject.listingId,
        );
        if (thisListing) {
          return patch(subject, {
            matchScore: thisListing.score,
            loadingState: "idle",
          });
        }
        // Listing didn't appear in results — it failed criteria matching
        return patch(subject, { matchScore: 0, loadingState: "idle" });
      }
    }

    if (object.commandName === "scheduleShowing") {
      const actionResult = asActionResult(object.result);
      if (actionResult?.success && actionResult.data) {
        const confirmedDate = actionResult.data["confirmedDate"] as string | undefined;
        if (confirmedDate) {
          const updatedSlots = [...subject.availableSlots, new Date(confirmedDate)];
          return patch(subject, { availableSlots: updatedSlots, loadingState: "idle" });
        }
      }
    }

    return patch(subject, { loadingState: "idle" });
  }
}

export class OfferStateSync implements Template<
  SyncBackendStateCommand,
  [NavigateCommand],
  OfferNegotiationView
> {
  readonly navigate = new NavigateCommand();

  execute(
    subject: OfferNegotiationView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    const actionResult = asActionResult(object.result);
    if (!actionResult) {
      return patch(subject, { loadingState: "idle" });
    }

    const updates: Record<string, unknown> = {
      lastActionResult: actionResult,
      loadingState: "idle",
    };

    if (actionResult.data) {
      const data = actionResult.data;

      // Update offer status from backend response
      if (data["offerId"] && data["offerId"] === subject.offerId) {
        const newStatus = data["status"] as OfferNegotiationView["currentStatus"] | undefined;
        if (newStatus) {
          updates["currentStatus"] = newStatus;
        }
        const counterNum = data["counterOfferNumber"] as number | undefined;
        if (counterNum !== undefined) {
          updates["counterOfferCount"] = counterNum;
        }

        // Append to offer history
        const historyEntry =
          data["counterOfferPrice"] || data["acceptedPrice"] || data["rejectedPrice"]
            ? {
                party: data["party"] as string ?? "seller",
                amount:
                  (data["counterOfferPrice"] ?? data["acceptedPrice"] ?? data["rejectedPrice"]) as number,
                timestamp: new Date(),
                status: newStatus ?? subject.currentStatus,
              }
            : null;
        if (historyEntry) {
          updates["offerHistory"] = [...subject.offerHistory, historyEntry];
        }
      }
    }

    // If offer was accepted, hook navigate to redirect to TransactionTrackerView
    let pendingNavigation: NavigationEvent | undefined;
    const isAccepted =
      (updates["currentStatus"] as string) === "accepted" ||
      (actionResult.data?.["acceptedPrice"] !== undefined);

    if (isAccepted) {
      const transactionId = actionResult.data?.["transactionId"] as string | undefined ?? subject.offerId;
      const navTemplate = this.navigate.resolveOfferNegotiation(subject, {
        trigger: "redirect",
        targetHint: "transactionTracker",
        params: { transactionId },
        historyMode: "replace",
      });
      const routeTarget = navTemplate.execute(subject, {
        trigger: "redirect",
        targetHint: "transactionTracker",
        params: { transactionId },
        historyMode: "replace",
      });
      pendingNavigation = {
        trigger: "redirect",
        targetHint: routeTarget.path,
        params: routeTarget.params,
        historyMode: "replace",
      };
    }

    return patch(subject, updates, pendingNavigation);
  }
}

export class ShowingStateSync implements Template<
  SyncBackendStateCommand,
  [],
  ShowingCalendarView
> {
  execute(
    subject: ShowingCalendarView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    const actionResult = asActionResult(object.result);
    if (!actionResult?.success || !actionResult.data) {
      return patch(subject, {
        loadingState: "idle",
        lastError: actionResult?.message ?? null,
      });
    }

    const data = actionResult.data;
    const showingId = data["showingId"] as string | undefined;

    if (!showingId) {
      return patch(subject, { loadingState: "idle" });
    }

    const existingIndex = subject.showings.findIndex((s) => s.showingId === showingId);
    const updates: Record<string, unknown> = { loadingState: "idle" };

    if (data["confirmedDate"]) {
      // Confirmation — update or insert the showing entry
      const confirmedEntry = {
        showingId,
        listingId: data["listingId"] as string ?? "",
        address: data["address"] as string ?? "",
        date: new Date(data["confirmedDate"] as string),
        durationMinutes: data["durationMinutes"] as number ?? 30,
        status: "confirmed" as const,
      };
      updates["showings"] =
        existingIndex >= 0
          ? subject.showings.map((s, i) => (i === existingIndex ? confirmedEntry : s))
          : [...subject.showings, confirmedEntry];
    } else if (data["action"] === "cancel") {
      updates["showings"] = subject.showings.map((s) =>
        s.showingId === showingId ? { ...s, status: "cancelled" as const } : s,
      );
    } else if (data["action"] === "feedback") {
      // Mark as completed and remove from pending feedback list
      updates["showings"] = subject.showings.map((s) =>
        s.showingId === showingId ? { ...s, status: "completed" as const } : s,
      );
      updates["pendingFeedbackIds"] = subject.pendingFeedbackIds.filter(
        (id) => id !== showingId,
      );
    } else {
      // New request — insert
      const requestEntry = {
        showingId,
        listingId: data["listingId"] as string ?? "",
        address: "",
        date: new Date(data["requestedDate"] as string),
        durationMinutes: data["durationMinutes"] as number ?? 30,
        status: "requested" as const,
      };
      updates["showings"] =
        existingIndex >= 0
          ? subject.showings
          : [...subject.showings, requestEntry];
    }

    return patch(subject, updates);
  }
}

export class TransactionStateSync implements Template<
  SyncBackendStateCommand,
  [],
  TransactionTrackerView
> {
  execute(
    subject: TransactionTrackerView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    const step = asWorkflowStep(object.result);
    if (!step) {
      return patch(subject, { loadingState: "idle" });
    }

    const updates: Record<string, unknown> = { loadingState: "idle" };

    // Advance current milestone if step is completed
    if (step.status === "completed") {
      updates["currentMilestone"] = step.stepName.split(":")[2] ?? subject.currentMilestone;
      // Remove from overdue if it was there
      updates["overdueItems"] = subject.overdueItems.filter(
        (item) => !item.includes(step.stepName),
      );
    }

    if (step.status === "blocked") {
      // Surface new overdue/blocked items
      const newOverdue = step.nextSteps.filter(
        (s) => !subject.overdueItems.includes(s),
      );
      updates["overdueItems"] = [...subject.overdueItems, ...newOverdue];
    }

    // Update or insert the milestone in the rail
    const existingIndex = subject.milestones.findIndex(
      (m) => m.stepName === step.stepName,
    );
    updates["milestones"] =
      existingIndex >= 0
        ? subject.milestones.map((m, i) => (i === existingIndex ? step : m))
        : [...subject.milestones, step];

    if (step.dueDate) {
      updates["closingDate"] = step.dueDate;
    }

    return patch(subject, updates);
  }
}

export class DisclosureStateSync implements Template<
  SyncBackendStateCommand,
  [],
  DisclosureWizardView
> {
  execute(
    subject: DisclosureWizardView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    const complianceCheck = asComplianceCheck(object.result);
    if (!complianceCheck) {
      return patch(subject, { loadingState: "idle" });
    }

    // Update completion map: mark steps with no blockers as complete
    const updatedCompletion: Record<string, boolean> = { ...subject.completionMap };
    const currentStepTitle = subject.stepTitles[subject.currentStep];
    if (currentStepTitle) {
      updatedCompletion[currentStepTitle] =
        complianceCheck.passed || complianceCheck.disclosureItems.every(
          (item) => item.severity !== "high",
        );
    }

    // Advance to next step if current step is now complete
    const currentComplete = updatedCompletion[currentStepTitle ?? ""];
    const maxStep = (subject.totalSteps || subject.stepTitles.length) - 1;
    const nextStep =
      currentComplete && subject.currentStep < maxStep
        ? subject.currentStep + 1
        : subject.currentStep;

    return patch(subject, {
      lastComplianceCheck: complianceCheck,
      completionMap: updatedCompletion,
      currentStep: nextStep,
      loadingState: "idle",
      currentFormValues: {
        ...subject.currentFormValues,
        dirty: false,
      },
    });
  }
}

export class BuyerStateSync extends WorkspaceStateSync<BuyerWorkspaceView> {
  execute(
    subject: BuyerWorkspaceView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    if (object.commandName === "matchProperty") {
      const matchResult = asMatchResult(object.result);
      if (matchResult) {
        return patch(subject, {
          matchResults: [matchResult, ...subject.matchResults.slice(0, 9)], // keep last 10
          loadingState: "idle",
          currentFormValues: { ...subject.currentFormValues, dirty: false },
        });
      }
    }

    if (object.commandName === "qualifyParticipant") {
      const step = asWorkflowStep(object.result);
      if (step) {
        const isQualified = step.status === "completed";
        const isDisqualified = step.status === "blocked";
        return patch(subject, {
          workflowStep: step,
          qualificationStatus: isQualified
            ? "qualified"
            : isDisqualified
            ? "disqualified"
            : "pending",
          loadingState: "idle",
        });
      }
    }

    if (object.commandName === "scheduleShowing") {
      const actionResult = asActionResult(object.result);
      return patch(subject, {
        loadingState: "idle",
        lastShowingResult: actionResult,
      });
    }

    if (object.commandName === "processOffer") {
      const actionResult = asActionResult(object.result);
      return patch(subject, {
        loadingState: "idle",
        lastOfferResult: actionResult,
      });
    }

    return patch(subject, { loadingState: "idle" });
  }
}

export class SellerStateSync extends WorkspaceStateSync<SellerWorkspaceView> {
  execute(
    subject: SellerWorkspaceView,
    object: Readonly<BackendPayload>,
  ): ViewStatePatch {
    if (object.commandName === "qualifyParticipant") {
      const step = asWorkflowStep(object.result);
      if (step) {
        const isQualified = step.status === "completed";
        const isDisqualified = step.status === "blocked";
        return patch(subject, {
          workflowStep: step,
          qualificationStatus: isQualified
            ? "qualified"
            : isDisqualified
            ? "disqualified"
            : "pending",
          loadingState: "idle",
        });
      }
    }

    if (object.commandName === "generateDisclosure") {
      const complianceCheck = asComplianceCheck(object.result);
      if (complianceCheck) {
        const disclosureStatus =
          complianceCheck.passed &&
          complianceCheck.generatedDocuments.length > 0
            ? "complete"
            : "in_progress";
        return patch(subject, {
          disclosureStatus,
          loadingState: "idle",
          currentFormValues: { ...subject.currentFormValues, dirty: false },
        });
      }
    }

    if (object.commandName === "processOffer") {
      const actionResult = asActionResult(object.result);
      if (actionResult?.success && actionResult.data?.["offerPrice"]) {
        // A new offer arrived — bump the received offer count
        return patch(subject, {
          receivedOfferCount: subject.receivedOfferCount + 1,
          loadingState: "idle",
        });
      }
    }

    if (object.commandName === "advanceTransaction") {
      const step = asWorkflowStep(object.result);
      if (step) {
        return patch(subject, {
          workflowStep: step,
          loadingState: "idle",
        });
      }
    }

    return patch(subject, { loadingState: "idle" });
  }
}
