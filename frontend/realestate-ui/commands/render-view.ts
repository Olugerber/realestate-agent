/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  ViewBase,
  LayoutContext,
  RenderSpec,
  DashboardView,
  BuyerWorkspaceView,
  SellerWorkspaceView,
  ListingDetailView,
  OfferNegotiationView,
  ShowingCalendarView,
  TransactionTrackerView,
  DisclosureWizardView,
  WorkflowStep,
} from "../domain-types.js";
import { ValidateFormCommand } from "./validate-form.js";

export class RenderViewCommand extends Command<
  ViewBase,
  LayoutContext,
  RenderSpec,
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
  readonly commandName = "renderView" as const;

  resolveDashboard(
    subject: DashboardView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], DashboardView> {
      return new DashboardRenderer();
  }

  resolveBuyerWorkspace(
    subject: BuyerWorkspaceView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], BuyerWorkspaceView> {
    return new BuyerWorkspaceRenderer();
  }

  resolveSellerWorkspace(
    subject: SellerWorkspaceView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], SellerWorkspaceView> {
    return new SellerWorkspaceRenderer();
  }

  resolveListingDetail(
    subject: ListingDetailView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], ListingDetailView> {
    return new ListingDetailRenderer();
  }

  resolveOfferNegotiation(
    subject: OfferNegotiationView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], OfferNegotiationView> {
    return new OfferRenderer();
  }

  resolveShowingCalendar(
    subject: ShowingCalendarView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], ShowingCalendarView> {
    return new ShowingRenderer();
  }

  resolveTransactionTracker(
    subject: TransactionTrackerView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], TransactionTrackerView> {
    return new TransactionRenderer();
  }

  resolveDisclosureWizard(
    subject: DisclosureWizardView,
    object: Readonly<LayoutContext>,
  ): Template<RenderViewCommand, [], DisclosureWizardView> {
    return new DisclosureRenderer();
  }
}

export abstract class WorkspaceRenderer<
  SU extends BuyerWorkspaceView | SellerWorkspaceView,
> implements Template<RenderViewCommand, [], SU> {
  abstract execute(subject: SU, object: Readonly<LayoutContext>): RenderSpec;
}

function baseSpec(
  componentName: string,
  subject: { loadingState: string },
  extraProps: Record<string, unknown> = {},
  children: RenderSpec[] = [],
): RenderSpec {
  return {
    componentName,
    props: { loadingState: subject.loadingState, ...extraProps },
    children,
    loadingState: subject.loadingState as RenderSpec["loadingState"],
  };
}

function noOp(): RenderSpec {
  return { componentName: "null", props: {}, children: [], loadingState: "idle" };
}

export class DashboardRenderer implements Template<
  RenderViewCommand,
  [],
  DashboardView
> {
  execute(subject: DashboardView, object: Readonly<LayoutContext>): RenderSpec {
    const urgentSteps = subject.activeWorkflowSteps.filter(
      (s) => s.status === "blocked",
    );
    const pendingSteps = subject.activeWorkflowSteps.filter(
      (s) => s.status === "in_progress" || s.status === "pending",
    );

    const stepBanners: RenderSpec[] = urgentSteps.map((step) => ({
      componentName: "WorkflowStepBanner",
      props: {
        stepName: step.stepName,
        status: step.status,
        nextSteps: step.nextSteps,
        dueDate: step.dueDate?.toISOString() ?? null,
        notes: step.notes ?? null,
        variant: "urgent",
      },
      children: [],
      loadingState: "idle",
    }));

    const pendingBanners: RenderSpec[] = pendingSteps.map((step) => ({
      componentName: "WorkflowStepBanner",
      props: {
        stepName: step.stepName,
        status: step.status,
        nextSteps: step.nextSteps,
        dueDate: step.dueDate?.toISOString() ?? null,
        notes: step.notes ?? null,
        variant: "info",
      },
      children: [],
      loadingState: "idle",
    }));

    const statsPanel: RenderSpec = {
      componentName: "PortfolioStats",
      props: {
        activeBuyers: subject.portfolioStats.activeBuyers,
        activeSellers: subject.portfolioStats.activeSellers,
        pendingShowings: subject.portfolioStats.pendingShowings,
        openTransactions: subject.portfolioStats.openTransactions,
      },
      children: [],
      loadingState: "idle",
    };

    const alertList: RenderSpec[] = subject.alerts.map((alert) => ({
      componentName: "AlertBadge",
      props: { message: alert },
      children: [],
      loadingState: "idle",
    }));

    return baseSpec(
      "DashboardLayout",
      subject,
      {
        agentName: object.agentName,
        brokerage: object.brokerage,
        viewport: object.viewport,
        theme: object.theme,
        urgentCount: urgentSteps.length,
      },
      [statsPanel, ...alertList, ...stepBanners, ...pendingBanners],
    );
  }
}

export class ListingDetailRenderer implements Template<
  RenderViewCommand,
  [],
  ListingDetailView
> {
  execute(
    subject: ListingDetailView,
    object: Readonly<LayoutContext>,
  ): RenderSpec {
    const totalCriteria = subject.matchedCriteria.length + subject.missedCriteria.length;
    const matchSummary =
      totalCriteria > 0
        ? `${subject.matchedCriteria.length} of ${totalCriteria} criteria met`
        : null;

    const gapAnalysis: RenderSpec = {
      componentName: "MatchGapAnalysis",
      props: {
        matchScore: subject.matchScore ?? null,
        matchedCriteria: subject.matchedCriteria,
        missedCriteria: subject.missedCriteria,
        summary: matchSummary,
      },
      children: [],
      loadingState: "idle",
    };

    const slotPicker: RenderSpec = {
      componentName: "ShowingSlotPicker",
      props: {
        listingId: subject.listingId,
        availableSlots: subject.availableSlots.map((d) => d.toISOString()),
        listingStatus: subject.status,
        disabled: subject.status !== "active",
      },
      children: [],
      loadingState: "idle",
    };

    const detailPanel: RenderSpec = {
      componentName: "ListingDetailPanel",
      props: {
        listingId: subject.listingId,
        address: `${subject.address}, ${subject.city}`,
        price: subject.price,
        bedrooms: subject.bedrooms,
        bathrooms: subject.bathrooms,
        sqft: subject.sqft,
        features: subject.features,
        daysOnMarket: subject.daysOnMarket,
        status: subject.status,
      },
      children: [],
      loadingState: "idle",
    };

    return baseSpec(
      "ListingDetailLayout",
      subject,
      { viewport: object.viewport, theme: object.theme },
      [detailPanel, gapAnalysis, slotPicker],
    );
  }
}

export class OfferRenderer implements Template<
  RenderViewCommand,
  [],
  OfferNegotiationView
> {
  execute(
    subject: OfferNegotiationView,
    object: Readonly<LayoutContext>,
  ): RenderSpec {
    const historyRows: RenderSpec[] = subject.offerHistory.map((entry, idx) => ({
      componentName: "OfferHistoryRow",
      props: {
        index: idx + 1,
        party: entry.party,
        amount: entry.amount,
        timestamp: entry.timestamp.toISOString(),
        status: entry.status,
      },
      children: [],
      loadingState: "idle",
    }));

    const isMutable =
      subject.currentStatus !== "accepted" &&
      subject.currentStatus !== "rejected" &&
      subject.currentStatus !== "withdrawn";

    const actionBar: RenderSpec = {
      componentName: "OfferActionBar",
      props: {
        offerId: subject.offerId,
        currentStatus: subject.currentStatus,
        counterOfferCount: subject.counterOfferCount,
        showCounter: isMutable && subject.currentStatus !== "draft",
        showAccept: isMutable,
        showReject: isMutable,
        counterLimitReached: subject.counterOfferCount >= 5,
      },
      children: [],
      loadingState: "idle",
    };

    const lastResultBanner: RenderSpec | null =
      subject.lastActionResult
        ? {
            componentName: "ActionResultBanner",
            props: {
              success: subject.lastActionResult.success,
              message: subject.lastActionResult.message,
              errors: subject.lastActionResult.errors ?? [],
            },
            children: [],
            loadingState: "idle",
          }
        : null;

    return baseSpec(
      "OfferNegotiationLayout",
      subject,
      {
        offerId: subject.offerId,
        listingId: subject.listingId,
        currentStatus: subject.currentStatus,
        viewport: object.viewport,
        theme: object.theme,
      },
      [
        ...(lastResultBanner ? [lastResultBanner] : []),
        ...historyRows,
        actionBar,
      ],
    );
  }
}

export class ShowingRenderer implements Template<
  RenderViewCommand,
  [],
  ShowingCalendarView
> {
  execute(
    subject: ShowingCalendarView,
    object: Readonly<LayoutContext>,
  ): RenderSpec {
    const showingCards: RenderSpec[] = subject.showings.map((s) => ({
      componentName: "ShowingCard",
      props: {
        showingId: s.showingId,
        listingId: s.listingId,
        address: s.address,
        date: s.date.toISOString(),
        durationMinutes: s.durationMinutes,
        status: s.status,
        needsFeedback: subject.pendingFeedbackIds.includes(s.showingId),
      },
      children: [],
      loadingState: "idle",
    }));

    const feedbackForms: RenderSpec[] = subject.pendingFeedbackIds.map((id) => ({
      componentName: "ShowingFeedbackForm",
      props: { showingId: id },
      children: [],
      loadingState: "idle",
    }));

    const confirmed = subject.showings.filter((s) => s.status === "confirmed").length;
    const pending = subject.showings.filter((s) => s.status === "requested").length;

    return baseSpec(
      "ShowingCalendarLayout",
      subject,
      {
        totalShowings: subject.showings.length,
        confirmedCount: confirmed,
        pendingCount: pending,
        pendingFeedbackCount: subject.pendingFeedbackIds.length,
        viewport: object.viewport,
        theme: object.theme,
      },
      [...showingCards, ...feedbackForms],
    );
  }
}

export class TransactionRenderer implements Template<
  RenderViewCommand,
  [],
  TransactionTrackerView
> {
  execute(
    subject: TransactionTrackerView,
    object: Readonly<LayoutContext>,
  ): RenderSpec {
    const milestoneOrder = [
      "offer_accepted",
      "disclosure",
      "inspection",
      "financing",
      "appraisal",
      "closing",
    ];

    const milestoneRail: RenderSpec[] = milestoneOrder.map((name) => {
      const step = subject.milestones.find((m) => m.stepName.includes(name));
      const isOverdue = subject.overdueItems.some((item) => item.includes(name));
      return {
        componentName: "MilestoneRailItem",
        props: {
          milestoneName: name,
          isCurrent: subject.currentMilestone === name,
          isComplete: step?.status === "completed",
          isBlocked: step?.status === "blocked" || isOverdue,
          dueDate: step?.dueDate?.toISOString() ?? null,
          notes: step?.notes ?? null,
          nextSteps: step?.nextSteps ?? [],
        },
        children: [],
        loadingState: "idle",
      };
    });

    const overdueAlerts: RenderSpec[] = subject.overdueItems.map((item) => ({
      componentName: "DateDriftAlert",
      props: { description: item, severity: "high" },
      children: [],
      loadingState: "idle",
    }));

    return baseSpec(
      "TransactionTrackerLayout",
      subject,
      {
        transactionId: subject.transactionId,
        acceptedPrice: subject.acceptedPrice,
        currentMilestone: subject.currentMilestone,
        closingDate: subject.closingDate?.toISOString() ?? null,
        overdueCount: subject.overdueItems.length,
        viewport: object.viewport,
        theme: object.theme,
      },
      [...overdueAlerts, ...milestoneRail],
    );
  }
}

export class DisclosureRenderer implements Template<
  RenderViewCommand,
  [ValidateFormCommand],
  DisclosureWizardView
> {
  readonly validateForm = new ValidateFormCommand();

  execute(
    subject: DisclosureWizardView,
    object: Readonly<LayoutContext>,
  ): RenderSpec {
    // Run live validation on current form values for inline wizard feedback
    const validationTemplate = this.validateForm.resolveDisclosureWizard(
      subject,
      subject.currentFormValues,
    );
    const liveValidation = validationTemplate.execute(subject, subject.currentFormValues);

    const currentStepTitle =
      subject.stepTitles[subject.currentStep] ?? `Step ${subject.currentStep + 1}`;

    const progressBar: RenderSpec = {
      componentName: "WizardProgressBar",
      props: {
        currentStep: subject.currentStep,
        totalSteps: subject.totalSteps || subject.stepTitles.length,
        stepTitles: subject.stepTitles,
        completionMap: subject.completionMap,
      },
      children: [],
      loadingState: "idle",
    };

    const stepForm: RenderSpec = {
      componentName: "DisclosureStepForm",
      props: {
        stepIndex: subject.currentStep,
        stepTitle: currentStepTitle,
        formId: subject.currentFormValues.formId,
        fields: subject.currentFormValues.fields,
        fieldErrors: liveValidation.fieldErrors,
        globalBlockers: liveValidation.globalBlockers,
        isValid: liveValidation.isValid,
        isDirty: subject.currentFormValues.dirty,
      },
      children: [],
      loadingState: "idle",
    };

    const compliancePanel: RenderSpec | null = subject.lastComplianceCheck
      ? {
          componentName: "ComplianceCheckPanel",
          props: {
            passed: subject.lastComplianceCheck.passed,
            disclosureItems: subject.lastComplianceCheck.disclosureItems,
            generatedDocuments: subject.lastComplianceCheck.generatedDocuments,
            requiredSignatures: subject.lastComplianceCheck.requiredSignatures,
          },
          children: [],
          loadingState: "idle",
        }
      : null;

    return baseSpec(
      "DisclosureWizardLayout",
      subject,
      {
        propertyId: subject.propertyId,
        currentStep: subject.currentStep,
        totalSteps: subject.totalSteps || subject.stepTitles.length,
        isLastStep: subject.currentStep === (subject.totalSteps || subject.stepTitles.length) - 1,
        canAdvance: liveValidation.isValid,
        viewport: object.viewport,
        theme: object.theme,
      },
      [progressBar, stepForm, ...(compliancePanel ? [compliancePanel] : [])],
    );
  }
}

export class BuyerWorkspaceRenderer extends WorkspaceRenderer<BuyerWorkspaceView> {
  execute(
    subject: BuyerWorkspaceView,
    object: Readonly<LayoutContext>,
  ): RenderSpec {
    const qualBadge: RenderSpec = {
      componentName: "QualificationBadge",
      props: {
        status: subject.qualificationStatus,
        preApprovalAmount: subject.preApprovalAmount,
        buyerId: subject.buyerId,
      },
      children: [],
      loadingState: "idle",
    };

    const workflowBanner: RenderSpec | null = subject.workflowStep
      ? {
          componentName: "WorkflowStepBanner",
          props: {
            stepName: subject.workflowStep.stepName,
            status: subject.workflowStep.status,
            nextSteps: subject.workflowStep.nextSteps,
            dueDate: subject.workflowStep.dueDate?.toISOString() ?? null,
            notes: subject.workflowStep.notes ?? null,
            variant: subject.workflowStep.status === "blocked" ? "urgent" : "info",
          },
          children: [],
          loadingState: "idle",
        }
      : null;

    const allMatches = subject.matchResults.flatMap((r) => r.matches);
    const sortedMatches = [...allMatches].sort((a, b) => b.score - a.score);

    const matchCards: RenderSpec[] = sortedMatches.map((match) => ({
      componentName: "ListingMatchCard",
      props: {
        listingId: match.listingId,
        address: match.address,
        price: match.price,
        score: match.score,
        isSaved: subject.savedListingIds.includes(match.listingId),
      },
      children: [],
      loadingState: "idle",
    }));

    const criteriaEditor: RenderSpec = {
      componentName: "BuyerCriteriaEditor",
      props: {
        formId: subject.currentFormValues.formId,
        fields: subject.currentFormValues.fields,
        dirty: subject.currentFormValues.dirty,
        qualificationRequired: subject.qualificationStatus !== "qualified",
      },
      children: [],
      loadingState: "idle",
    };

    return baseSpec(
      "BuyerWorkspaceLayout",
      subject,
      {
        buyerId: subject.buyerId,
        matchCount: sortedMatches.length,
        savedCount: subject.savedListingIds.length,
        viewport: object.viewport,
        theme: object.theme,
      },
      [
        ...(workflowBanner ? [workflowBanner] : []),
        qualBadge,
        criteriaEditor,
        ...matchCards,
      ],
    );
  }
}

export class SellerWorkspaceRenderer extends WorkspaceRenderer<SellerWorkspaceView> {
  execute(
    subject: SellerWorkspaceView,
    object: Readonly<LayoutContext>,
  ): RenderSpec {
    const qualBadge: RenderSpec = {
      componentName: "QualificationBadge",
      props: {
        status: subject.qualificationStatus,
        sellerId: subject.sellerId,
        listingId: subject.listingId,
      },
      children: [],
      loadingState: "idle",
    };

    const workflowBanner: RenderSpec | null = subject.workflowStep
      ? {
          componentName: "WorkflowStepBanner",
          props: {
            stepName: subject.workflowStep.stepName,
            status: subject.workflowStep.status,
            nextSteps: subject.workflowStep.nextSteps,
            dueDate: subject.workflowStep.dueDate?.toISOString() ?? null,
            notes: subject.workflowStep.notes ?? null,
            variant: subject.workflowStep.status === "blocked" ? "urgent" : "info",
          },
          children: [],
          loadingState: "idle",
        }
      : null;

    const disclosureKickoff: RenderSpec = {
      componentName: "DisclosureKickoffPanel",
      props: {
        status: subject.disclosureStatus,
        listingId: subject.listingId,
        sellerId: subject.sellerId,
        ctaLabel:
          subject.disclosureStatus === "not_started"
            ? "Start Disclosure Packet"
            : subject.disclosureStatus === "in_progress"
            ? "Continue Disclosure"
            : "View Completed Disclosures",
      },
      children: [],
      loadingState: "idle",
    };

    const listingForm: RenderSpec = {
      componentName: "SellerListingForm",
      props: {
        formId: subject.currentFormValues.formId,
        fields: subject.currentFormValues.fields,
        dirty: subject.currentFormValues.dirty,
        listingId: subject.listingId,
      },
      children: [],
      loadingState: "idle",
    };

    const offerSummary: RenderSpec = {
      componentName: "OfferSummaryPanel",
      props: {
        receivedOfferCount: subject.receivedOfferCount,
        listingId: subject.listingId,
      },
      children: [],
      loadingState: "idle",
    };

    return baseSpec(
      "SellerWorkspaceLayout",
      subject,
      {
        sellerId: subject.sellerId,
        listingId: subject.listingId,
        disclosureStatus: subject.disclosureStatus,
        receivedOfferCount: subject.receivedOfferCount,
        viewport: object.viewport,
        theme: object.theme,
      },
      [
        ...(workflowBanner ? [workflowBanner] : []),
        qualBadge,
        disclosureKickoff,
        listingForm,
        offerSummary,
      ],
    );
  }
}
