// ============================================================
// STYX — Public Type Definitions
// Domain types for the Styx Compliance API
// ============================================================

// --- Deal Lifecycle Stages ---
export enum DealStage {
  INITIATED = "INITIATED",
  NEGOTIATING = "NEGOTIATING",
  COMPLIANCE_REVIEW = "COMPLIANCE_REVIEW",
  TITLE_VERIFICATION = "TITLE_VERIFICATION",
  ESCROW_LOCKED = "ESCROW_LOCKED",
  DOCUMENT_EXECUTION = "DOCUMENT_EXECUTION",
  SETTLED = "SETTLED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// Valid stage transitions (state machine rules)
export const VALID_TRANSITIONS: Record<DealStage, DealStage[]> = {
  [DealStage.INITIATED]: [DealStage.NEGOTIATING, DealStage.CANCELLED],
  [DealStage.NEGOTIATING]: [DealStage.COMPLIANCE_REVIEW, DealStage.CANCELLED],
  [DealStage.COMPLIANCE_REVIEW]: [DealStage.TITLE_VERIFICATION, DealStage.FAILED],
  [DealStage.TITLE_VERIFICATION]: [DealStage.ESCROW_LOCKED, DealStage.FAILED],
  [DealStage.ESCROW_LOCKED]: [DealStage.DOCUMENT_EXECUTION, DealStage.FAILED],
  [DealStage.DOCUMENT_EXECUTION]: [DealStage.SETTLED, DealStage.FAILED],
  [DealStage.SETTLED]: [],
  [DealStage.FAILED]: [],
  [DealStage.CANCELLED]: [],
};

// --- Agent Roles & Identity ---
export enum AgentRole {
  BUYER = "BUYER",
  SELLER = "SELLER",
  BUYER_ATTORNEY = "BUYER_ATTORNEY",
  SELLER_ATTORNEY = "SELLER_ATTORNEY",
  BUYER_AGENT = "BUYER_AGENT",
  SELLER_AGENT = "SELLER_AGENT",
  TITLE = "TITLE",
  COMPLIANCE = "COMPLIANCE",
  ESCROW = "ESCROW",
  ORCHESTRATOR = "ORCHESTRATOR",
}

export interface AgentIdentity {
  agentId: string;
  role: AgentRole;
  walletAddress: string;
  publicKey: string;
  registeredAt: number;
  isActive: boolean;
  isEntity?: boolean;
  isTrust?: boolean;
  isForeign?: boolean;
}

// --- Property & Deal Structures ---
export interface PropertyDetails {
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  propertyType: "residential" | "commercial" | "mixed-use" | "land";
  residentialSubtype?: "single_family" | "condo" | "coop" | "townhouse" | "multi_family_2_4";
  parcelNumber: string;
  legalDescription?: string;
  squareFootage?: number;
  yearBuilt?: number;
  zoning?: string;
}

export interface DealTerms {
  purchasePrice: number;
  earnestMoney: number;
  closingDate: string;
  contingencies: Contingency[];
  financingType: "cash" | "conventional" | "fha" | "va" | "commercial" | "seller_financed";
  inspectionPeriodDays: number;
  specialConditions?: string[];
}

export interface Contingency {
  type: "financing" | "inspection" | "appraisal" | "title" | "compliance" | "custom";
  description: string;
  deadline: string;
  status: "pending" | "satisfied" | "waived" | "failed";
}

// --- Compliance ---
export interface ComplianceResult {
  dealId: string;
  jurisdiction: string;
  timestamp: number;
  overallStatus: "approved" | "rejected" | "pending_review";
  checks: ComplianceCheck[];
  sanctionsScreening: SanctionsResult;
  onChainTxHash?: string;
}

export interface ComplianceCheck {
  ruleId: string;
  ruleName: string;
  jurisdiction: string;
  required: boolean;
  passed: boolean;
  details: string;
}

export interface SanctionsResult {
  buyerCleared: boolean;
  sellerCleared: boolean;
  entityCleared: boolean;
  screenedAt: number;
  source: string;
  nameScreening?: {
    overallCleared: boolean;
    sanctionedCount: number;
    results: Array<{
      personId: string;
      role: string;
      isSanctioned: boolean;
      bestMatchScore: number;
    }>;
    source: string;
  };
}

// --- Title ---
export interface TitleReport {
  dealId: string;
  propertyId: string;
  searchDate: number;
  titleStatus: "clear" | "encumbered" | "defective";
  currentOwner: string;
  liens: Lien[];
  encumbrances: Encumbrance[];
  easements: string[];
  insuranceCommitment?: {
    provider: string;
    coverageAmount: number;
    exceptions: string[];
  };
}

export interface Lien {
  type: "mortgage" | "tax" | "mechanics" | "judgment" | "hoa" | "other";
  holder: string;
  amount: number;
  recordedDate: string;
  status: "active" | "released" | "disputed";
}

export interface Encumbrance {
  type: string;
  description: string;
  affectsTitle: boolean;
}

// --- Escrow ---
export interface EscrowAccount {
  dealId: string;
  escrowAgentId: string;
  contractAddress: string;
  totalRequired: number;
  deposits: EscrowDeposit[];
  status: "open" | "funded" | "disbursed" | "refunded";
  releaseConditions: string[];
}

export interface EscrowDeposit {
  fromAgent: string;
  amount: number;
  txHash: string;
  timestamp: number;
  type: "earnest_money" | "closing_funds" | "additional";
}

// --- Documents ---
export interface ClosingDocument {
  docId: string;
  dealId: string;
  type:
    | "purchase_agreement"
    | "deed"
    | "closing_disclosure"
    | "title_insurance"
    | "transfer_tax"
    | "affidavit"
    | "other";
  name: string;
  contentHash: string;
  signatures: DocumentSignature[];
  status: "draft" | "pending_signatures" | "executed" | "recorded";
}

export interface DocumentSignature {
  agentId: string;
  role: AgentRole;
  signedAt: number;
  signatureHash: string;
  walletAddress: string;
}

// --- Settlement ---
export interface SettlementRecord {
  dealId: string;
  closedAt: number;
  finalPrice: number;
  deedTxHash: string;
  escrowDisbursementTxHash: string;
  complianceAuditTxHash: string;
  documents: string[];
  parties: {
    buyer: string;
    seller: string;
    buyerRepresentative?: string;
    sellerRepresentative?: string;
    buyerRepresentativeRole?: AgentRole;
    sellerRepresentativeRole?: AgentRole;
    titleAgent: string;
    complianceAgent: string;
    escrowAgent: string;
  };
}

// --- Stage Transition ---
export interface StageTransition {
  from: DealStage;
  to: DealStage;
  triggeredBy: string;
  timestamp: number;
  reason: string;
  txHash?: string;
}
