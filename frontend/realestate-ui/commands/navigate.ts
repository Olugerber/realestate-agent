/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  ViewBase,
  NavigationEvent,
  RouteTarget,
  DashboardView,
  BuyerWorkspaceView,
  SellerWorkspaceView,
  ListingDetailView,
  OfferNegotiationView,
  ShowingCalendarView,
  TransactionTrackerView,
  DisclosureWizardView,
} from "../domain-types.js";

export class NavigateCommand extends Command<
  ViewBase,
  NavigationEvent,
  RouteTarget,
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
  readonly commandName = "navigate" as const;

  resolveDashboard(
    subject: DashboardView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], DashboardView> {
    return new DashboardNavigator();
  }

  resolveBuyerWorkspace(
    subject: BuyerWorkspaceView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], BuyerWorkspaceView> {
    return new BuyerNavigator();
  }

  resolveSellerWorkspace(
    subject: SellerWorkspaceView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], SellerWorkspaceView> {
    return new SellerNavigator();
  }

  resolveListingDetail(
    subject: ListingDetailView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], ListingDetailView> {
    return new ListingNavigator();
  }

  resolveOfferNegotiation(
    subject: OfferNegotiationView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], OfferNegotiationView> {
    return new OfferNavigator();
  }

  resolveShowingCalendar(
    subject: ShowingCalendarView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], ShowingCalendarView> {
    return new ShowingNavigator();
  }

  resolveTransactionTracker(
    subject: TransactionTrackerView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], TransactionTrackerView> {
    return new TransactionNavigator();
  }

  resolveDisclosureWizard(
    subject: DisclosureWizardView,
    object: Readonly<NavigationEvent>,
  ): Template<NavigateCommand, [], DisclosureWizardView> {
    return new DisclosureNavigator();
  }
}

export abstract class WorkspaceNavigator<
  SU extends BuyerWorkspaceView | SellerWorkspaceView,
> implements Template<NavigateCommand, [], SU> {
  abstract execute(subject: SU, object: Readonly<NavigationEvent>): RouteTarget;
}

function interpolate(template: string, params: Record<string, string>): string {
  return template.replace(/:([a-zA-Z]+)/g, (_, key) => params[key] ?? `:${key}`);
}

function route(
  path: string,
  params: Record<string, string>,
  historyMode: RouteTarget["historyMode"] = "push",
): RouteTarget {
  return { path: interpolate(path, params), params, historyMode };
}

export class DashboardNavigator implements Template<
  NavigateCommand,
  [],
  DashboardView
> {
  execute(
    subject: DashboardView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "buyerWorkspace":
        return route("/buyer/:buyerId", params, historyMode);
      case "sellerWorkspace":
        return route("/seller/:sellerId", params, historyMode);
      case "transactionTracker":
        return route("/transaction/:transactionId", params, historyMode);
      case "back":
        return route("/dashboard", {}, "replace");
      default:
        return route("/dashboard", {}, "replace");
    }
  }
}

export class ListingNavigator implements Template<
  NavigateCommand,
  [],
  ListingDetailView
> {
  execute(
    subject: ListingDetailView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "showingCalendar":
        return route("/showings", { ...params, listingId: subject.listingId }, historyMode);
      case "offerNegotiation":
        return route("/offer/:offerId", params, historyMode);
      case "buyerWorkspace":
        return route("/buyer/:buyerId", params, historyMode);
      case "back":
        return route("/buyer/:buyerId", { buyerId: subject.agentId }, "replace");
      default:
        return route("/listing/:listingId", { listingId: subject.listingId }, "replace");
    }
  }
}

export class OfferNavigator implements Template<
  NavigateCommand,
  [],
  OfferNegotiationView
> {
  execute(
    subject: OfferNegotiationView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "transactionTracker":
        // Primary post-accept redirect
        return route("/transaction/:transactionId", params, "replace");
      case "buyerWorkspace":
        return route("/buyer/:buyerId", { buyerId: subject.buyerId, ...params }, historyMode);
      case "sellerWorkspace":
        return route("/seller/:sellerId", { sellerId: subject.sellerId, ...params }, historyMode);
      case "dashboard":
        return route("/dashboard", {}, historyMode);
      case "back":
        // Go back to whichever workspace initiated this offer
        if (subject.sellerId) {
          return route("/seller/:sellerId", { sellerId: subject.sellerId }, "replace");
        }
        return route("/buyer/:buyerId", { buyerId: subject.buyerId }, "replace");
      default:
        return route("/offer/:offerId", { offerId: subject.offerId }, "replace");
    }
  }
}

export class ShowingNavigator implements Template<
  NavigateCommand,
  [],
  ShowingCalendarView
> {
  execute(
    subject: ShowingCalendarView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "listingDetail":
        return route("/listing/:listingId", params, historyMode);
      case "buyerWorkspace":
        return route("/buyer/:buyerId", params, historyMode);
      case "dashboard":
        return route("/dashboard", {}, historyMode);
      case "back":
        return route("/dashboard", {}, "replace");
      default:
        return route("/showings", {}, "replace");
    }
  }
}

export class TransactionNavigator implements Template<
  NavigateCommand,
  [],
  TransactionTrackerView
> {
  execute(
    subject: TransactionTrackerView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "disclosureWizard":
        return route(
          "/disclosure/:propertyId",
          { propertyId: subject.listingId, ...params },
          historyMode,
        );
      case "offerNegotiation":
        return route("/offer/:offerId", params, historyMode);
      case "dashboard":
        return route("/dashboard", {}, historyMode);
      case "back":
        return route("/dashboard", {}, "replace");
      default:
        return route(
          "/transaction/:transactionId",
          { transactionId: subject.transactionId },
          "replace",
        );
    }
  }
}

export class DisclosureNavigator implements Template<
  NavigateCommand,
  [],
  DisclosureWizardView
> {
  execute(
    subject: DisclosureWizardView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "transactionTracker":
        return route("/transaction/:transactionId", params, "replace");
      case "sellerWorkspace":
        return route(
          "/seller/:sellerId",
          { sellerId: subject.sellerId, ...params },
          historyMode,
        );
      case "dashboard":
        return route("/dashboard", {}, historyMode);
      case "back":
      case "saveAndExit":
        return route(
          "/seller/:sellerId",
          { sellerId: subject.sellerId },
          "replace",
        );
      default:
        return route(
          "/disclosure/:propertyId",
          { propertyId: subject.propertyId },
          "replace",
        );
    }
  }
}

export class BuyerNavigator extends WorkspaceNavigator<BuyerWorkspaceView> {
  execute(
    subject: BuyerWorkspaceView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "listingDetail":
        return route("/listing/:listingId", params, historyMode);
      case "showingCalendar":
        return route("/showings", params, historyMode);
      case "offerNegotiation":
        return route("/offer/:offerId", params, historyMode);
      case "transactionTracker":
        return route("/transaction/:transactionId", params, historyMode);
      case "dashboard":
        return route("/dashboard", {}, historyMode);
      case "back":
        return route("/dashboard", {}, "replace");
      default:
        return route("/buyer/:buyerId", { buyerId: subject.buyerId }, "replace");
    }
  }
}

export class SellerNavigator extends WorkspaceNavigator<SellerWorkspaceView> {
  execute(
    subject: SellerWorkspaceView,
    object: Readonly<NavigationEvent>,
  ): RouteTarget {
    const { targetHint, params, historyMode } = object;

    switch (targetHint) {
      case "offerNegotiation":
        return route("/offer/:offerId", params, historyMode);
      case "transactionTracker":
        return route("/transaction/:transactionId", params, historyMode);
      case "disclosureWizard":
        return route(
          "/disclosure/:propertyId",
          { propertyId: subject.listingId, ...params },
          historyMode,
        );
      case "dashboard":
        return route("/dashboard", {}, historyMode);
      case "back":
        return route("/dashboard", {}, "replace");
      default:
        return route("/seller/:sellerId", { sellerId: subject.sellerId }, "replace");
    }
  }
}
