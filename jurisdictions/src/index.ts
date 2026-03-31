// ============================================================
// STYX Jurisdiction Rules — Open Compliance Knowledge Layer
//
// These rules encode state-specific real estate compliance
// requirements as structured, machine-readable data.
//
// CONTRIBUTING: If you spot an error or a missing rule,
// please open a PR. These rules are the foundation of
// programmatic compliance and accuracy matters.
// ============================================================

export interface JurisdictionRules {
  state: string;
  stateName: string;

  // Attorney & representation
  attorneyRequired: boolean;
  attorneyRequiredContext?: string;
  brokerCanDraftCustom: boolean;

  // Disclosures
  sellerDisclosureRequired: boolean;
  leadPaintDisclosure: boolean;        // Federal: required for pre-1978
  propertyConditionDisclosure: boolean;
  naturalHazardDisclosure: boolean;

  // Taxes & thresholds
  transferTaxExists: boolean;
  transferTaxThreshold: number;        // USD, 0 = applies to all
  mansionTaxExists: boolean;
  mansionTaxThreshold: number;         // USD, 0 = no mansion tax

  // Board/HOA
  boardApprovalRequired: boolean;
  boardApprovalContext?: string;

  // Commercial
  commercialRequiresAccreditation: number;  // USD threshold, 0 = no requirement
  phaseIRequired: boolean;                   // Environmental Phase I

  // Foreign buyers
  firptaApplies: boolean;                    // Always true (federal)
  additionalForeignBuyerRules: boolean;
  foreignBuyerContext?: string;

  // Beneficial ownership
  boiThreshold: number;                      // USD threshold for BOI reporting

  // Tokenization-specific
  tokenizationNotes?: string;
}

// --- State Rules ---

const NY: JurisdictionRules = {
  state: "NY",
  stateName: "New York",
  attorneyRequired: true,
  attorneyRequiredContext: "New York requires attorney representation for all real estate transactions",
  brokerCanDraftCustom: false,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: false,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: true,
  mansionTaxThreshold: 1000000,
  boardApprovalRequired: true,
  boardApprovalContext: "Co-op and condo board approval required where applicable",
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: true,
  foreignBuyerContext: "NYC additional withholding requirements may apply",
  boiThreshold: 300000,
  tokenizationNotes: "NY BitLicense may apply to platforms facilitating tokenized transactions",
};

const CA: JurisdictionRules = {
  state: "CA",
  stateName: "California",
  attorneyRequired: false,
  brokerCanDraftCustom: true,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: true,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: false,
  mansionTaxThreshold: 0,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: true,
  foreignBuyerContext: "CA withholding of 3.33% for foreign sellers",
  boiThreshold: 300000,
  tokenizationNotes: "CA DBO may require licensing for tokenized security offerings",
};

const TX: JurisdictionRules = {
  state: "TX",
  stateName: "Texas",
  attorneyRequired: false,
  brokerCanDraftCustom: true,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: false,
  transferTaxExists: false,
  transferTaxThreshold: 0,
  mansionTaxExists: false,
  mansionTaxThreshold: 0,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: false,
  boiThreshold: 300000,
  tokenizationNotes: "TX has no state income tax; favorable for tokenized asset structures",
};

const FL: JurisdictionRules = {
  state: "FL",
  stateName: "Florida",
  attorneyRequired: false,
  brokerCanDraftCustom: true,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: true,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: false,
  mansionTaxThreshold: 0,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: true,
  foreignBuyerContext: "Significant international buyer activity; FIRPTA enforcement is common",
  boiThreshold: 300000,
  tokenizationNotes: "FL Office of Financial Regulation oversees digital asset activities",
};

const IL: JurisdictionRules = {
  state: "IL",
  stateName: "Illinois",
  attorneyRequired: true,
  attorneyRequiredContext: "Customary and effectively required in practice throughout Illinois",
  brokerCanDraftCustom: false,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: false,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: false,
  mansionTaxThreshold: 0,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: false,
  boiThreshold: 300000,
};

const NJ: JurisdictionRules = {
  state: "NJ",
  stateName: "New Jersey",
  attorneyRequired: true,
  attorneyRequiredContext: "Attorney review period is standard in NJ contracts",
  brokerCanDraftCustom: false,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: false,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: true,
  mansionTaxThreshold: 1000000,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: true,
  foreignBuyerContext: "NJ GIT/REP withholding for nonresident sellers",
  boiThreshold: 300000,
};

const WY: JurisdictionRules = {
  state: "WY",
  stateName: "Wyoming",
  attorneyRequired: false,
  brokerCanDraftCustom: true,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: false,
  transferTaxExists: false,
  transferTaxThreshold: 0,
  mansionTaxExists: false,
  mansionTaxThreshold: 0,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: false,
  boiThreshold: 300000,
  tokenizationNotes: "WY is among the most crypto-friendly states with favorable DAO and digital asset legislation",
};

const CO: JurisdictionRules = {
  state: "CO",
  stateName: "Colorado",
  attorneyRequired: false,
  brokerCanDraftCustom: true,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: true,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: false,
  mansionTaxThreshold: 0,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: false,
  boiThreshold: 300000,
};

const CT: JurisdictionRules = {
  state: "CT",
  stateName: "Connecticut",
  attorneyRequired: true,
  attorneyRequiredContext: "Attorney involvement required by custom and practice",
  brokerCanDraftCustom: false,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: false,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: true,
  mansionTaxThreshold: 2500000,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: false,
  boiThreshold: 300000,
};

const MA: JurisdictionRules = {
  state: "MA",
  stateName: "Massachusetts",
  attorneyRequired: true,
  attorneyRequiredContext: "Attorney required for deed preparation and closing",
  brokerCanDraftCustom: false,
  sellerDisclosureRequired: true,
  leadPaintDisclosure: true,
  propertyConditionDisclosure: true,
  naturalHazardDisclosure: false,
  transferTaxExists: true,
  transferTaxThreshold: 0,
  mansionTaxExists: false,
  mansionTaxThreshold: 0,
  boardApprovalRequired: false,
  commercialRequiresAccreditation: 1000000,
  phaseIRequired: true,
  firptaApplies: true,
  additionalForeignBuyerRules: false,
  boiThreshold: 300000,
};

// ============================================================
// Registry & Lookup
// ============================================================

const JURISDICTION_REGISTRY: Record<string, JurisdictionRules> = {
  NY, CA, TX, FL, IL, NJ, WY, CO, CT, MA,
};

export function getJurisdictionRules(stateCode: string): JurisdictionRules | undefined {
  return JURISDICTION_REGISTRY[stateCode.toUpperCase()];
}

export function getAvailableJurisdictions(): string[] {
  return Object.keys(JURISDICTION_REGISTRY);
}

export function requiresAttorney(stateCode: string): boolean {
  const rules = getJurisdictionRules(stateCode);
  return rules?.attorneyRequired ?? false;
}

export function triggersMansionTax(stateCode: string, purchasePrice: number): boolean {
  const rules = getJurisdictionRules(stateCode);
  if (!rules?.mansionTaxExists) return false;
  return purchasePrice >= rules.mansionTaxThreshold;
}

export function getRequiredDisclosures(stateCode: string): string[] {
  const rules = getJurisdictionRules(stateCode);
  if (!rules) return [];

  const disclosures: string[] = [];
  if (rules.sellerDisclosureRequired) disclosures.push("seller_property_condition");
  if (rules.leadPaintDisclosure) disclosures.push("lead_paint_pre1978");
  if (rules.propertyConditionDisclosure) disclosures.push("property_condition");
  if (rules.naturalHazardDisclosure) disclosures.push("natural_hazard");
  return disclosures;
}

export default JURISDICTION_REGISTRY;
