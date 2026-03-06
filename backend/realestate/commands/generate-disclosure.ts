/* @odetovibe-generated */
import { Command } from "codascon";
import type { Template } from "codascon";
import type {
  Participant,
  PropertyContext,
  ComplianceCheck,
  SellerProfile,
  PropertyListing,
} from "../domain-types.js";

export class GenerateDisclosureCommand extends Command<
  Participant,
  PropertyContext,
  ComplianceCheck,
  [SellerProfile, PropertyListing]
> {
  readonly commandName = "generateDisclosure" as const;

  resolveSeller(
    subject: SellerProfile,
    object: Readonly<PropertyContext>,
  ): Template<GenerateDisclosureCommand, [], SellerProfile> {
    return new SellerDisclosureTemplate();
  }

  resolveListing(
    subject: PropertyListing,
    object: Readonly<PropertyContext>,
  ): Template<GenerateDisclosureCommand, [], PropertyListing> {
    return new PropertyDisclosureTemplate();
  }
}

export class SellerDisclosureTemplate implements Template<
  GenerateDisclosureCommand,
  [],
  SellerProfile
> {
  execute(
    subject: SellerProfile,
    object: Readonly<PropertyContext>,
  ): ComplianceCheck {
    const disclosureItems: ComplianceCheck["disclosureItems"] = [];
    const requiredSignatures: string[] = [];

    // Statutory seller disclosure form required in all jurisdictions
    disclosureItems.push({
      category: "Seller Disclosure Statement",
      description:
        `${subject.participant.name} must complete and sign the statutory seller disclosure ` +
        `form covering all known material defects at ${object.address}`,
      severity: "high",
    });
    requiredSignatures.push(`${subject.participant.name} — Seller Disclosure Statement`);

    // Known issues disclosed by the seller
    for (const issue of object.knownIssues) {
      disclosureItems.push({
        category: "Known Defect",
        description: issue,
        severity: "high",
      });
    }

    // HOA disclosure
    if (object.hoaInfo) {
      disclosureItems.push({
        category: "HOA Disclosure",
        description:
          `Property is subject to HOA "${object.hoaInfo.name}" with monthly fees ` +
          `of $${object.hoaInfo.monthlyFee.toLocaleString()}. HOA documents (CC&Rs, bylaws, budget) must be provided.`,
        severity: "medium",
      });
      requiredSignatures.push(`${subject.participant.name} — HOA Disclosure Acknowledgement`);
    }

    // Lead-based paint disclosure for pre-1978 properties
    if (object.yearBuilt < 1978) {
      disclosureItems.push({
        category: "Lead-Based Paint Disclosure",
        description:
          `Property built in ${object.yearBuilt} — federal law requires lead-based paint ` +
          `disclosure and 10-day inspection period for buyers`,
        severity: "high",
      });
      requiredSignatures.push(`${subject.participant.name} — Lead-Based Paint Disclosure`);
    }

    // Recent renovations without permits
    for (const renovation of object.recentRenovations) {
      disclosureItems.push({
        category: "Renovation Disclosure",
        description: `Recent work reported: ${renovation}. Seller must confirm permits were obtained and final inspections passed.`,
        severity: "medium",
      });
    }

    const generatedDocuments = [
      "Seller Property Disclosure Statement",
      "Agency Disclosure",
      ...(object.hoaInfo ? ["HOA Transfer Disclosure"] : []),
      ...(object.yearBuilt < 1978 ? ["Lead-Based Paint Disclosure (EPA Form)"] : []),
    ];

    subject.disclosuresCompleted = true;

    return {
      passed: object.knownIssues.length === 0,
      disclosureItems,
      generatedDocuments,
      requiredSignatures,
      completedAt: new Date(),
    };
  }
}

export class PropertyDisclosureTemplate implements Template<
  GenerateDisclosureCommand,
  [],
  PropertyListing
> {
  execute(
    subject: PropertyListing,
    object: Readonly<PropertyContext>,
  ): ComplianceCheck {
    const disclosureItems: ComplianceCheck["disclosureItems"] = [];
    const requiredSignatures: string[] = [];

    // Transfer disclosure statement
    disclosureItems.push({
      category: "Transfer Disclosure Statement (TDS)",
      description:
        `Full TDS required for listing ${subject.listingId} at ${object.address} — ` +
        `covers condition of roof, plumbing, electrical, HVAC, and structural components`,
      severity: "high",
    });
    requiredSignatures.push(`Seller — Transfer Disclosure Statement`);
    requiredSignatures.push(`Listing Agent — Transfer Disclosure Statement`);

    // Natural hazard disclosure
    disclosureItems.push({
      category: "Natural Hazard Disclosure (NHD)",
      description:
        `NHD report required for ${object.address} — discloses flood, fire, earthquake, ` +
        `and seismic hazard zones as applicable`,
      severity: "medium",
    });

    // Zoning disclosure
    if (object.zoning && object.zoning !== "residential") {
      disclosureItems.push({
        category: "Zoning Disclosure",
        description: `Property is zoned "${object.zoning}" — buyer must verify permitted uses`,
        severity: "medium",
      });
    }

    // Known issues on the property record
    for (const issue of object.knownIssues) {
      disclosureItems.push({
        category: "Property Condition",
        description: issue,
        severity: "high",
      });
    }

    // Permit history for renovations
    for (const renovation of object.recentRenovations) {
      disclosureItems.push({
        category: "Permit Verification",
        description: `Verify permits for: ${renovation}`,
        severity: "low",
      });
    }

    // Age-based disclosures
    const propertyAge = new Date().getFullYear() - object.yearBuilt;
    if (propertyAge > 40) {
      disclosureItems.push({
        category: "Aging Systems Advisory",
        description:
          `Property is ${propertyAge} years old — recommend full inspection of roof, ` +
          `electrical panel, plumbing, and HVAC systems`,
        severity: "low",
      });
    }

    const generatedDocuments = [
      "Transfer Disclosure Statement",
      "Natural Hazard Disclosure Report",
      "Preliminary Title Report",
      ...(object.yearBuilt < 1978 ? ["Lead-Based Paint Advisory"] : []),
      ...(object.hoaInfo ? ["HOA Documents Package"] : []),
    ];

    return {
      passed: object.knownIssues.length === 0,
      disclosureItems,
      generatedDocuments,
      requiredSignatures,
      completedAt: new Date(),
    };
  }
}
