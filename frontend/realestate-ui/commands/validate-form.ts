/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  ViewBase,
  FormValues,
  ValidationReport,
  BuyerWorkspaceView,
  SellerWorkspaceView,
  OfferNegotiationView,
  DisclosureWizardView,
} from "../domain-types.js";

export class ValidateFormCommand extends Command<
  ViewBase,
  FormValues,
  ValidationReport,
  [
    BuyerWorkspaceView,
    SellerWorkspaceView,
    OfferNegotiationView,
    DisclosureWizardView,
  ]
> {
  readonly commandName = "validateForm" as const;

  resolveBuyerWorkspace(
    subject: BuyerWorkspaceView,
    object: Readonly<FormValues>,
  ): Template<ValidateFormCommand, [], BuyerWorkspaceView> {
    return new BuyerFormValidator();
  }

  resolveSellerWorkspace(
    subject: SellerWorkspaceView,
    object: Readonly<FormValues>,
  ): Template<ValidateFormCommand, [], SellerWorkspaceView> {
    return new SellerFormValidator();
  }

  resolveOfferNegotiation(
    subject: OfferNegotiationView,
    object: Readonly<FormValues>,
  ): Template<ValidateFormCommand, [], OfferNegotiationView> {
    return new ContingencyValidator();
  }

  resolveDisclosureWizard(
    subject: DisclosureWizardView,
    object: Readonly<FormValues>,
  ): Template<ValidateFormCommand, [], DisclosureWizardView> {
    return new DisclosureFormValidator();
  }
}

export abstract class OfferFormValidator<
  SU extends OfferNegotiationView,
> implements Template<ValidateFormCommand, [], SU> {
  abstract execute(subject: SU, object: Readonly<FormValues>): ValidationReport;
}

function field<T>(values: Readonly<FormValues>, key: string): T | undefined {
  return values.fields[key] as T | undefined;
}

function valid(): ValidationReport {
  return { isValid: true, fieldErrors: {}, globalBlockers: [] };
}

export class BuyerFormValidator implements Template<
  ValidateFormCommand,
  [],
  BuyerWorkspaceView
> {
  execute(
    subject: BuyerWorkspaceView,
    object: Readonly<FormValues>,
  ): ValidationReport {
    const fieldErrors: Record<string, string> = {};
    const globalBlockers: string[] = [];

    const maxPrice = field<number>(object, "maxPrice");
    const minPrice = field<number>(object, "minPrice");
    const minBedrooms = field<number>(object, "minBedrooms");
    const preferredLocations = field<string[]>(object, "preferredLocations");
    const preApprovalDoc = field<string>(object, "preApprovalDocumentUrl");

    if (!maxPrice || maxPrice <= 0) {
      fieldErrors["maxPrice"] = "Maximum price is required and must be greater than zero";
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice >= maxPrice) {
      fieldErrors["minPrice"] = "Minimum price must be less than maximum price";
    }
    if (subject.preApprovalAmount > 0 && maxPrice !== undefined && maxPrice > subject.preApprovalAmount) {
      fieldErrors["maxPrice"] =
        `Maximum price $${maxPrice.toLocaleString()} exceeds pre-approval of ` +
        `$${subject.preApprovalAmount.toLocaleString()}`;
    }
    if (!minBedrooms || minBedrooms < 1) {
      fieldErrors["minBedrooms"] = "Minimum bedrooms must be at least 1";
    }
    if (!preferredLocations || preferredLocations.length === 0) {
      fieldErrors["preferredLocations"] =
        "At least one preferred location is required for accurate matching";
    }
    if (!preApprovalDoc) {
      globalBlockers.push(
        "Upload your mortgage pre-approval letter to unlock offer submission",
      );
    }
    if (subject.qualificationStatus === "disqualified") {
      globalBlockers.push(
        "Buyer qualification is blocked — resolve all qualification issues before proceeding",
      );
    }

    return {
      isValid: Object.keys(fieldErrors).length === 0 && globalBlockers.length === 0,
      fieldErrors,
      globalBlockers,
    };
  }
}

export class SellerFormValidator implements Template<
  ValidateFormCommand,
  [],
  SellerWorkspaceView
> {
  execute(
    subject: SellerWorkspaceView,
    object: Readonly<FormValues>,
  ): ValidationReport {
    const fieldErrors: Record<string, string> = {};
    const globalBlockers: string[] = [];

    const address = field<string>(object, "address");
    const city = field<string>(object, "city");
    const price = field<number>(object, "askingPrice");
    const bedrooms = field<number>(object, "bedrooms");
    const bathrooms = field<number>(object, "bathrooms");
    const photoCount = field<number>(object, "photoCount");
    const disclosureStarted = field<boolean>(object, "disclosureStarted");

    if (!address || address.trim().length < 5) {
      fieldErrors["address"] = "A valid street address is required";
    }
    if (!city || city.trim().length === 0) {
      fieldErrors["city"] = "City is required";
    }
    if (!price || price <= 0) {
      fieldErrors["askingPrice"] = "Asking price must be greater than zero";
    } else if (price < 10_000) {
      fieldErrors["askingPrice"] = "Asking price seems too low — verify the amount";
    }
    if (!bedrooms || bedrooms < 1) {
      fieldErrors["bedrooms"] = "Bedroom count must be at least 1";
    }
    if (!bathrooms || bathrooms < 1) {
      fieldErrors["bathrooms"] = "Bathroom count must be at least 1";
    }
    if (photoCount !== undefined && photoCount < 3) {
      fieldErrors["photoCount"] =
        "At least 3 listing photos are required before the property can go live";
    }
    if (!disclosureStarted) {
      globalBlockers.push(
        "Disclosure packet must be initiated before the listing can be activated — click 'Start Disclosure Packet'",
      );
    }

    return {
      isValid: Object.keys(fieldErrors).length === 0 && globalBlockers.length === 0,
      fieldErrors,
      globalBlockers,
    };
  }
}

export class DisclosureFormValidator implements Template<
  ValidateFormCommand,
  [],
  DisclosureWizardView
> {
  execute(
    subject: DisclosureWizardView,
    object: Readonly<FormValues>,
  ): ValidationReport {
    const fieldErrors: Record<string, string> = {};
    const globalBlockers: string[] = [];

    // Step-gated validation: only validate fields for the current step
    const step = subject.currentStep;

    if (step === 0) {
      // Step 0: Property Details
      const yearBuilt = field<number>(object, "yearBuilt");
      const propertyType = field<string>(object, "propertyType");
      const sqft = field<number>(object, "sqft");

      if (!yearBuilt || yearBuilt < 1800 || yearBuilt > new Date().getFullYear()) {
        fieldErrors["yearBuilt"] = "A valid year built is required (1800–present)";
      }
      if (!propertyType) {
        fieldErrors["propertyType"] = "Property type is required (e.g. Single Family, Condo)";
      }
      if (!sqft || sqft <= 0) {
        fieldErrors["sqft"] = "Square footage must be greater than zero";
      }
    } else if (step === 1) {
      // Step 1: Known Defects
      const hasKnownDefects = field<boolean>(object, "hasKnownDefects");
      const defectDescription = field<string>(object, "defectDescription");

      if (hasKnownDefects === undefined) {
        fieldErrors["hasKnownDefects"] =
          "Indicate whether you are aware of any known defects";
      }
      if (hasKnownDefects === true && (!defectDescription || defectDescription.trim().length < 10)) {
        fieldErrors["defectDescription"] =
          "Please describe all known defects in detail (minimum 10 characters)";
      }
    } else if (step === 2) {
      // Step 2: Environmental Hazards
      const inFloodZone = field<boolean>(object, "inFloodZone");
      const femaFormAttached = field<boolean>(object, "femaFormAttached");
      const hasLeadPaint = field<boolean>(object, "hasLeadPaint");
      const yearBuiltForLead = field<number>(object, "yearBuilt");

      if (inFloodZone === undefined) {
        fieldErrors["inFloodZone"] = "Flood zone status must be disclosed";
      }
      if (inFloodZone === true && !femaFormAttached) {
        fieldErrors["femaFormAttached"] =
          "FEMA Elevation Certificate or flood zone documentation must be attached";
      }
      // Contradiction check: lead paint impossible if built after 1978
      if (hasLeadPaint === true && yearBuiltForLead !== undefined && yearBuiltForLead > 1978) {
        fieldErrors["hasLeadPaint"] =
          "Lead-based paint cannot be present in properties built after 1978 — verify year built";
      }
    } else if (step === 3) {
      // Step 3: HOA & Legal
      const hasHoa = field<boolean>(object, "hasHoa");
      const hoaName = field<string>(object, "hoaName");
      const hoaFee = field<number>(object, "hoaMonthlyFee");
      const hoaDocsAttached = field<boolean>(object, "hoaDocsAttached");

      if (hasHoa === undefined) {
        fieldErrors["hasHoa"] = "HOA membership status must be disclosed";
      }
      if (hasHoa === true) {
        if (!hoaName || hoaName.trim().length === 0) {
          fieldErrors["hoaName"] = "HOA name is required";
        }
        if (!hoaFee || hoaFee <= 0) {
          fieldErrors["hoaMonthlyFee"] = "HOA monthly fee must be disclosed and greater than zero";
        }
        if (!hoaDocsAttached) {
          fieldErrors["hoaDocsAttached"] =
            "HOA documents (CC&Rs, bylaws, budget) must be attached";
        }
      }
    } else if (step === 4) {
      // Step 4: Recent Improvements
      const hasRenovations = field<boolean>(object, "hasRenovations");
      const renovationDescription = field<string>(object, "renovationDescription");
      const permitsObtained = field<boolean>(object, "permitsObtained");

      if (hasRenovations === undefined) {
        fieldErrors["hasRenovations"] = "Disclose whether any renovations were made in the past 5 years";
      }
      if (hasRenovations === true) {
        if (!renovationDescription || renovationDescription.trim().length < 10) {
          fieldErrors["renovationDescription"] =
            "Describe all renovations including scope and approximate date";
        }
        if (permitsObtained === undefined) {
          fieldErrors["permitsObtained"] =
            "Indicate whether permits were obtained for all renovation work";
        }
      }
    } else if (step === 5) {
      // Step 5: Review & Submit — all previous steps must be complete
      const requiredSteps = ["Property Details", "Known Defects", "Environmental Hazards", "HOA & Legal", "Recent Improvements"];
      const incompleteSteps = requiredSteps.filter((title) => !subject.completionMap[title]);
      if (incompleteSteps.length > 0) {
        globalBlockers.push(
          `Complete all required steps before submitting: ${incompleteSteps.join(", ")}`,
        );
      }
      if (!subject.lastComplianceCheck) {
        globalBlockers.push(
          "Run disclosure validation before submitting the packet",
        );
      }
    }

    return {
      isValid: Object.keys(fieldErrors).length === 0 && globalBlockers.length === 0,
      fieldErrors,
      globalBlockers,
    };
  }
}

export class ContingencyValidator extends OfferFormValidator<OfferNegotiationView> {
  execute(
    subject: OfferNegotiationView,
    object: Readonly<FormValues>,
  ): ValidationReport {
    const fieldErrors: Record<string, string> = {};
    const globalBlockers: string[] = [];

    const offerPrice = field<number>(object, "offerPrice");
    const inspectionDays = field<number>(object, "inspectionPeriodDays");
    const closingDateStr = field<string>(object, "closingDate");
    const earnestMoney = field<number>(object, "earnestMoney");
    const financingContingency = field<boolean>(object, "financingContingency");
    const financingDeadlineStr = field<string>(object, "financingDeadline");
    const appraisalGapAmount = field<number>(object, "appraisalGapAmount");
    const waiverAcknowledged = field<boolean>(object, "contingencyWaiverAcknowledged");

    if (!offerPrice || offerPrice <= 0) {
      fieldErrors["offerPrice"] = "Offer price must be greater than zero";
    }

    if (!earnestMoney || earnestMoney <= 0) {
      fieldErrors["earnestMoney"] = "Earnest money deposit is required";
    } else if (offerPrice && earnestMoney < offerPrice * 0.01) {
      fieldErrors["earnestMoney"] =
        `Earnest money must be at least 1% of offer price ($${(offerPrice * 0.01).toLocaleString()})`;
    }

    if (!inspectionDays || inspectionDays < 5) {
      fieldErrors["inspectionPeriodDays"] =
        "Inspection period must be at least 5 days";
    } else if (inspectionDays > 30) {
      fieldErrors["inspectionPeriodDays"] =
        "Inspection period exceeding 30 days may be rejected by seller";
    }

    if (!closingDateStr) {
      fieldErrors["closingDate"] = "Closing date is required";
    } else {
      const closingDate = new Date(closingDateStr);
      if (isNaN(closingDate.getTime())) {
        fieldErrors["closingDate"] = "Closing date is not a valid date";
      } else if (closingDate <= new Date()) {
        fieldErrors["closingDate"] = "Closing date must be in the future";
      } else {
        const dayOfWeek = closingDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          fieldErrors["closingDate"] =
            "Closing date must be a business day (Monday–Friday)";
        }
      }
    }

    if (financingContingency === true && !financingDeadlineStr) {
      fieldErrors["financingDeadline"] =
        "A financing contingency deadline is required when financing contingency is selected";
    }

    if (appraisalGapAmount !== undefined && appraisalGapAmount < 0) {
      fieldErrors["appraisalGapAmount"] =
        "Appraisal gap coverage amount cannot be negative";
    }

    // If any contingency is being waived, require explicit acknowledgement
    const waivingContingency =
      field<boolean>(object, "waiveInspection") === true ||
      field<boolean>(object, "waiveFinancing") === true ||
      field<boolean>(object, "waiveAppraisal") === true;

    if (waivingContingency && !waiverAcknowledged) {
      globalBlockers.push(
        "You must acknowledge the risks of waiving contingencies before submitting this offer",
      );
    }

    if (subject.currentStatus === "accepted" || subject.currentStatus === "rejected") {
      globalBlockers.push(
        `This offer is already ${subject.currentStatus} and cannot be modified`,
      );
    }

    return {
      isValid: Object.keys(fieldErrors).length === 0 && globalBlockers.length === 0,
      fieldErrors,
      globalBlockers,
    };
  }
}

export class EscrowValidator extends OfferFormValidator<OfferNegotiationView> {
  execute(
    subject: OfferNegotiationView,
    object: Readonly<FormValues>,
  ): ValidationReport {
    const fieldErrors: Record<string, string> = {};
    const globalBlockers: string[] = [];

    const earnestMoney = field<number>(object, "earnestMoney");
    const escrowCompany = field<string>(object, "escrowCompany");
    const closingDateStr = field<string>(object, "closingDate");
    const offerPrice = field<number>(object, "offerPrice");

    if (!earnestMoney || earnestMoney <= 0) {
      fieldErrors["earnestMoney"] = "Earnest money deposit amount is required";
    }
    if (offerPrice && earnestMoney && earnestMoney > offerPrice * 0.1) {
      fieldErrors["earnestMoney"] =
        `Earnest money of $${earnestMoney.toLocaleString()} exceeds 10% of offer price — verify this is intentional`;
    }

    if (!escrowCompany || escrowCompany.trim().length === 0) {
      fieldErrors["escrowCompany"] = "An escrow company must be selected";
    }

    if (!closingDateStr) {
      fieldErrors["closingDate"] = "Closing date is required for escrow setup";
    } else {
      const closingDate = new Date(closingDateStr);
      if (isNaN(closingDate.getTime())) {
        fieldErrors["closingDate"] = "Closing date is not a valid date";
      } else {
        const dayOfWeek = closingDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          fieldErrors["closingDate"] =
            "Closing/escrow date must be a business day (Monday–Friday)";
        }
        const daysUntilClose = Math.ceil(
          (closingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilClose < 14) {
          globalBlockers.push(
            `Closing date of ${closingDate.toDateString()} is fewer than 14 days away — ` +
            `escrow may not have sufficient time to complete. Confirm with escrow officer.`,
          );
        }
      }
    }

    if (subject.currentStatus === "accepted" || subject.currentStatus === "rejected") {
      globalBlockers.push(
        `This offer is already ${subject.currentStatus} — escrow changes are not allowed`,
      );
    }

    return {
      isValid: Object.keys(fieldErrors).length === 0 && globalBlockers.length === 0,
      fieldErrors,
      globalBlockers,
    };
  }
}
