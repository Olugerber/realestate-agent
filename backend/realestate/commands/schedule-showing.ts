/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  Participant,
  ShowingSlot,
  ActionResult,
  BuyerProfile,
  ShowingRequest,
  PropertyListing,
} from "../domain-types.js";

export class ScheduleShowingCommand extends Command<
  Participant,
  ShowingSlot,
  ActionResult,
  [BuyerProfile, ShowingRequest, PropertyListing]
> {
  readonly commandName = "scheduleShowing" as const;

  resolveBuyer(
    subject: BuyerProfile,
    object: Readonly<ShowingSlot>,
  ): Template<ScheduleShowingCommand, [], BuyerProfile> {
    return new RequestShowingTemplate();
  }

  resolveShowing(
    subject: ShowingRequest,
    object: Readonly<ShowingSlot>,
  ): Template<ScheduleShowingCommand, [], ShowingRequest> {
    return new ConfirmShowingTemplate();
  }

  resolveListing(
    subject: PropertyListing,
    object: Readonly<ShowingSlot>,
  ): Template<ScheduleShowingCommand, [], PropertyListing> {
    return new ShowingAvailabilityTemplate();
  }
}

export class RequestShowingTemplate implements Template<
  ScheduleShowingCommand,
  [],
  BuyerProfile
> {
  execute(subject: BuyerProfile, object: Readonly<ShowingSlot>): ActionResult {
    if (subject.qualificationStatus !== "qualified") {
      return {
        success: false,
        message: `Buyer ${subject.participant.name} must be qualified before scheduling showings`,
        errors: ["Buyer qualification required"],
      };
    }

    const now = new Date();
    if (object.requestedDate <= now) {
      return {
        success: false,
        message: "Requested showing date must be in the future",
        errors: [`Requested date ${object.requestedDate.toISOString()} is in the past`],
      };
    }

    const showingId = `showing:${subject.participant.id}:${object.requestedDate.getTime()}`;
    subject.scheduledShowings.push(showingId);

    return {
      success: true,
      message: `Showing request submitted for ${subject.participant.name} on ${object.requestedDate.toDateString()}`,
      data: {
        showingId,
        buyerId: subject.participant.id,
        requestedDate: object.requestedDate.toISOString(),
        durationMinutes: object.durationMinutes,
        notes: object.notes ?? null,
      },
    };
  }
}

export class ConfirmShowingTemplate implements Template<
  ScheduleShowingCommand,
  [],
  ShowingRequest
> {
  execute(
    subject: ShowingRequest,
    object: Readonly<ShowingSlot>,
  ): ActionResult {
    if (subject.status === "cancelled") {
      return {
        success: false,
        message: `Showing ${subject.showingId} has been cancelled and cannot be confirmed`,
        errors: ["Showing is cancelled"],
      };
    }

    if (subject.status === "confirmed") {
      return {
        success: true,
        message: `Showing ${subject.showingId} is already confirmed for ${subject.confirmedDate?.toDateString()}`,
        data: { showingId: subject.showingId, confirmedDate: subject.confirmedDate?.toISOString() },
      };
    }

    const now = new Date();
    if (object.requestedDate <= now) {
      return {
        success: false,
        message: "Cannot confirm a showing in the past",
        errors: [`Slot date ${object.requestedDate.toISOString()} has already passed`],
      };
    }

    subject.confirmedDate = object.requestedDate;
    subject.requestedSlot = object;
    subject.status = "confirmed";

    return {
      success: true,
      message: `Showing ${subject.showingId} confirmed for ${object.requestedDate.toDateString()} (${object.durationMinutes} min)`,
      data: {
        showingId: subject.showingId,
        buyerId: subject.buyerId,
        listingId: subject.listingId,
        confirmedDate: subject.confirmedDate.toISOString(),
        durationMinutes: object.durationMinutes,
      },
    };
  }
}

export class ShowingAvailabilityTemplate implements Template<
  ScheduleShowingCommand,
  [],
  PropertyListing
> {
  execute(
    subject: PropertyListing,
    object: Readonly<ShowingSlot>,
  ): ActionResult {
    if (subject.status !== "active") {
      return {
        success: false,
        message: `Listing ${subject.listingId} is not available for showings — current status: ${subject.status}`,
        errors: [`Listing status is "${subject.status}"`],
      };
    }

    const requestedTime = object.requestedDate.getTime();
    const bufferMs = 30 * 60 * 1000; // 30-minute buffer between showings

    const conflict = subject.availableSlots.some(
      (slot) => Math.abs(slot.getTime() - requestedTime) < bufferMs,
    );

    if (conflict) {
      const conflictingSlot = subject.availableSlots.find(
        (slot) => Math.abs(slot.getTime() - requestedTime) < bufferMs,
      );
      return {
        success: false,
        message: `Requested time conflicts with an existing showing at ${conflictingSlot?.toLocaleTimeString()}`,
        errors: ["Showing time conflict — please select a different slot"],
      };
    }

    // Validate business hours: Mon–Sat 8am–7pm
    const hour = object.requestedDate.getHours();
    const dayOfWeek = object.requestedDate.getDay(); // 0=Sun
    if (dayOfWeek === 0 || hour < 8 || hour >= 19) {
      return {
        success: false,
        message: "Showings are only available Monday–Saturday between 8:00 AM and 7:00 PM",
        errors: ["Requested time is outside showing hours"],
      };
    }

    subject.availableSlots.push(object.requestedDate);

    return {
      success: true,
      message: `Listing ${subject.listingId} at ${subject.details.address} is available on ${object.requestedDate.toDateString()}`,
      data: {
        listingId: subject.listingId,
        address: `${subject.details.address}, ${subject.details.city}`,
        confirmedDate: object.requestedDate.toISOString(),
        durationMinutes: object.durationMinutes,
        listingPrice: subject.details.price,
      },
    };
  }
}
